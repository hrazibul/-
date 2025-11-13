
import React from 'react';
import { Settings, Model, AppearanceSettings } from '../types';

interface AdminPanelProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const FONT_SIZES: { key: AppearanceSettings['fontSize']; label: string }[] = [
    { key: 'sm', label: 'S' },
    { key: 'base', label: 'M' },
    { key: 'lg', label: 'L' },
];

const BG_COLORS: { key: AppearanceSettings['chatBackgroundColor']; className: string }[] = [
    { key: 'default', className: 'bg-gray-200 dark:bg-gray-700' },
    { key: 'blue', className: 'bg-blue-200 dark:bg-blue-900' },
    { key: 'green', className: 'bg-green-200 dark:bg-green-900' },
    { key: 'beige', className: 'bg-orange-200 dark:bg-stone-800' },
];


const AdminPanel: React.FC<AdminPanelProps> = ({ settings, setSettings }) => {
    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings(prev => ({ ...prev, model: e.target.value as Model }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    const handleAppearanceChange = (key: keyof AppearanceSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            appearance: {
                ...prev.appearance,
                [key]: value,
            }
        }));
    };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Admin Settings</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI Model</label>
          <select
            id="model"
            name="model"
            value={settings.model}
            onChange={handleModelChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="copilot">Copilot (recommended)</option>
            <option value="general">General LLM (Gemini Pro)</option>
            <option value="fast">Fast/Cost-Effective</option>
          </select>
        </div>
        <div>
          <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Tokens per Response</label>
          <input
            type="number"
            name="maxTokens"
            id="maxTokens"
            value={settings.maxTokens}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="chunkSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chunk Size (tokens)</label>
          <input
            type="number"
            name="chunkSize"
            id="chunkSize"
            step="50"
            value={settings.chunkSize}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="retrievedPassages" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Retrieved Passages</label>
          <input
            type="number"
            name="retrievedPassages"
            id="retrievedPassages"
            max="10"
            min="1"
            value={settings.retrievedPassages}
            onChange={handleInputChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      </div>

      <h3 className="text-lg font-medium mb-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">Appearance Settings</h3>
       <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chat Background</label>
                <div className="flex items-center space-x-2">
                    {BG_COLORS.map(color => (
                        <button
                            key={color.key}
                            type="button"
                            onClick={() => handleAppearanceChange('chatBackgroundColor', color.key)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${color.className} ${settings.appearance.chatBackgroundColor === color.key ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-primary' : 'border-transparent hover:border-gray-400'}`}
                            aria-label={`Set background to ${color.key}`}
                        />
                    ))}
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
                 <div className="flex items-center space-x-2">
                    {FONT_SIZES.map(size => (
                        <button
                            key={size.key}
                            type="button"
                            onClick={() => handleAppearanceChange('fontSize', size.key)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${settings.appearance.fontSize === size.key ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            {size.label}
                        </button>
                    ))}
                </div>
            </div>
       </div>
    </div>
  );
};

export default AdminPanel;