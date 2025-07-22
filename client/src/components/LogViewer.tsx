import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  url?: string;
  userId?: string;
  sessionId?: string;
  stack?: string;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load logs from localStorage
    const storedLogs = localStorage.getItem('client_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (error) {
        console.error('Failed to parse stored logs:', error);
      }
    }

    // Update logs every 5 seconds
    const interval = setInterval(() => {
      const currentLogs = localStorage.getItem('client_logs');
      if (currentLogs) {
        try {
          setLogs(JSON.parse(currentLogs));
        } catch (error) {
          console.error('Failed to parse stored logs:', error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const filteredLogs = logs.filter(log => {
    const matchesText = !filter || 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      JSON.stringify(log.data || {}).toLowerCase().includes(filter.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    
    return matchesText && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      case 'debug': return 'text-gray-500';
      default: return 'text-gray-700';
    }
  };

  const clearLogs = () => {
    localStorage.removeItem('client_logs');
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `client-logs-${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 text-sm"
          title="Open Log Viewer (Ctrl+Shift+L)"
        >
          📝
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Client Logs</h2>
            <div className="text-sm text-gray-500">
              {filteredLogs.length} of {logs.length} logs
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Clear
            </button>
            <button
              onClick={exportLogs}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Export
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b flex gap-4">
          <input
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className="mb-2 p-2 border-l-4 border-gray-200 hover:bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-500 text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className={`font-bold text-xs uppercase ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  {log.url && (
                    <span className="text-gray-400 text-xs truncate max-w-xs">
                      {log.url}
                    </span>
                  )}
                </div>
                <div className="mb-1">{log.message}</div>
                {log.data && (
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer hover:text-gray-800">Data</summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
                {log.stack && (
                  <details className="text-xs text-red-600">
                    <summary className="cursor-pointer hover:text-red-800">Stack Trace</summary>
                    <pre className="mt-1 p-2 bg-red-50 rounded overflow-auto">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;