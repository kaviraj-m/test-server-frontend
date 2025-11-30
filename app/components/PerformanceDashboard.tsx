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

const API_URL = 'http://localhost:3000/api';

export default function PerformanceDashboard() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [concurrentRequests, setConcurrentRequests] = useState(10);
  const [iterations, setIterations] = useState(1000000);
  const [requestsPerSecond, setRequestsPerSecond] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestCountRef = useRef(0);
  const rpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

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

  const runSingleTest = async () => {
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
          body: JSON.stringify({ iterations: 500000, complexity: 1 }),
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
            </label>
            <input
              type="number"
              value={concurrentRequests}
              onChange={(e) => setConcurrentRequests(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Iterations per Request
            </label>
            <input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value) || 1000000)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              min="1000"
              step="100000"
            />
          </div>
        </div>
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
    </div>
  );
}

