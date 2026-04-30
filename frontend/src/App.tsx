import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Products from './components/Products';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Database from './components/Database';
import Billing from './components/Billing';
import Intelligence from './components/Intelligence';
import AuditLogs from './components/AuditLogs';
import Settings from './components/Settings';
import TopBar from './components/TopBar';
import OwnerDashboard from './components/OwnerDashboard';

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cloudnest_token'));

  const isOwner = token ? (() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === 'owner';
    } catch { return false; }
  })() : false;

  const [currentPage, setCurrentPage] = useState(isOwner ? 'ownerDashboard' : 'dashboard');

  const handleLogin = (newToken: string) => {
    localStorage.setItem('cloudnest_token', newToken);
    setToken(newToken);
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setCurrentPage(payload.role === 'owner' ? 'ownerDashboard' : 'dashboard');
    } catch {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cloudnest_token');
    setToken(null);
    setCurrentPage('dashboard');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard token={token} />;
      case 'products':
        return <Products token={token} />;
      case 'customers':
        return <Customers token={token} />;
      case 'orders':
        return <Orders token={token} />;
      case 'database':
        return <Database token={token} />;
      case 'billing':
        return <Billing token={token} />;
      case 'intelligence':
        return <Intelligence token={token} />;
      case 'audit':
        return <AuditLogs token={token} />;
      case 'settings':
        return <Settings token={token} onLogout={handleLogout} />;
      case 'ownerDashboard':
        return <OwnerDashboard token={token} />;
      default:
        return <Dashboard token={token} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans selection:bg-indigo-500/30">
      <Sidebar activePage={currentPage} onNavigate={setCurrentPage} token={token} />
      <div className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex flex-col">
        <TopBar token={token} />
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
