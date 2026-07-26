import "../styles/globals.css";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "../lib/AuthContext";
import { ThemeProvider } from "../lib/ThemeContext";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Head>
          <title>Ledgy — Private Ledger & Budgeting Assistant</title>
          <meta name="description" content="Ledgy: Private Ledger & Budgeting Assistant" />
        </Head>
        <Component {...pageProps} />
        <Analytics />
      </AuthProvider>
    </ThemeProvider>
  );
}
