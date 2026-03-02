import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import MemberList from '../components/members/MemberList.jsx';
import InviteMemberModal from '../components/members/InviteMemberModal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getMembers } from '../api/members.js';
import { getTree } from '../api/trees.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function TreeMembersPage() {
  const { treeId } = useParams();
  const { user } = useAuth();
  const [tree, setTree] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [treeData, membersData] = await Promise.all([getTree(treeId), getMembers(treeId)]);
      setTree(treeData);
      setMembers(membersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [treeId]);

  // Derive current user ID from members list by matching email
  const currentUserId = members.find(m => m.email === user?.email)?.userId;

  return (
    <Layout>
      <div className="page-header">
        <div className="page-header-left">
          <Link to={`/trees/${treeId}`} className="back-link">
            <ArrowLeft size={18} /> {tree?.title || 'Дерево'}
          </Link>
          <h1 className="page-title">Участники</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <UserPlus size={18} /> Пригласить
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state"><Spinner size={32} /></div>
      ) : (
        <div className="section-card">
          <div className="section-header">
            <span>{members.length} {members.length === 1 ? 'участник' : members.length < 5 ? 'участника' : 'участников'}</span>
          </div>
          <MemberList
            treeId={treeId}
            members={members}
            currentUserId={currentUserId}
            onRefresh={load}
          />
        </div>
      )}

      {showInvite && (
        <InviteMemberModal
          treeId={treeId}
          onClose={() => { setShowInvite(false); load(); }}
        />
      )}
    </Layout>
  );
}
