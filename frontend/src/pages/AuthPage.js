import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.logo}>TaskFlow</div>
        <h1 style={styles.headline}>Manage tasks.<br />Ship faster.<br />Together.</h1>
        
        <div style={styles.features}>
          {['Role-based access control', 'Real-time task tracking', 'Team collaboration', 'Progress dashboard'].map(f => (
            <div key={f} style={styles.feature}>
              <span style={styles.featureDot}></span>
              {f}
            </div>
          ))}
        </div>
      </div>
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={styles.tabs}>
            <button style={mode === 'login' ? styles.tabActive : styles.tab} onClick={() => setMode('login')}>Sign In</button>
            <button style={mode === 'signup' ? styles.tabActive : styles.tab} onClick={() => setMode('signup')}>Sign Up</button>
          </div>
          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center', padding:'12px', marginTop:'8px', fontSize:'15px'}} disabled={loading}>
              {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display:'flex', minHeight:'100vh', background:'var(--bg)' },
  left: { flex:1, padding:'60px', display:'flex', flexDirection:'column', justifyContent:'center', background:'linear-gradient(135deg, #0a0a0f 0%, #13131a 100%)' },
  logo: { fontFamily:'Syne, sans-serif', fontSize:'22px', fontWeight:800, color:'var(--accent)', marginBottom:'48px', letterSpacing:'-0.5px' },
  headline: { fontFamily:'Syne, sans-serif', fontSize:'clamp(32px, 4vw, 52px)', fontWeight:800, lineHeight:1.1, marginBottom:'20px', background:'linear-gradient(135deg, #fff 0%, #8888aa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  sub: { fontSize:'16px', color:'var(--text2)', marginBottom:'40px', lineHeight:1.6 },
  features: { display:'flex', flexDirection:'column', gap:'12px' },
  feature: { display:'flex', alignItems:'center', gap:'12px', fontSize:'14px', color:'var(--text2)' },
  featureDot: { width:8, height:8, borderRadius:'50%', background:'var(--accent)', flexShrink:0 },
  right: { width:480, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', borderLeft:'1px solid var(--border)' },
  card: { width:'100%', background:'var(--surface)', borderRadius:'var(--radius)', padding:'36px', border:'1px solid var(--border)' },
  tabs: { display:'flex', gap:0, marginBottom:'28px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', padding:'4px' },
  tab: { flex:1, padding:'10px', background:'transparent', color:'var(--text2)', borderRadius:'var(--radius-sm)', fontSize:'14px', fontWeight:500, fontFamily:'DM Sans, sans-serif', cursor:'pointer', border:'none' },
  tabActive: { flex:1, padding:'10px', background:'var(--surface)', color:'var(--text)', borderRadius:'var(--radius-sm)', fontSize:'14px', fontWeight:600, fontFamily:'DM Sans, sans-serif', cursor:'pointer', border:'none', boxShadow:'0 2px 8px rgba(0,0,0,0.3)' },
};
