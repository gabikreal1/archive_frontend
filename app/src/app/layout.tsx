import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';

export const metadata: Metadata = {
  title: 'ARC LLM Task Platform',
  description: 'Create, fund, and review marketplace LLM executions.',
  manifest: '/manifest.json'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
