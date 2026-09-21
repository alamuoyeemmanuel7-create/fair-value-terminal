"use client";

import { useMemo, useCallback } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

require("@solana/wallet-adapter-react-ui/styles.css");

export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("mainnet-beta");
    console.log("[Wallet] Using RPC endpoint:", url);
    return url;
  }, []);
  
  // Use only Phantom - it's the most reliable and widely supported
  // Other wallets require browser extensions/setup that may not be available
  const wallets = useMemo(() => {
    try {
      const phantomWallet = new PhantomWalletAdapter();
      console.log("[Wallet] Using Phantom wallet adapter");
      return [phantomWallet];
    } catch (error) {
      console.error("[Wallet] Error initializing Phantom:", error);
      return [];
    }
  }, []);

  const onError = useCallback((error: any) => {
    const message = error?.message || String(error);
    
    // Suppress expected user rejection errors
    if (message?.includes("User rejected")) {
      return;
    }
    
    console.error("[Wallet] Connection error:", message);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={onError}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
