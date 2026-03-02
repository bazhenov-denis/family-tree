import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { createEvent, updateEvent } from '../../api/events.js';
import { useToast } from '../../context/ToastContext.jsx';

const EVENT_TYPES = [
  { value: 'BIRTH',    label: 'Рождение' },
  { value: 'DEATH',    label: 'Смерть' },
  { value: 'MARRIAGE', label: 'Бракосочетание' },
  { value: 'DIVORCE',  label: 'Развод' },
  { value: 'MOVE',     label: 'Переезд' },
  { value: 'CUSTOM',   label: 'Другое' },
];

export default function EventFormModal({ treeId, personId, event, onSave, onClose }) {
  const toast = useToast();
  const isEdit = !!event;
  const [type, setType]         = useState(event?.type || 'BIRTH');
  const [title, setTitle]       = useState(event?.title || '');
  const [dateFrom, setDateFrom] = useState(event?.dateFrom || '');
  const [dateTo, setDateTo]     = useState(event?.dateTo || '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = {
        type,
        title: title.trim() || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      };
      const saved = isEdit
        ? await updateEvent(treeId, event.id, data)
        : await createEvent(treeId, personId, data);
      toast.success(isEdit ? 'Событие обновлено' : 'Событие добавлено');
      onSave(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Редактировать событие' : 'Добавить событие'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label className="form-label">Тип события *</label>
          <div className="radio-group" style={{ flexDirection: 'column', gap: 6 }}>
            {EVENT_TYPES.map(t => (
              <label key={t.value} className="radio-option">
                <input
                  type="radio"
                  name="eventType"
                  value={t.value}
                  checked={type === t.value}
                  onChange={() => setType(t.value)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Описание</label>
          <input
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Краткое описание…"
            maxLength={255}
          />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Дата (с)</label>
            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Дата (по)</label>
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner size={16} /> : isEdit ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
