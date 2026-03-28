"use client";

import { FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200/50 dark:border-gray-800/50 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-500">
        <span>
          GetContact Web <span className="text-teal-500 font-semibold">v2.0</span> — Built
          with{" "}
          <span className="font-medium text-gray-700 dark:text-gray-400">Next.js</span>
        </span>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="GitHub"
        >
          <FaGithub size={18} />
        </a>
      </div>
    </footer>
  );
}
