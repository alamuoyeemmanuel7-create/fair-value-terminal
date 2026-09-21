"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export function WalletStatus() {
  const { connected, publicKey, wallets, connecting } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on server to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

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
  if (!wallets || wallets.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "#ff6a55" }}>
        No wallet detected
      </div>
    );
  }

  return null;
}

