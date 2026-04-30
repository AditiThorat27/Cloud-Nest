import React, { useState, useEffect, useMemo } from 'react';

interface DashboardProps {
  token: string;
}

interface Order {
  id: string;
  customer: { firstName: string; lastName: string } | null;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userInfo = useMemo(() => {
    try {
      const p = JSON.parse(atob(token.split('.')[1]));
      return { firstName: p.firstName || 'User', subdomain: p.subdomain || '' };
    } catch { return { firstName: 'User', subdomain: '' }; }
  }, [token]);

  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, oRes, cRes, aRes] = await Promise.all([
          fetch('http://localhost:8080/api/v1/products', { headers }),
          fetch('http://localhost:8080/api/v1/orders', { headers }),
          fetch('http://localhost:8080/api/v1/customers', { headers }),
          fetch('http://localhost:8080/api/v1/audit-logs', { headers }),
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (oRes.ok) setOrders(await oRes.json());
        if (cRes.ok) setCustomers(await cRes.json());
        if (aRes.ok) setAuditLogs(await aRes.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [token]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const totalStock = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
  const lowStockProducts = products.filter(p => (p.stockQuantity || 0) <= 5);

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  const statusCounts = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, CANCELLED: 0 };
  orders.forEach(o => { if (o.status in statusCounts) statusCounts[o.status as keyof typeof statusCounts]++; });
  const maxStatus = Math.max(...Object.values(statusCounts), 1);

  const topProducts = [...products].sort((a, b) => (b.price * b.stockQuantity) - (a.price * a.stockQuantity)).slice(0, 5);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const statusColor: Record<string, string> = {
    COMPLETED: 'bg-emerald-500',
    PENDING: 'bg-amber-500',
    PROCESSING: 'bg-blue-500',
    CANCELLED: 'bg-rose-500',
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isEmpty = products.length === 0 && orders.length === 0 && customers.length === 0;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          {getGreeting()}, {userInfo.firstName} 👋
        </h2>
        <p className="text-slate-400 mt-1">
          {isEmpty
            ? 'Welcome to CloudNest! Start by adding products, customers, and orders.'
            : `Here's your ${userInfo.subdomain ? userInfo.subdomain + ' ' : ''}store overview.`
          }
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
          { label: 'Products', value: products.length.toString(), icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/20' },
          { label: 'Customers', value: customers.length.toString(), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/20' },
          { label: 'Total Orders', value: orders.length.toString(), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/20' },
        ].map((stat, idx) => (
          <div key={idx} className={`relative overflow-hidden bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group`}>
            <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${stat.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
                <span className="text-3xl font-bold text-white mt-2 block">{stat.value}</span>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.glow}`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Order Status Breakdown */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Order Status Breakdown</h3>
          {orders.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500">
              <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p className="text-sm">No orders yet. Create one from the Orders page.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${statusColor[status]}`}></div>
                      <span className="text-sm text-slate-300 font-medium">{status}</span>
                    </div>
                    <span className="text-sm text-white font-semibold">{count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${statusColor[status]} transition-all duration-700 ease-out`}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-700/40 flex justify-between text-sm">
                <span className="text-slate-400">Total orders</span>
                <span className="text-white font-semibold">{orders.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <p className="text-sm">No orders to show.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-700/30 transition-colors group border border-transparent hover:border-slate-700/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor[order.status] || 'bg-slate-500'}`}></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : `#${order.id.slice(0, 6)}`}
                      </p>
                      <p className="text-xs text-slate-500">{timeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-white flex-shrink-0 ml-2">${order.totalAmount?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Products */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">Top Products</h3>
          {topProducts.length === 0 ? (
            <div className="h-36 flex flex-col items-center justify-center text-slate-500">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <p className="text-sm">Add products to see them here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/30 transition-colors border border-transparent hover:border-slate-700/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-slate-500 w-5">{i + 1}.</span>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center text-slate-500 text-xs font-bold">
                        {p.name?.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">Stock: {p.stockQuantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">${p.price?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Insights */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">Quick Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/20 border border-slate-700/30">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm text-white font-medium">Completed Orders</p>
                <p className="text-xs text-slate-400">{completedOrders} of {orders.length} orders completed ({orders.length ? Math.round((completedOrders / orders.length) * 100) : 0}%)</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/20 border border-slate-700/30">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm text-white font-medium">Pending Orders</p>
                <p className="text-xs text-slate-400">{pendingOrders} order{pendingOrders !== 1 ? 's' : ''} awaiting processing</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/20 border border-slate-700/30">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div>
                <p className="text-sm text-white font-medium">Inventory</p>
                <p className="text-xs text-slate-400">{totalStock} total units across {products.length} product{products.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {lowStockProducts.length > 0 && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Low Stock Alert</p>
                  <p className="text-xs text-slate-400">{lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} with ≤5 units: {lowStockProducts.map(p => p.name).join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed from Audit Logs */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">Activity Feed</h3>
          {auditLogs.length === 0 ? (
            <div className="h-36 flex flex-col items-center justify-center text-slate-500">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm">No activity yet. Changes will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {auditLogs.slice(0, 10).map((log: any, i: number) => {
                const opColor: Record<string, string> = { INSERT: 'text-emerald-400 bg-emerald-500/15', UPDATE: 'text-blue-400 bg-blue-500/15', DELETE: 'text-rose-400 bg-rose-500/15' };
                const opIcon: Record<string, string> = { INSERT: '+', UPDATE: '~', DELETE: '−' };
                return (
                  <div key={log.id || i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-700/20 transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${opColor[log.operation] || 'text-slate-400 bg-slate-700/50'}`}>
                      {opIcon[log.operation] || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white"><span className="font-medium capitalize">{log.tableName?.replace('_', ' ')}</span> <span className="text-slate-400">{log.operation?.toLowerCase()}d</span></p>
                      <p className="text-xs text-slate-500">{timeAgo(log.performedAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
