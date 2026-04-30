import React, { useEffect, useState } from 'react';

interface OrdersProps {
  token: string;
}

interface Product { id: string; name: string; price: number; stockQuantity: number; }
interface Customer { id: string; firstName: string; lastName: string; email: string; }
interface OrderItem { productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number; }
interface Order {
  id: string; status: string; totalAmount: number; createdAt: string;
  customer: Customer | null;
  items: OrderItem[];
}

const Orders: React.FC<OrdersProps> = ({ token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // New order form
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number }[]>([]);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAll = async () => {
    try {
      const [oRes, pRes, cRes] = await Promise.all([
        fetch('http://localhost:8080/api/v1/orders', { headers }),
        fetch('http://localhost:8080/api/v1/products', { headers }),
        fetch('http://localhost:8080/api/v1/customers', { headers }),
      ]);
      if (oRes.ok) setOrders(await oRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (cRes.ok) setCustomers(await cRes.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const addToCart = (productId: string) => {
    if (cartItems.find(i => i.productId === productId)) return;
    setCartItems([...cartItems, { productId, quantity: 1 }]);
  };

  const updateCartQty = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const clamped = Math.max(1, Math.min(qty, product.stockQuantity));
    setCartItems(cartItems.map(i => i.productId === productId ? { ...i, quantity: clamped } : i));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(cartItems.filter(i => i.productId !== productId));
  };

  const cartTotal = cartItems.reduce((sum, item) => {
    const p = products.find(pr => pr.id === item.productId);
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || cartItems.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/orders', {
        method: 'POST', headers,
        body: JSON.stringify({
          customer: { id: selectedCustomer },
          items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create order');
      }
      setShowModal(false);
      setSelectedCustomer('');
      setCartItems([]);
      fetchAll();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/orders/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to delete');
      fetchAll();
    } catch (err: any) { setError(err.message); }
  };

  const statusBadge: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    PROCESSING: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    CANCELLED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };

  const timeAgo = (d: string) => {
    if (!d) return '';
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Orders</h2>
          <p className="text-slate-400 mt-1">Manage orders linked to your products and customers.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const csvContent = [
                ['ID', 'Customer', 'Items Count', 'Status', 'Total Amount', 'Created At'],
                ...orders.map(o => [
                  o.id, 
                  o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'N/A', 
                  o.items?.length || 0, 
                  o.status, 
                  o.totalAmount, 
                  new Date(o.createdAt).toLocaleString()
                ])
              ].map(e => e.join(",")).join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'orders.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700 shadow-lg shadow-slate-900/20 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </button>
          <button onClick={() => setShowModal(true)} disabled={products.length === 0 || customers.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            Create Order
          </button>
        </div>
      </div>

      {(products.length === 0 || customers.length === 0) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-300 text-sm">
          ⚠️ You need at least 1 product and 1 customer before creating orders.
          {products.length === 0 && <span className="font-medium"> Add products first.</span>}
          {customers.length === 0 && <span className="font-medium"> Add customers first.</span>}
        </div>
      )}

      {error && <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-300 text-sm">{error}</div>}

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-xl font-bold text-white">Create Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Customer</label>
                <select required value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Add Products</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {products.filter(p => !cartItems.find(c => c.productId === p.id) && p.stockQuantity > 0).map(p => (
                    <button type="button" key={p.id} onClick={() => addToCart(p.id)}
                      className="w-full flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all text-left">
                      <div>
                        <span className="text-white text-sm font-medium">{p.name}</span>
                        <span className="text-slate-500 text-xs ml-2">({p.stockQuantity} in stock)</span>
                      </div>
                      <span className="text-emerald-400 text-sm font-semibold">${p.price.toFixed(2)}</span>
                    </button>
                  ))}
                  {products.filter(p => !cartItems.find(c => c.productId === p.id) && p.stockQuantity > 0).length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-2">
                      {cartItems.length > 0 ? 'All available products added' : 'No products with stock available'}
                    </p>
                  )}
                </div>
              </div>

              {/* Cart */}
              {cartItems.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Order Items</label>
                  <div className="space-y-2">
                    {cartItems.map(item => {
                      const p = products.find(pr => pr.id === item.productId);
                      if (!p) return null;
                      return (
                        <div key={item.productId} className="flex items-center gap-3 p-3 bg-slate-800/70 border border-slate-700/50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{p.name}</p>
                            <p className="text-slate-500 text-xs">${p.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-sm">−</button>
                            <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-sm">+</button>
                          </div>
                          <span className="text-emerald-400 font-semibold text-sm w-20 text-right">${(p.price * item.quantity).toFixed(2)}</span>
                          <button type="button" onClick={() => removeFromCart(item.productId)} className="text-slate-500 hover:text-rose-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700/50">
                    <span className="text-slate-300 font-medium">Order Total</span>
                    <span className="text-2xl font-bold text-white">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={saving || cartItems.length === 0 || !selectedCustomer}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-30">
                  {saving ? 'Creating...' : `Place Order — $${cartTotal.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 border border-slate-700/30 rounded-2xl">
          <svg className="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-xl font-bold text-white">No orders yet</h3>
          <p className="text-slate-400 mt-2">Create your first order to link products and customers.</p>
        </div>
      ) : (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium text-sm w-8"></th>
                <th className="px-6 py-4 font-medium text-sm">Customer</th>
                <th className="px-6 py-4 font-medium text-sm">Items</th>
                <th className="px-6 py-4 font-medium text-sm">Date</th>
                <th className="px-6 py-4 font-medium text-sm">Status</th>
                <th className="px-6 py-4 font-medium text-sm text-right">Total</th>
                <th className="px-6 py-4 font-medium text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {orders.map(order => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <td className="px-6 py-4">
                      <svg className={`w-4 h-4 text-slate-500 transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{timeAgo(order.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${statusBadge[order.status] || 'bg-slate-500/15 text-slate-400'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-semibold">${order.totalAmount?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleDelete(order.id)} className="p-2 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                  {/* Expanded row showing order items */}
                  {expandedOrder === order.id && order.items && order.items.length > 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-3 bg-slate-800/40">
                        <div className="ml-10 space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 px-4 rounded-lg bg-slate-800/50 text-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">{item.quantity}x</div>
                                <span className="text-white">{item.productName}</span>
                              </div>
                              <div className="text-slate-400">
                                <span className="text-slate-500">@ ${item.unitPrice?.toFixed(2)}</span>
                                <span className="text-white font-medium ml-4">${item.lineTotal?.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
