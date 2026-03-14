import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const SelectionToolbar = ({ selected, users, onBlock, onUnblock, onToggleAdmin, onDelete, onClear, t }) => {
  if (selected.size === 0) return null;

  const selectedUsers = users.filter((u) => selected.has(u.id));
  const allBlocked    = selectedUsers.every((u) => u.isBlocked);
  const allAdmin      = selectedUsers.every((u) => u.isAdmin);
  const single        = selected.size === 1;

  return (
    <div className="d-flex align-items-center gap-2 p-2 mb-2 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
      <span className="badge bg-primary">{selected.size}</span>
      <span className="small fw-semibold text-primary">{t('common.selected')}</span>
      <div className="ms-auto d-flex gap-2">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => onBlock(!allBlocked)}>
          <i className={`bi bi-${allBlocked ? 'unlock' : 'lock'} me-1`} />
          {allBlocked ? t('admin.unblock') : t('admin.block')}
        </button>
        {single && (
          <button className="btn btn-sm btn-outline-warning" onClick={() => onToggleAdmin(!allAdmin)}>
            <i className={`bi bi-shield${allAdmin ? '-x' : '-check'} me-1`} />
            {allAdmin ? t('admin.removeAdmin') : t('admin.makeAdmin')}
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

const AdminPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [q, setQ]             = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  const fetchUsers = async (pg = page, query = q) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { page: pg, q: query } });
      setUsers(data.users);
      setTotal(data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.isAdmin) fetchUsers(); }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSelected(new Set());
    fetchUsers(1, q);
  };

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === users.length ? new Set() : new Set(users.map((u) => u.id))
    );

  const patchSelected = async (patch) => {
    const ids = [...selected];
    const results = await Promise.all(ids.map((id) => api.patch(`/admin/users/${id}`, patch).then((r) => r.data)));
    setUsers((prev) => prev.map((u) => { const r = results.find((x) => x.id === u.id); return r ? { ...u, ...r } : u; }));
    setSelected(new Set());
  };

  const deleteSelected = async () => {
    if (!confirm(t('common.confirm') + '?')) return;
    await Promise.all([...selected].map((id) => api.delete(`/admin/users/${id}`)));
    setUsers((prev) => prev.filter((u) => !selected.has(u.id)));
    setSelected(new Set());
  };

  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;

  const totalPages  = Math.ceil(total / 20);
  const allChecked  = users.length > 0 && selected.size === users.length;

  const goPage = (p) => { setPage(p); setSelected(new Set()); fetchUsers(p); };

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-4">
        <i className="bi bi-shield-fill me-2 text-primary" />{t('admin.title')}
      </h4>

      <form className="input-group mb-3" style={{ maxWidth: 400 }} onSubmit={handleSearch}>
        <input className="form-control" placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" type="submit"><i className="bi bi-search" /></button>
      </form>

      <SelectionToolbar
        selected={selected}
        users={users}
        onBlock={(val) => patchSelected({ isBlocked: val })}
        onUnblock={() => patchSelected({ isBlocked: false })}
        onToggleAdmin={(val) => patchSelected({ isAdmin: val })}
        onDelete={deleteSelected}
        onClear={() => setSelected(new Set())}
        t={t}
      />

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table">
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" className="form-check-input" checked={allChecked} onChange={toggleAll} />
                  </th>
                  <th>{t('admin.name')}</th>
                  <th className="d-none d-md-table-cell">{t('admin.email')}</th>
                  <th>{t('admin.role')}</th>
                  <th>{t('admin.status')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="text-center py-4"><div className="spinner-border spinner-border-sm" /></td></tr>
                )}
                {!loading && users.map((u) => (
                  <tr
                    key={u.id}
                    className={selected.has(u.id) ? 'table-primary' : ''}
                    onClick={() => toggleOne(u.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="form-check-input" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} />
                    </td>
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
                <button className="page-link" onClick={() => goPage(page - 1)}>‹</button>
              </li>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => goPage(p)}>{p}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => goPage(page + 1)}>›</button>
              </li>
            </ul></nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;