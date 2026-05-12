import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import VersionsPanel from '../components/version/VersionsPanel.jsx';
import MergeWizard from '../components/version/MergeWizard.jsx';
import { getTree } from '../api/trees.js';
import { getTreeGraph } from '../api/graph.js';
import { getWorkingCopyContext, listVersions } from '../api/versions.js';
import { GitBranch, ArrowRight, GitMerge, ChevronDown, ExternalLink } from 'lucide-react';

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
    document.addEventListener('touchend', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchend', handler);
    };
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

function VersionSwitcher({ treeId, wcContext, onOpenVersions }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();
  const activeCopies = versions.filter(v => v.type === 'WORKING_COPY' && v.state === 'ACTIVE');

  useEffect(() => {
    if (!open || wcContext) return;
    listVersions(treeId).then(data => setVersions(data || [])).catch(() => setVersions([]));
  }, [open, treeId, wcContext]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchend', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchend', handler);
    };
  }, [open]);

  return (
    <div className="version-switcher" ref={ref}>
      <button
        className={`version-switcher-btn${wcContext ? ' version-switcher-btn--copy' : ''}`}
        onClick={() => setOpen(v => !v)}
        title="Текущая версия дерева"
      >
        <GitBranch size={14} />
        <span>{wcContext ? wcContext.versionName : 'main'}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="version-switcher-menu">
          <div className="version-switcher-current">
            <div className="version-switcher-label">Сейчас открыто</div>
            <div className="version-switcher-name">{wcContext ? wcContext.versionName : 'main'}</div>
          </div>
          {wcContext ? (
            <button
              className="version-switcher-item"
              onClick={() => { setOpen(false); navigate(`/trees/${wcContext.mainTreeId}`); }}
            >
              <GitBranch size={14} />
              Перейти в main
            </button>
          ) : (
            <>
              {activeCopies.length > 0 ? activeCopies.map(copy => (
                <button
                  key={copy.id}
                  className="version-switcher-item"
                  onClick={() => { setOpen(false); navigate(`/trees/${copy.clonedTreeId}`); }}
                >
                  <ExternalLink size={14} />
                  {copy.name}
                </button>
              )) : (
                <div className="version-switcher-empty">Активных рабочих копий нет</div>
              )}
            </>
          )}
          <div className="more-menu-sep" />
          <button
            className="version-switcher-item"
            onClick={() => { setOpen(false); onOpenVersions(); }}
          >
            <GitMerge size={14} />
            Управление версиями
          </button>
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
  const searchRef = useRef(null);
  const [exporting, setExporting]   = useState(false);
  const [relPath, setRelPath]       = useState(false);
  const [importing, setImporting]   = useState(false);
  const [showStats, setShowStats]   = useState(false);
  const [showAudit, setShowAudit]   = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [viewMode, setViewMode] = useState('graph');
  const [wcContext, setWcContext] = useState(null);
  const [wcMergeVersion, setWcMergeVersion] = useState(null);
  const navigate = useNavigate();

  const canEdit = tree?.role === 'OWNER' || tree?.role === 'EDITOR';
  const isOwner = tree?.role === 'OWNER';
  const hasNodes = graph && graph.nodes.length > 0;

  // ── Keyboard shortcuts ────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    // Ctrl/Cmd+K → focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchRef.current?.focus?.();
    }
    // Ctrl/Cmd+N → add person
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && canEdit) {
      e.preventDefault();
      setAddingPerson(true);
    }
    // R → refresh graph (when not in input)
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      loadGraph();
    }
    // Escape → close modals/panels
    if (e.key === 'Escape') {
      if (selectedNode) setSelectedNode(null);
      else if (addingPerson) setAddingPerson(false);
      else if (quickAdd) setQuickAdd(null);
    }
  }, [canEdit, selectedNode, addingPerson, quickAdd, loadGraph]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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

  function loadWorkingCopyContext() {
    return getWorkingCopyContext(treeId)
      .then(ctx => {
        if (ctx && ctx.versionState && ctx.versionState !== 'ACTIVE') {
          navigate(`/trees/${ctx.mainTreeId}`, { replace: true });
          return ctx;
        }
        setWcContext(ctx || null);
        return ctx || null;
      })
      .catch(() => {
        setWcContext(null);
        return null;
      });
  }

  useEffect(() => {
    let cancelled = false;
    setError('');
    setTreeLoading(true);
    setGraphLoading(true);
    loadWorkingCopyContext().then(ctx => {
      if (cancelled || (ctx && ctx.versionState && ctx.versionState !== 'ACTIVE')) return;
      loadTree();
      loadGraph();
    });
    return () => { cancelled = true; };
  }, [treeId]);

  async function refreshAfterVersionAction() {
    if (!wcContext) {
      loadGraph();
      return;
    }
    const ctx = await loadWorkingCopyContext();
    if (!ctx || ctx.versionState !== 'ACTIVE') {
      navigate(`/trees/${wcContext.mainTreeId}`, { replace: true });
      return;
    }
    loadGraph();
  }

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
    { sep: true, show: true },
    {
      show: true,
      label: 'Версии',
      icon: <GitFork size={15} />,
      onClick: () => setShowVersions(true),
    },
  ];

  return (
    <Layout fill>
      <div className="tree-detail-shell">

        {/* ── Top bar ── */}
        <div className="tree-detail-topbar">
          <div className="tree-detail-topbar-left">
            <Link to="/trees" className="back-link" aria-label="Назад к списку деревьев">
              <ArrowLeft size={16} />
            </Link>
            {treeLoading ? (
              <Spinner size={18} />
            ) : (
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h1 className="page-title" style={{ fontSize: 18, marginBottom: 0 }}>{tree?.title}</h1>
                  <span className={`role-badge role-${tree?.role?.toLowerCase()}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                    {tree?.role === 'OWNER' ? 'Владелец' : tree?.role === 'EDITOR' ? 'Редактор' : tree?.role === 'VIEWER' ? 'Читатель' : 'Комментатор'}
                  </span>
                </div>
                {tree?.description && (
                  <p className="page-subtitle" style={{ marginTop: 2, fontSize: 12 }}>{tree.description}</p>
                )}
              </div>
            )}
          </div>

          <div className="tree-detail-topbar-right">
            {hasNodes && (
              <TreeSearch
                ref={searchRef}
                nodes={graph.nodes}
                onSelect={node => {
                  setFlyToTarget({ nodeId: node.id, ts: Date.now() });
                  setSelectedNode(node);
                }}
              />
            )}
            <VersionSwitcher
              treeId={wcContext?.mainTreeId || treeId}
              wcContext={wcContext}
              onOpenVersions={() => setShowVersions(true)}
            />
            <button
              className="icon-btn"
              onClick={() => setShowVersions(true)}
              title="Управление версиями"
              aria-label="Управление версиями"
            >
              <GitFork size={15} />
            </button>
            {hasNodes && (
              <div className="view-toggle view-toggle--segmented">
                <button
                  className={`view-toggle-btn${viewMode === 'graph' ? ' active' : ''}`}
                  onClick={() => setViewMode('graph')}
                  title="Дерево"
                  aria-label="Вид дерева"
                >
                  <Network size={14} />
                  <span>Древо</span>
                </button>
                <button
                  className={`view-toggle-btn${viewMode === 'fan' ? ' active' : ''}`}
                  onClick={() => setViewMode('fan')}
                  title="Радиальный вид"
                  aria-label="Радиальный вид"
                >
                  <PieChart size={14} />
                  <span>Веер</span>
                </button>
                <button
                  className={`view-toggle-btn${viewMode === 'timeline' ? ' active' : ''}`}
                  onClick={() => setViewMode('timeline')}
                  title="Хронология"
                  aria-label="Хронология"
                >
                  <CalendarDays size={14} />
                  <span>Хронология</span>
                </button>
              </div>
            )}
            <button className="icon-btn" onClick={loadGraph} title="Обновить (R)" aria-label="Обновить граф">
              <RefreshCw size={15} />
            </button>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => setAddingPerson(true)} aria-label="Добавить человека">
                <UserPlus size={15} /> Добавить
              </button>
            )}
            <MoreMenu items={moreItems} />
          </div>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 10 }}>{error}</div>}

        {/* ── Working-copy banner ── */}
        {wcContext && (
          <div className="wc-banner">
            <div className="wc-banner-left">
              <GitBranch size={14} />
              <span>Рабочая копия&nbsp;<strong>{wcContext.versionName}</strong></span>
              <ArrowRight size={12} style={{ opacity: .5 }} />
              <span style={{ opacity: .7 }}>Основное дерево</span>
            </div>
            <div className="wc-banner-right">
              <button
                className="wc-banner-btn"
                onClick={() => navigate(`/trees/${wcContext.mainTreeId}`)}
              >
                ← Перейти к основному
              </button>
              <button
                className="wc-banner-btn wc-banner-btn--merge"
                onClick={() => setWcMergeVersion({
                  id: wcContext.versionId,
                  name: wcContext.versionName,
                  description: wcContext.versionDescription,
                  clonedTreeId: treeId,
                })}
              >
                <GitMerge size={12} /> Слить в основное
              </button>
            </div>
          </div>
        )}

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
      {showVersions && (
        <VersionsPanel
          treeId={wcContext?.mainTreeId || treeId}
          onClose={() => setShowVersions(false)}
          onRefresh={refreshAfterVersionAction}
        />
      )}
      {wcMergeVersion && (
        <MergeWizard
          treeId={wcContext.mainTreeId}
          version={wcMergeVersion}
          onClose={() => setWcMergeVersion(null)}
          onMerged={() => {
            setWcMergeVersion(null);
            setWcContext(null);
            navigate(`/trees/${wcContext.mainTreeId}`, { replace: true });
          }}
        />
      )}
    </Layout>
  );
}
