"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { WalletStatus } from "./WalletStatus";
import { CustomWalletButton } from "./CustomWalletButton";

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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <Suspense fallback={<div style={{ width: 150, height: 40 }} />}>
          <CustomWalletButton />
        </Suspense>
        <WalletStatus />
      </div>
    </div>
  );
}
