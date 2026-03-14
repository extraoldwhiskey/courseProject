import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const socket = io({ autoConnect: false });

const Discussion = ({ inventoryId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/comments', { params: { inventoryId } }).then(({ data }) => setComments(data));

    socket.connect();
    socket.emit('joinInventory', inventoryId);
    socket.on('newComment', (c) => setComments((prev) => {
      if (prev.some((x) => x.id === c.id)) return prev;
      return [...prev, c];
    }));

    return () => {
      socket.emit('leaveInventory', inventoryId);
      socket.off('newComment');
      socket.disconnect();
    };
  }, [inventoryId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const post = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await api.post('/comments', { inventoryId, content: draft.trim() });
      setDraft('');
      setComments((prev) => prev.some((x) => x.id === data.id) ? prev : [...prev, data]);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <div className="border rounded p-3 mb-3 overflow-auto" style={{ maxHeight: 400 }}>
        {comments.length === 0 && <p className="text-muted text-center mb-0">{t('discussion.noComments')}</p>}
        {comments.map((c) => (
          <div key={c.id} className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-1">
              {c.user.avatar && <img src={c.user.avatar} className="rounded-circle" width={24} height={24} alt="" />}
              <Link to={`/user/${c.user.id}`} className="fw-semibold text-decoration-none small">{c.user.name}</Link>
              <span className="text-muted small">{new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <div className="border rounded p-2 bg-opacity-50 markdown-content">
              <ReactMarkdown>{c.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {user ? (
        <div>
          <textarea
            className="form-control mb-2"
            rows={3}
            placeholder={t('discussion.addComment')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn-primary" onClick={post} disabled={!draft.trim() || posting}>
            {posting ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-send me-1" />}
            {t('discussion.post')}
          </button>
        </div>
      ) : (
        <p className="text-muted small">{t('auth.loginInfo')}</p>
      )}
    </div>
  );
};

export default Discussion;
