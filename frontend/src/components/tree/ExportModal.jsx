import { useState } from 'react';
import { Printer, Image, Code2, FileText, Braces } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { exportPDF, exportPNG, exportSVG } from '../../utils/exportTree.js';
import { exportGedcom, exportJson } from '../../api/gedcom.js';

export default function ExportModal({ svgEl, graph, treeName, treeId, onClose }) {
  const [busy, setBusy] = useState(null);

  const FORMATS = [
    {
      id: 'pdf',
      Icon: Printer,
      title: 'PDF — для печати',
      desc: 'Открывает диалог печати с деревом и списком людей.',
      action: () => exportPDF(svgEl, graph, treeName),
    },
    {
      id: 'png',
      Icon: Image,
      title: 'PNG — изображение 2×',
      desc: 'Растровое изображение высокого разрешения.',
      action: () => exportPNG(svgEl, graph, treeName),
    },
    {
      id: 'svg',
      Icon: Code2,
      title: 'SVG — векторная графика',
      desc: 'Масштабируется без потери качества. Открывается в Figma, Illustrator.',
      action: () => exportSVG(svgEl, graph, treeName),
    },
    {
      id: 'ged',
      Icon: FileText,
      title: 'GEDCOM (.ged) — стандарт генеалогии',
      desc: 'Универсальный формат. Совместим с Ancestry, MyHeritage, FamilySearch.',
      action: () => exportGedcom(treeId, treeName),
    },
    {
      id: 'json',
      Icon: Braces,
      title: 'JSON — полный дамп данных',
      desc: 'Все люди, связи и медиа в машиночитаемом формате. Для резервных копий.',
      action: () => exportJson(treeId, treeName),
    },
  ];

  async function handle(fmt) {
    if (busy) return;
    setBusy(fmt.id);
    try {
      await fmt.action();
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal title="Экспорт дерева" onClose={onClose}>
      <div className="export-options">
        {FORMATS.map(fmt => {
          const isLoading = busy === fmt.id;
          return (
            <button
              key={fmt.id}
              className="export-option"
              onClick={() => handle(fmt)}
              disabled={!!busy}
            >
              <div className="export-option-icon">
                {isLoading ? <Spinner size={28} /> : <fmt.Icon size={28} />}
              </div>
              <div className="export-option-body">
                <div className="export-option-title">{fmt.title}</div>
                <div className="export-option-desc">{fmt.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
