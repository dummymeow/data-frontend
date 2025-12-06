import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// JSON helper
async function apiJson(path, method, body) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export default function App() {
  const [page, setPage] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token && page === 'login') setPage('upload');
  }, [token, page]);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setPage('login');
  };

  return (
    <div className="app-shell">
      <div className="app-card">
        <div className="app-header">
          <div className="app-title-group">
            <h1>Data Capture Console</h1>
          </div>
        </div>

        <div className="app-tabs">
          <button
            className={`tab-button ${page === 'register' ? 'tab-button--active' : ''}`}
            onClick={() => setPage('register')}
          >
            Register
          </button>
          <button
            className={`tab-button ${page === 'login' ? 'tab-button--active' : ''}`}
            onClick={() => setPage('login')}
          >
            Login
          </button>
          <button
            className={`tab-button ${page === 'upload' && token ? 'tab-button--active' : ''}`}
            onClick={() => token && setPage('upload')}
          >
            Upload
          </button>
        </div>

        {page === 'register' && <Register />}
        {page === 'login' && (
          <Login onLogin={setToken} goUpload={() => setPage('upload')} />
        )}
        {page === 'upload' && token && <Upload />}
        {page === 'upload' && !token && <Blocked />}

        {token && (
          <div
            style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}
          >
            <button className="btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Register ---------- */

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsError(false);
    try {
      await apiJson('/api/auth/register', 'POST', { email, password });
      setMsg('Registered successfully.');
    } catch (err) {
      setIsError(true);
      setMsg(err.message);
    }
  };

  return (
    <div className="section-card">
      <h2 className="form-title">Create Account</h2>
      <form onSubmit={submit} className="form-grid">
        <div className="form-field">
          <label>Email</label>
          <input
            className="form-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Password</label>
          <input
            className="form-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="section-footer">
          <button className="btn-primary" type="submit">
            Register
          </button>
        </div>
      </form>
      {msg && (
        <p className={`message ${isError ? 'message--error' : 'message--success'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

/* ---------- Login ---------- */

function Login({ onLogin, goUpload }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsError(false);

    try {
      const data = await apiJson('/api/auth/login', 'POST', { email, password });
      localStorage.setItem('token', data.token);
      onLogin(data.token);
      goUpload();
    } catch (err) {
      setIsError(true);
      setMsg(err.message);
    }
  };

  return (
    <div className="section-card">
      <h2 className="form-title">Login</h2>
      <form onSubmit={submit} className="form-grid">
        <div className="form-field">
          <label>Email</label>
          <input
            className="form-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Password</label>
          <input
            className="form-input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="section-footer">
          <button className="btn-primary" type="submit">
            Login
          </button>
        </div>
      </form>
      {msg && (
        <p className={`message ${isError ? 'message--error' : 'message--success'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

/* ---------- Upload (now includes elbowPosition) ---------- */

function Upload() {
  const [uniqueId, setUniqueId] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const [vals, setVals] = useState({
    c0: '',
    c5: '',
    c10: '',
    c20: '',
    cElbow: '',
    elbowPosition: '',
  });

  useEffect(() => {
    const loadId = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/records/new-id`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to get ID');
        setUniqueId(data.uniqueId);
      } catch (err) {
        setIsError(true);
        setMsg(err.message);
      }
    };
    loadId();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsError(false);

    const { c0, c5, c10, c20, cElbow, elbowPosition } = vals;
    if ([c0, c5, c10, c20, cElbow, elbowPosition].some((v) => v === '' || v === null)) {
      setIsError(true);
      setMsg('Please fill all measurements including elbow position.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uniqueId,
          c0: Number(c0),
          c5: Number(c5),
          c10: Number(c10),
          c20: Number(c20),
          cElbow: Number(cElbow),
          elbowPosition: Number(elbowPosition),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setMsg('Saved successfully.');
    } catch (err) {
      setIsError(true);
      setMsg(err.message);
    }
  };

  return (
    <div className="section-card">
      <h2 className="form-title">Upload Measurements</h2>

      <div className="badge-id">
        <span className="badge-dot" />
        <span>ID</span>
        <strong>{uniqueId || '…'}</strong>
      </div>

      <form onSubmit={submit} className="form-grid">
        <table className="measure-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>0 cm</th>
              <th>5 cm</th>
              <th>10 cm</th>
              <th>20 cm</th>
              <th>Elbow</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Circumference</td>
              {['c0', 'c5', 'c10', 'c20', 'cElbow'].map((key) => (
                <td key={key}>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={vals[key]}
                    onChange={(e) =>
                      setVals((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* NEW: extra attribute below table */}
        <div className="form-field" style={{ marginTop: '0.75rem' }}>
          <label>Elbow position (cm)</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            value={vals.elbowPosition}
            onChange={(e) =>
              setVals((prev) => ({ ...prev, elbowPosition: e.target.value }))
            }
          />
        </div>

        <div className="section-footer">
          <button className="btn-primary" type="submit">
            Save
          </button>
        </div>
      </form>

      {msg && (
        <p className={`message ${isError ? 'message--error' : 'message--success'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

/* ---------- Blocked ---------- */

function Blocked() {
  return (
    <div className="section-card">
      <h2 className="form-title">Authentication Required</h2>
      <p>Please login to access the upload panel.</p>
    </div>
  );
}
