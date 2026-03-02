import { useRef, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { createPerson, updatePerson } from '../../api/persons.js';
import { createRelationship } from '../../api/relationships.js';
import { uploadImage } from '../../api/upload.js';
import { useToast } from '../../context/ToastContext.jsx';

const GENDERS = [
  { value: 'MALE', label: 'Мужской' },
  { value: 'FEMALE', label: 'Женский' },
  { value: 'OTHER', label: 'Другой' },
];

// Relationship options when creating from a card's + button
// value = internal key; label = what the new person IS relative to fromNode
const REL_OPTIONS = [
  { value: 'CHILD',  label: 'Ребёнок'  },
  { value: 'PARENT', label: 'Родитель' },
  { value: 'SPOUSE', label: 'Супруг/а' },
];

// Build the relationship request based on chosen type
function buildRelReq(relType, fromNodeId, newPersonId) {
  if (relType === 'CHILD')  return { fromPersonId: fromNodeId,  toPersonId: newPersonId, type: 'PARENT' };
  if (relType === 'PARENT') return { fromPersonId: newPersonId, toPersonId: fromNodeId,  type: 'PARENT' };
  if (relType === 'SPOUSE') return { fromPersonId: fromNodeId,  toPersonId: newPersonId, type: 'SPOUSE' };
  return null;
}

export default function PersonFormModal({ treeId, person, fromNode, onSave, onClose }) {
  const toast = useToast();
  const isEdit = !!person;
  const [relType, setRelType] = useState('CHILD'); // only used when fromNode is set
  const [firstName, setFirstName]   = useState(person?.firstName || '');
  const [lastName, setLastName]     = useState(person?.lastName || '');
  const [gender, setGender]         = useState(person?.gender || '');
  const [birthDate, setBirthDate]   = useState(person?.birthDate || '');
  const [deathDate, setDeathDate]   = useState(person?.deathDate || '');
  const [birthPlace, setBirthPlace] = useState(person?.birthPlace || '');
  const [deathPlace, setDeathPlace] = useState(person?.deathPlace || '');
  const [bio, setBio]               = useState(person?.bio || '');
  const [photoUrl, setPhotoUrl]     = useState(person?.photoUrl || '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef                = useRef(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setError('');
    try {
      const url = await uploadImage(file);
      setPhotoUrl(url);
    } catch (err) {
      setError('Не удалось загрузить фото: ' + err.message);
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!firstName.trim()) { setError('Имя обязательно'); return; }

    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim() || null,
      gender: gender || null,
      birthDate: birthDate || null,
      deathDate: deathDate || null,
      birthPlace: birthPlace.trim() || null,
      deathPlace: deathPlace.trim() || null,
      bio: bio.trim() || null,
      photoUrl: photoUrl.trim() || null,
    };

    setLoading(true);
    setError('');
    try {
      const saved = isEdit
        ? await updatePerson(treeId, person.id, data)
        : await createPerson(treeId, data);

      // If opened from a card's + button, auto-create the chosen relationship
      if (fromNode && !isEdit) {
        const relReq = buildRelReq(relType, fromNode.id, saved.id);
        if (relReq) await createRelationship(treeId, relReq);
      }

      toast.success(isEdit ? 'Карточка обновлена' : 'Карточка добавлена');
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Редактировать карточку' : 'Новая карточка'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form">

        {/* Relationship picker — shown only when creating from a card's + button */}
        {fromNode && !isEdit && (
          <div className="form-group">
            <label className="form-label">
              Кем приходится «{fromNode.fullName}»
            </label>
            <div className="radio-group">
              {REL_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`radio-option${relType === opt.value ? ' selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="relType"
                    value={opt.value}
                    checked={relType === opt.value}
                    onChange={() => setRelType(opt.value)}
                    style={{ display: 'none' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Имя *</label>
            <input
              className="form-input"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Иван"
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Фамилия</label>
            <input
              className="form-input"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Иванов"
              maxLength={100}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Пол</label>
          <div className="radio-group">
            {GENDERS.map(g => (
              <label
                key={g.value}
                className={`radio-option${gender === g.value ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={g.value}
                  checked={gender === g.value}
                  onChange={() => setGender(g.value)}
                  style={{ display: 'none' }}
                />
                {g.label}
              </label>
            ))}
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Дата рождения</label>
            <input
              className="form-input"
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Дата смерти</label>
            <input
              className="form-input"
              type="date"
              value={deathDate}
              onChange={e => setDeathDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">Место рождения</label>
            <input
              className="form-input"
              value={birthPlace}
              onChange={e => setBirthPlace(e.target.value)}
              placeholder="Москва"
              maxLength={500}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Место смерти</label>
            <input
              className="form-input"
              value={deathPlace}
              onChange={e => setDeathPlace(e.target.value)}
              placeholder="Санкт-Петербург"
              maxLength={500}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Фото</label>
          <div className="photo-upload-row">
            {photoUrl && (
              <img src={photoUrl} alt="preview" className="photo-upload-preview" />
            )}
            <div className="photo-upload-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
              >
                {photoUploading ? <Spinner size={14} /> : photoUrl ? 'Заменить фото' : 'Загрузить фото'}
              </button>
              {photoUrl && (
                <button
                  type="button"
                  className="btn btn-ghost btn-danger-ghost"
                  onClick={() => { setPhotoUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                >
                  Удалить
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Биография / заметки</label>
          <textarea
            className="form-input form-textarea"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Краткая биография, интересные факты…"
            rows={3}
            maxLength={4000}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <Spinner size={16} /> : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
