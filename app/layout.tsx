import "./globals.css";
import type { Metadata } from "next";
import { AppWalletProvider } from "@/components/WalletProvider";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Basis | Pre-IPO fair value terminal",
  description:
    "Cross-platform mispricing signals for tokenized pre-IPO stocks, live from PreStocks, Tessera and Pyth.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppWalletProvider>
          <div className="wrap">
            <header className="masthead">
              <div>
                <h1>Basis</h1>
                <div className="sub">pre-IPO fair value terminal</div>
              </div>
              <Nav />
            </header>
            {children}
          </div>
        </AppWalletProvider>
      </body>
    </html>
  );
}
