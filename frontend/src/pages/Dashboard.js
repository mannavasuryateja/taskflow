import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, color, icon, onClick }) => (
  <div
    className="card"
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.2s, transform 0.2s',
      borderColor: onClick ? undefined : undefined,
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}}
  >
    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '28px', fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '2px' }}>{label}</div>
    </div>
    {onClick && <div style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: '18px' }}>›</div>}
  </div>
);

const Bar = ({ label, value, max, color }) => (
  <div style={{ marginBottom: '14px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '13px' }}>
      <span style={{ color: 'var(--text2)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
    <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${max ? (value / max) * 100 : 0}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/tasks/dashboard/stats').then(res => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text2)', paddingTop: 40 }}>Loading dashboard...</div>;

  const statusData = stats?.byStatus || {};
  const maxStatus = Math.max(...Object.values(statusData), 1);

  // Navigate to projects page with a status filter in state
  const goToTasks = (filter) => {
    navigate('/projects', { state: { statusFilter: filter } });
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '28px', marginBottom: 4 }}>Good day, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text2)' }}>Here's what's happening across your projects.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Tasks"  value={stats?.total ?? 0}              color="#6c63ff" icon="📋" onClick={() => goToTasks('All')} />
        <StatCard label="To Do"        value={statusData['To Do'] ?? 0}       color="#6c63ff" icon="⭕" onClick={() => goToTasks('To Do')} />
        <StatCard label="In Progress"  value={statusData['In Progress'] ?? 0} color="#ffa502" icon="🔄" onClick={() => goToTasks('In Progress')} />
        <StatCard label="Overdue"      value={stats?.overdue ?? 0}            color="#ff4757" icon="⚠️" onClick={() => goToTasks('Overdue')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '16px' }}>Tasks by Status</h3>
          <Bar label="To Do"       value={statusData['To Do'] ?? 0}       max={maxStatus} color="var(--todo)" />
          <Bar label="In Progress" value={statusData['In Progress'] ?? 0} max={maxStatus} color="var(--inprogress)" />
          <Bar label="Done"        value={statusData['Done'] ?? 0}        max={maxStatus} color="var(--done)" />
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '16px' }}>Tasks per Member</h3>
          {stats?.byUser?.length === 0 ? (
            <p style={{ color: 'var(--text2)', fontSize: '14px' }}>No assigned tasks yet.</p>
          ) : stats?.byUser?.slice(0, 6).map(u => (
            <Bar key={u.id} label={u.name} value={u.count} max={stats.byUser[0]?.count || 1} color="var(--accent)" />
          ))}
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: '12px', color: 'var(--text3)', textAlign: 'right' }}>
        Click any stat card to view tasks →
      </p>
    </div>
  );
}
