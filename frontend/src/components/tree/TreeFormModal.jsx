import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function TreeFormModal({ tree, onSave, onClose }) {
  const toast = useToast();
  const [title, setTitle] = useState(tree?.title || '');
  const [description, setDescription] = useState(tree?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError('Название обязательно'); return; }

    setLoading(true);
    setError('');
    try {
      await onSave({ title: title.trim(), description: description.trim() || undefined });
      toast.success(tree ? 'Изменения сохранены' : 'Дерево создано');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={tree ? 'Редактировать дерево' : 'Новое дерево'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label className="form-label">Название *</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Моё семейное дерево"
            maxLength={255}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea
            className="form-input form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание..."
            maxLength={1000}
            rows={3}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner size={16} /> : tree ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
