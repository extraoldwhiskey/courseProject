import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuid } from 'uuid';

const FIELD_TYPES = ['string', 'text', 'number', 'link', 'boolean'];
const MAX_PER_TYPE = 3;

const SelectionToolbar = ({ selected, fields, onDelete, onClear, onToggleShowInTable, t }) => {
  if (selected.size === 0) return null;
  const allShown = fields.filter((f) => selected.has(f._id)).every((f) => f.showInTable !== false);
  return (
    <div className="d-flex align-items-center gap-2 p-2 mb-2 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
      <span className="badge bg-primary">{selected.size}</span>
      <span className="small fw-semibold text-primary">{t('common.selected')}</span>
      <div className="ms-auto d-flex gap-2">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => onToggleShowInTable(!allShown)}>
          <i className={`bi bi-${allShown ? 'eye-slash' : 'eye'} me-1`} />
          {allShown ? t('fields.hideFromTable') : t('fields.showInTable')}
        </button>
        <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
          <i className="bi bi-trash me-1" />{t('common.delete')}
        </button>
        <button className="btn btn-sm btn-outline-secondary" onClick={onClear}>
          <i className="bi bi-x" />
        </button>
      </div>
    </div>
  );
};

const FieldsEditor = ({ fields, onChange }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(new Set());

  const countPerType = (type) => fields.filter((f) => f.fieldType === type).length;

  const addField = (fieldType) => {
    const idx = countPerType(fieldType);
    if (idx >= MAX_PER_TYPE) return;
    onChange([...fields, { _id: uuid(), name: '', fieldType, fieldIndex: idx, showInTable: true }]);
  };

  const updateField = useCallback((id, patch) =>
    onChange(fields.map((f) => (f._id === id ? { ...f, ...patch } : f))),
  [fields, onChange]);

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const deleteSelected = () => {
    onChange(fields.filter((f) => !selected.has(f._id)));
    setSelected(new Set());
  };

  const toggleShowInTable = (val) => {
    onChange(fields.map((f) => selected.has(f._id) ? { ...f, showInTable: val } : f));
    setSelected(new Set());
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldI = fields.findIndex((f) => f._id === active.id);
    const newI = fields.findIndex((f) => f._id === over.id);
    onChange(arrayMove(fields, oldI, newI));
  };

  const SortableField = ({ field, isSelected }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field._id });
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition, cursor: 'pointer' }}
        className={`card border mb-2 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
        onClick={() => toggleOne(field._id)}
      >
        <div className="card-body py-2 px-3">
          <div className="row g-2 align-items-center">
            <div className="col-auto" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" className="form-check-input" checked={isSelected} onChange={() => toggleOne(field._id)} />
            </div>
            <div className="col-auto" onClick={(e) => e.stopPropagation()}>
              <span className="text-muted" style={{ cursor: 'grab' }} {...attributes} {...listeners}>
                <i className="bi bi-grip-vertical fs-5" />
              </span>
            </div>
            <div className="col-auto">
              <span className="badge bg-secondary">{t(`fields.${field.fieldType}`)}</span>
            </div>
            <div className="col" onClick={(e) => e.stopPropagation()}>
              <input className="form-control form-control-sm" placeholder={t('fields.fieldName')}
                value={field.name} onChange={(e) => updateField(field._id, { name: e.target.value })} />
            </div>
            <div className="col-md-4" onClick={(e) => e.stopPropagation()}>
              <input className="form-control form-control-sm" placeholder={t('fields.fieldDesc')}
                value={field.description || ''} onChange={(e) => updateField(field._id, { description: e.target.value })} />
            </div>
            <div className="col-auto">
              {field.showInTable !== false
                ? <span className="badge bg-success"><i className="bi bi-eye me-1" />{t('fields.showInTable')}</span>
                : <span className="badge bg-secondary"><i className="bi bi-eye-slash me-1" />{t('fields.hidden')}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <SelectionToolbar selected={selected} fields={fields}
        onDelete={deleteSelected} onClear={() => setSelected(new Set())}
        onToggleShowInTable={toggleShowInTable} t={t} />

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f._id)} strategy={verticalListSortingStrategy}>
          {fields.map((f) => <SortableField key={f._id} field={f} isSelected={selected.has(f._id)} />)}
        </SortableContext>
      </DndContext>

      {fields.length === 0 && <p className="text-muted text-center py-3">{t('fields.noFields')}</p>}

      <div className="d-flex flex-wrap gap-2 mt-3">
        {FIELD_TYPES.map((ft) => (
          <button key={ft} className="btn btn-sm btn-outline-primary"
            onClick={() => addField(ft)} disabled={countPerType(ft) >= MAX_PER_TYPE}>
            <i className="bi bi-plus me-1" />{t(`fields.${ft}`)}
            <span className="ms-1 text-muted">({countPerType(ft)}/3)</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FieldsEditor;