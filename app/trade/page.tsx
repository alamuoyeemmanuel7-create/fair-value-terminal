"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { RawAsset } from "@/lib/types";

const EXTERNAL_TRADE_URL: Record<string, (a: RawAsset) => string> = {
  PreStocks: (a) => `https://www.prestocks.com/${a.company.toLowerCase().replace(/\s+/g, "")}`,
  Tessera: () => `https://app.tessera.pe`,
};

export default function TradePage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [assets, setAssets] = useState<RawAsset[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setAssets(d.assets ?? []));
  }, []);

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalances({});
      return;
    }
    setLoadingBalances(true);
    (async () => {
      try {
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID,
        });
        const byMint: Record<string, number> = {};
        for (const { account } of accounts.value) {
          const info = account.data.parsed.info;
          byMint[info.mint] = info.tokenAmount.uiAmount ?? 0;
        }
        setBalances(byMint);
      } finally {
        setLoadingBalances(false);
      }
    })();
  }, [connected, publicKey, connection]);

  return (
    <section className="panel">
      <h2>Your positions</h2>
      <p className="desc">
        Connect a wallet to read your actual on-chain balance for every
        tracked pre-IPO mint. These SPV-backed tokens trade on each issuer's
        own venue rather than a shared order book, so execution routes out
        to the platform that minted the token — we are not simulating
        liquidity we do not have.
      </p>

      {!connected && <p className="status">No wallet connected.</p>}
      {loadingBalances && <p className="status">Reading token accounts…</p>}

      <div className="row head">
        <div>Asset</div>
        <div className="num hide-mobile">Mark price</div>
        <div className="num">Your balance</div>
        <div className="num">Action</div>
      </div>
      {assets.map((a) => (
        <div className="row" key={`${a.platform}-${a.mint}`}>
          <div className="company">
            {a.company}
            <span className="tag">{a.platform}</span>
          </div>
          <div className="num hide-mobile">${a.markPrice.toFixed(2)}</div>
          <div className="num">
            {connected ? (balances[a.mint] ?? 0).toLocaleString() : "—"}
          </div>
          <div className="num">
            <a
              className="btn"
              href={EXTERNAL_TRADE_URL[a.platform]?.(a) ?? "#"}
              target="_blank"
              rel="noreferrer"
            >
              Trade on {a.platform}
            </a>
          </div>
        </div>
      ))}
    </section>
  );
}
