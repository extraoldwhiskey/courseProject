import { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';

const UserAutocomplete = ({ onSelect, placeholder = 'Add user...' }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (val) => {
    setQ(val);
    if (val.length < 2) { setResults([]); return; }
    const { data } = await api.get('/users/autocomplete', { params: { q: val } });
    setResults(data);
    setShow(true);
  };

  const pick = (user) => {
    onSelect(user);
    setQ('');
    setResults([]);
    setShow(false);
  };

  return (
    <div ref={ref} className="position-relative">
      <div className="input-group">
        <span className="input-group-text"><i className="bi bi-person-plus" /></span>
        <input className="form-control" value={q} onChange={(e) => search(e.target.value)}
          placeholder={placeholder} onFocus={() => q.length > 1 && setShow(true)} />
      </div>
      {show && results.length > 0 && (
        <ul className="dropdown-menu show w-100" style={{ zIndex: 1050 }}>
          {results.map((u) => (
            <li key={u.id}>
              <button className="dropdown-item d-flex align-items-center gap-2" onMouseDown={() => pick(u)}>
                {u.avatar && <img src={u.avatar} alt="" className="rounded-circle" width={20} height={20} />}
                <span>{u.name}</span>
                <span className="text-muted small ms-auto">{u.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserAutocomplete;
