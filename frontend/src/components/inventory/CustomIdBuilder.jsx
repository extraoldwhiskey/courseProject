import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuid } from 'uuid';

const ELEMENT_TYPES = [
  { type: 'fixed', label: 'Fixed text', icon: 'bi-fonts', hasValue: true },
  { type: 'random6', label: '6-digit random', icon: 'bi-dice-3', hasLeadingZeros: true },
  { type: 'random9', label: '9-digit random', icon: 'bi-dice-5', hasLeadingZeros: true },
  { type: 'random20', label: '20-bit random', icon: 'bi-shuffle' },
  { type: 'random32', label: '32-bit random', icon: 'bi-cpu' },
  { type: 'guid', label: 'GUID', icon: 'bi-key' },
  { type: 'datetime', label: 'Date/Time', icon: 'bi-calendar' },
  { type: 'sequence', label: 'Sequence', icon: 'bi-sort-numeric-up', hasLeadingZeros: true, hasWidth: true },
];

const previewElement = (el) => {
  const pad = (n, w) => String(n).padStart(w, '0');
  switch (el.type) {
    case 'fixed': return el.value || '';
    case 'random6': return el.leadingZeros ? '042857' : '42857';
    case 'random9': return el.leadingZeros ? '004285712' : '4285712';
    case 'random20': return '524287';
    case 'random32': return '3141592653';
    case 'guid': return '550e8400-e29b';
    case 'datetime': return new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    case 'sequence': return el.leadingZeros ? pad(1, el.width || 4) : '1';
    default: return '';
  }
};

const SortableElement = ({ el, onUpdate, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: el._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const meta = ELEMENT_TYPES.find((t) => t.type === el.type);

  return (
    <div ref={setNodeRef} style={style} className="card border shadow-sm me-2 mb-2" style={{ minWidth: 130, maxWidth: 180 }}>
      <div className="card-header py-1 px-2 d-flex align-items-center justify-content-between">
        <span className="cursor-move text-muted" {...attributes} {...listeners}>
          <i className="bi bi-grip-horizontal" />
        </span>
        <small className="fw-semibold text-truncate mx-1">{meta?.label}</small>
        <button className="btn btn-sm p-0 text-danger" onClick={() => onRemove(el._id)} title="Remove">
          <i className="bi bi-x" />
        </button>
      </div>
      <div className="card-body py-2 px-2">
        {meta?.hasValue && (
          <input className="form-control form-control-sm mb-1" placeholder="Text value"
            value={el.value || ''} onChange={(e) => onUpdate(el._id, { value: e.target.value })} />
        )}
        {meta?.hasLeadingZeros && (
          <div className="form-check form-check-sm">
            <input className="form-check-input" type="checkbox" id={`lz-${el._id}`}
              checked={!!el.leadingZeros} onChange={(e) => onUpdate(el._id, { leadingZeros: e.target.checked })} />
            <label className="form-check-label small" htmlFor={`lz-${el._id}`}>Leading zeros</label>
          </div>
        )}
        {meta?.hasWidth && (
          <input className="form-control form-control-sm mt-1" type="number" placeholder="Width" min={1} max={10}
            value={el.width || 4} onChange={(e) => onUpdate(el._id, { width: parseInt(e.target.value) })} />
        )}
      </div>
    </div>
  );
};

const CustomIdBuilder = ({ elements, onChange }) => {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(null);

  const addElement = (type) => {
    if (elements.length >= 10) return;
    onChange([...elements, { _id: uuid(), type }]);
  };

  const updateElement = useCallback((id, patch) => {
    onChange(elements.map((el) => (el._id === id ? { ...el, ...patch } : el)));
  }, [elements, onChange]);

  const removeElement = useCallback((id) => {
    onChange(elements.filter((el) => el._id !== id));
  }, [elements, onChange]);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldI = elements.findIndex((e) => e._id === active.id);
    const newI = elements.findIndex((e) => e._id === over.id);
    onChange(arrayMove(elements, oldI, newI));
  };

  const preview = elements.map(previewElement).join('') || '(no elements)';

  return (
    <div>
      <div className="alert alert-info py-2 px-3 mb-3">
        <small><i className="bi bi-info-circle me-1" />{t('customId.help')}</small>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">{t('customId.preview')}</label>
        <div className="form-control font-monospace text-break">{preview}</div>
      </div>

      <label className="form-label fw-semibold">{t('customId.elements')}</label>
      <DndContext collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={handleDragEnd}>
        <SortableContext items={elements.map((e) => e._id)} strategy={horizontalListSortingStrategy}>
          <div className="d-flex flex-wrap p-2 border rounded mb-3" style={{ minHeight: 80 }}>
            {elements.map((el) => (
              <SortableElement key={el._id} el={el} onUpdate={updateElement} onRemove={removeElement} />
            ))}
            {elements.length === 0 && (
              <span className="text-muted small align-self-center ms-2">{t('customId.addElement')}...</span>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <div className="d-flex flex-wrap gap-2">
        {ELEMENT_TYPES.map((et) => (
          <button key={et.type} className="btn btn-sm btn-outline-secondary"
            onClick={() => addElement(et.type)} disabled={elements.length >= 10}
            title={et.label}>
            <i className={`bi ${et.icon} me-1`} />{et.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomIdBuilder;
