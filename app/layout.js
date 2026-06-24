import "./globals.css";
import { UserProvider } from "@/components/UserProvider";
import Header from "@/components/Header";

export const metadata = {
  title: "Collab Docs",
  description: "A lightweight collaborative document editor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <UserProvider>
          <Header />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
