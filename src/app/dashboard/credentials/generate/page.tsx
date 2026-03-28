'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlinePhone,
  HiOutlineChatAlt2,
  HiOutlineCheck,
  HiOutlineClipboardCopy,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineKey,
} from 'react-icons/hi';

interface GeneratedCredentials {
  clientDeviceId: string;
  finalKey: string;
  token: string;
}

const steps = [
  { title: 'Phone Number', description: 'Enter your phone number' },
  { title: 'Verification', description: 'Verify with WhatsApp code' },
  { title: 'Credentials', description: 'Your generated credentials' },
];

export default function GenerateCredentialsPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/getcontact/credentials/generate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.replace(/\D/g, '') }),
      });

      const data = await res.json();
      if (data.success) {
        setRequestId(data.requestId || null);
        toast.success('Verification code sent! Check your WhatsApp.');
        setCurrentStep(1);
      } else {
        toast.error(data.message || 'Failed to send verification code');
      }
    } catch {
      toast.error('Failed to initiate registration');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/getcontact/credentials/generate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          code: verificationCode,
          requestId,
        }),
      });

      const data = await res.json();
      if (data.success && data.credentials) {
        setGeneratedCredentials(data.credentials);
        toast.success('Credentials generated successfully!');
        setCurrentStep(2);
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const resetForm = () => {
    setCurrentStep(0);
    setPhoneNumber('');
    setVerificationCode('');
    setRequestId(null);
    setGeneratedCredentials(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Generate Credentials</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create new API credentials in 3 easy steps
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                    ${
                      index < currentStep
                        ? 'bg-teal-500 text-white'
                        : index === currentStep
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}
                  animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: index === currentStep ? Infinity : 0, repeatDelay: 2 }}
                >
                  {index < currentStep ? (
                    <HiOutlineCheck className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <span
                  className={`text-xs mt-1.5 font-medium hidden sm:block ${
                    index <= currentStep
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 mt-[-1rem] sm:mt-[-1.25rem] transition-colors duration-300 ${
                    index < currentStep
                      ? 'bg-teal-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Phone Number */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              className="glass-card p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center">
                  <HiOutlinePhone className="w-7 h-7 text-teal-500" />
                </div>
                <h2 className="text-lg font-bold">Enter Phone Number</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  We&apos;ll send a verification code via WhatsApp
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="input-field text-center text-lg"
                    placeholder="+62 812 3456 7890"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Include country code (e.g., +62 for Indonesia)
                  </p>
                </div>

                <button
                  onClick={handlePhoneSubmit}
                  disabled={loading || !phoneNumber.trim()}
                  className="btn-primary w-full gap-2"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending code...
                    </div>
                  ) : (
                    <>
                      Continue
                      <HiOutlineArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Verification Code */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              className="glass-card p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center">
                  <HiOutlineChatAlt2 className="w-7 h-7 text-teal-500" />
                </div>
                <h2 className="text-lg font-bold">Enter Verification Code</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Check your WhatsApp for the code sent to <strong>{phoneNumber}</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="btn-secondary flex-1 gap-2"
                  >
                    <HiOutlineArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleVerifyCode}
                    disabled={loading || !verificationCode.trim()}
                    className="btn-primary flex-1 gap-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      <>
                        Verify
                        <HiOutlineArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generated Credentials */}
          {currentStep === 2 && generatedCredentials && (
            <motion.div
              key="step-2"
              className="glass-card p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <motion.div
                  className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <HiOutlineKey className="w-7 h-7 text-emerald-500" />
                </motion.div>
                <h2 className="text-lg font-bold">Credentials Generated!</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Save these credentials securely — you won&apos;t see them again
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Client Device ID', value: generatedCredentials.clientDeviceId },
                  { label: 'Final Key', value: generatedCredentials.finalKey },
                  { label: 'Token', value: generatedCredentials.token },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {item.label}
                      </label>
                      <button
                        onClick={() => copyToClipboard(item.value, item.label)}
                        className="text-teal-500 hover:text-teal-600 transition-colors"
                        title={`Copy ${item.label}`}
                      >
                        <HiOutlineClipboardCopy className="w-4 h-4" />
                      </button>
                    </div>
                    <code className="text-sm font-mono break-all text-gray-700 dark:text-gray-300">
                      {item.value}
                    </code>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    const text = `Client Device ID: ${generatedCredentials.clientDeviceId}\nFinal Key: ${generatedCredentials.finalKey}\nToken: ${generatedCredentials.token}`;
                    copyToClipboard(text, 'All credentials');
                  }}
                  className="btn-secondary flex-1 gap-2"
                >
                  <HiOutlineClipboardCopy className="w-5 h-5" />
                  Copy All
                </button>
                <button onClick={resetForm} className="btn-primary flex-1 gap-2">
                  Generate Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
