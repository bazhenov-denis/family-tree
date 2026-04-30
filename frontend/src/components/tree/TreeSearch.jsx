import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Search, X } from 'lucide-react';

const TreeSearch = forwardRef(function TreeSearch({ nodes, onSelect }, ref) {
  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef            = useRef(null);
  const inputRef                = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => { inputRef.current?.focus(); setOpen(true); }
  }), []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return (nodes || [])
      .filter(n => (n.fullName || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, nodes]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(-1); }, [results]);

  function handleSelect(node) {
    onSelect(node);
    setQuery('');
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const node = activeIdx >= 0 ? results[activeIdx] : results[0];
      if (node) handleSelect(node);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function clear() {
    setQuery('');
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  const showDropdown = open && results.length > 0;

  return (
    <div ref={containerRef} className="tree-search">
      <div className="tree-search-wrap">
        <Search size={14} className="tree-search-icon" />
        <input
          ref={inputRef}
          className="tree-search-input"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Найти человека… ⌘K"
          autoComplete="off"
        />
        {query && (
          <button className="tree-search-clear" onClick={clear} tabIndex={-1}>
            <X size={12} />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul className="tree-search-dropdown">
          {results.map((node, idx) => {
            const years = [
              node.birthYear ? String(node.birthYear) : null,
              node.deathYear ? `† ${node.deathYear}` : null,
            ].filter(Boolean).join(' – ');
            return (
              <li
                key={node.id}
                className={`tree-search-result${activeIdx === idx ? ' active' : ''}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseDown={e => { e.preventDefault(); handleSelect(node); }}
              >
                <span className="tree-search-name">{node.fullName}</span>
                {years && <span className="tree-search-years">{years}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

export default TreeSearch;
