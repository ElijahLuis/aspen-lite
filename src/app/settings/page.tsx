'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const SETTINGS_KEY = 'aspen_lite_settings';

interface Settings {
  schoolName: string;
  nurseName: string;
  defaultDisposition: string;
  autoSaveDrafts: boolean;
  showDurationOnSave: boolean;
  hspPromptEnabled: boolean;
}

const defaultSettings: Settings = {
  schoolName: 'Lincoln Elementary',
  nurseName: '',
  defaultDisposition: '',
  autoSaveDrafts: true,
  showDurationOnSave: true,
  hspPromptEnabled: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        // Use defaults
      }
    }
  }, []);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    if (confirm('This will clear all encounters, drafts, and recent students. Continue?')) {
      localStorage.removeItem('aspen_lite_encounters');
      localStorage.removeItem('aspen_lite_encounter_draft');
      localStorage.removeItem('aspen_lite_recent_students');
      localStorage.removeItem('aspen_lite_draft_student');
      alert('Local data cleared.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
      </div>

      {/* School & User */}
      <div className="card space-y-4">
        <h2 className="text-lg font-medium">School & User</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            School Name
          </label>
          <input
            type="text"
            value={settings.schoolName}
            onChange={(e) => updateSetting('schoolName', e.target.value)}
            className="input"
            placeholder="Enter school name"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Displayed in the header
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Your Name (optional)
          </label>
          <input
            type="text"
            value={settings.nurseName}
            onChange={(e) => updateSetting('nurseName', e.target.value)}
            className="input"
            placeholder="e.g., Nurse Johnson"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Included in generated reports
          </p>
        </div>
      </div>

      {/* Encounter Defaults */}
      <div className="card space-y-4">
        <h2 className="text-lg font-medium">Encounter Defaults</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Default Disposition
          </label>
          <select
            value={settings.defaultDisposition}
            onChange={(e) => updateSetting('defaultDisposition', e.target.value)}
            className="input"
          >
            <option value="">No default (select each time)</option>
            <option value="returned_to_class">Returned to class</option>
            <option value="sent_home">Sent home</option>
            <option value="stayed_in_clinic">Stayed in clinic</option>
            <option value="parent_pickup">Parent pickup</option>
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoSaveDrafts}
            onChange={(e) => updateSetting('autoSaveDrafts', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-clinic-600 focus:ring-clinic-500"
          />
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Auto-save drafts
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recover unsaved encounters after accidental page close
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showDurationOnSave}
            onChange={(e) => updateSetting('showDurationOnSave', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-clinic-600 focus:ring-clinic-500"
          />
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Show encounter duration
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Display time taken when saving encounter
            </p>
          </div>
        </label>
      </div>

      {/* HSP Settings */}
      <div className="card space-y-4">
        <h2 className="text-lg font-medium">Health Safety Plans</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.hspPromptEnabled}
            onChange={(e) => updateSetting('hspPromptEnabled', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-clinic-600 focus:ring-clinic-500"
          />
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              HSP update prompts
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prompt when encounters may require HSP updates (new meds, EMS, etc.)
            </p>
          </div>
        </label>
      </div>

      {/* Data Management */}
      <div className="card space-y-4">
        <h2 className="text-lg font-medium">Data Management</h2>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Clear local data
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Remove all encounters, drafts, and recent students
            </p>
          </div>
          <button
            onClick={handleClearData}
            className="btn text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 text-sm"
          >
            Clear Data
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">About data storage</p>
          <p>
            All data is currently stored in your browser&apos;s local storage.
            In v2+, data will sync with the server and export to SSM.
          </p>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="card space-y-4">
        <h2 className="text-lg font-medium">Keyboard Shortcuts</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Save encounter</span>
            <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
              ⌘ + Enter
            </kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Save + next student</span>
            <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
              ⌘ + Shift + Enter
            </kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Clear selected student</span>
            <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
              Esc
            </kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Navigate search results</span>
            <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">
              ↑ / ↓
            </kbd>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-600 py-4">
        Aspen-Lite v1.0 &middot; Clinician Cockpit
      </div>
    </div>
  );
}
