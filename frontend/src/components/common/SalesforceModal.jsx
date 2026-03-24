import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education',
  'Retail', 'Manufacturing', 'Consulting', 'Media', 'Other',
];

const Field = ({ label, id, type = 'text', value, onChange, placeholder, required }) => (
  <div className="mb-3">
    <label className="form-label fw-semibold small" htmlFor={id}>
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    <input
      id={id} type={type} className="form-control form-control-sm"
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const SalesforceModal = ({ user, onClose }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName:  user.name.split(' ')[0] || '',
    lastName:   user.name.split(' ').slice(1).join(' ') || '',
    phone:      '',
    company:    '',
    jobTitle:   '',
    department: '',
    website:    '',
    industry:   '',
  });
  const [status, setStatus]   = useState('idle');
  const [result, setResult]   = useState(null);
  const [errMsg, setErrMsg]   = useState('');

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const submit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    setStatus('loading');
    try {
      const { data } = await api.post('/salesforce/create-contact', {
        userId:     user.id,
        ...form,
      });
      setResult(data);
      setStatus('success');
    } catch (e) {
      setErrMsg(e.response?.data?.error || 'Salesforce error');
      setStatus('error');
    }
  };

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle d-flex align-items-center justify-content-center"
                   style={{ width: 36, height: 36, background: '#00A1E0' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2 0V4.07c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93z"/>
                </svg>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0">Add to Salesforce CRM</h5>
                <small className="text-muted">Creates an Account + Contact in your SF org</small>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {status === 'success' && result && (
              <div className="text-center py-3">
                <div className="mb-3" style={{ fontSize: 48 }}>✅</div>
                <h5 className="fw-bold text-success">Successfully created in Salesforce!</h5>
                <p className="text-muted mb-4">Account and Contact are now available in your SF org.</p>

                <div className="row g-3 text-start">
                  <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                      <div className="card-body">
                        <p className="fw-semibold mb-1 small text-muted text-uppercase">Account</p>
                        <p className="font-monospace small mb-2 text-break">{result.accountId}</p>
                        <a href={`${result.instanceUrl}/${result.accountId}`}
                           target="_blank" rel="noreferrer"
                           className="btn btn-sm btn-outline-primary w-100">
                          <i className="bi bi-box-arrow-up-right me-1" />View Account in SF
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-0 bg-light h-100">
                      <div className="card-body">
                        <p className="fw-semibold mb-1 small text-muted text-uppercase">Contact</p>
                        <p className="font-monospace small mb-2 text-break">{result.contactId}</p>
                        <a href={`${result.instanceUrl}/${result.contactId}`}
                           target="_blank" rel="noreferrer"
                           className="btn btn-sm btn-outline-success w-100">
                          <i className="bi bi-box-arrow-up-right me-1" />View Contact in SF
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {status === 'error' && (
              <div className="alert alert-danger d-flex gap-2 align-items-start">
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1" />
                <div>
                  <strong>Salesforce error:</strong> {errMsg}
                  <div className="mt-2">
                    <button className="btn btn-sm btn-outline-danger"
                            onClick={() => setStatus('idle')}>Try again</button>
                  </div>
                </div>
              </div>
            )}
            {(status === 'idle' || status === 'loading') && (
              <>
                <div className="alert alert-info py-2 px-3 mb-4">
                  <small>
                    <i className="bi bi-info-circle me-1" />
                    This will create an <b>Account</b> (company) and a <b>Contact</b> linked to it
                    in your Salesforce org. Email <b>{user.email}</b> will be set automatically.
                  </small>
                </div>

                <div className="row g-0">
                  <div className="col-md-6 pe-md-3">
                    <p className="fw-semibold text-muted small text-uppercase mb-2">Contact Info</p>
                    <Field label="First Name" id="firstName" required
                      value={form.firstName} onChange={set('firstName')} />
                    <Field label="Last Name" id="lastName" required
                      value={form.lastName} onChange={set('lastName')} />
                    <Field label="Phone" id="phone" type="tel"
                      value={form.phone} onChange={set('phone')}
                      placeholder="+1 555 000 0000" />
                    <Field label="Job Title" id="jobTitle"
                      value={form.jobTitle} onChange={set('jobTitle')}
                      placeholder="e.g. Software Engineer" />
                    <Field label="Department" id="department"
                      value={form.department} onChange={set('department')}
                      placeholder="e.g. Engineering" />
                  </div>

                  <div className="col-md-6 ps-md-3 border-start-md">
                    <p className="fw-semibold text-muted small text-uppercase mb-2">Account (Company)</p>
                    <Field label="Company Name" id="company"
                      value={form.company} onChange={set('company')}
                      placeholder="Your company name" />
                    <Field label="Website" id="website" type="url"
                      value={form.website} onChange={set('website')}
                      placeholder="https://example.com" />
                    <div className="mb-3">
                      <label className="form-label fw-semibold small" htmlFor="industry">Industry</label>
                      <select className="form-select form-select-sm" id="industry"
                        value={form.industry} onChange={(e) => set('industry')(e.target.value)}>
                        <option value="">— Select —</option>
                        {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>

                    <div className="card border-0 rounded-3 mt-3"
                         style={{ background: '#f0f8ff', borderLeft: '3px solid #00A1E0' }}>
                      <div className="card-body py-2 px-3">
                        <p className="small fw-semibold mb-1" style={{ color: '#00A1E0' }}>
                          What will be created:
                        </p>
                        <ul className="mb-0 small text-muted" style={{ paddingLeft: 16 }}>
                          <li>Account — company record</li>
                          <li>Contact — person linked to account</li>
                          <li>LeadSource set to "Web"</li>
                          <li>Email: <b>{user.email}</b></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {status !== 'success' && (
            <div className="modal-footer border-0 pt-0">
              <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              {(status === 'idle' || status === 'loading') && (
                <button className="btn text-white fw-semibold px-4"
                        style={{ background: '#00A1E0' }}
                        onClick={submit}
                        disabled={status === 'loading' || !form.firstName.trim() || !form.lastName.trim()}>
                  {status === 'loading'
                    ? <><span className="spinner-border spinner-border-sm me-2" />Sending to Salesforce…</>
                    : <><i className="bi bi-cloud-upload me-2" />Push to Salesforce CRM</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesforceModal;