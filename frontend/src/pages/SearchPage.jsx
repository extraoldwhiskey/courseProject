import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

const SearchPage = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [type, setType] = useState(params.get('type') || 'all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api.get('/search', { params: { q, type } })
      .then(({ data }) => setResults(data))
      .finally(() => setLoading(false));
  }, [q, type]);

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-3">
        <i className="bi bi-search me-2 text-primary" />
        {t('search.title')}: <span className="text-primary">"{q}"</span>
      </h4>

      <div className="btn-group mb-4">
        {['all', 'inventories', 'items'].map((v) => (
          <button key={v} className={`btn btn-sm ${type === v ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setType(v)}>
            {t(`search.${v === 'all' ? 'allTypes' : v === 'inventories' ? 'inventoriesOnly' : 'itemsOnly'}`)}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-5"><div className="spinner-border" /></div>}

      {results && !loading && (
        <>
          {(type === 'all' || type === 'inventories') && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header fw-bold bg-transparent">
                <i className="bi bi-collection me-2" />{t('search.inventories')}
              </div>
              <div className="card-body p-0">
                {results.inventories.length === 0 ? (
                  <p className="text-muted p-3 mb-0">{t('search.noResults')}</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>{t('inventory.title')}</th>
                          <th className="d-none d-md-table-cell">{t('inventory.description')}</th>
                          <th className="d-none d-lg-table-cell">{t('common.by')}</th>
                          <th className="text-end">{t('common.items')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.inventories.map((inv) => (
                          <tr key={inv.id}>
                            <td><Link to={`/inventory/${inv.id}`} className="fw-semibold text-decoration-none">{inv.title}</Link></td>
                            <td className="d-none d-md-table-cell text-truncate" style={{ maxWidth: 200 }}>{inv.description || '—'}</td>
                            <td className="d-none d-lg-table-cell">
                              {inv.creatorName ? <Link to={`/user/${inv.creatorid}`} className="text-decoration-none">{inv.creatorName}</Link> : '—'}
                            </td>
                            <td className="text-end"><span className="badge bg-primary">{Number(inv.itemCount || 0)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {(type === 'all' || type === 'items') && (
            <div className="card border-0 shadow-sm">
              <div className="card-header fw-bold bg-transparent">
                <i className="bi bi-list-ul me-2" />{t('search.items')}
              </div>
              <div className="card-body p-0">
                {results.items.length === 0 ? (
                  <p className="text-muted p-3 mb-0">{t('search.noResults')}</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>{t('item.customId')}</th>
                          <th className="d-none d-md-table-cell">{t('inventory.title')}</th>
                          <th className="d-none d-lg-table-cell">Value</th>
                          <th className="d-none d-lg-table-cell">{t('common.by')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.items.map((item) => (
                          <tr key={item.id}>
                            <td><Link to={`/item/${item.id}`} className="fw-semibold text-decoration-none font-monospace">{item.customId}</Link></td>
                            <td className="d-none d-md-table-cell">
                              <Link to={`/inventory/${item.inventoryId}`} className="text-decoration-none">{item.inventoryTitle}</Link>
                            </td>
                            <td className="d-none d-lg-table-cell text-truncate" style={{ maxWidth: 200 }}>{item.string1 || item.string2 || '—'}</td>
                            <td className="d-none d-lg-table-cell">{item.creatorName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;
