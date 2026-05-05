import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';
import NotesModal from '../components/NotesModal';

const statusColors = { 'To Do': 'tag-todo', 'In Progress': 'tag-inprogress', 'Done': 'tag-done' };
const priorityColors = { 'Low': 'tag-low', 'Medium': 'tag-medium', 'High': 'tag-high' };

function TaskCard({ task, isAdmin, isAssignee, onEdit, onDelete, onNotes }) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'Done';
  const canEdit = isAdmin || isAssignee;

  return (
    <div className="card" style={{ marginBottom:10, opacity: task.status === 'Done' ? 0.7 : 1 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
            <span className={`tag ${statusColors[task.status]}`}>{task.status}</span>
            <span className={`tag ${priorityColors[task.priority]}`}>{task.priority}</span>
            {isOverdue && <span className="tag" style={{ background:'rgba(255,71,87,0.15)', color:'var(--danger)' }}>⚠ Overdue</span>}
            {task.noteCount > 0 && (
              <span className="tag" style={{ background:'rgba(67,233,123,0.1)', color:'var(--success)' }}>
                📝 {task.noteCount} note{task.noteCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize:'15px', fontWeight:600, marginBottom:4 }}>{task.title}</div>
          {task.description && <div style={{ fontSize:'13px', color:'var(--text2)', marginBottom:8, lineHeight:1.5 }}>{task.description}</div>}
          <div style={{ display:'flex', gap:16, fontSize:'12px', color:'var(--text3)' }}>
            {task.assignee && <span>👤 {task.assignee.name}</span>}
            {task.dueDate && <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit' }}>📅 {task.dueDate}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:6, marginLeft:12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onNotes(task)} title="Notes & Attachments">
            📝 Notes
          </button>
          {canEdit && (
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>
              {isAdmin ? 'Edit' : 'Status'}
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)}>Del</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [notesTask, setNotesTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');
  const [memberError, setMemberError] = useState('');
  const [filter, setFilter] = useState(location.state?.statusFilter || 'All');
  const [tab, setTab] = useState('tasks');

  const fetchAll = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/tasks/project/${id}`)
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const isAdmin = project?.currentUserRole === 'Admin';

  const handleTaskSave = (task, type) => {
    if (type === 'create') setTasks(prev => [task, ...prev]);
    else setTasks(prev => prev.map(t => t.id === task.id ? task : t));
  };
  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await API.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    try {
      await API.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      setMemberEmail(''); setShowAddMember(false);
      fetchAll();
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await API.delete(`/projects/${id}/members/${userId}`);
    fetchAll();
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project? This cannot be undone.')) return;
    await API.delete(`/projects/${id}`);
    navigate('/projects');
  };

  if (loading) return <div style={{ color:'var(--text2)' }}>Loading...</div>;
  if (!project) return null;

  const today = new Date().toISOString().split('T')[0];
  const filteredTasks = filter === 'All' ? tasks
    : filter === 'Overdue' ? tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'Done')
    : tasks.filter(t => t.status === filter);
  const statuses = ['All', 'To Do', 'In Progress', 'Done', 'Overdue'];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <button onClick={() => navigate('/projects')} style={{ background:'none', color:'var(--text3)', fontSize:'13px', padding:0, marginBottom:8, border:'none', cursor:'pointer' }}>← Projects</button>
          <h1 style={{ fontSize:'26px' }}>{project.name}</h1>
          {project.description && <p style={{ color:'var(--text2)', marginTop:4 }}>{project.description}</p>}
          <span className={`tag ${isAdmin ? 'tag-admin' : 'tag-member'}`} style={{ marginTop:8 }}>{project.currentUserRole}</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {isAdmin && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>+ Task</button>
              {isAdmin && <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:24, borderBottom:'1px solid var(--border)' }}>
        {['tasks', 'members'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'10px 20px', background:'none', border:'none', color: tab === t ? 'var(--accent)' : 'var(--text2)', fontFamily:'DM Sans, sans-serif', fontSize:'14px', fontWeight: tab === t ? 600 : 400, borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', cursor:'pointer', textTransform:'capitalize' }}>
            {t} {t === 'tasks' ? `(${tasks.length})` : `(${project.members?.length})`}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {tab === 'tasks' && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>{s}</button>
            ))}
          </div>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text2)' }}>
              {isAdmin ? <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Create first task</button> : <p>No tasks found.</p>}
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} isAdmin={isAdmin}
                isAssignee={task.assignedTo === user.id}
                onEdit={t => { setEditingTask(t); setShowTaskModal(true); }}
                onDelete={handleDelete}
                onNotes={t => setNotesTask(t)}
              />
            ))
          )}
        </>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div>
          {isAdmin && (
            <div style={{ marginBottom:20 }}>
              {showAddMember ? (
                <form onSubmit={handleAddMember} style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                  <div style={{ flex:1 }}>
                    <input placeholder="member@email.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required type="email" />
                  </div>
                  <select value={memberRole} onChange={e => setMemberRole(e.target.value)} style={{ width:120 }}>
                    <option>Member</option>
                    <option>Admin</option>
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm">Add</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(false)}>Cancel</button>
                </form>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>
              )}
              {memberError && <p className="error-msg">{memberError}</p>}
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {project.members?.map(m => (
              <div key={m.id} className="card" style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{m.name[0].toUpperCase()}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{m.name}</div>
                  <div style={{ fontSize:'13px', color:'var(--text2)' }}>{m.email}</div>
                </div>
                <span className={`tag ${m.ProjectMember?.role === 'Admin' ? 'tag-admin' : 'tag-member'}`}>{m.ProjectMember?.role}</span>
                {isAdmin && m.id !== user.id && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          projectId={id}
          members={project.members || []}
          task={editingTask}
          isAdmin={isAdmin}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSave={handleTaskSave}
        />
      )}

      {notesTask && (
        <NotesModal
          task={notesTask}
          isAdmin={isAdmin}
          onClose={() => setNotesTask(null)}
          onNoteAdded={(updatedTask) => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            setNotesTask(updatedTask);
          }}
        />
      )}
    </div>
  );
}
