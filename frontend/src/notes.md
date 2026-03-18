
1. close all the servers
2. clear the VestingEntry, PublicSale, Referral, and ActivityLog tables in the database.
3. Run below 3 commands

# Deleting ABI Files, Compiling, Deploying Smart contract to Test Net (Sepolia)

# Delete: 
EITCrowdsale.json
EITDistributor.json
EITPlatformManager.json
EITVestingVault.json
EnsureInsuredToken.json

 ABI files from 
 
 "/eit-admin-v2/src" folder

# Delete:

EITDistributor.json
EITPlatformManager.json
EITVestingVault.json
EnsureInsuredToken.json
MockOracle.json
MockUSDT.json

ABI files from "/eit-final-v2/frontend/src" folder

# Then:

npx hardhat clean

npx hardhat compile

npx hardhat run scripts/deploy_sepolia.js --network sepolia

## 4. Copy new ABI files
EITCrowdsale.json
EITDistributor.json
EITPlatformManager.json
EITVestingVault.json
EnsureInsuredToken.json

to 
 
 "/eit-admin-v2/src" folder

## 5. Copy new ABI files

EITDistributor.json
EITPlatformManager.json
EITVestingVault.json
EnsureInsuredToken.json
MockOracle.json
MockUSDT.json

to "/eit-final-v2/frontend/src" folder

# Misc Notes
6. Copy all  addresses to all from '/eit-final-v2/scripts/frontend-config.json' update below files in the respective folders.

File	                                   Location

frontend-config.json               eit-final-v2/ (root)

frontend-config.json               eit-final-v2/eit-backend/

frontend-config.json               eit-final-v2/frontend/src/

frontend-config.json               eit-admin-v2/ (root)

frontend-config.json               eit-admin-v2/src/

7. Run backend, localhost servers for 'eit-final-v2', 'eit-admin-v2'

# ********************************************************************************************************************

# Public ICO Phases (Milestone Based)
These happen offline via vesting vault.

Round	Tokens	Price	Raise
Seed	1.5B	$0.001	$1.5M
Private	1.5B	$0.002	$3M

Total raised before ICO: $4.5M

💎 EIT Master Allocation Plan (15B Total)
This document outlines the definitive token allocation and pricing strategy to reach the $100M Hard Cap using the total supply of 15 Billion EIT.

📊 1. The "Hard Cap" Master Plan
Segment	            Tokens (EIT)	        Price USD   Target	% of Supply
Seed Round	        1.50 Billion	        $0.0010	     $1.5M	   10.0%
Private Round	    1.50 Billion	        $0.0020	     $3.0M	   10.0%
ICO Sale (Total)   10.00 Billion	    Avg $0.0095	    $95.5M	   66.7%
Liquidity Reserve   2.00 Billion	           —           —	   13.3%
---------------------------------------------------------------------------
GRAND TOTAL	       15.00 Billion	           —	    $100.0M	  100.00%
---------------------------------------------------------------------------

IMPORTANT: The Liquidity Reserve (2B EIT) is strictly reserved for CEX listings and liquidity pools and is excluded from active crowdsale calculations.

🚀 2. ICO Phase Breakdown (Exactly 10B Tokens)
To raise the remaining $95.5M after the Seed and Private rounds, the ICO sales phases are structured as follows:

Phase	        USD Target	Price per EIT	Tokens Sold (Approx)
Phase 1	       $5,000,000	 $0.0050	      1,000,000,000
Phase 2	       $5,000,000	 $0.0065	        769,230,769
Phase 3	       $5,000,000	 $0.0080	        625,000,000
Phase 4	      $10,000,000	 $0.0095	      1,052,631,579
Phase 5	      $15,000,000	 $0.0110	      1,363,636,364
Phase 6	      $20,000,000	 $0.0125	      1,600,000,000
Phase 7	      $35,500,000	 $0.0137	      2,589,501,288
---------------------------------------------------------------------------
ICO TOTAL	  $95,500,000	    —	       10,000,000,000 (10B)
---------------------------------------------------------------------------

💡 Key Metrics:

Average ICO Price: ~$0.0095
Soft Cap Achievement: Reached after $10.5M of ICO sales (Approx. Phase 2 mid-point).
Total Token Supply: 15,000,000,000 EIT.

Total raised from ICO phases (Crowd Sale): ~$95.5M

Add seed + private + Crowd Sale: $100M HARD CAP

# ********************************************************************************************************************

push 'eit-final-v2' code into 'https://github.com/RAMKI14/ensure-insured-core-v3'
push 'eit-admin-v2' code to 'https://github.com/RAMKI14/ensure-insured-admin-v3'

# ********************************************************************************************************************

### EIT Services Startup Guide: ###

This guide provides the commands to manually start the backend and frontend services for the EIT ecosystem.

0. Stop All Existing Servers
Before starting, ensure no old processes are holding the ports.

# Kill all processes on ports 3001, 3002, 5173, 5174
lsof -ti :3001,3002,5173,5174 | xargs kill -9 2>/dev/null

# 1. Backend Servers (eit-final-v2/eit-backend)
Note: Both the Investor and Admin frontends use these backend instances. There is no separate backend in eit-admin-v2.

