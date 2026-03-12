import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ItemForm from '../components/items/ItemForm';

const ItemPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    api.get(`/items/${id}`).then(({ data }) => setItem(data)).finally(() => setLoading(false));
  }, [id]);

  const toggleLike = async () => {
    if (!user) return;
    if (item.userLiked) {
      const { data } = await api.delete(`/items/${id}/like`);
      setItem((i) => ({ ...i, userLiked: false, _count: { ...i._count, likes: data.count } }));
    } else {
      const { data } = await api.post(`/items/${id}/like`);
      setItem((i) => ({ ...i, userLiked: true, _count: { ...i._count, likes: data.count } }));
    }
  };

  const deleteItem = async () => {
    if (!confirm(t('common.confirm') + '?')) return;
    await api.delete(`/items/${id}`);
    navigate(`/inventory/${item.inventoryId}`);
  };

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border" /></div>;
  if (!item) return <div className="container py-5 text-center">Not found</div>;

  const inv = item.inventory;
  const fields = inv?.fields || [];
  const isOwnerOrAdmin = user && (user.isAdmin || inv?.creatorId === user.id);
  const canEdit = user && (isOwnerOrAdmin || inv?.isPublic || inv?.access?.some?.((a) => a.userId === user.id));

  const renderValue = (f) => {
    const key = `${f.fieldType}${f.fieldIndex + 1}`;
    const val = item[key];
    if (val === null || val === undefined) return <span className="text-muted">—</span>;
    if (f.fieldType === 'boolean') return val ? <span className="badge bg-success">Yes</span> : <span className="badge bg-secondary">No</span>;
    if (f.fieldType === 'link') return <a href={val} target="_blank" rel="noreferrer">{val}</a>;
    if (f.fieldType === 'text') return <pre className="mb-0 small">{val}</pre>;
    return <span>{String(val)}</span>;
  };

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">{t('nav.home')}</Link></li>
          <li className="breadcrumb-item"><Link to={`/inventory/${inv?.id}`}>{inv?.title}</Link></li>
          <li className="breadcrumb-item active font-monospace">{item.customId}</li>
        </ol>
      </nav>

      {editMode ? (
        <div className="card border-0 shadow-sm p-4">
          <h5 className="fw-bold mb-3">{t('item.edit')}</h5>
          <ItemForm
            inventoryId={inv.id}
            fields={fields}
            existingItem={item}
            onSaved={(updated) => { setItem({ ...item, ...updated }); setEditMode(false); }}
            onCancel={() => setEditMode(false)}
          />
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent d-flex align-items-center justify-content-between">
            <div>
              <span className="font-monospace fw-bold fs-5">{item.customId}</span>
              <span className="badge bg-primary ms-2">{inv?.title}</span>
            </div>
            <div className="d-flex gap-2">
              <button className={`btn btn-sm ${item.userLiked ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={toggleLike}>
                <i className={`bi bi-heart${item.userLiked ? '-fill' : ''} me-1`} />
                {item._count?.likes || 0}
              </button>
              {canEdit && (
                <>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setEditMode(true)}>
                    <i className="bi bi-pencil me-1" />{t('common.edit')}
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={deleteItem}>
                    <i className="bi bi-trash me-1" />{t('common.delete')}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="card-body">
            <table className="table table-borderless mb-0">
              <tbody>
                <tr>
                  <td className="fw-semibold text-muted w-40">{t('item.createdBy')}</td>
                  <td><Link to={`/user/${item.createdBy?.id}`} className="text-decoration-none">{item.createdBy?.name}</Link></td>
                </tr>
                <tr>
                  <td className="fw-semibold text-muted">{t('item.createdAt')}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
                {fields.map((f) => (
                  <tr key={f.id}>
                    <td className="fw-semibold text-muted">{f.name}</td>
                    <td>{renderValue(f)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemPage;
