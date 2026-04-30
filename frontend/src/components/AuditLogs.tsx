import React, { useState, useEffect } from 'react';

interface AuditLogEntry {
  id: string;
  tenantId: string;
  tableName: string;
  operation: string;
  oldData: string | null;
  newData: string | null;
  performedAt: string;
  performedBy: string;
}

interface AuditLogsProps {
  token: string;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ token }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTable, setFilterTable] = useState('all');
  const [filterOp, setFilterOp] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/v1/audit-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 403) {
          setError('Access denied. Only Tenant Admins can view audit logs.');
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        const data = await response.json();
        setLogs(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  const getOpColor = (op: string) => {
    switch (op) {
      case 'INSERT': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'UPDATE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'DELETE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getOpIcon = (op: string) => {
    switch (op) {
      case 'INSERT': return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
      case 'UPDATE': return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      case 'DELETE': return 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16';
      default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  const uniqueTables = [...new Set(logs.map(l => l.tableName))];

  const filtered = logs.filter(l => {
    if (filterTable !== 'all' && l.tableName !== filterTable) return false;
    if (filterOp !== 'all' && l.operation !== filterOp) return false;
    return true;
  });

  const formatJson = (data: string | null) => {
    if (!data) return null;
    try { return JSON.stringify(JSON.parse(data), null, 2); }
    catch { return data; }
  };

  const insertCount = logs.filter(l => l.operation === 'INSERT').length;
  const updateCount = logs.filter(l => l.operation === 'UPDATE').length;
  const deleteCount = logs.filter(l => l.operation === 'DELETE').length;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Audit Logs</h2>
        <p className="text-slate-400 mt-1">Complete change history with before/after snapshots.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Total Events</p>
          <p className="text-2xl font-bold text-cyan-400">{logs.length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Inserts</p>
          <p className="text-2xl font-bold text-emerald-400">{insertCount}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Updates</p>
          <p className="text-2xl font-bold text-amber-400">{updateCount}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Deletes</p>
          <p className="text-2xl font-bold text-rose-400">{deleteCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={filterTable}
          onChange={e => setFilterTable(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Tables</option>
          {uniqueTables.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterOp}
          onChange={e => setFilterOp(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Operations</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <span className="text-sm text-slate-500">{filtered.length} events</span>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center">
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-12 rounded-2xl text-center shadow-xl">
          <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-white">No audit events recorded</h3>
          <p className="text-slate-400 mt-2">Changes to your Products, Orders, Customers, and Invoices will appear here instantly.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <div key={log.id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/50 transition-all">
              <div
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${getOpColor(log.operation)}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getOpIcon(log.operation)} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getOpColor(log.operation)}`}>
                      {log.operation}
                    </span>
                    <span className="text-white font-medium">{log.tableName}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    by {log.performedBy || 'system'} • {new Date(log.performedAt).toLocaleString()}
                  </p>
                </div>
                <svg className={`w-5 h-5 text-slate-500 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {expandedId === log.id && (
                <div className="px-4 pb-4 border-t border-slate-700/50 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {log.oldData && (
                      <div>
                        <p className="text-xs text-rose-400 font-semibold mb-2">OLD DATA</p>
                        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 overflow-auto max-h-48 font-mono">
                          {formatJson(log.oldData)}
                        </pre>
                      </div>
                    )}
                    {log.newData && (
                      <div>
                        <p className="text-xs text-emerald-400 font-semibold mb-2">NEW DATA</p>
                        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 overflow-auto max-h-48 font-mono">
                          {formatJson(log.newData)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
