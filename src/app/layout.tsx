import type { Metadata } from "next";
import Head from "next/head";
import { Raleway } from "next/font/google";
import "../assets/scss/style.scss";
import Footer from "@/components/Footer";

const inter = Raleway({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tarot",
  description: "Unveil the mysteries of your future with our mystical tarot reading app. Get personalized predictions, daily insights, and a touch of humor to guide you on your spiritual journey. Dive into the world of tarot and discover what the cards have in store for you today!",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
    <Head>
      <link rel="icon" href="/logo.svg" />
    </Head>
    <body className={inter.className}>
      {children}
      <Footer/>
    </body>
    </html>
  );
};
