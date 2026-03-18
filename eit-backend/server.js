const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const geoip = require('geoip-lite');
const { ethers } = require('ethers');
const crypto = require('crypto');

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
const PORT = process.env.PORT || 3001;

// --- BLOCKCHAIN SETUP ---
// Use Public RPC (Sepolia)
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

const EIT_ADDRESS = addresses.EIT;         // <--- Dynamic
const CROWD_ADDRESS = addresses.CROWDSALE; // <--- Dynamic

// Minimal ABIs
const TOKEN_ABI = ["function balanceOf(address) view returns (uint256)"];
const CROWD_ABI = [
    "function getPhaseCount() view returns (uint256)",
    "function currentPhase() view returns (uint256)",
    "function phases(uint256) view returns (uint256 targetUSD, uint256 priceUSD, uint256 raisedUSD, bool isComplete)",
    "function phasePurchased(uint256,address) view returns (uint256)"
];

app.use(cors());
app.use(express.json());

const SUPPORTED_KYC_PROVIDERS = {
    civic_pass: { label: 'Civic Pass', url: 'https://www.civic.com/' },
    fractal_id: { label: 'Fractal ID', url: 'https://fractal.id/' },
    blockpass: { label: 'Blockpass', url: 'https://www.blockpass.org/' },
};

const kycRateLimit = new Map();

// --- HELPER: SAFE IP EXTRACTION ---
// Prevents crashes if IP is undefined
const getClientIP = (req) => {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    return rawIp.replace('::ffff:', ''); // Remove IPv6 prefix if present
};

const sanitizeText = (value, maxLength = 5000) => {
    if (value === undefined || value === null) return '';
    return String(value).replace(/\0/g, '').trim().slice(0, maxLength);
};

const hashCredential = (credential) => crypto.createHash('sha256').update(credential).digest('hex');

const normalizeWallet = (walletAddress) => String(walletAddress || '').trim().toLowerCase();

const getProviderLabel = (providerKey) => SUPPORTED_KYC_PROVIDERS[providerKey]?.label || providerKey;

const enforceKycRateLimit = (req, walletAddress) => {
    const ip = getClientIP(req);
    const key = `${ip}:${normalizeWallet(walletAddress)}`;
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const maxAttempts = 5;
    const attempts = (kycRateLimit.get(key) || []).filter((ts) => now - ts < windowMs);

    if (attempts.length >= maxAttempts) {
        return false;
    }

    attempts.push(now);
    kycRateLimit.set(key, attempts);
    return true;
};

