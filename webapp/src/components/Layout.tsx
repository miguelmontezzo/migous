import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, ShoppingBag, Backpack, User, Heart, Star, Coins } from 'lucide-react';
import { useStore } from '../store/useStore';
import DailyCheckinModal from './DailyCheckinModal';
import './Layout.css';

const navItems = [
  { path: '/', label: 'Painel', icon: <LayoutDashboard size={24} /> },
  { path: '/rotinas', label: 'Rotinas', icon: <CheckSquare size={24} /> },
  { path: '/loja', label: 'Loja', icon: <ShoppingBag size={24} /> },
  { path: '/inventario', label: 'Inventário', icon: <Backpack size={24} /> },
  { path: '/perfil', label: 'Perfil', icon: <User size={24} /> },
];

export default function Layout() {
  const { stats, runDailyCheck, fetchUserStats } = useStore();

  useEffect(() => {
    runDailyCheck();
    fetchUserStats();
  }, [runDailyCheck, fetchUserStats]);

  return (
    <div className="app-container">
      <DailyCheckinModal />
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <span className="brand-icon">✦</span>
            <h1>Migous</h1>
          </div>
          <div className="header-status">
            <div className="status-badge hp">
              <Heart size={14} className="status-icon" fill="currentColor" />
              <span className="value">{Math.floor(stats.hp)}</span>
            </div>
            <div className="status-badge xp">
              <Star size={14} className="status-icon" fill="currentColor" />
              <span className="value">Lv.{stats.level}</span>
            </div>
            <div className="status-badge coins">
              <Coins size={14} className="status-icon" />
              <span className="value">{Math.floor(stats.credits)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
