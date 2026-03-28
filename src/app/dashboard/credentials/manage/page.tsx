'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineKey,
  HiOutlineRefresh,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineClipboardCopy,
} from 'react-icons/hi';

interface Credential {
  id: string;
  description: string;
  finalKey: string;
  token: string;
  clientDeviceId: string;
}

interface CredentialFormData {
  description: string;
  finalKey: string;
  token: string;
  clientDeviceId: string;
}

const emptyForm: CredentialFormData = {
  description: '',
  finalKey: '',
  token: '',
  clientDeviceId: '',
};

function SkeletonRow() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ManageCredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CredentialFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCredentials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/getcontact/credentials/manage');
      const data = await res.json();
      if (data.success) {
        setCredentials(data.credentials || []);
      } else {
        toast.error(data.message || 'Failed to fetch credentials');
      }
    } catch {
      toast.error('Failed to fetch credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (cred: Credential) => {
    setEditingId(cred.id);
    setFormData({
      description: cred.description,
      finalKey: cred.finalKey,
      token: cred.token,
      clientDeviceId: cred.clientDeviceId,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.finalKey.trim() || !formData.token.trim() || !formData.clientDeviceId.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch('/api/getcontact/credentials/manage', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Credential updated!' : 'Credential added!');
        setShowModal(false);
        fetchCredentials();
      } else {
        toast.error(data.message || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save credential');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch('/api/getcontact/credentials/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Credential deleted!');
        setDeleteConfirm(null);
        fetchCredentials();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete credential');
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Credentials</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Add, edit, or remove API credentials
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCredentials} className="btn-secondary !p-2.5 !rounded-xl" title="Refresh">
            <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openAddModal} className="btn-primary !px-4 gap-2">
            <HiOutlinePlus className="w-5 h-5" />
            <span className="hidden sm:inline">Add New</span>
          </button>
        </div>
      </div>

      {/* Credentials List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : credentials.length === 0 ? (
          <motion.div
            className="glass-card p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <HiOutlineKey className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No credentials found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add your first credential to get started
            </p>
            <button onClick={openAddModal} className="btn-primary mt-4 gap-2">
              <HiOutlinePlus className="w-5 h-5" />
              Add Credential
            </button>
          </motion.div>
        ) : (
          credentials.map((cred, index) => (
            <motion.div
              key={cred.id}
              className="glass-card p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">
                      {cred.description || `Credential #${cred.id}`}
                    </h3>
                    <span className="badge-info">ID: {cred.id}</span>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium min-w-[80px]">Device ID:</span>
                      <code className="truncate bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded flex-1">
                        {cred.clientDeviceId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(cred.clientDeviceId, 'Device ID')}
                        className="text-gray-400 hover:text-teal-500 transition-colors flex-shrink-0"
                      >
                        <HiOutlineClipboardCopy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium min-w-[80px]">Token:</span>
                      <code className="truncate bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded flex-1">
                        {cred.token.substring(0, 40)}...
                      </code>
                      <button
                        onClick={() => copyToClipboard(cred.token, 'Token')}
                        className="text-gray-400 hover:text-teal-500 transition-colors flex-shrink-0"
                      >
                        <HiOutlineClipboardCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(cred)}
                    className="p-2 rounded-lg text-gray-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all"
                    title="Edit"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(cred.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Delete"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="glass-card p-6 w-full max-w-lg"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">
                  {editingId ? 'Edit Credential' : 'Add New Credential'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    placeholder="e.g., My Primary Key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Final Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.finalKey}
                    onChange={(e) => setFormData({ ...formData, finalKey: e.target.value })}
                    className="input-field font-mono text-sm"
                    placeholder="Enter final key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Token <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    className="input-field font-mono text-sm resize-none"
                    rows={3}
                    placeholder="Enter token"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Client Device ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.clientDeviceId}
                    onChange={(e) => setFormData({ ...formData, clientDeviceId: e.target.value })}
                    className="input-field font-mono text-sm"
                    placeholder="Enter client device ID"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : editingId ? (
                    'Update'
                  ) : (
                    'Add Credential'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              className="glass-card p-6 w-full max-w-sm text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <HiOutlineExclamation className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Delete Credential</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete this credential? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 btn-primary !from-red-500 !to-red-600 !shadow-red-500/25"
                >
                  {deleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
