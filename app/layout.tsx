import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'PumpFun Scanner - Token Analytics Dashboard',
  description:
    'Real-time dashboard to monitor and analyze trending tokens from pump.fun. Identify utility tokens vs meme tokens with automated scoring and classification.',
  openGraph: {
    title: 'PumpFun Scanner - Token Analytics Dashboard',
    description: 'Monitor and analyze trending pump.fun tokens with automated utility scoring.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
