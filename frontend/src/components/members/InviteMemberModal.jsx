import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { createInvite } from '../../api/invites.js';

const ROLE_LABELS = { EDITOR: 'Редактор', VIEWER: 'Читатель' };

export default function InviteMemberModal({ treeId, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Укажите email'); return; }

    setLoading(true);
    setError('');
    try {
      await createInvite(treeId, { email: email.trim(), role });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Пригласить участника" onClose={onClose}>
      {success ? (
        <div className="success-state">
          <p>Приглашение отправлено на <strong>{email}</strong>.</p>
          <button className="btn btn-primary" onClick={onClose}>Готово</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Роль</label>
            <div className="radio-group">
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <label key={value} className={`radio-option ${role === value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Spinner size={16} /> : 'Пригласить'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
