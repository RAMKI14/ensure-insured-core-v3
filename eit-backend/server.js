const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const geoip = require('geoip-lite');
const { ethers } = require('ethers');

// --- DYNAMIC CONFIGURATION ---
// Import the addresses directly from the JSON file
// Ensure you copied 'frontend-config.json' into the 'eit-backend' folder!
let addresses;
try {
    addresses = require('./frontend-config.json');
    console.log("✅ Loaded Contract Addresses:", addresses);
} catch (e) {
    console.error("❌ ERROR: Could not find 'frontend-config.json'. Please copy it to the backend folder.");
    process.exit(1); // Stop server if config is missing
}

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// --- BLOCKCHAIN SETUP ---
// Use Public RPC (Sepolia)
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

const EIT_ADDRESS = addresses.EIT;         // <--- Dynamic
const CROWD_ADDRESS = addresses.CROWDSALE; // <--- Dynamic

// Minimal ABIs
const TOKEN_ABI = ["function balanceOf(address) view returns (uint256)"];
const CROWD_ABI = ["function pricePerTokenUSD() view returns (uint256)"];

app.use(cors());
app.use(express.json());

// --- HELPER: SAFE IP EXTRACTION ---
// Prevents crashes if IP is undefined
const getClientIP = (req) => {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    return rawIp.replace('::ffff:', ''); // Remove IPv6 prefix if present
};

const BANNED_COUNTRIES = ['US', 'IN', 'CN', 'KP', 'IR', 'RU', 'AE', 'GB'];

// --- LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- API: CHECK GEO (General) ---
app.get('/api/check-geo', (req, res) => {
    const ip = getClientIP(req);
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : 'UNKNOWN';
    const isBanned = BANNED_COUNTRIES.includes(country);

    console.log(`📍 GEO CHECK | IP: ${ip} | Country: ${country} | Banned: ${isBanned}`);
    res.json({ country, isBanned });
});

// --- API: CHECK COOLING OFF (Wallet-First Logic) ---
app.post('/api/check-cooling-off', async (req, res) => {
    try {
        let { walletAddress, ip } = req.body;

        // Use Frontend IP if provided, otherwise detect server-side
        const connectionIP = getClientIP(req);
        const userIP = ip || connectionIP;

        console.log(`🇬🇧 CHECKING COOLING OFF`);
        console.log(`   - Wallet: ${walletAddress}`);
        console.log(`   - IP:     ${userIP}`);

        let existingLog = null;

        // LOGIC: PRIORITIZE WALLET IDENTITY
        if (walletAddress && walletAddress !== "Pre-Connection") {
            // 1. Check strict Wallet Match
            existingLog = await prisma.consentLog.findFirst({
                where: {
                    walletAddress: walletAddress,
                    countryCode: "GB"
                },
                orderBy: { timestamp: 'asc' }
            });
        } else {
            // 2. Fallback to IP Match (Visitor Mode)
            existingLog = await prisma.consentLog.findFirst({
                where: {
                    ipAddress: userIP,
                    countryCode: "GB"
                },
                orderBy: { timestamp: 'asc' }
            });
        }

        if (existingLog) {
            console.log(`   ✅ Found Existing Timer: ${existingLog.timestamp}`);
            return res.json({ firstSeen: existingLog.timestamp });
        }

        // 3. New Identity -> Start Timer
        const newLog = await prisma.consentLog.create({
            data: {
                walletAddress: walletAddress || "Pre-Connection",
                ipAddress: userIP,
                countryCode: "GB",
                userAgent: "Auto-Log: Cooling Off Start",
                agreedToTerms: true
            }
        });

        console.log(`   ✨ New Identity Created. Timer Started: ${newLog.timestamp}`);
        res.json({ firstSeen: newLog.timestamp });

    } catch (error) {
        console.error("❌ Cooling Off Error:", error);
        // Don't crash the server, just return null so frontend handles it gracefully
        res.status(500).json({ error: "Check failed" });
    }
});

// --- API: LOG CONSENT ---
app.post('/api/log-consent', async (req, res) => {
    try {
        let { walletAddress, userAgent, ip, country } = req.body;

        const connectionIP = getClientIP(req);
        const finalIP = ip || connectionIP;

        if (!country || country === "UNKNOWN") {
            const geo = geoip.lookup(finalIP);
            country = geo ? geo.country : 'UNKNOWN';
        }

        const log = await prisma.consentLog.create({
            data: {
                walletAddress: walletAddress || "Not Connected Yet",
                ipAddress: finalIP,
                countryCode: country,
                userAgent: userAgent || "Unknown",
                agreedToTerms: true
            }
        });

        console.log(`✅ CONSENT LOGGED | ID: ${log.id} | Country: ${country}`);
        res.json({ success: true, id: log.id });

    } catch (error) {
        console.error("❌ DB ERROR:", error);
        res.status(500).json({ error: "Failed to log consent" });
    }
});

