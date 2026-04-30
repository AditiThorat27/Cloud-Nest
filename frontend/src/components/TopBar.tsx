import React, { useState, useEffect } from 'react';

interface TopBarProps {
  token: string;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const TopBar: React.FC<TopBarProps> = ({ token }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Generate dummy notifications based on real data alerts
    const fetchAlerts = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [pRes, oRes] = await Promise.all([
          fetch('http://localhost:8080/api/v1/products', { headers }),
          fetch('http://localhost:8080/api/v1/orders', { headers })
        ]);
        
        const newNotifs: Notification[] = [];
        
        if (pRes.ok) {
          const products = await pRes.json();
          const lowStock = products.filter((p: any) => p.stockQuantity <= 5);
          if (lowStock.length > 0) {
            newNotifs.push({
              id: 'notif-1',
              type: 'warning',
              message: `${lowStock.length} products have low stock.`,
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        }
        
        if (oRes.ok) {
          const orders = await oRes.json();
          const pending = orders.filter((o: any) => o.status === 'PENDING');
          if (pending.length > 0) {
            newNotifs.push({
              id: 'notif-2',
              type: 'info',
              message: `You have ${pending.length} pending orders.`,
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        }

        setNotifications(newNotifs);
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="flex justify-end p-4 items-center">
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-950"></span>
          )}
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Mark all as read</button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No new notifications
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`p-4 hover:bg-slate-800/50 transition-colors ${!notif.isRead ? 'bg-slate-800/30' : ''}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                        <div>
                          <p className={`text-sm ${!notif.isRead ? 'text-white font-medium' : 'text-slate-300'}`}>{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1">Just now</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
