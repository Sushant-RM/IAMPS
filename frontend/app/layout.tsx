import React from 'react';
import '../styles/globals.css';
import AppProviders from './providers';

export const metadata = {
  title: 'Research Ecosystem',
  description: 'AI Portfolio & Research Paper Management Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
