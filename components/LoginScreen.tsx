import React, { useState } from 'react';
import { BotIcon } from './icons';

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      onLogin(email);
    } else {
      alert('Please enter a valid email address.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center">
        <div className="flex justify-center">
            <BotIcon className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">নলেজ বুক এসিস্ট্যান্ট</h1>
        <p className="text-gray-600 dark:text-gray-400">Please enter your email to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="your.email@example.com"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Login
          </button>
        </form>
         <footer className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                &copy; 2024 | Knowledge Book Assistant. All rights reserved.<br/>
                Powered by <a href="https://ai.google.dev/gemini-api" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Google Gemini</a>
            </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginScreen;
