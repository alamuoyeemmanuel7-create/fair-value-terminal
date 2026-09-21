"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState, useEffect } from "react";

export function CustomWalletButton() {
  const { 
    connected, 
    publicKey, 
    disconnect, 
    connecting, 
    wallets,
    select
  } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = useCallback(async () => {
    if (!wallets || wallets.length === 0) {
      window.open("https://phantom.app", "_blank");
      return;
    }

    try {
      if (wallets.length > 0) {
        select(wallets[0].adapter.name);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }, [wallets, select]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setShowMenu(false);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }, [disconnect]);

  // Use a placeholder on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: 13,
          padding: "9px 16px",
          border: "1px solid #f2b84b",
          background: "transparent",
          color: "#f2b84b",
          borderRadius: "4px",
          minWidth: 120,
          opacity: 0.5,
        }}
      >
        Loading...
      </div>
    );
  }

  if (connected && publicKey) {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            fontFamily: "var(--sans)",
            fontSize: 13,
            padding: "9px 16px",
            border: "1px solid #f2b84b",
            background: "transparent",
            color: "#f2b84b",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          {publicKey.toString().slice(0, 8)}... ✓
        </button>
        {showMenu && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 4,
              background: "#101617",
              border: "1px solid #223032",
              borderRadius: "4px",
              minWidth: 150,
              zIndex: 1000,
            }}
          >
            <button
              onClick={handleDisconnect}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                color: "#ff6a55",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 12,
              }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      style={{
        fontFamily: "var(--sans)",
        fontSize: 13,
        padding: "9px 16px",
        border: "1px solid #f2b84b",
        background: connecting ? "#f2b84b" : "transparent",
        color: connecting ? "#0a0e0f" : "#f2b84b",
        cursor: connecting ? "not-allowed" : "pointer",
        borderRadius: "4px",
        opacity: connecting ? 0.7 : 1,
      }}
    >
      {connecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
