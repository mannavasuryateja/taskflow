import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function NotesModal({ task, isAdmin, onClose, onNoteAdded }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null); // { name, type, data }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    API.get(`/tasks/${task.id}/notes`)
      .then(res => { setNotes(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [task.id]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment({ name: file.name, type: file.type, data: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !attachment) { setError('Add a note or attach a file.'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await API.post(`/tasks/${task.id}/notes`, { text: text.trim(), attachment });
      const newNotes = [res.data, ...notes];
      setNotes(newNotes);
      setText('');
      setAttachment(null);
      if (fileRef.current) fileRef.current.value = '';
      // Notify parent with updated noteCount
      onNoteAdded({ ...task, noteCount: newNotes.length });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    await API.delete(`/tasks/${task.id}/notes/${noteId}`);
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    onNoteAdded({ ...task, noteCount: updated.length });
  };

  const isImage = (type) => type && type.startsWith('image/');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>📝 Notes</h2>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{task.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Add note form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <textarea
              rows={3}
              placeholder="Write a note, describe progress, paste error messages, code snippets..."
              value={text}
              onChange={e => setText(e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }}
            />
          </div>

          {/* Attachment preview */}
          {attachment && (
            <div style={{ marginBottom: 10, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 10 }}>
              {isImage(attachment.type) ? (
                <img src={attachment.data} alt={attachment.name} style={{ height: 48, width: 48, objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                <span style={{ fontSize: 24 }}>📎</span>
              )}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachment.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{attachment.type}</div>
              </div>
              <button type="button" onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = ''; }}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
          )}

          {error && <p className="error-msg" style={{ marginBottom: 8 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', color: 'var(--text2)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
              📎 Attach
              <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.js,.ts,.py,.json,.md,.csv,.zip" onChange={handleFile} style={{ display: 'none' }} />
            </label>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ marginLeft: 'auto' }}>
              {saving ? 'Posting...' : 'Post Note'}
            </button>
          </div>
        </form>

        {/* Notes list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Loading notes...</p>
          ) : notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <p style={{ fontSize: '14px' }}>No notes yet. Add the first one above.</p>
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} style={{ marginBottom: 14, padding: '14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                {/* Note header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                      {note.author?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{note.author?.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 8 }}>
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {(isAdmin || note.author?.id === user.id) && (
                    <button onClick={() => handleDelete(note.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '14px' }}
                      title="Delete note">🗑</button>
                  )}
                </div>

                {/* Note text */}
                {note.text && (
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: note.attachment ? 10 : 0 }}>
                    {note.text}
                  </p>
                )}

                {/* Attachment */}
                {note.attachment && (
                  <div style={{ marginTop: 8 }}>
                    {isImage(note.attachment.type) ? (
                      <a href={note.attachment.data} target="_blank" rel="noreferrer">
                        <img src={note.attachment.data} alt={note.attachment.name}
                          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }} />
                      </a>
                    ) : (
                      <a href={note.attachment.data} download={note.attachment.name}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
                        📎 {note.attachment.name}
                        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>↓ download</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
