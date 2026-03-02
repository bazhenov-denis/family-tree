import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, ArrowLeft, RefreshCw, UserPlus, MoreHorizontal,
  GitFork, BarChart2, Download, Upload, ScrollText,
  Network, PieChart, CalendarDays,
} from 'lucide-react';
import Layout from '../components/Layout.jsx';
import TreeGraph from '../components/tree/TreeGraph.jsx';
import FanChart from '../components/tree/FanChart.jsx';
import TimelineView from '../components/tree/TimelineView.jsx';
import TreeSearch from '../components/tree/TreeSearch.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import PersonFormModal from '../components/person/PersonFormModal.jsx';
import PersonPanel from '../components/person/PersonPanel.jsx';
import ExportModal from '../components/tree/ExportModal.jsx';
import RelPathModal from '../components/tree/RelPathModal.jsx';
import BirthdaysWidget from '../components/tree/BirthdaysWidget.jsx';
import GedcomImportModal from '../components/tree/GedcomImportModal.jsx';
import StatsModal from '../components/tree/StatsModal.jsx';
import AuditLogModal from '../components/tree/AuditLogModal.jsx';
import { getTree } from '../api/trees.js';
import { getTreeGraph } from '../api/graph.js';

// ── Overflow "more" menu ────────────────────────────────────────
function MoreMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visible = items.filter(it => it.show !== false);
  if (!visible.length) return null;

  return (
    <div className="more-menu" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)} title="Ещё">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="more-menu-dropdown">
          {visible.map((item, i) =>
            item.sep ? (
              <div key={i} className="more-menu-sep" />
            ) : item.href ? (
              <Link key={i} to={item.href} className="more-menu-item" onClick={() => setOpen(false)}>
                {item.icon}
                {item.label}
              </Link>
            ) : (
              <button key={i} className="more-menu-item" onClick={() => { item.onClick(); setOpen(false); }}>
                {item.icon}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────
export default function TreeDetailPage() {
  const { treeId } = useParams();
  const [tree, setTree]           = useState(null);
  const [graph, setGraph]         = useState(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [error, setError]         = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [addingPerson, setAddingPerson] = useState(false);
  const [quickAdd, setQuickAdd]   = useState(null);

  const svgRef = useRef(null);
  const [exporting, setExporting]   = useState(false);
  const [relPath, setRelPath]       = useState(false);
  const [importing, setImporting]   = useState(false);
  const [showStats, setShowStats]   = useState(false);
  const [showAudit, setShowAudit]   = useState(false);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [viewMode, setViewMode] = useState('graph');

  const canEdit = tree?.role === 'OWNER' || tree?.role === 'EDITOR';
  const isOwner = tree?.role === 'OWNER';
  const hasNodes = graph && graph.nodes.length > 0;

  async function loadTree() {
    try {
      const data = await getTree(treeId);
      setTree(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setTreeLoading(false);
    }
  }

  async function loadGraph() {
    setGraphLoading(true);
    try {
      const data = await getTreeGraph(treeId);
      setGraph(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGraphLoading(false);
    }
  }

  useEffect(() => {
    loadTree();
    loadGraph();
  }, [treeId]);

  const moreItems = [
    {
      show: graph && graph.nodes.length > 1,
      label: 'Путь родства',
      icon: <GitFork size={15} />,
      onClick: () => setRelPath(true),
    },
    {
      show: hasNodes,
      label: 'Статистика',
      icon: <BarChart2 size={15} />,
      onClick: () => setShowStats(true),
    },
    {
      show: isOwner,
      label: 'Журнал изменений',
      icon: <ScrollText size={15} />,
      onClick: () => setShowAudit(true),
    },
    { sep: true, show: hasNodes || canEdit },
    {
      show: hasNodes,
      label: 'Экспорт',
      icon: <Download size={15} />,
      onClick: () => setExporting(true),
    },
    {
      show: canEdit,
      label: 'Импорт GEDCOM',
      icon: <Upload size={15} />,
      onClick: () => setImporting(true),
    },
    { sep: true, show: true },
    {
      show: true,
      label: 'Люди',
      icon: <Users size={15} />,
      href: `/trees/${treeId}/persons`,
    },
    {
      show: isOwner,
      label: 'Участники',
      icon: <Users size={15} />,
      href: `/trees/${treeId}/members`,
    },
  ];

  return (
    <Layout fill>
      <div className="tree-detail-shell">

        {/* ── Top bar ── */}
        <div className="tree-detail-topbar">
          <div className="tree-detail-topbar-left">
            <Link to="/trees" className="back-link">
              <ArrowLeft size={16} /> Деревья
            </Link>
            {treeLoading ? (
              <Spinner size={18} />
            ) : (
              <div style={{ minWidth: 0 }}>
                <h1 className="page-title" style={{ fontSize: 18 }}>{tree?.title}</h1>
                {tree?.description && (
                  <p className="page-subtitle" style={{ marginTop: 1 }}>{tree.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="tree-detail-topbar-right">
            {hasNodes && (
              <TreeSearch
                nodes={graph.nodes}
                onSelect={node => {
                  setFlyToTarget({ nodeId: node.id, ts: Date.now() });
                  setSelectedNode(node);
                }}
              />
            )}
            {hasNodes && (
              <div className="view-toggle">
                <button
                  className={`icon-btn${viewMode === 'graph' ? ' active' : ''}`}
                  onClick={() => setViewMode('graph')}
                  title="Дерево"
                >
                  <Network size={15} />
                </button>
                <button
                  className={`icon-btn${viewMode === 'fan' ? ' active' : ''}`}
                  onClick={() => setViewMode('fan')}
                  title="Радиальный вид"
                >
                  <PieChart size={15} />
                </button>
                <button
                  className={`icon-btn${viewMode === 'timeline' ? ' active' : ''}`}
                  onClick={() => setViewMode('timeline')}
                  title="Хронология"
                >
                  <CalendarDays size={15} />
                </button>
              </div>
            )}
            <button className="icon-btn" onClick={loadGraph} title="Обновить граф">
              <RefreshCw size={15} />
            </button>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => setAddingPerson(true)}>
                <UserPlus size={15} /> Добавить
              </button>
            )}
            <MoreMenu items={moreItems} />
          </div>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 10 }}>{error}</div>}

        {/* ── Graph — fills remaining height ── */}
        <div className="graph-wrapper" style={{ position: 'relative' }}>
          {viewMode === 'graph' ? (
            <TreeGraph
              graph={graph}
              loading={graphLoading}
              onNodeClick={setSelectedNode}
              canEdit={canEdit}
              selectedNodeId={selectedNode?.id}
              onQuickAdd={canEdit ? node => setQuickAdd(node) : undefined}
              onAddFirst={canEdit ? () => setAddingPerson(true) : undefined}
              svgRef={svgRef}
              flyToTarget={flyToTarget}
            />
          ) : viewMode === 'fan' ? (
            <FanChart
              graph={graph}
              loading={graphLoading}
              onNodeClick={setSelectedNode}
            />
          ) : (
            <TimelineView
              treeId={treeId}
              graph={graph}
              onPersonClick={node => { setSelectedNode(node); setViewMode('graph'); }}
            />
          )}
          {treeId && <BirthdaysWidget treeId={treeId} />}
        </div>
      </div>

      {/* ── Modals ── */}
      {addingPerson && (
        <PersonFormModal
          treeId={treeId}
          person={null}
          onSave={() => { setAddingPerson(false); loadGraph(); }}
          onClose={() => setAddingPerson(false)}
        />
      )}
      {quickAdd && (
        <PersonFormModal
          treeId={treeId}
          person={null}
          fromNode={quickAdd}
          onSave={() => { setQuickAdd(null); loadGraph(); }}
          onClose={() => setQuickAdd(null)}
        />
      )}
      {selectedNode && (
        <PersonPanel
          treeId={treeId}
          node={selectedNode}
          graph={graph}
          canEdit={canEdit}
          onClose={() => setSelectedNode(null)}
          onRefresh={() => { loadGraph(); setSelectedNode(null); }}
        />
      )}
      {relPath   && <RelPathModal graph={graph} onClose={() => setRelPath(false)} />}
      {showStats && <StatsModal graph={graph} onClose={() => setShowStats(false)} />}
      {showAudit && <AuditLogModal treeId={treeId} onClose={() => setShowAudit(false)} />}
      {exporting && (
        <ExportModal
          svgEl={svgRef.current}
          graph={graph}
          treeName={tree?.title}
          treeId={treeId}
          onClose={() => setExporting(false)}
        />
      )}
      {importing && (
        <GedcomImportModal
          treeId={treeId}
          onImported={loadGraph}
          onClose={() => setImporting(false)}
        />
      )}
    </Layout>
  );
}
