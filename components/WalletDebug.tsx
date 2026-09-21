"use client";

import { useWallet } from "@solana/wallet-adapter-react";

export function WalletDebug() {
  const { wallets, select, disconnect, publicKey } = useWallet();

  return (
    <div style={{ 
      padding: "12px", 
      backgroundColor: "#f5f5f5", 
      borderRadius: "4px",
      fontSize: "12px",
      marginTop: "8px"
    }}>
      <div><strong>Available Wallets:</strong> {wallets.length}</div>
      {wallets.map((w) => (
        <div key={w.adapter.name} style={{ marginTop: "4px" }}>
          • {w.adapter.name}
          {w.adapter.readyState === "Installed" && " ✓ (Installed)"}
          {w.adapter.readyState === "NotDetected" && " ⊘ (Not Installed)"}
          {w.adapter.readyState === "Loadable" && " ◐ (Loadable)"}
        </div>
      ))}
      {publicKey && (
        <div style={{ marginTop: "8px", color: "#666" }}>
          Connected: {publicKey.toString().slice(0, 8)}...
        </div>
      )}
    </div>
  );
}
