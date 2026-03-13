import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@/styles/globals.css';
import { QueryProvider } from '@/components/layout/query-provider';
import { AuthGate } from '@/components/layout/auth-gate';

export const metadata: Metadata = {
  title: 'Gravity — Vehicle Health',
  description: 'Probabilistic vehicle health governance',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-gravity-bg text-gravity-text font-sans antialiased noise-bg min-h-screen">
        <QueryProvider>
          <AuthGate>{children}</AuthGate>
        </QueryProvider>
      </body>
    </html>
  );
}
