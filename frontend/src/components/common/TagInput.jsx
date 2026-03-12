import { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';

const TagInput = ({ tags = [], onChange }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = async (q) => {
    if (q.length < 1) { setSuggestions([]); return; }
    const { data } = await api.get('/tags', { params: { q } });
    setSuggestions(data.filter((t) => !tags.includes(t.name)));
    setShowDropdown(true);
  };

  const addTag = (name) => {
    const clean = name.trim().toLowerCase();
    if (!clean || tags.includes(clean)) return;
    onChange([...tags, clean]);
    setInput('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const removeTag = (t) => onChange(tags.filter((x) => x !== t));

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
  };

  return (
    <div ref={wrapRef} className="position-relative">
      <div className="form-control d-flex flex-wrap gap-1 align-items-center" style={{ minHeight: 42, cursor: 'text' }}
        onClick={() => wrapRef.current?.querySelector('input')?.focus()}>
        {tags.map((t) => (
          <span key={t} className="badge bg-primary d-flex align-items-center gap-1">
            {t}
            <button type="button" className="btn-close btn-close-white btn-sm p-0 ms-1" style={{ fontSize: 8 }}
              onClick={(e) => { e.stopPropagation(); removeTag(t); }} />
          </span>
        ))}
        <input
          className="border-0 outline-none flex-grow-1 bg-transparent p-0"
          style={{ minWidth: 80, outline: 'none' }}
          value={input}
          onChange={(e) => { setInput(e.target.value); fetchSuggestions(e.target.value); }}
          onKeyDown={handleKey}
          onFocus={() => input && setShowDropdown(true)}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul className="dropdown-menu show position-absolute w-100" style={{ zIndex: 1050 }}>
          {suggestions.map((s) => (
            <li key={s.id}>
              <button className="dropdown-item d-flex justify-content-between" onMouseDown={() => addTag(s.name)}>
                {s.name}
                <span className="badge bg-secondary">{s._count?.inventories || 0}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagInput;
