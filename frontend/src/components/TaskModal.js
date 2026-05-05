import React, { useState, useEffect } from 'react';
import API from '../utils/api';

export default function TaskModal({ projectId, members, task, onClose, onSave, isAdmin }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    dueDate: task?.dueDate || '',
    priority: task?.priority || 'Medium',
    status: task?.status || 'To Do',
    assignedTo: task?.assignedTo || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (task) {
        const res = await API.put(`/tasks/${task.id}`, form);
        onSave(res.data, 'update');
      } else {
        const res = await API.post('/tasks', { ...form, projectId });
        onSave(res.data, 'create');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <h2>{task ? (isAdmin ? 'Edit Task' : 'Update Status') : 'New Task'}</h2>
        <form onSubmit={handleSubmit}>
          {(isAdmin || !task) && (
            <>
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Task title" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the task..." style={{ resize:'vertical' }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign To</label>
                  <select value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                </div>
              </div>
            </>
          )}
          {task && !isAdmin && (
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            </div>
          )}
          {error && <p className="error-msg">{error}</p>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
