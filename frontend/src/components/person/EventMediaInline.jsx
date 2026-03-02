import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import { listEventMedia, addEventMedia, deleteMedia } from '../../api/media.js';
import { uploadFile } from '../../api/upload.js';
import { useToast } from '../../context/ToastContext.jsx';

function isImage(item) {
  if (item.mimeType) return item.mimeType.startsWith('image/');
  return !item.fileName || /\.(jpe?g|png|gif|webp|svg)$/i.test(item.fileName);
}

const ACCEPT = 'image/*,application/pdf,application/msword,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-excel,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'text/plain';

export default function EventMediaInline({ treeId, eventId, canEdit }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [open, setOpen]           = useState(false);
  const [items, setItems]         = useState([]);
  const [loaded, setLoaded]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting]   = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listEventMedia(treeId, eventId);
      setItems(data);
      setLoaded(true);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    if (!open && !loaded) load();
    setOpen(o => !o);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, mimeType, fileName } = await uploadFile(file);
      const saved = await addEventMedia(treeId, eventId, { url, mimeType, fileName, description: null });
      setItems(prev => [...prev, saved]);
      toast.success('Файл добавлен');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(mediaId) {
    setDeleting(mediaId);
    try {
      await deleteMedia(treeId, mediaId);
      setItems(prev => prev.filter(m => m.id !== mediaId));
      toast.success('Файл удалён');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  const count = loaded ? items.length : null;

  return (
    <div className="event-media-inline">
      <button className="event-media-toggle" onClick={toggle}>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        <span>Файлы{count !== null ? ` (${count})` : ''}</span>
      </button>

      {open && (
        <div className="event-media-body">
          {loading ? (
            <Spinner size={14} />
          ) : (
            <>
              {items.map(m => (
                <div key={m.id} className="event-media-item">
                  {isImage(m) ? (
                    <a href={m.url} target="_blank" rel="noreferrer">
                      <img src={m.url} alt="" className="event-media-thumb" />
                    </a>
                  ) : (
                    <FileText size={14} className="event-media-doc-icon" />
                  )}
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="event-media-name"
                    title={m.fileName || m.url}
                  >
                    {m.fileName || (isImage(m) ? 'Фото' : 'Документ')}
                  </a>
                  <a href={m.url} target="_blank" rel="noreferrer" className="icon-btn" title="Открыть">
                    <Download size={12} />
                  </a>
                  {canEdit && (
                    <button
                      className="icon-btn danger"
                      title="Удалить"
                      disabled={deleting === m.id}
                      onClick={() => handleDelete(m.id)}
                    >
                      {deleting === m.id ? <Spinner size={12} /> : <Trash2 size={12} />}
                    </button>
                  )}
                </div>
              ))}

              {items.length === 0 && !uploading && (
                <span className="text-muted" style={{ fontSize: 12 }}>Нет файлов</span>
              )}

              {canEdit && (
                <button
                  className="event-media-add-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Добавить файл"
                >
                  {uploading ? <Spinner size={12} /> : <Plus size={12} />}
                  {uploading ? 'Загрузка...' : 'Добавить файл'}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
