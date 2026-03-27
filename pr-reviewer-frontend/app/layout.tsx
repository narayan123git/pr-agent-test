import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from './components/Providers';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI PR Reviewer | Automated GitHub Code Analysis",
  description: "Automate your GitHub pull request reviews with Google Gemini AI. Catch bugs and security vulnerabilities instantly.",
  keywords: ["GitHub", "Pull Request", "Code Review", "AI", "Gemini", "Automated Code Review", "DevSecOps", "Programming"],
  openGraph: {
    title: "AI PR Reviewer | Automated GitHub Code Analysis",
    description: "Automate your GitHub pull request reviews with Google Gemini AI. Catch bugs and security vulnerabilities instantly.",
    url: "https://pr-agent-test.vercel.app",
    siteName: "AI PR Reviewer",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI PR Reviewer | Automated GitHub Code Analysis",
    description: "Automate your GitHub pull request reviews with Google Gemini AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
      <Providers>
        {children}
      </Providers>
      </body>
    </html>
  );
}
