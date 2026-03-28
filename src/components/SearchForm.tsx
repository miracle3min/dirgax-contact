"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HiSearch, HiUser, HiTag } from "react-icons/hi";
import toast from "react-hot-toast";
import CredentialSelect from "./CredentialSelect";
import ProfileCard from "./ProfileCard";
import TagsList from "./TagsList";

type SearchType = "profile" | "tags";

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

const countries: Country[] = [
  { code: "ID", dial: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "United States" },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "MY", dial: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "SG", dial: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "IN", dial: "+91", flag: "🇮🇳", name: "India" },
  { code: "TH", dial: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "PH", dial: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "VN", dial: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "AU", dial: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "TR", dial: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "RU", dial: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "SA", dial: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "UAE" },
];

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SearchForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState(countries[0]);
  const [credentialId, setCredentialId] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("profile");
  const [loading, setLoading] = useState(false);
  const [profileResult, setProfileResult] = useState<any>(null);
  const [tagsResult, setTagsResult] = useState<any>(null);
  const [countryOpen, setCountryOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleaned = phoneNumber.replace(/\D/g, "");
    if (!cleaned) {
      toast.error("Please enter a phone number");
      return;
    }
    if (!credentialId) {
      toast.error("Please select a credential");
      return;
    }

    const fullNumber = country.dial + cleaned;
    setLoading(true);
    setProfileResult(null);
    setTagsResult(null);

    try {
      const res = await fetch("/api/getcontact/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: fullNumber,
          id: credentialId,
          searchType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.captchaRequired) {
          toast.error("Captcha required! Go to Dashboard → Captcha Verify");
          return;
        }
        throw new Error(data.message || data.error || "Search failed");
      }

      if (searchType === "profile") {
        setProfileResult(data.data);
        toast.success("Profile found!");
      } else {
        setTagsResult(data.data);
        toast.success(`Found ${data.data?.tags?.length || 0} tags!`);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl shadow-xl shadow-teal-500/5 p-6 sm:p-8"
      >
        {/* Decorative gradient blobs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="relative space-y-5">
          {/* Title */}
          <motion.div variants={itemVariants} className="text-center mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Phone Number Lookup
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Search any phone number for profile info or tags
            </p>
          </motion.div>

          {/* Search type toggle */}
          <motion.div variants={itemVariants} className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <button
              type="button"
              onClick={() => setSearchType("profile")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                searchType === "profile"
                  ? "bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <HiUser size={16} />
              Profile
            </button>
            <button
              type="button"
              onClick={() => setSearchType("tags")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                searchType === "tags"
                  ? "bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <HiTag size={16} />
              Tags
            </button>
          </motion.div>

          {/* Phone number input */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phone Number
            </label>
            <div className="flex gap-2">
              {/* Country selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCountryOpen(!countryOpen)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-sm hover:border-teal-500/50 transition-colors min-w-[100px]"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-gray-700 dark:text-gray-300">{country.dial}</span>
                </button>
                {countryOpen && (
                  <div className="absolute top-full mt-1 left-0 z-20 w-56 max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
                    {countries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCountry(c);
                          setCountryOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-teal-500/10 text-left text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-lg">{c.flag}</span>
                        <span className="flex-1">{c.name}</span>
                        <span className="text-gray-400">{c.dial}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone input */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="8123456789"
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </motion.div>

          {/* Credential selector */}
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Credential
            </label>
            <CredentialSelect value={credentialId} onChange={setCredentialId} />
          </motion.div>

          {/* Search button */}
          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <HiSearch size={18} />
                  Search {searchType === "profile" ? "Profile" : "Tags"}
                </>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>

      {/* Results */}
      {profileResult && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-6"
        >
          <ProfileCard profile={profileResult} />
        </motion.div>
      )}

      {tagsResult && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-6"
        >
          <TagsList tags={tagsResult.tags || []} phoneNumber={tagsResult.phoneNumber || ""} />
        </motion.div>
      )}
    </div>
  );
}
