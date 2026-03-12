import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import useAutoSave from '../hooks/useAutoSave';
import ItemsTable from '../components/items/ItemsTable';
import Discussion from '../components/discussion/Discussion';
import FieldsEditor from '../components/inventory/FieldsEditor';
import CustomIdBuilder from '../components/inventory/CustomIdBuilder';
import TagInput from '../components/common/TagInput';
import UserAutocomplete from '../components/common/UserAutocomplete';

const SaveStatus = ({ status }) => {
  const { t } = useTranslation();
  if (status === 'saving') return <span className="badge bg-warning text-dark ms-2"><i className="bi bi-cloud-upload me-1" />{t('inventory.saving')}</span>;
  if (status === 'saved') return <span className="badge bg-success ms-2"><i className="bi bi-cloud-check me-1" />{t('inventory.saved')}</span>;
  if (status === 'conflict') return <span className="badge bg-danger ms-2"><i className="bi bi-exclamation-triangle me-1" />{t('inventory.conflict')}</span>;
  return null;
};

const InventoryPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('items');
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);

  const [form, setForm] = useState({});
  const [fields, setFields] = useState([]);
  const [customIdElements, setCustomIdElements] = useState([]);
  const [accessList, setAccessList] = useState([]);
  const [accessSort, setAccessSort] = useState('name');
  const [stats, setStats] = useState(null);

  const isOwner = user && (user.isAdmin || inv?.creatorId === user.id);
  const hasWriteAccess = user && (isOwner || inv?.isPublic || inv?.access?.some((a) => a.userId === user.id));

  useEffect(() => {
    Promise.all([
      api.get(`/inventories/${id}`),
      api.get('/categories').catch(() => ({ data: [] })),
    ]).then(([invRes, catRes]) => {
      const data = invRes.data;
      setInv(data);
      setForm({
        title: data.title || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        categoryId: data.categoryId || '',
        isPublic: data.isPublic,
        tags: data.tags?.map((t) => t.tag.name) || [],
        version: data.version,
      });
      setFields(data.fields?.map((f) => ({ ...f, _id: f.id })) || []);
      setCustomIdElements(data.customIdConf?.elements || []);
      setAccessList(data.access?.map((a) => a.user) || []);
      setCategories(catRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 'items') {
      setItemsLoading(true);
      api.get('/items', { params: { inventoryId: id } })
        .then(({ data }) => setItems(data.items))
        .finally(() => setItemsLoading(false));
    }
    if (tab === 'stats') {
      api.get(`/inventories/${id}/stats`).then(({ data }) => setStats(data));
    }
  }, [tab, id]);

  const doSave = useCallback(async () => {
    if (!isOwner) return;
    setSaveStatus('saving');
    try {
      const { data } = await api.patch(`/inventories/${id}`, {
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl || null,
        categoryId: form.categoryId || null,
        isPublic: form.isPublic,
        tags: form.tags,
        version: form.version,
      });
      setForm((f) => ({ ...f, version: data.version }));
      setInv((i) => ({ ...i, ...data }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      setSaveStatus(e.response?.status === 409 ? 'conflict' : null);
    }
  }, [id, form, isOwner]);

  const { scheduleeSave, flush } = useAutoSave(doSave);

  const updateForm = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    if (isOwner) scheduleeSave();
  };

  const saveFields = async () => {
    const cleaned = fields.map((f, i) => ({
      name: f.name, description: f.description || null,
      fieldType: f.fieldType, fieldIndex: f.fieldIndex,
      showInTable: f.showInTable !== false, order: i,
    }));
    const { data } = await api.put(`/inventories/${id}/fields`, { fields: cleaned });
    setFields(data.map((f) => ({ ...f, _id: f.id })));
  };

  const saveCustomId = async () => {
    await api.put(`/inventories/${id}/custom-id-config`, { elements: customIdElements });
  };

  const saveAccess = async () => {
    await api.put(`/inventories/${id}/access`, {
      isPublic: form.isPublic,
      userIds: accessList.map((u) => u.id),
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await api.post('/upload/image', fd);
    updateForm({ imageUrl: data.url });
  };

  const deleteInventory = async () => {
    if (!confirm(t('common.confirm') + '?')) return;
    await api.delete(`/inventories/${id}`);
    navigate('/me');
  };

  const sortedAccess = [...accessList].sort((a, b) =>
    accessSort === 'email' ? a.email.localeCompare(b.email) : a.name.localeCompare(b.name)
  );

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border" /></div>;
  if (!inv) return <div className="container py-5 text-center text-muted">Not found</div>;

  const tabs = [
    { key: 'items', label: t('inventory.items'), icon: 'bi-list-ul' },
    { key: 'discussion', label: t('inventory.discussion'), icon: 'bi-chat' },
    ...(isOwner ? [
      { key: 'settings', label: t('inventory.settings'), icon: 'bi-gear' },
      { key: 'fields', label: t('inventory.fields'), icon: 'bi-layout-text-window' },
      { key: 'access', label: t('inventory.access'), icon: 'bi-shield-lock' },
      { key: 'customId', label: t('inventory.customId'), icon: 'bi-hash' },
      { key: 'stats', label: t('inventory.stats'), icon: 'bi-bar-chart' },
    ] : []),
  ];

  return (
    <div className="container-fluid container-xl py-4">
      <div className="d-flex flex-wrap align-items-start gap-3 mb-4">
        {form.imageUrl && (
          <img src={form.imageUrl} alt="" className="rounded-3 object-fit-cover d-none d-md-block"
            style={{ width: 80, height: 80 }} />
        )}
        <div className="flex-grow-1">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h3 className="fw-bold mb-0">{inv.title}</h3>
            {inv.category && <span className="badge bg-secondary">{inv.category.name}</span>}
            {inv.isPublic && <span className="badge bg-success">{t('access.publicMode')}</span>}
            <SaveStatus status={saveStatus} />
          </div>
          <div className="d-flex gap-1 mt-1 flex-wrap">
            {inv.tags?.map((it) => (
              <span key={it.tag.id} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">{it.tag.name}</span>
            ))}
          </div>
          <p className="text-muted small mb-0 mt-1">
            {t('common.by')} <Link to={`/user/${inv.creator?.id}`} className="text-decoration-none">{inv.creator?.name}</Link>
            {' · '}{inv._count?.items} {t('common.items')}
          </p>
        </div>
        {isOwner && (
          <button className="btn btn-sm btn-outline-danger ms-auto" onClick={deleteInventory}>
            <i className="bi bi-trash me-1" />{t('inventory.delete')}
          </button>
        )}
      </div>

      <ul className="nav nav-tabs flex-nowrap overflow-auto mb-4" style={{ whiteSpace: 'nowrap' }}>
        {tabs.map((tb) => (
          <li className="nav-item" key={tb.key}>
            <button className={`nav-link ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>
              <i className={`bi ${tb.icon} me-1 d-none d-sm-inline`} />{tb.label}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'items' && (
        itemsLoading
          ? <div className="text-center py-4"><div className="spinner-border" /></div>
          : <ItemsTable items={items} fields={inv.fields || []} inventory={inv} canEdit={hasWriteAccess} onItemsChange={setItems} />
      )}

      {tab === 'discussion' && <Discussion inventoryId={id} />}

      {tab === 'settings' && isOwner && (
        <div className="row g-3">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('inventory.title')}</label>
                  <input className="form-control" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('inventory.description')} <span className="text-muted small">(Markdown)</span></label>
                  <textarea className="form-control" rows={5} value={form.description} onChange={(e) => updateForm({ description: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('inventory.category')}</label>
                  <select className="form-select" value={form.categoryId || ''} onChange={(e) => updateForm({ categoryId: e.target.value })}>
                    <option value="">—</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('inventory.tags')}</label>
                  <TagInput tags={form.tags} onChange={(tags) => updateForm({ tags })} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('inventory.image')}</label>
                  <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} />
                  {form.imageUrl && <img src={form.imageUrl} alt="" className="mt-2 rounded" style={{ maxHeight: 120 }} />}
                </div>
                <button className="btn btn-primary" onClick={flush}>
                  <i className="bi bi-cloud-upload me-1" />{t('inventory.saveChanges')}
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            {form.description && (
              <div className="card border-0 shadow-sm">
                <div className="card-header fw-semibold bg-transparent">Preview</div>
                <div className="card-body"><ReactMarkdown>{form.description}</ReactMarkdown></div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'fields' && isOwner && (
        <div>
          <FieldsEditor
            fields={fields.map((f) => ({ ...f, _id: f._id || f.id }))}
            onChange={setFields}
          />
          <button className="btn btn-primary mt-3" onClick={saveFields}>
            <i className="bi bi-check-lg me-1" />{t('common.save')}
          </button>
        </div>
      )}

      {tab === 'access' && isOwner && (
        <div>
          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="isPublic"
              checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} />
            <label className="form-check-label fw-semibold" htmlFor="isPublic">{t('access.publicMode')}</label>
          </div>

          {!form.isPublic && (
            <>
              <div className="mb-3">
                <UserAutocomplete
                  placeholder={t('access.addUser')}
                  onSelect={(u) => { if (!accessList.find((x) => x.id === u.id)) setAccessList((l) => [...l, u]); }}
                />
              </div>

              <div className="d-flex gap-2 mb-2">
                <button className={`btn btn-sm ${accessSort === 'name' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setAccessSort('name')}><i className="bi bi-sort-alpha-down me-1" />{t('access.sortByName')}</button>
                <button className={`btn btn-sm ${accessSort === 'email' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setAccessSort('email')}><i className="bi bi-sort-alpha-down me-1" />{t('access.sortByEmail')}</button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr><th>{t('admin.name')}</th><th>{t('admin.email')}</th><th /></tr></thead>
                  <tbody>
                    {sortedAccess.map((u) => (
                      <tr key={u.id}>
                        <td className="d-flex align-items-center gap-2">
                          {u.avatar && <img src={u.avatar} className="rounded-circle" width={24} height={24} alt="" />}
                          {u.name}
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setAccessList((l) => l.filter((x) => x.id !== u.id))}>
                            <i className="bi bi-x" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <button className="btn btn-primary mt-3" onClick={saveAccess}>
            <i className="bi bi-check-lg me-1" />{t('common.save')}
          </button>
        </div>
      )}

      {tab === 'customId' && isOwner && (
        <div>
          <CustomIdBuilder elements={customIdElements} onChange={setCustomIdElements} />
          <button className="btn btn-primary mt-3" onClick={saveCustomId}>
            <i className="bi bi-check-lg me-1" />{t('common.save')}
          </button>
        </div>
      )}

      {tab === 'stats' && (
        <div className="row g-3">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm text-center">
              <div className="card-body">
                <div className="display-4 fw-bold text-primary">{stats?._count || inv._count?.items || 0}</div>
                <div className="text-muted">{t('common.items')}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm text-center">
              <div className="card-body">
                <div className="display-4 fw-bold text-success">{inv.fields?.length || 0}</div>
                <div className="text-muted">{t('inventory.fields')}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
