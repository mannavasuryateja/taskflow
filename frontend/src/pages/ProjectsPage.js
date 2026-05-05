import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const statusFilter = location.state?.statusFilter || null;

  const fetchProjects = () => {
    API.get('/projects').then(res => { setProjects(res.data); setLoading(false); });
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/projects', form);
      setForm({ name: '', description: '' });
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'26px' }}>Projects</h1>
          <p style={{ color:'var(--text2)', marginTop:4, fontSize:'14px' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <span>+</span> New Project
        </button>
      </div>

      {statusFilter && (
        <div style={{ marginBottom:20, padding:'10px 16px', background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.3)', borderRadius:'var(--radius-sm)', fontSize:'13px', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>Showing projects — click a project to filter tasks by <strong>{statusFilter}</strong></span>
          <button onClick={() => navigate('/projects', { replace: true })} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:'16px' }}>✕</button>
        </div>
      )}

      {loading ? (
        <p style={{ color:'var(--text2)' }}>Loading...</p>
      ) : projects.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize:48, marginBottom:16 }}>📁</div>
          <h3>No projects yet</h3>
          <p style={{ color:'var(--text2)', marginTop:8 }}>Create your first project to get started</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map(p => (
            <div key={p.id} className="card" style={styles.projectCard} onClick={() => navigate(`/projects/${p.id}`, { state: { statusFilter } })}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={styles.projectIcon}>{p.name[0].toUpperCase()}</div>
                <span className={`tag ${p.role === 'Admin' ? 'tag-admin' : 'tag-member'}`}>{p.role}</span>
              </div>
              <h3 style={{ fontSize:'16px', marginBottom:6 }}>{p.name}</h3>
              {p.description && <p style={{ color:'var(--text2)', fontSize:'13px', lineHeight:1.5 }}>{p.description}</p>}
              <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)', fontSize:'12px', color:'var(--text3)' }}>
                Created by {p.creator?.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Project</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name *</label>
                <input placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="What's this project about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ resize:'vertical' }} />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 },
  projectCard: { cursor:'pointer', transition:'transform 0.2s, border-color 0.2s', ':hover': { transform:'translateY(-2px)' } },
  projectIcon: { width:40, height:40, borderRadius:10, background:'linear-gradient(135deg, var(--accent), #a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontFamily:'Syne, sans-serif', fontWeight:800 },
  empty: { textAlign:'center', padding:'80px 20px', color:'var(--text)' },
};
