import { useState } from 'react';
import { createWorkingCopy } from '../../api/versions';

export default function CreateWorkingCopyModal({ treeId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createWorkingCopy(treeId, { name: name || undefined, description: description || undefined });
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
          <h2>Создать рабочую копию</h2>
          <button className="modal__close" onClick={onClose}>&times;</button>
        </div>
        <p className="text-muted" style={{ marginBottom: 16 }}>
          Будет создана полная копия дерева, в которой вы сможете работать параллельно с основной версией.
          После завершения изменений можно выполнить слияние (merge).
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Например: Экспериментальная ветвь"
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Что планируете изменить..."
              rows={3}
            />
          </div>
          {error && <div className="error-text">{error}</div>}
          <div className="modal__footer">
            <button type="button" className="btn btn--outline" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Создание...' : 'Создать копию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
