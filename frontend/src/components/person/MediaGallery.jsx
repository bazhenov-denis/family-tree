import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, ChevronLeft, ChevronRight, FileText, Download } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import { listMedia, addMedia, deleteMedia } from '../../api/media.js';
import { uploadFile } from '../../api/upload.js';
import { useToast } from '../../context/ToastContext.jsx';

const ACCEPT = 'image/*,application/pdf,application/msword,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-excel,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'text/plain';

function isImage(item) {
  if (item.mimeType) return item.mimeType.startsWith('image/');
  // fallback: assume image if no mimeType (legacy records)
  return !item.fileName || /\.(jpe?g|png|gif|webp|svg)$/i.test(item.fileName);
}

export default function MediaGallery({ treeId, personId, canEdit }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [lightbox, setLightbox]   = useState(null);

  useEffect(() => {
    setLoading(true);
    listMedia(treeId, personId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [treeId, personId]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, mimeType, fileName } = await uploadFile(file);
      const saved = await addMedia(treeId, personId, { url, mimeType, fileName, description: null });
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
      if (lightbox !== null) setLightbox(null);
      toast.success('Файл удалён');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  function prev() { setLightbox(i => (i - 1 + imageItems.length) % imageItems.length); }
  function next() { setLightbox(i => (i + 1) % imageItems.length); }

  if (loading) return <div style={{ padding: '8px 0' }}><Spinner size={18} /></div>;

  const imageItems = items.filter(isImage);
  const docItems   = items.filter(m => !isImage(m));

  return (
    <>
      {/* ── Photos ── */}
      <div className="media-gallery">
        {imageItems.map((m, idx) => (
          <div key={m.id} className="media-thumb" onClick={() => setLightbox(idx)}>
            <img src={m.url} alt={m.description || ''} className="media-thumb-img" />
            {canEdit && (
              <button
                className="media-thumb-del"
                title="Удалить"
                disabled={deleting === m.id}
                onClick={e => { e.stopPropagation(); handleDelete(m.id); }}
              >
                {deleting === m.id ? <Spinner size={12} /> : <Trash2 size={12} />}
              </button>
            )}
          </div>
        ))}

        {canEdit && (
          <button
            className="media-thumb media-thumb-add"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Добавить файл"
          >
            {uploading ? <Spinner size={20} /> : <Plus size={20} />}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {imageItems.length === 0 && !canEdit && (
        <p className="text-muted" style={{ fontSize: 13 }}>Нет фотографий</p>
      )}

      {/* ── Documents ── */}
      {docItems.length > 0 && (
        <div className="media-docs">
          <p className="media-docs-label">Документы</p>
          {docItems.map(m => (
            <div key={m.id} className="media-doc-row">
              <FileText size={16} className="media-doc-icon" />
              <span className="media-doc-name">{m.fileName || 'Документ'}</span>
              <a href={m.url} target="_blank" rel="noreferrer" className="icon-btn" title="Скачать">
                <Download size={14} />
              </a>
              {canEdit && (
                <button
                  className="icon-btn"
                  title="Удалить"
                  disabled={deleting === m.id}
                  onClick={() => handleDelete(m.id)}
                >
                  {deleting === m.id ? <Spinner size={12} /> : <Trash2 size={12} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && imageItems[lightbox] && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}><X size={20} /></button>

          {imageItems.length > 1 && (
            <>
              <button className="lightbox-nav lightbox-prev" onClick={e => { e.stopPropagation(); prev(); }}>
                <ChevronLeft size={28} />
              </button>
              <button className="lightbox-nav lightbox-next" onClick={e => { e.stopPropagation(); next(); }}>
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={imageItems[lightbox].url} alt={imageItems[lightbox].description || ''} className="lightbox-img" />
            {imageItems[lightbox].description && (
              <p className="lightbox-caption">{imageItems[lightbox].description}</p>
            )}
            {canEdit && (
              <button
                className="btn btn-danger btn-sm"
                style={{ marginTop: 12 }}
                disabled={deleting === imageItems[lightbox].id}
                onClick={() => handleDelete(imageItems[lightbox].id)}
              >
                {deleting === imageItems[lightbox].id ? <Spinner size={14} /> : <Trash2 size={14} />}
                Удалить
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
