'use client';

import { useState, useEffect, useRef } from 'react';

interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  nodeVersion: string;
  cpu: {
    cpuCount: number;
    cpuModel: string;
    loadAverage: number[];
    cpuUtilization: string;
    loadAverage1min: number;
    loadAverage5min: number;
    loadAverage10min: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: string;
  };
  cpuUtilization?: string;
}

interface TestResult {
  executionTime: number;
  iterations: number;
  cpuUsage: {
    user: number;
    system: number;
  };
  timestamp: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface PerformanceDashboardProps {
  showPasswordModal?: boolean;
  setShowPasswordModal?: (show: boolean) => void;
}

export default function PerformanceDashboard({ 
  showPasswordModal: externalShowPasswordModal, 
  setShowPasswordModal: externalSetShowPasswordModal 
}: PerformanceDashboardProps = {}) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [concurrentRequests, setConcurrentRequests] = useState(10);
  const [iterations, setIterations] = useState(100);
  const [requestsPerSecond, setRequestsPerSecond] = useState(0);
  const [internalShowPasswordModal, setInternalShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // Use external modal state if provided, otherwise use internal state
  const showPasswordModal = externalShowPasswordModal !== undefined ? externalShowPasswordModal : internalShowPasswordModal;
  const setShowPasswordModal = externalSetShowPasswordModal || setInternalShowPasswordModal;
  const [maxRequestLimit, setMaxRequestLimit] = useState(1000);
  const [maxIterationLimit, setMaxIterationLimit] = useState(1000);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestCountRef = useRef(0);
  const rpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Password to unlock limits (you can change this)
  const UNLOCK_PASSWORD = 'unlock2024';

  useEffect(() => {
    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/system-info`);
      const data = await response.json();
      setSystemInfo(data);
    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  };

  const validateLimits = (reqCount: number, iterCount: number): boolean => {
    if (reqCount > maxRequestLimit && !isUnlocked) {
      setShowPasswordModal(true);
      return false;
    }
    if (iterCount > maxIterationLimit && !isUnlocked) {
      setShowPasswordModal(true);
      return false;
    }
    return true;
  };

  const handleUnlock = () => {
    if (passwordInput === UNLOCK_PASSWORD) {
      setIsUnlocked(true);
      setShowPasswordModal(false);
      setPasswordInput('');
    } else {
      alert('Incorrect password!');
      setPasswordInput('');
    }
  };

  const runSingleTest = async () => {
    if (!validateLimits(1, iterations)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iterations, complexity: 1 }),
      });
      const result = await response.json();
      setTestResults((prev) => [result, ...prev].slice(0, 50));
    } catch (error) {
      console.error('Error running test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runConcurrentTests = async () => {
    if (!validateLimits(concurrentRequests, iterations)) {
      return;
    }
    
    setIsRunning(true);
    setTestResults([]);
    
    const promises = Array.from({ length: concurrentRequests }, () =>
      fetch(`${API_URL}/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iterations, complexity: 1 }),
      }).then((res) => res.json())
    );

    try {
      const results = await Promise.all(promises);
      setTestResults(results);
    } catch (error) {
      console.error('Error running concurrent tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const startContinuousTesting = () => {
    if (intervalRef.current) return;
    
    // Use the iteration limit or unlocked iterations
    const testIterations = isUnlocked ? iterations : Math.min(iterations, maxIterationLimit);
    if (!validateLimits(1, testIterations)) {
      return;
    }
    
    setIsRunning(true);
    requestCountRef.current = 0;
    startTimeRef.current = Date.now();
    setRequestsPerSecond(0);
    
    // Client-side continuous testing - runs until stopped
    const runTest = async () => {
      try {
        const response = await fetch(`${API_URL}/compute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ iterations: testIterations, complexity: 1 }),
        });
        const result = await response.json();
        requestCountRef.current += 1;
        setTestResults((prev) => [result, ...prev].slice(0, 100));
      } catch (error) {
        console.error('Error in continuous test:', error);
      }
    };
    
    // Calculate requests per second every second
    rpsIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000; // seconds
        const rps = elapsed > 0 ? requestCountRef.current / elapsed : 0;
        setRequestsPerSecond(rps);
      }
    }, 1000);
    
    // Run immediately, then every second
    runTest();
    intervalRef.current = setInterval(runTest, 1000);
  };

  const stopContinuousTesting = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (rpsIntervalRef.current) {
      clearInterval(rpsIntervalRef.current);
      rpsIntervalRef.current = null;
    }
    setIsRunning(false);
    startTimeRef.current = null;
  };

  const avgExecutionTime = testResults.length > 0
    ? testResults.reduce((sum, r) => sum + r.executionTime, 0) / testResults.length
    : 0;

  const avgCpuUsage = testResults.length > 0
    ? testResults.reduce((sum, r) => sum + r.cpuUsage.user + r.cpuUsage.system, 0) / testResults.length
    : 0;

  return (
    <div className="space-y-6">
      {/* System Info Cards */}
      {systemInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">CPU Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Cores:</span>
                <span className="text-white">{systemInfo.cpu.cpuCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Model:</span>
                <span className="text-white text-xs truncate">{systemInfo.cpu.cpuModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Load Avg (1min):</span>
                <span className="text-white">{systemInfo.cpu.loadAverage1min?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Load Avg (5min):</span>
                <span className="text-white">{systemInfo.cpu.loadAverage5min?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Load Avg (10min):</span>
                <span className="text-white">{systemInfo.cpu.loadAverage10min?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">CPU Utilization:</span>
                <span className={`font-bold ${
                  parseFloat(systemInfo.cpu.cpuUtilization || '0') > 80 ? 'text-red-400' :
                  parseFloat(systemInfo.cpu.cpuUtilization || '0') > 50 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {systemInfo.cpu.cpuUtilization || '0'}%
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      parseFloat(systemInfo.cpu.cpuUtilization || '0') > 80 ? 'bg-red-500' :
                      parseFloat(systemInfo.cpu.cpuUtilization || '0') > 50 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(parseFloat(systemInfo.cpu.cpuUtilization || '0'), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Memory</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span className="text-white">{(systemInfo.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Used:</span>
                <span className="text-white">{(systemInfo.memory.used / 1024 / 1024 / 1024).toFixed(2)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Usage:</span>
                <span className="text-white">{systemInfo.memory.usagePercent}%</span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${systemInfo.memory.usagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">System</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Platform:</span>
                <span className="text-white">{systemInfo.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Arch:</span>
                <span className="text-white">{systemInfo.arch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Node:</span>
                <span className="text-white">{systemInfo.nodeVersion}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Performance Test Controls</h2>
          {isRunning && (
            <div className="bg-green-600 px-4 py-2 rounded-lg">
              <span className="text-white font-medium">
                Requests/sec: <span className="font-bold text-lg">{requestsPerSecond.toFixed(2)}</span>
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Concurrent Requests
              <span className="text-xs text-gray-500 ml-2">
                (Max: {isUnlocked ? 'Unlimited' : maxRequestLimit})
              </span>
            </label>
            <input
              type="number"
              value={concurrentRequests}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 10;
                if (isUnlocked || val <= maxRequestLimit) {
                  setConcurrentRequests(val);
                } else {
                  setShowPasswordModal(true);
                }
              }}
              className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${
                concurrentRequests > maxRequestLimit && !isUnlocked
                  ? 'border-red-500'
                  : 'border-gray-600'
              }`}
              min="1"
              max={isUnlocked ? undefined : maxRequestLimit}
            />
            {concurrentRequests > maxRequestLimit && !isUnlocked && (
              <p className="text-xs text-red-400 mt-1">
                ⚠ Limit exceeded. Enter password to unlock.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Iterations per Request
              <span className="text-xs text-gray-500 ml-2">
                (Max: {isUnlocked ? 'Unlimited' : maxIterationLimit.toLocaleString()})
              </span>
            </label>
            <input
              type="number"
              value={iterations}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1000000;
                if (isUnlocked || val <= maxIterationLimit) {
                  setIterations(val);
                } else {
                  setShowPasswordModal(true);
                }
              }}
              className={`w-full px-3 py-2 bg-gray-700 border rounded text-white ${
                iterations > maxIterationLimit && !isUnlocked
                  ? 'border-red-500'
                  : 'border-gray-600'
              }`}
              min="1000"
              step="100000"
              max={isUnlocked ? undefined : maxIterationLimit}
            />
            {iterations > maxIterationLimit && !isUnlocked && (
              <p className="text-xs text-red-400 mt-1">
                ⚠ Limit exceeded. Enter password to unlock.
              </p>
            )}
          </div>
        </div>
        {isUnlocked && (
          <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-600 rounded">
            <p className="text-sm text-yellow-400">
              🔓 Limits unlocked - High request mode enabled
            </p>
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={runSingleTest}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium"
          >
            {isLoading ? 'Running...' : 'Single Test'}
          </button>
          <button
            onClick={runConcurrentTests}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded font-medium"
          >
            {isRunning ? 'Running...' : `Run ${concurrentRequests} Concurrent`}
          </button>
          {!isRunning ? (
            <button
              onClick={startContinuousTesting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium"
            >
              Start Continuous
            </button>
          ) : (
            <button
              onClick={stopContinuousTesting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              Stop Continuous
            </button>
          )}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-700 rounded p-4">
              <div className="text-sm text-gray-400">Total Tests</div>
              <div className="text-2xl font-bold text-white">{testResults.length}</div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-sm text-gray-400">Avg Execution Time</div>
              <div className="text-2xl font-bold text-white">{avgExecutionTime.toFixed(2)} ms</div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-sm text-gray-400">Avg CPU Usage</div>
              <div className="text-2xl font-bold text-white">{avgCpuUsage.toFixed(2)} ms</div>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-300">Time (ms)</th>
                  <th className="text-left p-2 text-gray-300">Iterations</th>
                  <th className="text-left p-2 text-gray-300">CPU User (ms)</th>
                  <th className="text-left p-2 text-gray-300">CPU System (ms)</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, idx) => (
                  <tr key={idx} className="border-b border-gray-700">
                    <td className="p-2 text-white">{result.executionTime}</td>
                    <td className="p-2 text-white">{result.iterations.toLocaleString()}</td>
                    <td className="p-2 text-white">{result.cpuUsage.user.toFixed(2)}</td>
                    <td className="p-2 text-white">{result.cpuUsage.system.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Limit Exceeded - Password Required
            </h3>
            <p className="text-gray-300 mb-4">
              Due to high request limits, please enter the password to increase limits:
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUnlock();
                  }
                }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Enter password"
                autoFocus
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleUnlock}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                Unlock Limits
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Current limits: {maxRequestLimit} requests, {maxIterationLimit.toLocaleString()} iterations
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


