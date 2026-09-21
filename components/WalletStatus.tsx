"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export function WalletStatus() {
  const { connected, publicKey, wallet, wallets, connecting } = useWallet();
  const [phantomInstalled, setPhantomInstalled] = useState(true);

  useEffect(() => {
    // Check if any wallets are available
    const hasWallets = wallets && wallets.length > 0;
    setPhantomInstalled(hasWallets);
  }, [wallets]);

  // Show connecting state
  if (connecting) {
    return (
      <div style={{ fontSize: 12, color: "#f2b84b" }}>
        Connecting...
      </div>
    );
  }

  // Show connected state
  if (connected && publicKey) {
    return (
      <div style={{ fontSize: 12, color: "#3ddc84" }}>
        ✓ {publicKey.toString().slice(0, 8)}...
      </div>
    );
  }

  // Show helpful message if no wallets available
  if (!phantomInstalled || !wallets || wallets.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "#ff6a55" }}>
        No wallet detected.{" "}
        <a
          href="https://phantom.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#f2b84b", textDecoration: "underline" }}
        >
          Install Phantom
        </a>
      </div>
    );
  }

  return null;
}

