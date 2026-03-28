import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'GetContact Web',
  description: 'Search phone number profiles and tags via GetContact API',
  icons: { icon: '/images/getcontact.webp' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-8 pt-24">
            {children}
          </main>
          <Footer />
          <Toaster
            position="top-center"
            toastOptions={{
              className: '!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !shadow-lg',
              duration: 3000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