// --- API: ICO SETTINGS (Admin) ---
app.get('/api/ico-status', async (req, res) => {
    try {
        // Fallback for first run if table empty
        let settings = await prisma.iCOSettings.findUnique({ where: { id: 1 } });
        if (!settings) {
            // Auto-seed if missing
            settings = await prisma.iCOSettings.create({
                data: { id: 1, phaseName: "Phase 1: Seed Round", phaseTargetUSD: 5000000.0 }
            });
        }
        res.json(settings);
    } catch (error) {
        // If table doesn't exist yet (migration pending), return default
        res.json({ phaseName: "Phase 1: Seed Round", phaseTargetUSD: 15000000 });
    }
});

app.post('/api/update-ico-status', async (req, res) => {
    try {
        const { phaseName, phaseTargetUSD, isActive, phaseEndDate } = req.body;

        let parsedDate = null;
        if (phaseEndDate) {
            parsedDate = new Date(phaseEndDate);
        }

        const settings = await prisma.iCOSettings.upsert({
            where: { id: 1 },
            update: { phaseName, phaseTargetUSD: parseFloat(phaseTargetUSD), isActive, phaseEndDate: parsedDate },
            create: { id: 1, phaseName, phaseTargetUSD: parseFloat(phaseTargetUSD), isActive, phaseEndDate: parsedDate }
        });
        res.json({ success: true, settings });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Failed to update" });
    }
});

// --- API: REFERRAL SETTINGS ---
app.post('/api/update-referral-settings', async (req, res) => {
    try {
        const { active, percent } = req.body;
        const settings = await prisma.iCOSettings.update({
            where: { id: 1 },
            data: { referralActive: active, referralPercent: parseFloat(percent) }
        });
        res.json({ success: true, settings });
    } catch (error) { res.status(500).json({ error: "Update failed" }); }
});

// --- API: RECORD REFERRAL (Called after purchase) ---
app.post('/api/record-referral', async (req, res) => {
    try {
        const { referrer, referee, amountUSD, txHash, eitPrice } = req.body;

        const settings = await prisma.iCOSettings.findUnique({ where: { id: 1 } });

        if (!settings.referralActive) return res.json({ msg: "Referrals disabled" });
        if (referrer.toLowerCase() === referee.toLowerCase()) return res.json({ msg: "Self-referral" });

        // --- NEW: BACKEND SECURITY CHECK ---
        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const tokenContract = new ethers.Contract(EIT_ADDRESS, TOKEN_ABI, provider);
            const crowdContract = new ethers.Contract(CROWD_ADDRESS, CROWD_ABI, provider);

            // 1. Get Referrer Balance
            const balWei = await tokenContract.balanceOf(referrer);
            const balance = parseFloat(ethers.formatEther(balWei));

            // 2. Get Price
            const priceWei = await crowdContract.pricePerTokenUSD();
            const price = parseFloat(ethers.formatEther(priceWei));

            // 3. Check Eligibility ($100 Min)
            const holdingValue = balance * price;
            if (holdingValue < 100) {
                console.log(`❌ FRAUD PREVENTED: Referrer ${referrer} only holds $${holdingValue}`);
                return res.json({ msg: "Referrer ineligible (Low Balance)" });
            }

        } catch (chainError) {
            console.error("Blockchain Check Failed (Network Error?):", chainError);
            // Optional: Decide if you want to fail open or closed if RPC is down.
            // For security, usually fail closed, but for MVP, maybe log warning only.
        }
        // -----------------------------------

        // Safety: Prevent Division by Zero
        const safePrice = eitPrice > 0 ? eitPrice : 0.01;

        // CALCULATE REWARDS
        const referrerValUSD = amountUSD * (settings.referralPercent / 100);
        const referrerReward = referrerValUSD / safePrice;

        const refereeValUSD = amountUSD * (settings.referralPercent / 100);
        const refereeBonus = refereeValUSD / safePrice;

        // SAVE TO DB
        await prisma.referral.create({
            data: {
                referrer: referrer,
                referee: referee,
                purchaseAmount: parseFloat(amountUSD),
                referrerReward,
                refereeBonus,
                txHash: txHash
            }
        });

        console.log(`✅ REFERRAL LOGGED: ${referrer} (+${referrerReward} EIT)`);
        res.json({ success: true });

    } catch (error) {
        console.error("❌ REFERRAL DB ERROR:", error.message);
        res.json({ success: false, error: error.message });
    }
});

// --- API: MARK REFERRALS AS PAID ---
app.post('/api/update-referral-status', async (req, res) => {
    try {
        const { ids, txHash } = req.body; // Expects an array of IDs [1, 2, 5]

        // Update multiple records at once
        await prisma.referral.updateMany({
            where: {
                id: { in: ids }
            },
            data: {
                status: "PAID",
                // We could store the payout TxHash if we added a column, 
                // but for now updating status is sufficient.
            }
        });

        console.log(`💰 Marked ${ids.length} referrals as PAID.`);
        res.json({ success: true });

    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ error: "Failed to update" });
    }
});

