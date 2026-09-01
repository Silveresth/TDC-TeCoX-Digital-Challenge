import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';

export const metadata: Metadata = {
  title: 'TDC — TeCoX Digital Challenge 2026',
  description: 'Plateforme officielle de la compétition numérique TeCoX — Tech Community eXperience.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
