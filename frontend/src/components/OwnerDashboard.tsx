import React, { useState, useEffect } from 'react';

interface TenantSummary {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  mrr: number;
  status: string;
  traffic: number;
}

interface DashboardData {
  totalActiveTenants: number;
  mrr: number;
  globalTraffic: number;
  directory: TenantSummary[];
}

const OwnerDashboard: React.FC<{ token?: string }> = ({ token }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/super-admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token]);

  const handleAction = async (tenantId: string, action: 'suspend' | 'activate' | 'delete') => {
    if (action === 'delete' && !window.confirm('Are you sure you want to permanently delete this tenant? All their data will be lost.')) {
      return;
    }
    
    try {
      const method = action === 'delete' ? 'DELETE' : 'PUT';
      const endpoint = action === 'delete' 
        ? `http://localhost:8080/api/v1/super-admin/tenants/${tenantId}`
        : `http://localhost:8080/api/v1/super-admin/tenants/${tenantId}/${action}`;
        
      const res = await fetch(endpoint, { method });
      if (res.ok) {
        fetchDashboard();
      } else {
        alert('Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Action failed');
    }
  };

  if (loading) return <div className="p-8 text-white">Loading insights...</div>;
  if (error) return <div className="p-8 text-rose-400">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Super Admin Overview</h2>
        <p className="text-slate-400 mt-1">Platform-wide insights, tenant management, and infrastructure health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-slate-400 mb-1">Total Active Tenants</p>
          <p className="text-2xl font-bold text-white">{data.totalActiveTenants}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-slate-400 mb-1">Monthly Recurring Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">${data.mrr}/mo</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-slate-400 mb-1">Global Platform Traffic</p>
          <p className="text-2xl font-bold text-indigo-400">{data.globalTraffic} reqs</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-slate-400 mb-1">System Health</p>
          <p className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            All Systems Operational
          </p>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">Active Tenants Directory</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-800/80 text-slate-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Tenant</th>
              <th className="px-6 py-4 font-medium">Subdomain</th>
              <th className="px-6 py-4 font-medium">Active Plan</th>
              <th className="px-6 py-4 font-medium">API Traffic</th>
              <th className="px-6 py-4 font-medium">MRR</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {data.directory.map(t => (
              <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{t.name}</td>
                <td className="px-6 py-4 text-slate-400">{t.subdomain}.cloudnest.com</td>
                <td className="px-6 py-4 text-indigo-400 font-medium">{t.plan}</td>
                <td className="px-6 py-4 text-slate-300">{t.traffic} reqs</td>
                <td className="px-6 py-4 text-emerald-400">${t.mrr}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    t.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {t.status === 'ACTIVE' ? (
                    <button 
                      onClick={() => handleAction(t.id, 'suspend')}
                      className="px-3 py-1 text-xs font-medium rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleAction(t.id, 'activate')}
                      className="px-3 py-1 text-xs font-medium rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  <button 
                    onClick={() => handleAction(t.id, 'delete')}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OwnerDashboard;
