import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavIcon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { to: '/projects', label: 'Projects', icon: 'M2 7l10-5 10 5M2 17l10 5 10-5M2 12l10 5 10-5' },
  ];

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>⬡</span>
          <span style={styles.brandName}>TaskFlow</span>
        </div>
        <nav style={styles.nav}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} style={({ isActive }) => ({
              ...styles.navLink, ...(isActive ? styles.navLinkActive : {})
            })}>
              <NavIcon d={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.userSection}>
          <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user?.name}</div>
            <div style={styles.userEmail}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  shell: { display:'flex', minHeight:'100vh' },
  sidebar: { width:240, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:100 },
  brand: { padding:'24px 20px', display:'flex', alignItems:'center', gap:'10px', borderBottom:'1px solid var(--border)' },
  brandIcon: { fontSize:'20px', color:'var(--accent)' },
  brandName: { fontFamily:'Syne, sans-serif', fontSize:'18px', fontWeight:800, letterSpacing:'-0.3px' },
  nav: { flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:'4px' },
  navLink: { display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'var(--radius-sm)', color:'var(--text2)', fontSize:'14px', fontWeight:500, transition:'all 0.2s', textDecoration:'none' },
  navLinkActive: { background:'rgba(108,99,255,0.15)', color:'var(--accent)' },
  userSection: { padding:'16px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'10px' },
  avatar: { width:34, height:34, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, flexShrink:0 },
  userInfo: { flex:1, overflow:'hidden' },
  userName: { fontSize:'13px', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userEmail: { fontSize:'11px', color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  logoutBtn: { background:'transparent', color:'var(--text3)', padding:'6px', borderRadius:'6px', display:'flex', border:'none', cursor:'pointer' },
  main: { flex:1, marginLeft:240, padding:'32px', overflowY:'auto' },
};
