import { useState } from 'react';
import { createSnapshot } from '../../api/versions';

export default function CreateSnapshotModal({ treeId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createSnapshot(treeId, { name: name || undefined, description: description || undefined });
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Создать снапшот</h2>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Например: Перед добавлением ветви"
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Опишите состояние дерева..."
              rows={3}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="modal__footer">
            <button type="button" className="btn btn--outline" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Создание...' : 'Создать снапшот'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
