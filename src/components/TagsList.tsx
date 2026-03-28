"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { HiDownload, HiHashtag } from "react-icons/hi";
import toast from "react-hot-toast";

interface TagsListProps {
  tags: string[];
  phoneNumber: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const tagVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 15, stiffness: 200 },
  },
};

export default function TagsList({ tags, phoneNumber }: TagsListProps) {
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
      link.download = `getcontact-tags-${phoneNumber || "unknown"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image saved!");
    } catch {
      toast.error("Failed to save image");
    }
  };

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
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500" />

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Tags Result
              </h3>
              {phoneNumber && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {phoneNumber}
                </p>
              )}
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              <HiHashtag size={12} />
              {tags.length} tag{tags.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tags */}
          {tags.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No tags found for this number.
            </p>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-2"
            >
              {tags.map((tag, index) => (
                <motion.span
                  key={index}
                  variants={tagVariants}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/40 hover:border-teal-400 dark:hover:border-teal-500 transition-colors cursor-default"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Save button */}
      {tags.length > 0 && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSaveImage}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
          >
            <HiDownload size={16} />
            Save as Image
          </button>
        </div>
      )}
    </motion.div>
  );
}
