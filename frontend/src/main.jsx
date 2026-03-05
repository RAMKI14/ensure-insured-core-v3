import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Import the wrapper we created in Step 4
import { Web3Providers } from './web3/Web3Providers'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* This wrapper gives the App access to Wallet Logic */}
    <Web3Providers>
        <App />
    </Web3Providers>
  </React.StrictMode>,
);