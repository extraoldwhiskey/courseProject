import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import ItemForm from './ItemForm';

const CellValue = ({ field, item }) => {
  const key = `${field.fieldType}${field.fieldIndex + 1}`;
  const val = item[key];
  if (field.fieldType === 'boolean')
    return val
      ? <i className="bi bi-check-circle-fill text-success" />
      : <i className="bi bi-circle text-muted" />;
  if (field.fieldType === 'link')
    return val
      ? <a href={val} target="_blank" rel="noreferrer" className="text-truncate d-inline-block" style={{ maxWidth: 120 }}>{val}</a>
      : '—';
  return <span className="text-truncate d-inline-block" style={{ maxWidth: 160 }}>{val ?? '—'}</span>;
};

const SelectionToolbar = ({ selected, onDelete, onEdit, onClear, t }) => {
  if (selected.size === 0) return null;
  return (
    <div className="d-flex align-items-center gap-2 p-2 mb-2 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
      <span className="badge bg-primary">{selected.size}</span>
      <span className="small fw-semibold text-primary">{t('common.selected')}</span>
      <div className="ms-auto d-flex gap-2">
        {selected.size === 1 && (
          <button className="btn btn-sm btn-outline-primary" onClick={onEdit}>
            <i className="bi bi-pencil me-1" />{t('common.edit')}
          </button>
        )}
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

const ItemsTable = ({ items, fields, inventory, canEdit, onItemsChange }) => {
  const { t } = useTranslation();
  const [localItems, setLocalItems] = useState(items);
  const [selected, setSelected] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { setLocalItems(items); }, [items]);

  const visibleFields = fields.filter((f) => f.showInTable);

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === localItems.length ? new Set() : new Set(localItems.map((i) => i.id))
    );

  const handleAdded = (item) => {
    setLocalItems((prev) => [item, ...prev]);
    setShowAddForm(false);
  };

  const handleUpdated = (updated) => {
    setLocalItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
    setEditItem(null);
    setSelected(new Set());
  };

  const handleDeleteSelected = async () => {
    if (!confirm(t('common.confirm') + '?')) return;
    await Promise.all([...selected].map((id) => api.delete(`/items/${id}`)));
    setLocalItems((prev) => prev.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
  };

  const handleEditSelected = () => {
    const id = [...selected][0];
    setEditItem(localItems.find((i) => i.id === id));
  };

  const allChecked = localItems.length > 0 && selected.size === localItems.length;

  return (
    <div>
      {canEdit && (
        <div className="mb-3">
          {showAddForm ? (
            <div className="card border-0 p-3">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-plus-circle me-2 text-primary" />{t('item.create')}
              </h6>
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

      {canEdit && (
        <SelectionToolbar
          selected={selected}
          onDelete={handleDeleteSelected}
          onEdit={handleEditSelected}
          onClear={() => setSelected(new Set())}
          t={t}
        />
      )}

      {editItem && (
        <div className="card border-0 p-3 mb-3">
          <h6 className="fw-bold mb-3">
            <i className="bi bi-pencil me-2 text-primary" />{t('common.edit')}
          </h6>
          <ItemForm
            inventoryId={inventory.id}
            fields={fields}
            existingItem={editItem}
            customIdConf={inventory.customIdConf}
            onSaved={handleUpdated}
            onCancel={() => { setEditItem(null); setSelected(new Set()); }}
          />
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table">
            <tr>
              {canEdit && (
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={allChecked}
                    onChange={toggleAll}
                  />
                </th>
              )}
              <th>{t('item.customId')}</th>
              {visibleFields.map((f) => <th key={f.id}>{f.name}</th>)}
              <th>{t('item.createdBy')}</th>
            </tr>
          </thead>
          <tbody>
            {localItems.length === 0 && (
              <tr>
                <td colSpan={visibleFields.length + (canEdit ? 3 : 2)} className="text-center text-muted py-4">
                  {t('inventory.noItems')}
                </td>
              </tr>
            )}
            {localItems.map((item) => (
              <tr
                key={item.id}
                className={selected.has(item.id) ? 'table-primary' : ''}
                onClick={canEdit ? () => toggleOne(item.id) : undefined}
                style={canEdit ? { cursor: 'pointer' } : {}}
              >
                {canEdit && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selected.has(item.id)}
                      onChange={() => toggleOne(item.id)}
                    />
                  </td>
                )}
                <td onClick={(e) => e.stopPropagation()}>
                  <Link to={`/item/${item.id}`} className="font-monospace text-decoration-none fw-semibold">
                    {item.customId}
                  </Link>
                </td>
                {visibleFields.map((f) => (
                  <td key={f.id}><CellValue field={f} item={item} /></td>
                ))}
                <td onClick={(e) => e.stopPropagation()}>
                  <Link to={`/user/${item.createdBy?.id}`} className="text-decoration-none small">
                    {item.createdBy?.name}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemsTable;