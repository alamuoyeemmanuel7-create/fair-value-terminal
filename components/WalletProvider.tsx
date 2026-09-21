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
  
  // Initialize Phantom wallet with proper error handling
  const wallets = useMemo(() => {
    try {
      // Create adapter but don't validate ready state yet
      // The wallet adapter will handle detection internally
      const phantomWallet = new PhantomWalletAdapter();
      console.log("[Wallet] Phantom adapter created");
      
      // Log ready state if available
      try {
        const readyState = phantomWallet.readyState;
        console.log("[Wallet] Phantom readyState:", readyState);
      } catch (e) {
        console.log("[Wallet] Could not determine Phantom readyState");
      }
      
      return [phantomWallet];
    } catch (error) {
      console.error("[Wallet] Error creating Phantom adapter:", error);
      return [];
    }
  }, []);

  const onError = useCallback((error: any) => {
    const message = error?.message || String(error);
    const name = error?.name || "Unknown";
    
    // Log all wallet errors for debugging
    console.log("[Wallet] Error event:", { name, message });
    
    // Only suppress specific expected errors
    if (name === "WalletNotFoundError" || message?.includes("not found")) {
      console.log("[Wallet] Phantom wallet not found - install browser extension");
      return;
    }
    
    if (message?.includes("User rejected")) {
      console.log("[Wallet] User rejected connection");
      return;
    }
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
