import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const fieldKey = (type, index) => `${type}${index + 1}`;

const ItemForm = ({ inventoryId, fields, existingItem, customIdConf, onSaved, onCancel }) => {
  const { t } = useTranslation();
  const isEdit = !!existingItem;
  const [values, setValues] = useState(() => {
    const init = {};
    fields.forEach((f) => { init[fieldKey(f.fieldType, f.fieldIndex)] = existingItem?.[fieldKey(f.fieldType, f.fieldIndex)] ?? (f.fieldType === 'boolean' ? false : ''); });
    return init;
  });
  const [customId, setCustomId] = useState(existingItem?.customId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);

  const setValue = (key, val) => setValues((v) => ({ ...v, [key]: val }));

  const save = async () => {
    setSaving(true);
    setError(null);
    setConflict(false);
    try {
      const payload = { ...values };
      if (isEdit && customId) payload.customId = customId;
      if (isEdit) {
        payload.version = existingItem.version;
        const { data } = await api.patch(`/items/${existingItem.id}`, payload);
        onSaved(data);
      } else {
        const { data } = await api.post('/items', { inventoryId, ...payload });
        onSaved(data);
      }
    } catch (e) {
      if (e.response?.status === 409) {
        setConflict(true);
      } else {
        setError(e.response?.data?.error || t('common.error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f) => {
    const key = fieldKey(f.fieldType, f.fieldIndex);
    const label = <label className="form-label fw-semibold">{f.name}{f.description && <i className="bi bi-info-circle ms-1 text-muted" title={f.description} />}</label>;

    switch (f.fieldType) {
      case 'string':
        return <div key={f.id} className="mb-3">{label}<input className="form-control" value={values[key] || ''} onChange={(e) => setValue(key, e.target.value)} /></div>;
      case 'text':
        return <div key={f.id} className="mb-3">{label}<textarea className="form-control" rows={3} value={values[key] || ''} onChange={(e) => setValue(key, e.target.value)} /></div>;
      case 'number':
        return <div key={f.id} className="mb-3">{label}<input className="form-control" type="number" value={values[key] ?? ''} onChange={(e) => setValue(key, e.target.value ? parseFloat(e.target.value) : null)} /></div>;
      case 'link':
        return <div key={f.id} className="mb-3">{label}<input className="form-control" type="url" placeholder="https://" value={values[key] || ''} onChange={(e) => setValue(key, e.target.value)} /></div>;
      case 'boolean':
        return <div key={f.id} className="mb-3 form-check">{label}<input className="form-check-input" type="checkbox" checked={!!values[key]} onChange={(e) => setValue(key, e.target.checked)} /></div>;
      default: return null;
    }
  };

  return (
    <div>
      {conflict && (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          <span>{t('item.conflict')}</span>
          <button className="btn btn-sm btn-warning ms-auto" onClick={() => window.location.reload()}>{t('common.reload')}</button>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      {isEdit && (
        <div className="mb-3">
          <label className="form-label fw-semibold">{t('item.customId')}</label>
          <input className="form-control font-monospace" value={customId} onChange={(e) => setCustomId(e.target.value)} />
        </div>
      )}

      {fields.map(renderField)}

      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-check-lg me-1" />}
          {t('item.save')}
        </button>
        <button className="btn btn-outline-secondary" onClick={onCancel}>{t('item.cancel')}</button>
      </div>
    </div>
  );
};

export default ItemForm;
