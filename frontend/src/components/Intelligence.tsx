import React, { useState, useEffect } from 'react';

interface TenantForecast {
  id: string;
  tenantId: string;
  riskLevel: string;
  healthScore: number;
  forecastDate: string;
  notes: string;
}

interface Anomaly {
  id: string;
  tenantId: string;
  signalType: string;
  detectedAt: string;
  severity: string;
  description: string;
  resolved: boolean;
}

interface Intervention {
  id: string;
  tenantId: string;
  anomalyId: string;
  actionTaken: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

interface IntelligenceProps {
  token: string;
}

const Intelligence: React.FC<IntelligenceProps> = ({ token }) => {
  const [forecasts, setForecasts] = useState<TenantForecast[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'forecasts' | 'anomalies' | 'interventions'>('forecasts');

  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [fRes, aRes, iRes] = await Promise.all([
          fetch('http://localhost:8080/api/v1/intelligence/forecasts', { headers }),
          fetch('http://localhost:8080/api/v1/intelligence/anomalies', { headers }),
          fetch('http://localhost:8080/api/v1/intelligence/interventions/pending', { headers }),
        ]);
        if (fRes.ok) setForecasts(await fRes.json());
        if (aRes.ok) setAnomalies(await aRes.json());
        if (iRes.ok) setInterventions(await iRes.json());
      } catch (err) {
        console.error('Intelligence fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-emerald-400';
      case 'medium': return 'text-amber-400';
      case 'high': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const getHealthGradient = (score: number) => {
    if (score >= 75) return 'from-emerald-500 to-emerald-400';
    if (score >= 50) return 'from-amber-500 to-amber-400';
    if (score >= 25) return 'from-orange-500 to-orange-400';
    return 'from-rose-500 to-rose-400';
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/intelligence/interventions/${id}/resolve`, {
        method: 'PUT',
        headers
      });
      if (res.ok) {
        setInterventions(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [runningDiag, setRunningDiag] = useState(false);
  const handleRunDiagnostics = async () => {
    setRunningDiag(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/intelligence/run-diagnostics`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        // Refresh data
        const [fRes, aRes, iRes] = await Promise.all([
          fetch('http://localhost:8080/api/v1/intelligence/forecasts', { headers }),
          fetch('http://localhost:8080/api/v1/intelligence/anomalies', { headers }),
          fetch('http://localhost:8080/api/v1/intelligence/interventions/pending', { headers }),
        ]);
        if (fRes.ok) setForecasts(await fRes.json());
        if (aRes.ok) setAnomalies(await aRes.json());
        if (iRes.ok) setInterventions(await iRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningDiag(false);
    }
  };

  const tabs = [
    { id: 'forecasts' as const, label: 'Health Forecasts', count: forecasts.length },
    { id: 'anomalies' as const, label: 'Anomalies', count: anomalies.length },
    { id: 'interventions' as const, label: 'Pending Actions', count: interventions.length },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Intelligence Center</h2>
          <p className="text-slate-400 mt-1">AI-powered insights, anomaly detection, and health forecasting.</p>
        </div>
        <button
          onClick={handleRunDiagnostics}
          disabled={runningDiag}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
        >
          {runningDiag ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Monitored Tenants</p>
          <p className="text-2xl font-bold text-cyan-400">{forecasts.length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Active Anomalies</p>
          <p className="text-2xl font-bold text-amber-400">{anomalies.filter(a => !a.resolved).length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Pending Interventions</p>
          <p className="text-2xl font-bold text-rose-400">{interventions.length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Avg Health Score</p>
          <p className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${getHealthGradient(forecasts.length ? forecasts.reduce((s, f) => s + f.healthScore, 0) / forecasts.length : 0)}`}>
            {forecasts.length ? (forecasts.reduce((s, f) => s + f.healthScore, 0) / forecasts.length).toFixed(1) : '—'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700/50 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium rounded-t-xl transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-slate-800/80 text-white border border-slate-700/50 border-b-transparent -mb-px'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Forecasts Tab */}
          {activeTab === 'forecasts' && (
            forecasts.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-12 rounded-2xl text-center shadow-xl">
                <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white">No forecasts available</h3>
                <p className="text-slate-400 mt-2">Forecasts are generated daily at 2:00 AM by the scheduler.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forecasts.map(f => (
                  <div key={f.id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs text-slate-500 font-mono">{f.tenantId.split('-')[0]}</span>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRiskColor(f.riskLevel)}`}>
                        {f.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-slate-400 mb-1">Health Score</p>
                      <div className="flex items-end gap-2">
                        <span className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${getHealthGradient(f.healthScore)}`}>
                          {f.healthScore}
                        </span>
                        <span className="text-slate-500 text-sm mb-1">/ 100</span>
                      </div>
                      <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${getHealthGradient(f.healthScore)} transition-all duration-500`} style={{ width: `${f.healthScore}%` }}></div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Forecast: {f.forecastDate}</p>
                    {f.notes && <p className="text-xs text-slate-500 mt-1 truncate" title={f.notes}>{f.notes}</p>}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Anomalies Tab */}
          {activeTab === 'anomalies' && (
            anomalies.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-12 rounded-2xl text-center shadow-xl">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white">All Clear</h3>
                <p className="text-slate-400 mt-2">No anomalies detected. The system is running smoothly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {anomalies.map(a => (
                  <div key={a.id} className={`bg-slate-800/50 backdrop-blur-xl border rounded-2xl p-5 flex items-center gap-4 ${a.resolved ? 'border-slate-700/30 opacity-60' : 'border-slate-700/50'}`}>
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${a.severity === 'high' ? 'bg-rose-500 animate-pulse' : a.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{a.signalType}</span>
                        <span className={`text-xs font-semibold ${getSeverityColor(a.severity)}`}>({a.severity})</span>
                        {a.resolved && <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">Resolved</span>}
                      </div>
                      <p className="text-sm text-slate-400 mt-1 truncate">{a.description}</p>
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {a.detectedAt ? new Date(a.detectedAt).toLocaleString() : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Interventions Tab */}
          {activeTab === 'interventions' && (
            interventions.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-12 rounded-2xl text-center shadow-xl">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white">No pending actions</h3>
                <p className="text-slate-400 mt-2">All interventions have been resolved.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interventions.map(i => (
                  <div key={i.id} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{i.actionTaken || 'Pending review'}</p>
                      <p className="text-xs text-slate-500 mt-1">Created: {new Date(i.createdAt).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => handleResolve(i.id)}
                      className="px-4 py-2 text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded-lg transition-colors border border-emerald-500/30 flex-shrink-0"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default Intelligence;
