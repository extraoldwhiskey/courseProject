import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TagInput from '../components/common/TagInput';
import SalesforceModal from '../components/common/SalesforceModal';

const CreateInventoryModal = ({ onCreated, categories }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', isPublic: false, tags: [] });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/inventories', form);
      onCreated(data);
    } finally { setSaving(false); }
  };

  return (
    <div className="modal fade" id="createInventoryModal" tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">{t('inventory.create')}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label fw-semibold">{t('inventory.title')} *</label>
              <input className="form-control" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">{t('inventory.description')}</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">{t('inventory.category')}</label>
              <select className="form-select" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">{t('inventory.tags')}</label>
              <TagInput tags={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="ci-pub"
                checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} />
              <label className="form-check-label" htmlFor="ci-pub">{t('inventory.isPublic')}</label>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" data-bs-dismiss="modal">{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving || !form.title.trim()}>
              {saving ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-plus-circle me-1" />}
              {t('inventory.create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryTable = ({ inventories, onDeleted, showDeleteButton }) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sorted = [...inventories].sort((a, b) => {
    const va = a[sortField] || '';
    const vb = b[sortField] || '';
    return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const sortIcon = (field) => sortField === field
    ? <i className={`bi bi-sort-${sortDir === 'asc' ? 'up' : 'down'} ms-1`} />
    : <i className="bi bi-arrow-down-up ms-1 text-muted opacity-50" />;

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table">
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('title')}>
              {t('inventory.title')}{sortIcon('title')}
            </th>
            <th className="d-none d-md-table-cell">{t('inventory.category')}</th>
            <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('createdAt')} className="d-none d-lg-table-cell">
              Created{sortIcon('createdAt')}
            </th>
            <th className="text-end">{t('common.items')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={4} className="text-center text-muted py-4">{t('common.noData')}</td></tr>
          )}
          {sorted.map((inv) => (
            <tr key={inv.id}>
              <td>
                <Link to={`/inventory/${inv.id}`} className="fw-semibold text-decoration-none">{inv.title}</Link>
              </td>
              <td className="d-none d-md-table-cell">
                {inv.category ? <span className="badge bg-secondary">{inv.category.name}</span> : '—'}
              </td>
              <td className="d-none d-lg-table-cell text-muted small">
                {new Date(inv.createdAt).toLocaleDateString()}
              </td>
              <td className="text-end">
                <span className="badge bg-primary">{inv._count?.items || 0}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PersonalPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sfModal, setSfModal] = useState(false);
  const [sfConfigured, setSfConfigured] = useState(false);
  
  useEffect(() => {
    api.get('/salesforce/status').then(({ data }) => setSfConfigured(data.configured)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/users/me/inventories'),
      api.get('/users/me/write-access'),
      api.get('/categories').catch(() => ({ data: [] })),
    ]).then(([o, s, c]) => {
      setOwned(o.data);
      setShared(s.data);
      setCategories(c.data);
    }).finally(() => setLoading(false));
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (loading) return <div className="container py-5 text-center"><div className="spinner-border" /></div>;

    return (
    <div className="container py-4">
      {sfModal && <SalesforceModal user={user} onClose={() => setSfModal(false)} />}

      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        {user.avatar && <img src={user.avatar} className="rounded-circle" width={56} height={56} alt="" />}
        <div className="flex-grow-1">
          <h4 className="fw-bold mb-0">{user.name}</h4>
          <p className="text-muted small mb-0">{user.email}</p>
        </div>
        {sfConfigured && (
          <button
            className="btn btn-sm fw-semibold text-white d-flex align-items-center gap-2"
            style={{ background: '#00A1E0', border: 'none' }}
            onClick={() => setSfModal(true)}
            title={t('salesforce.infoText')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2 0V4.07c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93z"/>
            </svg>
            {t('salesforce.connected')}
          </button>
        )}
      </div>
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-transparent d-flex align-items-center justify-content-between">
          <span className="fw-bold"><i className="bi bi-collection me-2 text-primary" />{t('personal.myInventories')} ({owned.length})</span>
          <button className="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#createInventoryModal">
            <i className="bi bi-plus-lg me-1" />{t('inventory.create')}
          </button>
        </div>
        <div className="card-body p-0">
          <InventoryTable inventories={owned} showDeleteButton />
        </div>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent fw-bold">
          <i className="bi bi-people me-2 text-success" />{t('personal.sharedInventories')} ({shared.length})
        </div>
        <div className="card-body p-0">
          <InventoryTable inventories={shared} />
        </div>
      </div>

      <CreateInventoryModal categories={categories} onCreated={(inv) => {
        setOwned((o) => [inv, ...o]);
        document.querySelector('#createInventoryModal .btn-close')?.click();
      }} />
    </div>
  );
};

export default PersonalPage;
