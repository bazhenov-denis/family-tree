import { useState, useEffect, useRef } from 'react';
import { Trash2, Send } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import { listComments, createComment, deleteComment } from '../../api/comments.js';
import { useToast } from '../../context/ToastContext.jsx';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'только что';
  if (m < 60) return `${m} мин. назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч. назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} дн. назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

function authorInitials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';
}

export default function CommentSection({ treeId, personId }) {
  const toast = useToast();
  const bottomRef = useRef(null);

  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [deleting, setDeleting]   = useState(null);

  useEffect(() => {
    setLoading(true);
    listComments(treeId, personId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [treeId, personId]);

  async function handleSend(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      const saved = await createComment(treeId, personId, { content });
      setComments(prev => [...prev, saved]);
      setText('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId) {
    setDeleting(commentId);
    try {
      await deleteComment(treeId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  return (
    <div className="comment-section">
      {loading ? (
        <div style={{ padding: '8px 0' }}><Spinner size={18} /></div>
      ) : (
        <>
          {comments.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>Нет комментариев</p>
          ) : (
            <ul className="comment-list">
              {comments.map(c => (
                <li key={c.id} className="comment-item">
                  <div className="comment-avatar">{authorInitials(c.authorName)}</div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{c.authorName}</span>
                      <span className="comment-time">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="comment-text">{c.content}</p>
                  </div>
                  {c.mine && (
                    <button
                      className="icon-btn danger"
                      title="Удалить"
                      disabled={deleting === c.id}
                      onClick={() => handleDelete(c.id)}
                    >
                      {deleting === c.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                    </button>
                  )}
                </li>
              ))}
              <div ref={bottomRef} />
            </ul>
          )}

          <form className="comment-form" onSubmit={handleSend}>
            <textarea
              className="comment-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написать комментарий… (Enter — отправить)"
              rows={2}
              maxLength={2000}
              disabled={sending}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm comment-send"
              disabled={sending || !text.trim()}
            >
              {sending ? <Spinner size={14} /> : <Send size={14} />}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
