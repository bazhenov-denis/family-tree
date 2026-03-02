import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import TreeCard from '../components/tree/TreeCard.jsx';
import TreeFormModal from '../components/tree/TreeFormModal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getMyTrees, createTree, updateTree, deleteTree } from '../api/trees.js';
import { useToast } from '../context/ToastContext.jsx';

export default function TreesPage() {
  const toast = useToast();
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal]             = useState(null); // null | 'create' | tree object for edit
  const [confirmDel, setConfirmDel]   = useState(null); // tree object to delete
  const [deleting, setDeleting]       = useState(false);

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
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Мои деревья</h1>
          <p className="page-subtitle">{trees.length} {trees.length === 1 ? 'дерево' : trees.length < 5 ? 'дерева' : 'деревьев'}</p>
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
        <div className="empty-state">
          <p>У вас ещё нет семейных деревьев.</p>
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
  );
}
