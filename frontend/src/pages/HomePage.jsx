import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const InventoryCard = ({ inv }) => {
  const { t } = useTranslation();
  return (
    <tr>
      <td>
        <Link
          to={`/inventory/${inv.id}`}
          className="fw-semibold text-decoration-none"
        >
          {inv.title}
        </Link>
        {inv.tags?.length > 0 && (
          <div className="mt-1">
            {inv.tags.map((it) => (
              <span
                key={it.tag.id}
                className="badge bg-secondary me-1 fw-normal"
              >
                {it.tag.name}
              </span>
            ))}
          </div>
        )}
      </td>
      <td
        className="d-none d-md-table-cell text-truncate"
        style={{ maxWidth: 200 }}
      >
        {inv.description || "—"}
      </td>
      <td className="d-none d-lg-table-cell">
        {inv.creator?.name ? (
          <Link to={`/user/${inv.creator.id}`} className="text-decoration-none">
            {inv.creator.name}
          </Link>
        ) : (
          "—"
        )}
      </td>
      <td className="text-end">
        <span className="badge bg-primary">
          {inv._count?.items ?? 0} {t("common.items")}
        </span>
      </td>
    </tr>
  );
};

const HomePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [latest, setLatest] = useState([]);
  const [popular, setPopular] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/inventories/latest"),
      api.get("/inventories/popular"),
      api.get("/tags/cloud"),
    ])
      .then(([l, p, tg]) => {
        setLatest(Array.isArray(l.data) ? l.data : []);
        setPopular(Array.isArray(p.data) ? p.data : []);
        setTags(Array.isArray(tg.data) ? tg.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const maxTagCount = Math.max(
    ...tags.map((t) => t._count?.inventories || 0),
    1,
  );
  const tagSize = (count) =>
    Math.max(0.75, Math.min(2, 0.75 + (count / maxTagCount) * 1.25));

  if (loading)
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" />
      </div>
    );

  return (
    <div className="container py-4">
      <div
        className="p-4 p-md-5 mb-4 rounded-4 text-center"
        style={{
          background:
            "linear-gradient(135deg, var(--bs-primary) 0%, #6f42c1 100%)",
        }}
      >
        <h1 className="display-5 fw-bold text-white mb-2">{t("home.title")}</h1>
        <p className="lead text-white opacity-75 mb-4">{t("home.subtitle")}</p>
        {user ? (
          <button
            className="btn btn-light btn-lg fw-semibold px-4"
            onClick={() => navigate("/me")}
          >
            <i className="bi bi-plus-circle me-2" />
            {t("inventory.create")}
          </button>
        ) : (
          <Link className="btn btn-light btn-lg fw-semibold px-4" to="/login">
            <i className="bi bi-box-arrow-in-right me-2" />
            {t("nav.login")}
          </Link>
        )}
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent fw-bold">
              <i className="bi bi-clock-history me-2 text-primary" />
              {t("home.latestInventories")}
            </div>
            <div className="card-body p-0">
              {latest.length === 0 ? (
                <p className="text-muted p-3 mb-0">{t("home.noInventories")}</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table">
                      <tr>
                        <th>{t("inventory.title")}</th>
                        <th className="d-none d-md-table-cell">
                          {t("inventory.description")}
                        </th>
                        <th className="d-none d-lg-table-cell">
                          {t("common.by")}
                        </th>
                        <th className="text-end">{t("common.items")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latest.map((inv) => (
                        <InventoryCard key={inv.id} inv={inv} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4 d-flex flex-column gap-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent fw-bold">
              <i className="bi bi-fire me-2 text-danger" />
              {t("home.popularInventories")}
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table">
                    <tr>
                      <th>{t("inventory.title")}</th>
                      <th className="text-end">{t("common.items")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popular.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <Link
                            to={`/inventory/${inv.id}`}
                            className="text-decoration-none"
                          >
                            {inv.title}
                          </Link>
                        </td>
                        <td className="text-end">
                          <span className="badge bg-danger">
                            {inv._count?.items ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent fw-bold">
              <i className="bi bi-tags me-2 text-success" />
              {t("home.tagCloud")}
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/search?q=${encodeURIComponent(tag.name)}&type=inventories`}
                    className="badge text-decoration-none bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-2"
                    style={{
                      fontSize: `${tagSize(tag._count?.inventories || 0)}rem`,
                    }}
                  >
                    {tag.name}
                    <span className="ms-1 opacity-75">
                      ({tag._count?.inventories || 0})
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
