import "./globals.css";
import { Inter } from "next/font/google";
import { UserProvider } from "@/components/UserProvider";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Collab Docs",
  description: "A lightweight collaborative document editor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen text-slate-800">
        <UserProvider>
          <Header />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
