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
    console.log("[Wallet] RPC endpoint:", url.substring(0, 40) + "...");
    return url;
  }, []);
  
  const wallets = useMemo(() => {
    console.log("[Wallet] Initializing wallet adapters");
    try {
      return [new PhantomWalletAdapter()];
    } catch (error) {
      console.error("[Wallet] Error creating Phantom adapter:", error);
      return [];
    }
  }, []);

  const onError = useCallback((error: any) => {
    const msg = error?.message || String(error);
    
    // Suppress common expected errors
    if (msg.includes("User rejected") || msg.includes("not found")) {
      return;
    }
    
    console.warn("[Wallet] Error:", msg);
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
