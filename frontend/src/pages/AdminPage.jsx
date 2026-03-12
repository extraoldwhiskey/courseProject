import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AdminPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = async (pg = page, query = q) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { page: pg, q: query } });
      setUsers(data.users);
      setTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.isAdmin) fetch(); }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetch(1, q);
  };

  const patchUser = async (id, patch) => {
    const { data } = await api.patch(`/admin/users/${id}`, patch);
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...data } : u)));
  };

  const deleteUser = async (id) => {
    if (!confirm(t('common.confirm') + '?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers((us) => us.filter((u) => u.id !== id));
  };

  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-4"><i className="bi bi-shield-fill me-2 text-primary" />{t('admin.title')}</h4>

      <form className="input-group mb-4" style={{ maxWidth: 400 }} onSubmit={handleSearch}>
        <input className="form-control" placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" type="submit"><i className="bi bi-search" /></button>
      </form>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>{t('admin.name')}</th>
                  <th className="d-none d-md-table-cell">{t('admin.email')}</th>
                  <th>{t('admin.role')}</th>
                  <th>{t('admin.status')}</th>
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} className="text-center py-4"><div className="spinner-border spinner-border-sm" /></td></tr>}
                {!loading && users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {u.avatar && <img src={u.avatar} className="rounded-circle" width={28} height={28} alt="" />}
                        {u.name}
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell text-muted small">{u.email}</td>
                    <td>
                      {u.isAdmin
                        ? <span className="badge bg-warning text-dark"><i className="bi bi-shield me-1" />Admin</span>
                        : <span className="badge bg-secondary">User</span>}
                    </td>
                    <td>
                      {u.isBlocked
                        ? <span className="badge bg-danger">Blocked</span>
                        : <span className="badge bg-success">Active</span>}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-secondary" title={u.isBlocked ? t('admin.unblock') : t('admin.block')}
                          onClick={() => patchUser(u.id, { isBlocked: !u.isBlocked })}>
                          <i className={`bi bi-${u.isBlocked ? 'unlock' : 'lock'}`} />
                        </button>
                        <button className="btn btn-outline-warning" title={u.isAdmin ? t('admin.removeAdmin') : t('admin.makeAdmin')}
                          onClick={() => patchUser(u.id, { isAdmin: !u.isAdmin })}>
                          <i className={`bi bi-shield${u.isAdmin ? '-x' : '-check'}`} />
                        </button>
                        <button className="btn btn-outline-danger" title={t('admin.delete')}
                          onClick={() => deleteUser(u.id)}>
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="card-footer bg-transparent d-flex justify-content-center">
            <nav><ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => { setPage(page - 1); fetch(page - 1); }}>‹</button>
              </li>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => { setPage(p); fetch(p); }}>{p}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => { setPage(page + 1); fetch(page + 1); }}>›</button>
              </li>
            </ul></nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
