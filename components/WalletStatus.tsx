"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export function WalletStatus() {
  const { connected, publicKey, wallet } = useWallet();
  const [phantomInstalled, setPhantomInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if Phantom is installed
    const checkPhantom = () => {
      const isInstalled = typeof window !== "undefined" && 
        (window as any).solana?.isPhantom === true;
      setPhantomInstalled(isInstalled);
    };

    checkPhantom();
    window.addEventListener("load", checkPhantom);
    return () => window.removeEventListener("load", checkPhantom);
  }, []);

  if (!phantomInstalled) {
    return (
      <div style={{ fontSize: 12, color: "#ff6a55" }}>
        Phantom not installed.{" "}
        <a
          href="https://phantom.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#f2b84b", textDecoration: "underline" }}
        >
          Install here
        </a>
      </div>
    );
  }

  if (connected && publicKey) {
    return (
      <div style={{ fontSize: 12, color: "#3ddc84" }}>
        ✓ Connected: {publicKey.toString().slice(0, 8)}...
      </div>
    );
  }

  return null;
}
