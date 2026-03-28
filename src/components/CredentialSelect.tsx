"use client";

import { useState, useEffect } from "react";
import { SkeletonLine } from "./Skeleton";

export interface Credential {
  id: string;
  description: string;
  finalKey: string;
  token: string;
  clientDeviceId: string;
}

interface CredentialSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function CredentialSelect({ value, onChange, className }: CredentialSelectProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const res = await fetch("/api/getcontact/credentials");
        if (!res.ok) throw new Error("Failed to fetch credentials");
        const data = await res.json();
        setCredentials(data.credentials || []);
        if (data.credentials?.length > 0 && !value) {
          onChange(data.credentials[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load credentials");
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <SkeletonLine className="h-11 rounded-xl" />;
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 dark:text-red-400 px-3 py-2.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
        {error}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="text-sm text-amber-600 dark:text-amber-400 px-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        No credentials configured. Add them in the dashboard.
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer ${className || ""}`}
    >
      {credentials.map((cred) => (
        <option key={cred.id} value={cred.id}>
          {cred.description || `Credential #${cred.id}`}
        </option>
      ))}
    </select>
  );
}
