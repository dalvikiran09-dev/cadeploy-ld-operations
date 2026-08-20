import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, Download, Upload, RotateCcw, Building, Moon, Sun, 
  Database, Shield, Save, CheckCircle2, Tag, Plus, Edit, Trash2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    settings, updateSettings, toggleTheme, backupDatabase, 
    restoreDatabase, resetToDefaults, categories, addCategory, updateCategory, deleteCategory,
    tasks, repairTaskNumberingSequence
  } = useApp();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [departmentName, setDepartmentName] = useState(settings.departmentName);
  const [companyLogo, setCompanyLogo] = useState(settings.companyLogo);
  const [restoreJson, setRestoreJson] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [repairResult, setRepairResult] = useState<{
    totalTasks: number;
    resequencedCount: number;
    duplicatesRemoved: number;
    gapsResolved: number;
  } | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  const handleRepairSequence = async () => {
    setIsRepairing(true);
    try {
      const result = await repairTaskNumberingSequence();
      setRepairResult(result);
    } catch (e) {
      console.error("Error repairing sequence:", e);
      alert("Failed to repair task sequence.");
    } finally {
      setIsRepairing(false);
    }
  };

  // Category state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      departmentName,
      companyLogo
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const handleSaveCategoryEdit = (oldName: string) => {
    if (!editingNameValue.trim()) return;
    updateCategory(oldName, editingNameValue.trim());
    setEditingCategory(null);
  };

  const handleDownloadBackup = () => {
    const jsonStr = backupDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CADEPLOY_LD_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreJson.trim()) return;
    const ok = restoreDatabase(restoreJson.trim());
    if (ok) {
      alert('Database restored successfully!');
      setRestoreJson('');
    } else {
      alert('Failed to parse backup JSON. Please check file format.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          System & Organization Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage system branding, L&D operational categories, appearance themes, database backups, and restore operations.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings saved successfully.
        </div>
      )}

      {/* Organization Branding */}
      <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-600" /> Organization & Department Identity
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Name
            </label>
            <input
              type="text"
              required
              value={departmentName}
              onChange={e => setDepartmentName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Company Logo URL
          </label>
          <input
            type="text"
            value={companyLogo}
            onChange={e => setCompanyLogo(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" /> Save Branding Settings
        </button>
      </form>

      {/* Categories Management (Requirement 12) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            Operational & Training Categories ({categories.length})
          </h2>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="Add new task category (e.g. Safety Orientation)..."
            className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </form>

        {/* Categories List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {categories.map(cat => (
            <div key={cat} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
              {editingCategory === cat ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={editingNameValue}
                    onChange={e => setEditingNameValue(e.target.value)}
                    className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-blue-500 rounded text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleSaveCategoryEdit(cat)}
                    className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setEditingNameValue(cat);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Rename Category"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category "${cat}"?`)) {
                          deleteCategory(cat);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          Microsoft Fluent Design Visual Theme
        </h2>

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Active Theme Mode</div>
            <div className="text-[11px] text-slate-500">Toggle between Microsoft Fluent Light and Dark UI canvas modes</div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            Switch to {settings.theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </div>

      {/* Task Numbering & Sequence Integrity */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Task Code Sequence & Creation-Order Integrity
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Validates that all active tasks are assigned strictly according to creation date/time (<code className="text-blue-600 dark:text-blue-400 font-mono text-[10px]">created_at ASC, id ASC</code>) starting from <code className="font-mono text-blue-600 dark:text-blue-400 text-[10px]">LD-TSK-101</code> with zero duplicates or gaps.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRepairSequence}
            disabled={isRepairing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all whitespace-nowrap self-start sm:self-center"
          >
            {isRepairing ? 'Validating & Resequencing...' : 'Repair & Validate Sequence'}
          </button>
        </div>

        {repairResult && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs space-y-1">
            <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Task Sequence Verification Complete
            </div>
            <div className="text-slate-600 dark:text-slate-300 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div>Total Active Tasks: <strong className="font-mono text-slate-900 dark:text-white">{repairResult.totalTasks}</strong></div>
              <div>Codes Resequenced: <strong className="font-mono text-slate-900 dark:text-white">{repairResult.resequencedCount}</strong></div>
              <div>Duplicate Codes Fixed: <strong className="font-mono text-slate-900 dark:text-white">{repairResult.duplicatesRemoved}</strong></div>
              <div>Gaps Resolved: <strong className="font-mono text-slate-900 dark:text-white">{repairResult.gapsResolved}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Database Backup & Restore */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Database Backup & Restore Operations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" /> Backup System Database
            </h3>
            <p className="text-[11px] text-slate-500">
              Download complete local JSON snapshot of all operational tasks, user accounts, audit trails, and time logs.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              Export JSON Backup File
            </button>
          </div>

          <form onSubmit={handleRestoreSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-600" /> Restore Database Snapshot
            </h3>
            <textarea
              rows={2}
              value={restoreJson}
              onChange={e => setRestoreJson(e.target.value)}
              placeholder="Paste backup JSON string here..."
              className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              Apply Restore Data
            </button>
          </form>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div>
            <div className="text-xs font-bold text-rose-600">Danger Zone: Reset System</div>
            <div className="text-[11px] text-slate-400">Revert all local changes back to default seed data</div>
          </div>
          <button
            onClick={() => {
              if (confirm('Reset all database tables to default seed state?')) {
                resetToDefaults();
              }
            }}
            className="px-4 py-2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-200 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Reset To Seed Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

