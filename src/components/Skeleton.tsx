"use client";

import { cn } from "@/lib/utils";

function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  );
}

interface SkeletonProps {
  className?: string;
}

export function SkeletonLine({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse h-4 w-full",
        className
      )}
    >
      <ShimmerOverlay />
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gray-200/60 dark:bg-gray-800/60 animate-pulse p-6 space-y-4",
        className
      )}
    >
      <div className="h-5 w-2/5 rounded-md bg-gray-300 dark:bg-gray-700" />
      <div className="space-y-2.5">
        <div className="h-4 w-full rounded-md bg-gray-300 dark:bg-gray-700" />
        <div className="h-4 w-4/5 rounded-md bg-gray-300 dark:bg-gray-700" />
        <div className="h-4 w-3/5 rounded-md bg-gray-300 dark:bg-gray-700" />
      </div>
      <div className="h-10 w-1/3 rounded-lg bg-gray-300 dark:bg-gray-700" />
      <ShimmerOverlay />
    </div>
  );
}

export function SkeletonProfile({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gray-200/60 dark:bg-gray-800/60 animate-pulse p-6",
        className
      )}
    >
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-full bg-gray-300 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-5 w-3/5 rounded-md bg-gray-300 dark:bg-gray-700" />
          <div className="h-3.5 w-2/5 rounded-md bg-gray-300 dark:bg-gray-700" />
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="h-4 w-full rounded-md bg-gray-300 dark:bg-gray-700" />
        <div className="h-4 w-3/4 rounded-md bg-gray-300 dark:bg-gray-700" />
      </div>
      <ShimmerOverlay />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gray-200/60 dark:bg-gray-800/60 animate-pulse",
        className
      )}
    >
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-300/50 dark:border-gray-700/50">
        <div className="h-4 w-1/4 rounded bg-gray-300 dark:bg-gray-700" />
        <div className="h-4 w-1/4 rounded bg-gray-300 dark:bg-gray-700" />
        <div className="h-4 w-1/4 rounded bg-gray-300 dark:bg-gray-700" />
        <div className="h-4 w-1/4 rounded bg-gray-300 dark:bg-gray-700" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 border-b border-gray-300/30 dark:border-gray-700/30 last:border-0"
        >
          <div className="h-3.5 w-1/4 rounded bg-gray-300/70 dark:bg-gray-700/70" />
          <div className="h-3.5 w-1/4 rounded bg-gray-300/70 dark:bg-gray-700/70" />
          <div className="h-3.5 w-1/4 rounded bg-gray-300/70 dark:bg-gray-700/70" />
          <div className="h-3.5 w-1/4 rounded bg-gray-300/70 dark:bg-gray-700/70" />
        </div>
      ))}
      <ShimmerOverlay />
    </div>
  );
}
