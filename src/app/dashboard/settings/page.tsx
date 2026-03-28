'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineCog,
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineSave,
  HiOutlineRefresh,
  HiOutlineGlobe,
  HiOutlineServer,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

interface SettingField {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  secret?: boolean;
  description?: string;
  group: string;
}

const SETTING_FIELDS: SettingField[] = [
  // GetContact API
  { key: 'GTC_API_BASE_URL', label: 'API Base URL', icon: HiOutlineGlobe, placeholder: 'https://pbssrv-centralevents.com', group: 'GetContact API' },
  { key: 'GTC_HMAC_SECRET_KEY', label: 'HMAC Secret Key', icon: HiOutlineKey, placeholder: 'Enter HMAC secret key', secret: true, group: 'GetContact API' },
  { key: 'GTC_ANDROID_OS', label: 'Android OS', icon: HiOutlineServer, placeholder: 'android 9', group: 'GetContact API' },
  { key: 'GTC_APP_VERSION', label: 'App Version', icon: HiOutlineServer, placeholder: '8.4.0', group: 'GetContact API' },
  { key: 'GTC_CLIENT_DEVICE_ID', label: 'Client Device ID', icon: HiOutlineServer, placeholder: 'Enter device ID', group: 'GetContact API' },
  { key: 'GTC_LANG', label: 'Language', icon: HiOutlineGlobe, placeholder: 'en_US', group: 'GetContact API' },
  { key: 'GTC_COUNTRY_CODE', label: 'Country Code', icon: HiOutlineGlobe, placeholder: 'id', group: 'GetContact API' },

  // VerifyKit
  { key: 'VFK_API_BASE_URL', label: 'API Base URL', icon: HiOutlineGlobe, placeholder: 'https://web-rest.verifykit.com', group: 'VerifyKit' },
  { key: 'VFK_APP_KEY', label: 'App Key', icon: HiOutlineKey, placeholder: 'Enter VerifyKit app key', secret: true, group: 'VerifyKit' },
  { key: 'VFK_SERVER_KEY', label: 'Server Key', icon: HiOutlineKey, placeholder: 'Enter VerifyKit server key', secret: true, group: 'VerifyKit' },
  { key: 'VFK_CLIENT_IP', label: 'Client IP', icon: HiOutlineServer, placeholder: 'Auto-detect or manual', group: 'VerifyKit' },
  { key: 'VFK_LANG', label: 'Language', icon: HiOutlineGlobe, placeholder: 'en', group: 'VerifyKit' },

  // Tools API
  { key: 'TOOLS_API_BASE_URL', label: 'Tools API URL', icon: HiOutlineGlobe, placeholder: 'https://tools.naufalist.com', group: 'External Tools' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings || {});
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved! 🎉');
        setSettings(data.settings || {});
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed! 🔒');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Group fields
  const groups = SETTING_FIELDS.reduce((acc, field) => {
    if (!acc[field.group]) acc[field.group] = [];
    acc[field.group].push(field);
    return acc;
  }, {} as Record<string, SettingField[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 space-y-4">
            <div className="h-6 w-32 skeleton rounded" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="space-y-2">
                <div className="h-4 w-24 skeleton rounded" />
                <div className="h-10 w-full skeleton rounded-xl" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <HiOutlineCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure your API keys and preferences
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSettings} className="btn-secondary !py-2 !px-3" title="Reload">
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !px-4">
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <HiOutlineSave className="w-4 h-4" />
                Save All
              </div>
            )}
          </button>
        </div>
      </motion.div>

      {/* Credential Groups */}
      {Object.entries(groups).map(([group, fields], gi) => (
        <motion.div
          key={group}
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.1 }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {group === 'GetContact API' && <HiOutlineGlobe className="w-5 h-5 text-teal-500" />}
            {group === 'VerifyKit' && <HiOutlineShieldCheck className="w-5 h-5 text-purple-500" />}
            {group === 'External Tools' && <HiOutlineServer className="w-5 h-5 text-orange-500" />}
            {group}
          </h2>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  {field.label}
                </label>
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={field.secret && !showSecrets[field.key] ? 'password' : 'text'}
                    value={settings[field.key] || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, [field.key]: e.target.value }))}
                    className="input-field pl-10 pr-10 !text-sm"
                    placeholder={field.placeholder}
                  />
                  {field.secret && (
                    <button
                      type="button"
                      onClick={() => toggleSecret(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showSecrets[field.key] ? (
                        <HiOutlineEyeOff className="w-4 h-4" />
                      ) : (
                        <HiOutlineEye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Change Password Section */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HiOutlineLockClosed className="w-5 h-5 text-red-500" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field !text-sm"
              placeholder="Enter current password"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field !text-sm"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="input-field !text-sm"
                placeholder="Repeat new password"
              />
            </div>
          </div>
          <button type="submit" disabled={changingPassword} className="btn-primary !py-2 !px-4">
            {changingPassword ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Changing...
              </div>
            ) : (
              'Change Password'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
