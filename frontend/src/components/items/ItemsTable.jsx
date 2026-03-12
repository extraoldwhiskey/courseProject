import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import ItemForm from './ItemForm';

const ItemRow = ({ item, fields, canEdit, onDeleted, onUpdated, inventory }) => {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [hovered, setHovered] = useState(false);
  const visibleFields = fields.filter((f) => f.showInTable);

  const handleDelete = async () => {
    if (!confirm(t('common.confirm') + '?')) return;
    await api.delete(`/items/${item.id}`);
    onDeleted(item.id);
  };

  if (editMode) {
    return (
      <tr>
        <td colSpan={visibleFields.length + 3}>
          <ItemForm
            inventoryId={inventory.id}
            fields={fields}
            existingItem={item}
            customIdConf={inventory.customIdConf}
            onSaved={(updated) => { onUpdated(updated); setEditMode(false); }}
            onCancel={() => setEditMode(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      <td>
        <Link to={`/item/${item.id}`} className="font-monospace text-decoration-none fw-semibold">
          {item.customId}
        </Link>
      </td>
      {visibleFields.map((f) => {
        const key = `${f.fieldType}${f.fieldIndex + 1}`;
        const val = item[key];
        if (f.fieldType === 'boolean') return <td key={f.id}>{val ? <i className="bi bi-check-circle-fill text-success" /> : <i className="bi bi-circle text-muted" />}</td>;
        if (f.fieldType === 'link') return <td key={f.id}>{val ? <a href={val} target="_blank" rel="noreferrer" className="text-truncate d-inline-block" style={{ maxWidth: 120 }}>{val}</a> : '—'}</td>;
        return <td key={f.id} className="text-truncate" style={{ maxWidth: 160 }}>{val ?? '—'}</td>;
      })}
      <td>
        <Link to={`/user/${item.createdBy?.id}`} className="text-decoration-none small">{item.createdBy?.name}</Link>
      </td>
      <td>
        {/* Animated context actions - appear on row hover, no inline buttons per requirement */}
        <div className={`d-flex gap-1 justify-content-end transition-opacity ${hovered && canEdit ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.15s', pointerEvents: hovered && canEdit ? 'auto' : 'none' }}>
          <button className="btn btn-xs btn-outline-primary py-0 px-1" onClick={() => setEditMode(true)} title={t('common.edit')}>
            <i className="bi bi-pencil" />
          </button>
          <button className="btn btn-xs btn-outline-danger py-0 px-1" onClick={handleDelete} title={t('common.delete')}>
            <i className="bi bi-trash" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const ItemsTable = ({ items, fields, inventory, canEdit, onItemsChange }) => {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [localItems, setLocalItems] = useState(items);

  const visibleFields = fields.filter((f) => f.showInTable);

  const handleAdded = (item) => { setLocalItems((prev) => [item, ...prev]); setShowAddForm(false); };
  const handleDeleted = (id) => setLocalItems((prev) => prev.filter((i) => i.id !== id));
  const handleUpdated = (updated) => setLocalItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));

  return (
    <div>
      {canEdit && (
        <div className="mb-3">
          {showAddForm ? (
            <div className="card border-0 bg-light p-3">
              <h6 className="fw-bold mb-3"><i className="bi bi-plus-circle me-2 text-primary" />{t('item.create')}</h6>
              <ItemForm
                inventoryId={inventory.id}
                fields={fields}
                customIdConf={inventory.customIdConf}
                onSaved={handleAdded}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
              <i className="bi bi-plus-lg me-1" />{t('inventory.addItem')}
            </button>
          )}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>{t('item.customId')}</th>
              {visibleFields.map((f) => <th key={f.id}>{f.name}</th>)}
              <th>{t('item.createdBy')}</th>
              <th style={{ width: 70 }} />
            </tr>
          </thead>
          <tbody>
            {localItems.length === 0 && (
              <tr><td colSpan={visibleFields.length + 3} className="text-center text-muted py-4">{t('inventory.noItems')}</td></tr>
            )}
            {localItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                fields={fields}
                canEdit={canEdit}
                inventory={inventory}
                onDeleted={handleDeleted}
                onUpdated={handleUpdated}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsTable;
