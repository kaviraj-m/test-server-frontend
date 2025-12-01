'use client';

import { useState } from 'react';
import PerformanceDashboard from './components/PerformanceDashboard';

export default function Home() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const maxRequestLimit = 1000;
  const maxIterationLimit = 1000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Server Performance Monitor
              </h1>
              <p className="text-gray-400">
                Real-time CPU, Memory, and Performance Testing Dashboard
              </p>
            </div>
            <div className="max-w-4xl bg-blue-900/30 border border-blue-600 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-400 text-xl">ℹ️</div>
                <div className="flex-1">
                  <h3 className="text-blue-300 font-semibold mb-1">Request Limits Notice</h3>
                  <p className="text-blue-200 text-sm mb-3">
                    Due to high request restrictions, unlimited limits require a password to unlock. 
                    Current limits: <span className="font-semibold">{maxRequestLimit} concurrent requests</span> and{' '}
                    <span className="font-semibold">{maxIterationLimit.toLocaleString()} iterations per request</span>. 
                    To exceed these limits, click the button below to enter the password.
                  </p>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm"
                  >
                    Enter Password to Unlock Limits
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <PerformanceDashboard showPasswordModal={showPasswordModal} setShowPasswordModal={setShowPasswordModal} />
      </div>
    </div>
  );
}
