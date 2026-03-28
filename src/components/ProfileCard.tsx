"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { HiDownload, HiShieldCheck, HiExclamation, HiGlobe, HiTag, HiPhone } from "react-icons/hi";
import toast from "react-hot-toast";

interface ProfileData {
  displayName?: string;
  phoneNumber?: string;
  country?: string;
  tagCount?: number;
  spamCount?: number;
  spamType?: string;
  email?: string;
  [key: string]: any;
}

interface ProfileCardProps {
  profile: ProfileData;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#111827",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `getcontact-${profile.phoneNumber || "profile"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image saved!");
    } catch {
      toast.error("Failed to save image");
    }
  };

  const isSpam = (profile.spamCount || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div
        ref={cardRef}
        className="relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        {/* Gradient top border */}
        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500" />

        <div className="p-6 space-y-4">
          {/* Profile name */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {profile.displayName || "Unknown"}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <HiPhone size={14} />
                <span>{profile.phoneNumber || "N/A"}</span>
              </div>
            </div>
            {isSpam ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                <HiExclamation size={14} />
                Spam
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <HiShieldCheck size={14} />
                Clean
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {profile.country && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <HiGlobe className="text-teal-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Country</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {profile.country}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <HiTag className="text-cyan-500" size={18} />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tags</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {profile.tagCount ?? 0}
                </p>
              </div>
            </div>
            {isSpam && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                <HiExclamation className="text-red-500" size={18} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Spam Reports</p>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {profile.spamCount}
                    {profile.spamType && ` (${profile.spamType})`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save button (outside ref so it won't appear in screenshot) */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleSaveImage}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
        >
          <HiDownload size={16} />
          Save as Image
        </button>
      </div>
    </motion.div>
  );
}
