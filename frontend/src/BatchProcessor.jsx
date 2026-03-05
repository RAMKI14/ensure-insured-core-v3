import { useState } from 'react';
import { ethers } from 'ethers';
import addresses from './frontend-config.json';
// You need the PlatformManager ABI (Logic)
import ManagerABI from './EITPlatformManager.json'; // Make sure to copy this from artifacts!

function BatchProcessor() {
  // Input States
  const [revenue, setRevenue] = useState("");
  const [rate, setRate] = useState("0.1");
  const [region, setRegion] = useState("INDIA");
  const [batchRef, setBatchRef] = useState("");
  
  const [status, setStatus] = useState("");

  const handleBurn = async () => {
    if (!window.ethereum) return alert("No Wallet Found");
    
    try {
      setStatus("Initializing...");
      
      // 1. Setup Connection
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // 2. Connect to Contract
      const contract = new ethers.Contract(addresses.MANAGER, ManagerABI.abi, signer);

      // 3. Calculate EIT Amount (Revenue * Rate)
      const eitAmount = parseFloat(revenue) * parseFloat(rate);
      if (eitAmount <= 0) return alert("Invalid Amount");

      // 4. Convert to 18 Decimals (Wei)
      const amountInWei = ethers.parseEther(eitAmount.toString());

      setStatus(`Processing: Burn ${eitAmount} EIT... Check MetaMask.`);

      // 5. Execute Transaction
      // Note: Your connected wallet MUST have the 'OPERATOR_ROLE'
      const tx = await contract.processRevenueBatch(
        amountInWei,
        region,
        batchRef || `BATCH_${new Date().toISOString().split('T')[0]}` // Auto-generate Date if empty
      );

      setStatus("Transaction Sent! Waiting for confirmation...");
      await tx.wait();
      
      setStatus(`✅ SUCCESS! Burned & Recycled ${eitAmount} EIT.`);

    } catch (err) {
      console.error(err);
      setStatus("Failed: " + (err.reason || err.message));
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px", maxWidth: "500px", margin: "20px auto" }}>
      <h2>🔥 Manual Revenue Settlement</h2>
      
      <div style={{ marginBottom: "15px" }}>
        <label>Net Revenue (Fiat):</label><br/>
        <input 
            type="number" 
            placeholder="e.g. 500000" 
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Exchange Rate (Fiat to EIT):</label><br/>
        <input 
            type="number" 
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Region Code:</label><br/>
        <select 
            value={region} 
            onChange={(e) => setRegion(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
        >
            <option value="INDIA">India</option>
            <option value="UAE">Dubai (UAE)</option>
            <option value="GLOBAL">Global</option>
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Batch Reference (Optional):</label><br/>
        <input 
            type="text" 
            placeholder="e.g. SETTLEMENT_JAN_2026" 
            value={batchRef}
            onChange={(e) => setBatchRef(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <button 
        onClick={handleBurn}
        style={{ 
            backgroundColor: "red", color: "white", padding: "12px", 
            width: "100%", border: "none", cursor: "pointer", fontSize: "16px" 
        }}
      >
        PROCESS BURN & RECYCLE
      </button>

      <p style={{ marginTop: "10px", fontWeight: "bold" }}>{status}</p>
    </div>
  );
}

export default BatchProcessor;