// --- API: VESTING REGISTRY ---

// 1. Add new Employee/Schedule
app.post('/api/vesting/add', async (req, res) => {
    try {
        const { address, name, role, amount, amountUSD, phase, country, kycStatus, eitPrice, txHash, category, note, crypto } = req.body;
        console.log(`📝 ADDING VESTING: ${name} (${address}) | Role: ${role} | KYC: ${kycStatus}`);

        const entry = await prisma.vestingEntry.create({
            data: { 
                address, 
                name, 
                role, 
                amount: parseFloat(amount), 
                amountUSD: amountUSD ? parseFloat(amountUSD) : null,
                eitPrice: eitPrice ? parseFloat(eitPrice) : null,
                phase: phase || null,
                country: country || null,
                kycStatus: kycStatus || null,
                txHash, 
                category, 
                note, 
                crypto 
            }
        });

        console.log(`✅ SAVED TO DB: ${entry.address}`);
        res.json({ success: true, entry });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to save to DB" });
    }
});

// 2. Get List of All Schedules
app.get('/api/vesting/list', async (req, res) => {
    try {
        const list = await prisma.vestingEntry.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(list);
    } catch (e) { res.status(500).json({ error: "Fetch failed" }); }
});

// 3. Mark as Revoked (Sync DB with Blockchain)
app.post('/api/vesting/revoke', async (req, res) => {
    try {
        const { id } = req.body;
        await prisma.vestingEntry.update({
            where: { id: parseInt(id) },
            data: { isRevoked: true }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Update failed" }); }
});

// --- API: GET REFERRAL STATS (For Admin) ---
app.get('/api/referral-stats', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const status = req.query.status; // Optional filter explicitly for PENDING or PAID
        const search = req.query.search; // Optional search term for wallet address

        const where = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { referrer: { contains: search } },
                { referee: { contains: search } }
            ];
        }

        const [referrals, total] = await Promise.all([
            prisma.referral.findMany({
                where,
                skip,
                take: limit,
                orderBy: { timestamp: 'desc' }
            }),
            prisma.referral.count({ where })
        ]);

        res.json({
            data: referrals,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (e) {
        console.error("Error fetching referral stats:", e);
        res.status(500).json({ error: "Failed to fetch referrals" });
    }
});

// --- API: ADMIN ACTIVITY LOG ---

// 1. Log a new admin action
app.post('/api/activity-logs', async (req, res) => {
    try {
        const { admin, action, details, severity, ipAddress, location, txHash } = req.body;
        const sev = severity || "INFO";
        console.log(`🛡 [${sev}] ADMIN ACTION: [${action}] by ${admin} | IP: ${ipAddress || 'unknown'}${txHash ? ' | Tx: ' + txHash : ''}`);

        const log = await prisma.activityLog.create({
            data: { admin, action, details, severity: sev, ipAddress, location, txHash }
        });

        res.json({ success: true, log });
    } catch (e) {
        console.error("❌ Error saving activity log:", e);
        res.status(500).json({ error: "Failed to save log" });
    }
});

// Helper: build Prisma where clause from query params
function buildActivityLogWhere(query) {
    const { severity, action, admin, from, to } = query;
    const where = {};
    if (severity && severity !== 'ALL') where.severity = severity;
    if (action) where.action = { contains: action };
    if (admin) where.admin = { contains: admin };
    if (from || to) {
        where.timestamp = {};
        if (from) where.timestamp.gte = new Date(from);
        if (to)   where.timestamp.lte = new Date(to);
    }
    return where;
}

// 2. Fetch activity logs with optional filters
app.get('/api/activity-logs', async (req, res) => {
    try {
        const { format, ...filterQuery } = req.query;
        const where = buildActivityLogWhere(filterQuery);

        const logs = await prisma.activityLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: format ? undefined : 200 // no limit for export
        });

        if (format === 'csv') {
            const header = 'ID,Timestamp,Admin,Action,Severity,Details,IP Address,Location,Tx Hash';
            const rows = logs.map(l =>
                `${l.id},"${new Date(l.timestamp).toISOString()}","${l.admin}","${l.action}","${l.severity}","${(l.details || '').replace(/"/g, "''")}","${l.ipAddress || ''}","${l.location || ''}","${l.txHash || ''}"`
            );
            const csv = [header, ...rows].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="eit_activity_log_${Date.now()}.csv"`);
            return res.send(csv);
        }

        res.json(logs);
    } catch (e) {
        console.error("❌ Error fetching activity logs:", e);
        res.status(500).json({ error: "Fetch failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SERVER RUNNING on http://localhost:${PORT}`);
});