import { useState, useEffect } from 'react';
import { Plus, Trees, Sparkles, BookOpen, Users, Share2 } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import TreeCard from '../components/tree/TreeCard.jsx';
import TreeFormModal from '../components/tree/TreeFormModal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getMyTrees, createTree, updateTree, deleteTree } from '../api/trees.js';
import { useToast } from '../context/ToastContext.jsx';

const WELCOME_KEY = 'ft_welcome_seen';

function WelcomeModal({ onClose }) {
  const steps = [
    { icon: Trees, title: 'Создайте дерево', desc: 'Начните с первого семейного дерева — это бесплатно' },
    { icon: Users, title: 'Добавьте близких', desc: 'Внесите информацию о родственниках и их связях' },
    { icon: BookOpen, title: 'Заполните историю', desc: 'Добавляйте события, фотографии и документы' },
    { icon: Share2, title: 'Пригласите семью', desc: 'Поделитесь доступом с родственниками' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal welcome-modal" onClick={e => e.stopPropagation()}>
        <div className="welcome-modal-header">
          <Sparkles size={20} style={{ color: 'var(--clr-primary)' }} />
          <h2 className="welcome-modal-title">Добро пожаловать!</h2>
        </div>
        <div className="welcome-modal-body">
          <p className="welcome-modal-desc">
            Семейное Древо — приложение для хранения истории вашей семьи.
            Начните с четырёх простых шагов:
          </p>
          <div className="welcome-steps">
            {steps.map((step, i) => (
              <div key={i} className="welcome-step">
                <div className="welcome-step-icon">
                  <step.icon size={18} />
                </div>
                <div className="welcome-step-info">
                  <div className="welcome-step-title">{step.title}</div>
                  <div className="welcome-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="welcome-modal-footer">
          <button className="btn btn-primary btn-full" onClick={onClose}>
            Начать
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TreesPage() {
  const toast = useToast();
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal]             = useState(null); // null | 'create' | tree object for edit
  const [confirmDel, setConfirmDel]   = useState(null); // tree object to delete
  const [deleting, setDeleting]       = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return !localStorage.getItem(WELCOME_KEY); } catch { return true; }
  });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getMyTrees();
      setTrees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleWelcomeClose() {
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch {}
    setShowWelcome(false);
  }

  async function handleSave(data) {
    if (modal === 'create') {
      await createTree(data);
    } else {
      await updateTree(modal.id, data);
    }
    await load();
  }

  async function handleDelete() {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await deleteTree(confirmDel.id);
      toast.success('Дерево удалено');
      setConfirmDel(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Мои деревья</h1>
          <p className="page-subtitle">
            {loading
              ? 'Загрузка...'
              : `${trees.length} ${trees.length === 1 ? 'дерево' : trees.length < 5 ? 'дерева' : 'деревьев'}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={18} /> Новое дерево
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <Spinner size={32} />
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {!loading && !error && trees.length === 0 && (
        <div className="empty-state" style={{ minHeight: 360, padding: '48px 24px' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--clr-primary)', marginBottom: 8,
            boxShadow: '0 4px 16px rgba(22,163,74,.12)',
          }}>
            <Trees size={44} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginBottom: 6 }}>
            Начните свою семейную историю
          </h3>
          <p style={{ maxWidth: 340, lineHeight: 1.6, marginBottom: 20 }}>
            Создайте первое семейное дерево, добавьте близких, фотографии и важные события.
            Это бесплатно и займёт всего пару минут.
          </p>
          <button className="btn btn-primary" onClick={() => setModal('create')}>
            <Plus size={18} /> Создать первое дерево
          </button>
        </div>
      )}

      <div className="tree-grid">
        {trees.map((tree) => (
          <TreeCard
            key={tree.id}
            tree={tree}
            onEdit={(t) => setModal(t)}
            onDelete={(t) => setConfirmDel(t)}
          />
        ))}
      </div>

      {modal && (
        <TreeFormModal
          tree={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Удалить дерево"
          message={`Удалить дерево «${confirmDel.title}»? Все люди и связи будут удалены. Это действие необратимо.`}
          confirmLabel="Удалить"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
          loading={deleting}
        />
      )}
    </Layout>
    {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
    </>
  );
}
