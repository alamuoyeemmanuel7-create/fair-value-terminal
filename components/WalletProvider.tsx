"use client";

import { useMemo, useCallback } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

require("@solana/wallet-adapter-react-ui/styles.css");

export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("mainnet-beta");
    console.log("[Wallet] Using RPC endpoint:", url);
    return url;
  }, []);
  
  const wallets = useMemo(() => {
    try {
      const walletList = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new LedgerWalletAdapter(),
        new TorusWalletAdapter(),
      ];
      console.log("[Wallet] Initialized", walletList.length, "wallet adapters");
      return walletList;
    } catch (error) {
      console.error("[Wallet] Error initializing wallets:", error);
      return [new PhantomWalletAdapter()];
    }
  }, []);

  const onError = useCallback((error: any) => {
    const message = error?.message || String(error);
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
