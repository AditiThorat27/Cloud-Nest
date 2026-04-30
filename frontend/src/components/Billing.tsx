import React, { useState, useEffect } from 'react';

interface Invoice {
  id: string;
  tenantId: string;
  planId: string | null;
  amount: number;
  status: string;
  issuedAt: string;
  paidAt: string | null;
  dueDate: string;
}

interface BillingProps {
  token: string;
}

const Billing: React.FC<BillingProps> = ({ token }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState('free');
  const [currentUsage, setCurrentUsage] = useState(0);

  const plans = [
    { id: 'free', name: 'Free Tier', price: '$0', requests: '1,000 requests/mo', limit: 1000 },
    { id: 'pro', name: 'Professional', price: '$49', requests: '10,000 requests/mo', limit: 10000 },
    { id: 'enterprise', name: 'Enterprise', price: '$199', requests: 'Unlimited', limit: Infinity }
  ];


  const fetchInvoices = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/billing/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlan = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/billing/plan`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivePlan(data.plan || 'free');
        setCurrentUsage(data.usage || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlanChange = async (planId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/billing/plan`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: planId })
      });
      if (response.ok) {
        setActivePlan(planId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchPlan();
  }, [token]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/billing/invoices/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to generate invoice');
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/billing/invoices/${invoiceId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update status');
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'overdue': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingCount = invoices.filter(i => i.status === 'pending').length;
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Billing & Invoices</h2>
          <p className="text-slate-400 mt-1">Manage invoices and track payment status.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
        >
          {generating ? 'Generating...' : '+ Generate Invoice'}
        </button>
      </div>

      {/* Subscription Plans */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Current Subscription</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              onClick={() => handlePlanChange(plan.id)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 ${
                activePlan === plan.id 
                  ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className={`font-bold ${activePlan === plan.id ? 'text-indigo-400' : 'text-white'}`}>{plan.name}</h4>
                  <p className="text-2xl font-bold text-white mt-1">{plan.price}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                </div>
                {activePlan === plan.id && (
                  <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-500/30">
                    Active Plan
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {plan.requests}
                </p>
                <p className="text-sm text-slate-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Standard Support
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Progress */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="text-lg font-semibold text-white">API Usage This Month</h3>
            <p className="text-sm text-slate-400">Total requests processed across all your headless endpoints.</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-indigo-400">{currentUsage.toLocaleString()}</span>
            <span className="text-slate-500"> / {plans.find(p => p.id === activePlan)?.limit === Infinity ? '∞' : plans.find(p => p.id === activePlan)?.limit.toLocaleString()}</span>
          </div>
        </div>
        <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${currentUsage / (plans.find(p => p.id === activePlan)?.limit || 1000) > 0.9 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
            style={{ width: `${Math.min((currentUsage / (plans.find(p => p.id === activePlan)?.limit || 1000)) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Pending Invoices</p>
          <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <p className="text-sm text-slate-400 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-rose-400">{overdueCount}</p>
        </div>
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center">
          <p>{error}</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-12 rounded-2xl text-center shadow-xl">
          <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-white">No invoices yet</h3>
          <p className="text-slate-400 mt-2">Generate your first invoice to get started.</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium text-sm">Invoice ID</th>
                <th className="px-6 py-4 font-medium text-sm">Issued</th>
                <th className="px-6 py-4 font-medium text-sm">Due Date</th>
                <th className="px-6 py-4 font-medium text-sm">Status</th>
                <th className="px-6 py-4 font-medium text-sm text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-slate-300 font-mono text-sm">{inv.id.split('-')[0].toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{inv.dueDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(inv.status)}`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-white font-medium">${inv.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    {inv.status === 'pending' && (
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleStatusChange(inv.id, 'paid')} className="px-3 py-1 text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded-lg transition-colors border border-emerald-500/30">
                          Mark Paid
                        </button>
                        <button onClick={() => handleStatusChange(inv.id, 'overdue')} className="px-3 py-1 text-xs bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 rounded-lg transition-colors border border-rose-500/30">
                          Overdue
                        </button>
                      </div>
                    )}
                    {inv.status === 'paid' && (
                      <span className="text-xs text-slate-500">Paid {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : ''}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Billing;
