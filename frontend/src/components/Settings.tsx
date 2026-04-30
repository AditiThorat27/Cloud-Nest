import React, { useState, useEffect, useMemo } from 'react';

interface SettingsProps {
  token: string;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ token, onLogout }) => {
  const userInfo = useMemo(() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        email: payload.sub || '',
        subdomain: payload.subdomain || '',
        tenantId: payload.tenantId || '',
      };
    } catch {
      return { firstName: '', lastName: '', email: '', subdomain: '', tenantId: '' };
    }
  }, [token]);

  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  useEffect(() => {
    setProfile({ firstName: userInfo.firstName, lastName: userInfo.lastName, email: userInfo.email });
  }, [userInfo]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleChangePassword = async () => {
    if (!passwordData.current) {
      setPasswordMsg({ text: 'Please enter your current password', isError: true });
      return;
    }
    if (passwordData.newPass.length < 4) {
      setPasswordMsg({ text: 'New password must be at least 4 characters', isError: true });
      return;
    }
    if (passwordData.newPass !== passwordData.confirm) {
      setPasswordMsg({ text: 'Passwords do not match', isError: true });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg({ text: '', isError: false });
    try {
      const res = await fetch('http://localhost:8080/api/v1/account/change-password', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordData.current, newPassword: passwordData.newPass })
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg({ text: data.message || 'Failed to update password', isError: true });
      } else {
        setPasswordMsg({ text: 'Password updated successfully!', isError: false });
        setPasswordData({ current: '', newPass: '', confirm: '' });
      }
    } catch {
      setPasswordMsg({ text: 'Network error. Please try again.', isError: true });
    } finally {
      setPasswordSaving(false);
      setTimeout(() => setPasswordMsg({ text: '', isError: false }), 4000);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteText === 'DELETE') onLogout();
  };

  const initials = `${userInfo.firstName.charAt(0)}${userInfo.lastName.charAt(0)}`.toUpperCase();
  const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();



  const sections = [
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'workspace', label: 'Workspace', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'developer', label: 'Developer', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { id: 'danger', label: 'Danger Zone', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ];

  const inputClass = "w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-slate-400 mt-1">Manage your account, workspace, and security.</p>
      </div>

      <div className="flex gap-8">
        {/* Left Nav */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === s.id ? 'bg-slate-800 text-white shadow-lg'
                  : s.id === 'danger' ? 'text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl">
              <div className="px-8 py-5 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                <p className="text-sm text-slate-400 mt-0.5">Update your personal details.</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/20">
                    {initials || '?'}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-xl">{fullName || 'User'}</p>
                    <p className="text-slate-400">{userInfo.email}</p>
                    {userInfo.subdomain && (
                      <span className="text-xs text-slate-500 mt-1 font-mono bg-slate-800 inline-block px-2 py-0.5 rounded">{userInfo.subdomain}.cloudnest.com</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                    <input type="text" className={inputClass} value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                    <input type="text" className={inputClass} value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input type="email" className={inputClass} value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95">
                    {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                  </button>
                  {saved && <span className="text-emerald-400 text-sm">Profile updated</span>}
                </div>
              </div>
            </div>
          )}

          {/* WORKSPACE */}
          {activeSection === 'workspace' && (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl">
              <div className="px-8 py-5 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-white">Workspace Details</h3>
                <p className="text-sm text-slate-400 mt-0.5">Your organization and account information.</p>
              </div>
              <div className="p-8">
                {[
                  { label: 'Subdomain', desc: 'Your unique store URL', value: userInfo.subdomain ? `${userInfo.subdomain}.cloudnest.com` : '—' },
                  { label: 'Tenant ID', desc: 'Unique workspace identifier', value: userInfo.tenantId || '—' },
                  { label: 'Account Email', desc: 'Primary login email', value: userInfo.email },
                  { label: 'Role', desc: 'Your access level', value: 'Tenant Admin' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b border-slate-700/20 last:border-0">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                    <span className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg font-mono text-sm max-w-xs truncate">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl">
                <div className="px-8 py-5 border-b border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white">Change Password</h3>
                  <p className="text-sm text-slate-400 mt-0.5">Enter your current password and choose a new one.</p>
                </div>
                <div className="p-8 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                    <input type="password" className={inputClass} placeholder="Enter current password" value={passwordData.current} onChange={e => setPasswordData({ ...passwordData, current: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                      <input type="password" className={inputClass} placeholder="Enter new password" value={passwordData.newPass} onChange={e => setPasswordData({ ...passwordData, newPass: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                      <input type="password" className={inputClass} placeholder="Confirm new password" value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleChangePassword} disabled={passwordSaving || !passwordData.current || !passwordData.newPass || !passwordData.confirm}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all disabled:opacity-30 shadow-lg shadow-indigo-600/20 active:scale-95">
                      {passwordSaving ? 'Updating...' : 'Update Password'}
                    </button>
                    {passwordMsg.text && (
                      <span className={`text-sm ${passwordMsg.isError ? 'text-rose-400' : 'text-emerald-400'}`}>{passwordMsg.text}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl">
                <div className="px-8 py-5 border-b border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white">Session</h3>
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Sign out of your account</p>
                      <p className="text-sm text-slate-400">You'll be redirected to the login page.</p>
                    </div>
                    <button onClick={onLogout} className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all active:scale-95">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEVELOPER */}
          {activeSection === 'developer' && (
            <div className="space-y-6">
              {/* API Keys */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl">
                <div className="px-8 py-5 border-b border-slate-700/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white">API Keys</h3>
                    <p className="text-sm text-slate-400 mt-0.5">Generate API keys for external access.</p>
                  </div>
                  <button onClick={() => alert('Generated new API Key: cnst_live_' + Math.random().toString(36).substr(2, 10))} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20 active:scale-95 text-sm">
                    Generate Key
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-center py-3 border-b border-slate-700/20">
                    <div>
                      <p className="text-white font-medium">Production API Key</p>
                      <p className="text-sm text-slate-400">Created just now</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="px-3 py-1.5 bg-slate-950 text-slate-300 border border-slate-700 rounded-lg font-mono text-sm max-w-xs truncate">cnst_live_••••••••</span>
                      <button className="text-slate-400 hover:text-white transition-colors" title="Copy">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhooks */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl">
                <div className="px-8 py-5 border-b border-slate-700/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Webhooks</h3>
                    <p className="text-sm text-slate-400 mt-0.5">Receive real-time notifications for events.</p>
                  </div>
                  <button onClick={() => alert('Webhook creation modal would open here.')} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors border border-slate-600 shadow-lg shadow-slate-900/20 active:scale-95 text-sm">
                    Add Webhook
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-center py-3 border-b border-slate-700/20">
                    <div>
                      <p className="text-white font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Order Sync Webhook
                      </p>
                      <p className="text-sm text-slate-400">https://your-app.com/webhooks/orders</p>
                    </div>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-medium border border-slate-700">order.created</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DANGER ZONE */}
          {activeSection === 'danger' && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl shadow-xl">
              <div className="px-8 py-5 border-b border-rose-500/20">
                <h3 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Danger Zone
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">Irreversible and destructive actions.</p>
              </div>
              <div className="p-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-white font-medium">Delete this workspace</p>
                    <p className="text-sm text-slate-400 mt-1">Permanently delete <span className="text-white font-medium">{userInfo.subdomain || 'your'}</span> workspace and all data. <span className="text-rose-400 font-semibold">This cannot be undone.</span></p>
                  </div>
                  <button onClick={() => setShowDeleteConfirm(true)} className="px-5 py-2.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-xl font-medium transition-colors border border-rose-500/30 flex-shrink-0 whitespace-nowrap">
                    Delete Workspace
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-rose-500/20 bg-rose-500/5">
              <h3 className="text-xl font-bold text-rose-400">Delete Workspace</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-300">This will permanently delete all data for <span className="text-white font-semibold">{userInfo.subdomain || 'your workspace'}</span>.</p>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type <span className="text-rose-400 font-bold tracking-wider">DELETE</span> to confirm</label>
                <input type="text" className="w-full bg-slate-950 border border-rose-500/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500" value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="DELETE" autoFocus />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleteText !== 'DELETE'} className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
