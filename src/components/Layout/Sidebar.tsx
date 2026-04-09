import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Activity,
  Settings,
  Shield,
  LogOut,
  Archive,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { to: '/files', icon: <FolderOpen className="w-5 h-5" />, label: 'My Files' },
  { to: '/upload', icon: <Upload className="w-5 h-5" />, label: 'Upload' },
  { to: '/activity', icon: <Activity className="w-5 h-5" />, label: 'Activity' },
  { to: '/profile', icon: <Settings className="w-5 h-5" />, label: 'Profile' },
  { to: '/admin', icon: <Shield className="w-5 h-5" />, label: 'Admin', adminOnly: true },
];

export function Sidebar() {
  const { logout, isAdmin, userProfile } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to logout');
    }
  }

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 border-r border-slate-700 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <Archive className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-lg truncate">ArchivePro</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-bold shrink-0">
              {userProfile?.displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm text-white font-medium truncate">{userProfile?.displayName}</p>
              <p className="text-xs text-slate-400 truncate">{userProfile?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
