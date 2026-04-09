import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: { default: 'AMSODE RH PRO', template: '%s | AMSODE RH PRO' },
  description: 'Plateforme de Gestion des Ressources Humaines — AMSODE Mali',
  manifest: '/manifest.json',
  icons: { 
    icon: '/logo.png',
    shortcut: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#f59e0b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontFamily: 'inherit' } }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
