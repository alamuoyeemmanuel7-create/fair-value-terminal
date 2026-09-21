"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false, loading: () => <div style={{ width: 150, height: 40 }} /> }
);

export default function Nav() {
  const pathname = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} className={pathname === href ? "active" : ""}>
      {label}
    </Link>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <nav className="nav">
        {link("/", "Dashboard")}
        {link("/basket", "Basket")}
        {link("/trade", "Trade")}
      </nav>
      <Suspense fallback={<div style={{ width: 150, height: 40 }} />}>
        <WalletMultiButton style={{ fontFamily: "var(--sans)", fontSize: 13 }} />
      </Suspense>
    </div>
  );
}
