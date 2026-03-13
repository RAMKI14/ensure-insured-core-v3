
1. close all the servers
2. Run below 3 commands

# Compiling, Deploying Smart contract to Test Net (Sepolia)
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy_sepolia.js --network sepolia

3. Copy all ABI files to admin /src folder

# Misc Notes
4. Copy all  addresses to all from '/eit-final-v2/scripts/frontend-config.json' update below files in the respective folders.

File	                                   Location

frontend-config.json               eit-final-v2/ (root)

frontend-config.json               eit-final-v2/eit-backend/

frontend-config.json               eit-final-v2/frontend/src/

frontend-config.json               eit-admin-v2/ (root)

frontend-config.json               eit-admin-v2/src/

5. Run backend, localhost servers to work on 'eit-admin-v2'
# --------------------------------------- #
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
