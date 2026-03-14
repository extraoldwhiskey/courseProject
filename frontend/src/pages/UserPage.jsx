import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

const UserPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${id}`).then(({ data }) => setProfile(data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border" /></div>;
  if (!profile) return <div className="container py-5 text-center">Not found</div>;

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        {profile.avatar && <img src={profile.avatar} className="rounded-circle" width={64} height={64} alt="" />}
        <div>
          <h4 className="fw-bold mb-0">{profile.name}</h4>
          <p className="text-muted small mb-0">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header fw-bold bg-transparent">
          <i className="bi bi-collection me-2 text-primary" />Inventories ({profile.inventories.length})
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table">
                <tr>
                  <th>{t('inventory.title')}</th>
                  <th className="d-none d-md-table-cell">{t('inventory.category')}</th>
                  <th className="text-end">{t('common.items')}</th>
                </tr>
              </thead>
              <tbody>
                {profile.inventories.map((inv) => (
                  <tr key={inv.id}>
                    <td><Link to={`/inventory/${inv.id}`} className="fw-semibold text-decoration-none">{inv.title}</Link></td>
                    <td className="d-none d-md-table-cell">
                      {inv.category ? <span className="badge bg-secondary">{inv.category.name}</span> : '—'}
                    </td>
                    <td className="text-end"><span className="badge bg-primary">{inv._count?.items || 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
