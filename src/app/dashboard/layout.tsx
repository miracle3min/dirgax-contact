'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlinePlusCircle,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineChevronLeft,
  HiOutlineCog,
  HiOutlineUser,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const sidebarLinks = [
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: HiOutlineCog,
  },
  {
    href: '/dashboard/credentials/manage',
    label: 'Manage Credentials',
    icon: HiOutlineKey,
  },
  {
    href: '/dashboard/captcha/verify',
    label: 'Verify Captcha',
    icon: HiOutlineShieldCheck,
  },
  {
    href: '/dashboard/credentials/generate',
    label: 'Generate Credentials',
    icon: HiOutlinePlusCircle,
  },
];

interface AuthUser {
  id: number;
  username: string;
  displayName: string | null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Allow login page without auth
    if (pathname === '/dashboard') {
      setAuthenticated(true);
      return;
    }

    fetch('/api/auth/check')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthenticated(true);
          setUser(data.user || null);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        router.replace('/dashboard');
      });
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.replace('/dashboard');
    } catch {
      toast.error('Logout failed');
    }
  };

  // Loading state
  if (authenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Login/signup page (no sidebar)
  if (pathname === '/dashboard') {
    return <>{children}</>;
  }

  return (
    <div className="flex gap-6 min-h-[70vh]">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 btn-primary !p-3 !rounded-full !shadow-xl"
      >
        {sidebarOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`
          fixed lg:sticky top-24 left-0 z-40 lg:z-0
          w-72 lg:w-64 h-[calc(100vh-6rem)] lg:h-auto lg:max-h-[calc(100vh-8rem)]
          glass-card p-4 flex flex-col gap-2
          transform lg:transform-none transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        initial={false}
      >
        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1 border-b border-gray-200/50 dark:border-gray-700/50 pb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <HiOutlineUser className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.displayName || user.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <Link href="/" className="text-gray-400 hover:text-teal-500 transition-colors">
            <HiOutlineChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-bold text-lg bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Dashboard
          </h2>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }
                `}
              >
                <link.icon className={`w-5 h-5 ${isActive ? 'text-teal-500' : ''}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 mt-auto"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Logout
        </button>
      </motion.aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
