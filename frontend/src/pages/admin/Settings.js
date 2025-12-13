import React, { useState } from 'react';
import { toast } from 'react-toastify';

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: 'HRM System',
    workHoursStart: '08:00',
    workHoursEnd: '17:00',
    lateThreshold: 15,
    annualLeaveDays: 12,
    sickLeaveDays: 12,
    currency: 'VND',
    dateFormat: 'DD/MM/YYYY',
    emailNotifications: true,
    systemNotifications: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Settings saved successfully');
    // In real app, send to backend
  };

  const handleReset = () => {
    setSettings({
      companyName: 'HRM System',
      workHoursStart: '08:00',
      workHoursEnd: '17:00',
      lateThreshold: 15,
      annualLeaveDays: 12,
      sickLeaveDays: 12,
      currency: 'VND',
      dateFormat: 'DD/MM/YYYY',
      emailNotifications: true,
      systemNotifications: true,
    });
    toast.info('Settings reset to default');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">System Settings</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Work Start Time</label>
                  <input
                    type="time"
                    value={settings.workHoursStart}
                    onChange={(e) => setSettings({ ...settings, workHoursStart: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Work End Time</label>
                  <input
                    type="time"
                    value={settings.workHoursEnd}
                    onChange={(e) => setSettings({ ...settings, workHoursEnd: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Late Threshold (minutes)</label>
                <input
                  type="number"
                  value={settings.lateThreshold}
                  onChange={(e) => setSettings({ ...settings, lateThreshold: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="VND">VND - Vietnamese Dong</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leave Settings */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Leave Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Annual Leave Days</label>
                <input
                  type="number"
                  value={settings.annualLeaveDays}
                  onChange={(e) => setSettings({ ...settings, annualLeaveDays: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sick Leave Days</label>
                <input
                  type="number"
                  value={settings.sickLeaveDays}
                  onChange={(e) => setSettings({ ...settings, sickLeaveDays: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 mt-6">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Email Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">System Notifications</label>
                <input
                  type="checkbox"
                  checked={settings.systemNotifications}
                  onChange={(e) => setSettings({ ...settings, systemNotifications: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset to Default
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
