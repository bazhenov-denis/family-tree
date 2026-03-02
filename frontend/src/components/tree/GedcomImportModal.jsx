import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, Eye, Users, GitBranch } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { previewGedcom, importGedcom } from '../../api/gedcom.js';

const GENDER_LABELS = { MALE: 'М', FEMALE: 'Ж', OTHER: '—' };

export default function GedcomImportModal({ treeId, onImported, onClose }) {
  const [step, setStep]       = useState('select');   // 'select' | 'preview' | 'done'
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);       // { persons, familiesCount }
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const inputRef = useRef(null);

  function handleFile(f) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.ged')) {
      setError('Файл должен иметь расширение .ged');
      return;
    }
    setFile(f);
    setError('');
    setPreview(null);
  }

  function onDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  async function doPreview() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await previewGedcom(treeId, file);
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err.message || 'Ошибка разбора файла');
    } finally {
      setLoading(false);
    }
  }

  async function doImport() {
    setLoading(true);
    setError('');
    try {
      const res = await importGedcom(treeId, file);
      setResult(res);
      setStep('done');
      onImported();
    } catch (err) {
      setError(err.message || 'Ошибка импорта');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Импорт GEDCOM" onClose={onClose}>
      <div className="form" style={{ gap: 16 }}>

        {/* ── Step 1: select file ── */}
        {step === 'select' && (
          <>
            <div
              className="gedcom-drop"
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
            >
              {file ? (
                <>
                  <FileText size={32} style={{ color: 'var(--clr-primary)' }} />
                  <p className="gedcom-drop-name">{file.name}</p>
                  <p className="text-muted" style={{ fontSize: 12 }}>
                    {(file.size / 1024).toFixed(1)} КБ — нажмите чтобы заменить
                  </p>
                </>
              ) : (
                <>
                  <Upload size={32} style={{ opacity: .4 }} />
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Перетащите .ged файл</p>
                  <p className="text-muted" style={{ fontSize: 12 }}>или нажмите для выбора</p>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".ged"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            {error && <p className="form-error">{error}</p>}
            <p className="text-muted" style={{ fontSize: 12 }}>
              Импортированные люди и связи будут добавлены к существующим данным дерева.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
              <button
                className="btn btn-primary"
                disabled={!file || loading}
                onClick={doPreview}
              >
                {loading ? <Spinner size={16} /> : <Eye size={16} />}
                Предпросмотр
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: preview ── */}
        {step === 'preview' && preview && (
          <>
            <div className="gedcom-preview-stats">
              <div className="gedcom-stat">
                <Users size={18} />
                <span><strong>{preview.persons.length}</strong> человек</span>
              </div>
              <div className="gedcom-stat">
                <GitBranch size={18} />
                <span><strong>{preview.familiesCount}</strong> семей</span>
              </div>
            </div>

            <div className="gedcom-preview-list">
              {preview.persons.slice(0, 50).map((p, i) => (
                <div key={i} className="gedcom-preview-row">
                  <span className="gedcom-preview-gender">{GENDER_LABELS[p.gender] || '—'}</span>
                  <span className="gedcom-preview-name">
                    {[p.firstName, p.lastName].filter(Boolean).join(' ') || '—'}
                  </span>
                  <span className="gedcom-preview-dates text-muted">
                    {[p.birthDate?.slice(0,4), p.deathDate ? `† ${p.deathDate.slice(0,4)}` : null]
                      .filter(Boolean).join(' – ')}
                  </span>
                </div>
              ))}
              {preview.persons.length > 50 && (
                <p className="text-muted" style={{ fontSize: 12, padding: '4px 8px' }}>
                  … и ещё {preview.persons.length - 50} человек
                </p>
              )}
            </div>

            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setStep('select')}>Назад</button>
              <button className="btn btn-primary" disabled={loading} onClick={doImport}>
                {loading ? <Spinner size={16} /> : <Upload size={16} />}
                Импортировать
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: done ── */}
        {step === 'done' && result && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle size={48} style={{ color: 'var(--clr-primary)', marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Импорт завершён</h3>
            <p style={{ fontSize: 14, color: 'var(--clr-muted)' }}>
              Добавлено: <strong>{result.personsCreated}</strong> чел.,{' '}
              <strong>{result.relationshipsCreated}</strong> связей
            </p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onClose}>
              Готово
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
}