const validateKycCredential = (provider, walletAddress, credential) => {
    const providerConfig = SUPPORTED_KYC_PROVIDERS[provider];
    if (!providerConfig) {
        return { ok: false, message: 'Provider not supported' };
    }

    const sanitizedCredential = sanitizeText(credential, 10000);
    if (sanitizedCredential.length < 20) {
        return { ok: false, message: 'Invalid credential' };
    }

    let parsed;
    try {
        parsed = JSON.parse(sanitizedCredential);
    } catch {
        return { ok: false, message: 'Invalid credential' };
    }

    const credentialWallet = normalizeWallet(
        parsed.walletAddress || parsed.address || parsed.subjectWallet || parsed.subject
    );
    if (!credentialWallet || credentialWallet !== normalizeWallet(walletAddress)) {
        return { ok: false, message: 'Credential does not match wallet' };
    }

    const credentialProvider = sanitizeText(parsed.provider || parsed.issuer || '').toLowerCase();
    const acceptedProviderNames = [
        provider,
        providerConfig.label.toLowerCase(),
    ];
    if (credentialProvider && !acceptedProviderNames.includes(credentialProvider)) {
        return { ok: false, message: 'Provider not supported' };
    }

    const expiresAt = parsed.expiresAt || parsed.expiry || parsed.expirationDate;
    if (expiresAt && Number.isNaN(new Date(expiresAt).getTime()) === false && new Date(expiresAt) < new Date()) {
        return { ok: false, message: 'Credential expired' };
    }

    return {
        ok: true,
        sanitizedCredential,
    };
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
        // 1. Get DB Settings (Phase Name, Referral Status)
        let settings = await prisma.iCOSettings.findUnique({ where: { id: 1 } });
        if (!settings) {
            settings = { phaseName: "Phase 1", phaseTargetUSD: 0, isActive: false, referralActive: false, referralPercent: 5 };
        }

        // 2. Fetch On-Chain Price as Source of Truth
        let onChainData = { priceUSD: 0, phaseTargetUSD: 0, nextPriceUSD: 0 };
        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CROWD_ADDRESS, CROWD_ABI, provider);
            
            const [currentPhase, totalPhases] = await Promise.all([
                contract.currentPhase(),
                contract.getPhaseCount()
            ]);

            const phase = await contract.phases(currentPhase);
            onChainData.priceUSD = parseFloat(ethers.formatUnits(phase.priceUSD, 18));
            onChainData.phaseTargetUSD = parseFloat(ethers.formatUnits(phase.targetUSD, 18));

            // Fetch Next Phase Price if it exists
            const nextIdx = Number(currentPhase) + 1;
            if (nextIdx < Number(totalPhases)) {
                const nextPhase = await contract.phases(nextIdx);
                onChainData.nextPriceUSD = parseFloat(ethers.formatUnits(nextPhase.priceUSD, 18));
            }
            
        } catch (chainError) {
            console.error("⚠️ Blockchain Price Fetch Error:", chainError.message);
        }

        res.json({
            ...settings,
            priceUSD: onChainData.priceUSD,
            nextPriceUSD: onChainData.nextPriceUSD,
            phaseTargetUSD: onChainData.phaseTargetUSD || settings.phaseTargetUSD
        });
    } catch (error) {
        console.error("ICO Status Fetch Error:", error);
        res.json({ phaseName: "", phaseTargetUSD: 0, isActive: false, priceUSD: 0 });
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

            const [walletBalWei, phaseCountRaw, currentPhaseRaw] = await Promise.all([
                tokenContract.balanceOf(referrer),
                crowdContract.getPhaseCount(),
                crowdContract.currentPhase()
            ]);

            const phaseCount = Number(phaseCountRaw);
            const currentPhase = Number(currentPhaseRaw);

            let pendingBalWei = 0n;
            for (let i = 0; i < phaseCount; i += 1) {
                pendingBalWei += await crowdContract.phasePurchased(i, referrer);
            }

            let price = 0;
            if (phaseCount > 0) {
                const phaseIndex = Math.min(currentPhase, phaseCount - 1);
                const phase = await crowdContract.phases(phaseIndex);
                price = parseFloat(ethers.formatEther(phase.priceUSD));
            }

            const totalEligibleWei = walletBalWei + pendingBalWei;
            const balance = parseFloat(ethers.formatEther(totalEligibleWei));
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
        const { type } = req.query; // e.g. ?type=PUBLIC
        
        if (type === 'PUBLIC') {
            const list = await prisma.publicSale.findMany({
                orderBy: { timestamp: 'desc' }
            });
            // Map timestamp to createdAt so VestingPanel.jsx sorting works seamlessly
            const mappedList = list.map(item => ({
                ...item,
                createdAt: item.timestamp
            }));
            return res.json(mappedList);
        } else {
            const list = await prisma.vestingEntry.findMany({
                where: {
                    NOT: {
                        role: { startsWith: 'PUBLIC_' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(list);
        }
    } catch (e) { res.status(500).json({ error: "Fetch failed" }); }
});

// --- NEW: Calculate Total Sales (For Admin Tokenomics) ---
app.get('/api/sales', async (req, res) => {
    try {
        const sales = await prisma.publicSale.aggregate({
            _sum: {
                amount: true
            }
        });
        res.json({ totalTokens: sales._sum.amount || 0 });
    } catch (e) {
        console.error("Sales Calculation Error:", e);
        res.status(500).json({ error: "Failed to calculate sales" });
    }
});

app.get('/api/kyc/providers', (req, res) => {
    res.json(
        Object.entries(SUPPORTED_KYC_PROVIDERS).map(([key, value]) => ({
            key,
            label: value.label,
            url: value.url,
        }))
    );
});

app.get('/api/kyc/status/:walletAddress', async (req, res) => {
    try {
        const walletAddress = normalizeWallet(req.params.walletAddress);
        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const record = await prisma.kycVerification.findUnique({
            where: { walletAddress }
        });

        if (!record) {
            return res.json({ status: 'NOT_VERIFIED', walletAddress });
        }

        return res.json({
            ...record,
            providerLabel: getProviderLabel(record.provider),
        });
    } catch (e) {
        console.error('KYC status fetch error:', e);
        res.status(500).json({ error: 'Failed to fetch KYC status' });
    }
});

app.get('/api/kyc/records', async (req, res) => {
    try {
        const records = await prisma.kycVerification.findMany({
            orderBy: { verifiedAt: 'desc' }
        });

        res.json(records.map((record) => ({
            ...record,
            providerLabel: getProviderLabel(record.provider),
        })));
    } catch (e) {
        console.error('KYC records fetch error:', e);
        res.status(500).json({ error: 'Failed to fetch KYC records' });
    }
});

app.post('/api/kyc/verify', async (req, res) => {
    try {
        const walletAddress = normalizeWallet(req.body.walletAddress);
        const provider = sanitizeText(req.body.provider, 100).toLowerCase();
        const credential = req.body.credential;

        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        if (!enforceKycRateLimit(req, walletAddress)) {
            return res.status(429).json({ error: 'Too many verification attempts. Please try again later.' });
        }

        const validation = validateKycCredential(provider, walletAddress, credential);
        if (!validation.ok) {
            await prisma.kycVerification.upsert({
                where: { walletAddress },
                update: {
                    provider,
                    status: 'REJECTED',
                    lastError: validation.message,
                    verificationMethod: 'decentralized_identity',
                },
                create: {
                    walletAddress,
                    provider,
                    credentialHash: hashCredential(sanitizeText(credential, 10000) || walletAddress),
                    status: 'REJECTED',
                    lastError: validation.message,
                    verificationMethod: 'decentralized_identity',
                }
            });

            return res.status(400).json({ error: validation.message });
        }

        const credentialHash = hashCredential(validation.sanitizedCredential);
        const record = await prisma.kycVerification.upsert({
            where: { walletAddress },
            update: {
                provider,
                credentialHash,
                verificationMethod: 'decentralized_identity',
                status: 'VERIFIED_PENDING_WHITELIST',
                verifiedAt: new Date(),
                approvedAt: null,
                approvedBy: null,
                lastError: null,
            },
            create: {
                walletAddress,
                provider,
                credentialHash,
                verificationMethod: 'decentralized_identity',
                status: 'VERIFIED_PENDING_WHITELIST',
            }
        });

        res.json({
            success: true,
            record: {
                ...record,
                providerLabel: getProviderLabel(record.provider),
            }
        });
    } catch (e) {
        console.error('KYC verification error:', e);
        res.status(500).json({ error: 'Failed to verify credential' });
    }
});

app.post('/api/kyc/mark-whitelisted', async (req, res) => {
    try {
        const walletAddresses = Array.isArray(req.body.walletAddresses) ? req.body.walletAddresses : [];
        const approvedBy = sanitizeText(req.body.approvedBy, 200) || null;
        const normalized = [...new Set(walletAddresses.map(normalizeWallet).filter((wallet) => ethers.isAddress(wallet)))];

        if (normalized.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        const result = await prisma.kycVerification.updateMany({
            where: { walletAddress: { in: normalized } },
            data: {
                status: 'WHITELISTED',
                approvedAt: new Date(),
                approvedBy,
                lastError: null,
            }
        });

        res.json({ success: true, count: result.count });
    } catch (e) {
        console.error('KYC mark-whitelisted error:', e);
        res.status(500).json({ error: 'Failed to mark wallets as whitelisted' });
    }
});

app.post('/api/kyc/mark-pending', async (req, res) => {
    try {
        const walletAddresses = Array.isArray(req.body.walletAddresses) ? req.body.walletAddresses : [];
        const normalized = [...new Set(walletAddresses.map(normalizeWallet).filter((wallet) => ethers.isAddress(wallet)))];

        if (normalized.length === 0) {
            return res.json({ success: true, count: 0 });
        }

        const result = await prisma.kycVerification.updateMany({
            where: { walletAddress: { in: normalized } },
            data: {
                status: 'VERIFIED_PENDING_WHITELIST',
                approvedAt: null,
                approvedBy: null,
            }
        });

        res.json({ success: true, count: result.count });
    } catch (e) {
        console.error('KYC mark-pending error:', e);
        res.status(500).json({ error: 'Failed to reset wallets to pending' });
    }
});

// --- NEW: Unified Sales Log (Seed, Private, Public) ---
app.get('/api/sales/log', async (req, res) => {
    try {
        const [manualSales, publicSales, legacyPublicSales, kycRecords] = await Promise.all([
            prisma.vestingEntry.findMany({
                where: {
                    role: { in: ['SEED', 'PRIVATE'] }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.publicSale.findMany({
                orderBy: { timestamp: 'desc' }
            }),
            prisma.vestingEntry.findMany({
                where: {
                    role: { startsWith: 'PUBLIC_' }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.kycVerification.findMany()
        ]);

        const kycMap = new Map(
            kycRecords.map((record) => [normalizeWallet(record.walletAddress), record])
        );

        const normalizedManual = manualSales.map((sale) => ({
            ...sale,
            id: `vest-${sale.id}`,
            timestamp: sale.createdAt
        }));

        const normalizedPublic = publicSales.map((sale) => ({
            ...sale,
            id: `pub-${sale.id}`,
            timestamp: sale.timestamp
        }));

        const normalizedLegacyPublic = legacyPublicSales.map((sale) => ({
            ...sale,
            id: `vest-${sale.id}`,
            timestamp: sale.createdAt
        }));

        // Deduplicate by txHash (case-insensitive) so old migrated public rows do not appear twice.
        const combined = [...normalizedManual, ...normalizedPublic, ...normalizedLegacyPublic];
        const deduped = combined.filter((sale, index, list) => {
            if (!sale.txHash) return true;
            return index === list.findIndex((candidate) => 
                candidate.txHash && candidate.txHash.toLowerCase() === sale.txHash.toLowerCase()
            );
        });

        deduped.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const enriched = deduped.map((sale) => {
            const kycRecord = kycMap.get(normalizeWallet(sale.address));
            return {
                ...sale,
                kycProvider: kycRecord?.provider || null,
                kycProviderLabel: kycRecord ? getProviderLabel(kycRecord.provider) : null,
                kycVerifiedAt: kycRecord?.verifiedAt || null,
                verificationMethod: kycRecord?.verificationMethod || null,
                kycVerificationStatus: kycRecord?.status || null,
            };
        });

        res.json(enriched);
    } catch (e) {
        console.error("Sales Log Fetch Error:", e);
        res.status(500).json({ error: "Failed to fetch sales log" });
    }
});

// --- NEW: Targeted Investor Summary for Frontend ---
app.get('/api/investor/total/:address', async (req, res) => {
    try {
        const address = normalizeWallet(req.params.address);
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const [vestingEntries, publicSales, referrals] = await Promise.all([
            prisma.$queryRaw`SELECT * FROM VestingEntry WHERE address = ${address} COLLATE NOCASE AND isRevoked = 0`,
            prisma.$queryRaw`SELECT * FROM PublicSale WHERE address = ${address} COLLATE NOCASE ORDER BY timestamp DESC`,
            prisma.$queryRaw`SELECT SUM(referrerReward) as totalRewards FROM Referral WHERE referrer = ${address} COLLATE NOCASE`
        ]);

        const totalVesting = vestingEntries.reduce((sum, v) => sum + Number(v.amount || 0), 0);
        const totalPublic = publicSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
        const totalInvestedUSD = publicSales.reduce((sum, s) => sum + Number(s.amountUSD || 0), 0);
        
        // Get unique currencies used
        const currenciesUsed = [...new Set(publicSales.map(s => s.crypto || 'ETH'))].join('/');

        res.json({
            address,
            totalEIT: totalVesting + totalPublic,
            vestingEIT: totalVesting,
            publicEIT: totalPublic,
            totalInvestedUSD,
            latestCurrency: publicSales[0]?.crypto || 'ETH',
            currenciesUsed: currenciesUsed || 'None',
            referralRewards: Number(referrals[0]?.totalRewards || 0)
        });
    } catch (e) {
        console.error("Investor Total Fetch Error:", e);
        res.status(500).json({ error: "Failed to fetch investor total" });
    }
});

// --- NEW: Add Public Sale Log ---
app.post('/api/sales/add', async (req, res) => {
    try {
        const { address, name, role, amount, amountUSD, phase, country, eitPrice, txHash, note, crypto } = req.body;
        console.log(`🛒 PUBLIC SALE RECORDED: ${address} | ${amount} EIT | Tx: ${txHash}`);

        const entry = await prisma.publicSale.create({
            data: { 
                address, 
                name: name || "Public Investor", 
                role, 
                amount: parseFloat(amount), 
                amountUSD: amountUSD ? parseFloat(amountUSD) : null,
                eitPrice: eitPrice ? parseFloat(eitPrice) : null,
                phase: phase || null,
                country: country || null,
                txHash, 
                note, 
                crypto 
            }
        });

        res.json({ success: true, entry });
    } catch (e) {
        console.error("Public Sale Save Error:", e);
        res.status(500).json({ error: "Failed to save sale" });
    }
});

// --- NEW: Get Earliest Sale per Phase (Start Dates) ---
app.get('/api/sales/phase-starts', async (req, res) => {
    try {
        const starts = await prisma.publicSale.groupBy({
            by: ['phase'],
            _min: { timestamp: true }
        });

        const legacyStarts = await prisma.vestingEntry.findMany({
            where: { role: { startsWith: 'PUBLIC_' } },
            orderBy: { createdAt: 'asc' }
        });

        const mapping = {};

        // Helper to turn "Phase 1: Seed" or "1" into "Phase 1"
        const normalize = (p) => {
            if (!p) return "Phase 1";
            const match = String(p).match(/Phase\s*(\d+)/i);
            if (match) return `Phase ${match[1]}`;
            if (!isNaN(p)) return `Phase ${p}`;
            return p;
        };

        legacyStarts.forEach(s => {
            const phaseKey = normalize(s.phase);
            if (!mapping[phaseKey] || new Date(s.createdAt) < new Date(mapping[phaseKey])) {
                mapping[phaseKey] = s.createdAt;
            }
        });

        starts.forEach(s => {
            if (s.phase) {
                const phaseKey = normalize(s.phase);
                if (!mapping[phaseKey] || new Date(s._min.timestamp) < new Date(mapping[phaseKey])) {
                    mapping[phaseKey] = s._min.timestamp;
                }
            }
        });

        res.json(mapping);
    } catch (e) {
        console.error("Phase Starts Fetch Error:", e);
        res.status(500).json({ error: "Failed to fetch phase start dates" });
    }
});

// 3. Mark as Revoked (Sync DB with Blockchain)
app.post('/api/vesting/revoke', async (req, res) => {
    try {
        const { address } = req.body;
        await prisma.vestingEntry.updateMany({
            where: { address: { equals: address } },
            data: { 
                isRevoked: true,
                revokedAt: new Date()
            }
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
        if (action === 'PANEL_VIEW') {
            return res.json({ success: true, ignored: true });
        }
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
        const { format, page: pageParam, limit: limitParam, ...filterQuery } = req.query;
        const where = buildActivityLogWhere(filterQuery);
        const page = Math.max(parseInt(pageParam, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);

        if (format) {
            const logs = await prisma.activityLog.findMany({
                where,
                orderBy: { timestamp: 'desc' }
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

            return res.json(logs);
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.activityLog.count({ where })
        ]);

        res.json({
            data: logs,
            total,
            page,
            limit,
            totalPages: Math.max(Math.ceil(total / limit), 1)
        });
    } catch (e) {
        console.error("❌ Error fetching activity logs:", e);
        res.status(500).json({ error: "Fetch failed" });
    }
});

// ===================== BURN LOGS =====================

// POST: Record a burn event
app.post('/api/burn-logs', async (req, res) => {
    try {
        const { type, totalAmount, burnedAmount, recycledAmount, region, batchRef, reason, txHash, admin } = req.body;
        
        if (!type || !totalAmount || !burnedAmount || !txHash || !admin) {
            return res.status(400).json({ error: "Missing required fields: type, totalAmount, burnedAmount, txHash, admin" });
        }

        const log = await prisma.burnLog.create({
            data: {
                type,
                totalAmount: parseFloat(totalAmount),
                burnedAmount: parseFloat(burnedAmount),
                recycledAmount: parseFloat(recycledAmount || 0),
                region: region || null,
                batchRef: batchRef || null,
                reason: reason || null,
                txHash,
                admin
            }
        });
        
        res.json(log);
    } catch (e) {
        if (e.code === 'P2002') {
            return res.status(409).json({ error: "Burn log with this txHash already exists" });
        }
        console.error("❌ Error creating burn log:", e);
        res.status(500).json({ error: "Failed to create burn log" });
    }
});

// GET: Retrieve all burn logs + summary totals
app.get('/api/burn-logs', async (req, res) => {
    try {
        const logs = await prisma.burnLog.findMany({
            orderBy: { timestamp: 'desc' }
        });
        
        const totalBurned = logs.reduce((sum, l) => sum + l.burnedAmount, 0);
        const totalRecycled = logs.reduce((sum, l) => sum + l.recycledAmount, 0);
        const totalBatchVolume = logs.reduce((sum, l) => sum + l.totalAmount, 0);
        
        res.json({
            logs,
            summary: {
                totalBurned,
                totalRecycled,
                totalBatchVolume,
                count: logs.length
            }
        });
    } catch (e) {
        console.error("❌ Error fetching burn logs:", e);
        res.status(500).json({ error: "Failed to fetch burn logs" });
    }
});

// GET: Quick summary for dashboard card
app.get('/api/burn-summary', async (req, res) => {
    try {
        const result = await prisma.burnLog.aggregate({
            _sum: {
                burnedAmount: true,
                recycledAmount: true,
                totalAmount: true
            },
            _count: true
        });
        
        res.json({
            totalBurned: result._sum.burnedAmount || 0,
            totalRecycled: result._sum.recycledAmount || 0,
            totalBatchVolume: result._sum.totalAmount || 0,
            count: result._count
        });
    } catch (e) {
        console.error("❌ Error fetching burn summary:", e);
        res.status(500).json({ error: "Failed to fetch burn summary" });
    }
});

// --- NEW: Investor Dashboard APIs ---

// 1. Unified Transaction History for a specific address
app.get('/api/investor/transactions/:address', async (req, res) => {
    try {
        const address = normalizeWallet(req.params.address);
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        const [publicSales, vestingEntries] = await Promise.all([
            prisma.publicSale.findMany({
                where: { address: { equals: address } },
                orderBy: { timestamp: 'desc' }
            }),
            prisma.vestingEntry.findMany({
                where: { address: { equals: address } },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const history = [
            ...publicSales.map(s => ({ ...s, id: `pub-${s.id}`, type: 'Public Sale', date: s.timestamp })),
            ...vestingEntries.map(v => ({ ...v, id: `vest-${v.id}`, type: v.role || 'Vesting', date: v.createdAt }))
        ];

        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(history);
    } catch (e) {
        console.error("Transaction History Fetch Error:", e);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

// 2. Referral Statistics for a specific address
app.get('/api/investor/referrals/:address', async (req, res) => {
    try {
        const address = normalizeWallet(req.params.address);
        const referrals = await prisma.referral.findMany({
            where: { referrer: { equals: address } }
        });

        const totalEarned = referrals.reduce((sum, r) => sum + (r.referrerReward || 0), 0);
        const pendingPayouts = referrals.filter(r => r.status !== 'PAID').length;

        res.json({
            totalReferrals: referrals.length,
            totalEarnedEIT: totalEarned,
            pendingPayouts,
            referrals: referrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (e) {
        console.error("Referral Stats Fetch Error:", e);
        res.status(500).json({ error: "Failed to fetch referral stats" });
    }
});

// --- REMOVED: /api/announcements ---
// Previously exposed admin activity logs (wallet addresses, actions, IPs) to investors.
// This was a critical security flaw and has been permanently removed.

app.listen(PORT, () => {
    console.log(`🚀 SERVER RUNNING on http://localhost:${PORT}`);
});
