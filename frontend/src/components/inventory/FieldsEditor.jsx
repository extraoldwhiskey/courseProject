import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuid } from 'uuid';

const FIELD_TYPES = ['string', 'text', 'number', 'link', 'boolean'];
const MAX_PER_TYPE = 3;

const SelectionToolbar = ({ selected, onDelete, onClear, t }) => {
  if (selected.size === 0) return null;
  return (
    <div className="d-flex align-items-center gap-2 p-2 mb-2 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
      <span className="badge bg-primary">{selected.size}</span>
      <span className="small fw-semibold text-primary">{t('common.selected')}</span>
      <div className="ms-auto d-flex gap-2">
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

const SortableField = ({ field, isSelected, onToggle, onUpdate }) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card border mb-2 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
      onClick={() => onToggle(field._id)}
      style={{ ...style, cursor: 'pointer' }}
    >
      <div className="card-body py-2 px-3">
        <div className="row g-2 align-items-center">
          <div className="col-auto" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" className="form-check-input" checked={isSelected} onChange={() => onToggle(field._id)} />
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
            <input
              className="form-control form-control-sm"
              placeholder={t('fields.fieldName')}
              value={field.name}
              onChange={(e) => onUpdate(field._id, { name: e.target.value })}
            />
          </div>
          <div className="col-md-4" onClick={(e) => e.stopPropagation()}>
            <input
              className="form-control form-control-sm"
              placeholder={t('fields.fieldDesc')}
              value={field.description || ''}
              onChange={(e) => onUpdate(field._id, { description: e.target.value })}
            />
          </div>
          <div className="col-auto" onClick={(e) => e.stopPropagation()}>
            <div className="form-check mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id={`sit-${field._id}`}
                checked={field.showInTable !== false}
                onChange={(e) => onUpdate(field._id, { showInTable: e.target.checked })}
              />
              <label className="form-check-label small" htmlFor={`sit-${field._id}`}>
                {t('fields.showInTable')}
              </label>
            </div>
          </div>
        </div>
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

  const updateField = useCallback((id, patch) => {
    onChange(fields.map((f) => (f._id === id ? { ...f, ...patch } : f)));
  }, [fields, onChange]);

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

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldI = fields.findIndex((f) => f._id === active.id);
    const newI = fields.findIndex((f) => f._id === over.id);
    onChange(arrayMove(fields, oldI, newI));
  };

  return (
    <div>
      <SelectionToolbar
        selected={selected}
        onDelete={deleteSelected}
        onClear={() => setSelected(new Set())}
        t={t}
      />

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f._id)} strategy={verticalListSortingStrategy}>
          {fields.map((f) => (
            <SortableField
              key={f._id}
              field={f}
              isSelected={selected.has(f._id)}
              onToggle={toggleOne}
              onUpdate={updateField}
            />
          ))}
        </SortableContext>
      </DndContext>

      {fields.length === 0 && (
        <p className="text-muted text-center py-3">{t('fields.dragToReorder')}</p>
      )}

      <div className="d-flex flex-wrap gap-2 mt-3">
        {FIELD_TYPES.map((ft) => (
          <button
            key={ft}
            className="btn btn-sm btn-outline-primary"
            onClick={() => addField(ft)}
            disabled={countPerType(ft) >= MAX_PER_TYPE}
          >
            <i className="bi bi-plus me-1" />{t(`fields.${ft}`)}
            <span className="ms-1 text-muted">({countPerType(ft)}/3)</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FieldsEditor;