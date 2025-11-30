'use client';

import { useState, useEffect } from 'react';
import PerformanceDashboard from './components/PerformanceDashboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Server Performance Monitor
          </h1>
          <p className="text-gray-400">
            Real-time CPU, Memory, and Performance Testing Dashboard
          </p>
        </header>
        <PerformanceDashboard />
      </div>
    </div>
  );
}
