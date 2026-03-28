'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlinePhotograph,
} from 'react-icons/hi';

interface Credential {
  id: string;
  description: string;
}

export default function VerifyCaptchaPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState('');
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [validationCode, setValidationCode] = useState('');
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCredentials = useCallback(async () => {
    try {
      setLoadingCredentials(true);
      const res = await fetch('/api/getcontact/credentials/manage');
      const data = await res.json();
      if (data.success) {
        setCredentials(data.credentials || []);
      }
    } catch {
      toast.error('Failed to load credentials');
    } finally {
      setLoadingCredentials(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const refreshCaptcha = async () => {
    if (!selectedCredential) {
      toast.error('Please select a credential first');
      return;
    }

    setLoadingCaptcha(true);
    setCaptchaImage(null);
    setValidationCode('');

    try {
      const res = await fetch('/api/getcontact/captcha/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: selectedCredential }),
      });

      const data = await res.json();
      if (data.success && data.captchaUrl) {
        setCaptchaImage(data.captchaUrl);
        toast.success('Captcha loaded!');
      } else {
        toast.error(data.message || 'Failed to load captcha');
      }
    } catch {
      toast.error('Failed to refresh captcha');
    } finally {
      setLoadingCaptcha(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCredential) {
      toast.error('Please select a credential');
      return;
    }
    if (!validationCode.trim()) {
      toast.error('Please enter the validation code');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/getcontact/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialId: selectedCredential,
          code: validationCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Captcha verified successfully!');
        setCaptchaImage(null);
        setValidationCode('');
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Verify Captcha</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Solve captcha challenges to keep credentials active
        </p>
      </div>

      <div className="max-w-lg">
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleVerify} className="space-y-5">
            {/* Credential Selector */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Select Credential
              </label>
              {loadingCredentials ? (
                <div className="input-field animate-pulse bg-gray-100 dark:bg-gray-800 h-12" />
              ) : (
                <select
                  value={selectedCredential}
                  onChange={(e) => {
                    setSelectedCredential(e.target.value);
                    setCaptchaImage(null);
                    setValidationCode('');
                  }}
                  className="input-field"
                >
                  <option value="">Choose a credential...</option>
                  {credentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.description || `Credential #${cred.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Captcha Display */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Captcha Image</label>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  disabled={loadingCaptcha || !selectedCredential}
                  className="text-xs text-teal-500 hover:text-teal-600 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  <HiOutlineRefresh className={`w-4 h-4 ${loadingCaptcha ? 'animate-spin' : ''}`} />
                  {captchaImage ? 'Refresh' : 'Load Captcha'}
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 min-h-[120px] flex items-center justify-center">
                {loadingCaptcha ? (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-8 h-8 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                    <span className="text-xs">Loading captcha...</span>
                  </div>
                ) : captchaImage ? (
                  <motion.img
                    src={captchaImage}
                    alt="Captcha"
                    className="max-w-full h-auto rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <HiOutlinePhotograph className="w-10 h-10" />
                    <span className="text-xs">
                      {selectedCredential ? 'Click "Load Captcha" to begin' : 'Select a credential first'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Code */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Validation Code</label>
              <input
                type="text"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                className="input-field text-center text-lg tracking-widest font-mono"
                placeholder="Enter code from image"
                disabled={!captchaImage}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !captchaImage || !validationCode.trim()}
              className="btn-primary w-full gap-2"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                <>
                  <HiOutlineShieldCheck className="w-5 h-5" />
                  Verify Captcha
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