# Start Backend on Port 3001 (Main API)
cd /Users/ramki/Desktop/eit-final-v2/eit-backend
node server.js

# Start Backend on Port 3002 (Secondary/WebSocket):
cd /Users/ramki/Desktop/eit-final-v2/eit-backend
PORT=3002 node server.js

# 2. Localhost Frontends:
  # Start Investor Frontend (Port 5173):
cd /Users/ramki/Desktop/eit-final-v2/frontend
npm run dev

  # Start Admin Frontend (Port 5174):
cd /Users/ramki/Desktop/eit-admin-v2
npm run dev

# 3. How to See What Servers Are Active
  # To verify exactly which EIT services are currently listening on their ports:
lsof -i :3001,3002,5173,5174 | grep LISTEN

  # To see all running Node.js processes (including those running in the background):
ps aux | grep node

  # To check specifically for Vite (Frontend) or Node (Backend) by name:
pgrep -fl "node|vite"

### 4. Advanced Scaling (High Traffic) ###
If you expect very high traffic on the ICO Frontend, you can run more backend instances to spread the load.

Step A: Run more Backends
# Open new terminals and run:

PORT=3003 node server.js
PORT=3004 node server.js

Step B: Point Frontend to a specific Backend
# You can tell a frontend to use a specific port by setting VITE_API_URL before starting it:
  # Point Investor Frontend to Port 3003
cd /Users/ramki/Desktop/eit-final-v2/frontend

VITE_API_URL=http://localhost:3003/api npm run dev

# Tips for Scaling:
Admin Isolation: Always keep the Admin Panel on its own dedicated port (e.g., 3002) so it stays responsive even if the main ICO port (3001) is flooded with investors.
Database: All backend instances share the same database (dev.db), so they will all see the same transactions and settings in real-time.

## Reset / Clear Database Tables ##
If you need to start fresh (e.g., after redeploying smart contracts), run this command in the eit-backend directory to clear all investor data, activity logs, and reset settings to Phase 1:

bash
node wipe_db.js

## ------------------------------------------- ##
Running Servers
cd /Users/ramki/Desktop/eit-final-v2/eit-backend
npx nodemon server.js
To run ICO Backend Server: PORT=3001 node server.js
To run Admin Backend Server: PORT=3002 node server.js
To run ICO Frontend: npm run dev

cd /Users/ramki/Desktop/eit-admin-v2
To run Admin Frontend: npm run dev

*******
Note: nodemon is a development tool that automatically restarts your Node.js server whenever you save a file change.

In your project, nodemon is installed as a development dependency in the eit-final-v2/eit-backend folder. It looks like you may have used it in the past to keep the backend running while you were editing the 

server.js
 code.

Why use it?
Instead of manually killing and restarting the server every time you fix a bug or add a route, nodemon watches your files and does it for you instantly.
*******

## ------------------------------------------- ##
# To run backend server, ICO Frontend, Admin Frontend all at once.
lsof -ti :3001,3002,5173,5174 | xargs kill -9 2>/dev/null; (cd /Users/ramki/Desktop/eit-final-v2/eit-backend && PORT=3001 npx nodemon server.js) & (cd /Users/ramki/Desktop/eit-final-v2/eit-backend && PORT=3002 npx nodemon server.js) & (cd /Users/ramki/Desktop/eit-final-v2/frontend && npm run dev) & (cd /Users/ramki/Desktop/eit-admin-v2 && npm run dev) & wait


lsof -ti :3001,3002,5173,5174 | xargs kill -9 2>/dev/null; npx concurrently -c "blue,magenta,green,yellow" -n "BACKEND-1,BACKEND-2,FRONTEND,ADMIN" "cd /Users/ramki/Desktop/eit-final-v2/eit-backend && PORT=3001 npx nodemon server.js" "cd /Users/ramki/Desktop/eit-final-v2/eit-backend && PORT=3002 npx nodemon server.js" "cd /Users/ramki/Desktop/eit-final-v2/frontend && npm run dev" "cd /Users/ramki/Desktop/eit-admin-v2 && npm run dev"

## ------------------------------------------- ##
## Working command to start backend & localhost servers:


It runs in the background: As soon as you hit Enter, PM2 will launch all 4 servers perfectly and instantly return your terminal to you. It will no longer show "in progress."

Auto-Restarts: If one of the servers crashes, PM2 will automatically restart it for you in the background.

Easy Management commands:

See all running servers: pm2 list
See logs for all servers live: pm2 logs
Stop everything: pm2 stop all
Restart everything: pm2 restart all
Run that pm2 start command above—it's the exact permanent fix you were looking for!

-----------------------

Background Execution: It uses native Unix nohup to securely push all 4 servers into the background. As soon as you run it, you get your terminal back instantly.
Safe from Closing: Because of nohup, you can completely close your terminal window or VS Code, and the servers will stay running perfectly in the background.
Smart Logging: It streams all the color-coded logs (from both backends and frontends) into a single text file.
To read the live logs anytime: tail -f eit-dev-logs.txt
Clean Shutdown: Included instructions in the script prompt. To stop them all: lsof -ti :3001,3002,5173,5174 | xargs kill -9 2>/dev/null
Just type ./start-dev.sh and you'll be good to go! Let me know if that completely resolves the server startup headaches for you.