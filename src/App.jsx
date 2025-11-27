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

function App() {
  const [page, setPage] = useState('login'); // 'login' | 'register' | 'upload'
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token && page === 'login') {
      setPage('upload');
    }
  }, [token, page]);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setPage('login');
  };

  return (
    <div className="app-shell">
      <div className="app-card">
        {/* Header */}
        <div className="app-header">
          <div className="app-title-group">
            <h1>Data Capture Console</h1>
            <p>Sign in, register and upload image samples for preprocessing.</p>
          </div>
          <div className="app-pill">MERN • Atlas • Render ready</div>
        </div>

        {/* Tabs */}
        <div className="app-tabs">
          <button
            className={
              'tab-button ' + (page === 'register' ? 'tab-button--active' : '')
            }
            onClick={() => setPage('register')}
          >
            Register
          </button>
          <button
            className={
              'tab-button ' + (page === 'login' ? 'tab-button--active' : '')
            }
            onClick={() => setPage('login')}
          >
            Login
          </button>
          <button
            className={
              'tab-button ' +
              (page === 'upload' && token ? 'tab-button--active' : '')
            }
            onClick={() => token && setPage('upload')}
          >
            Upload
          </button>
        </div>

        {/* Sections */}
        {page === 'register' && <Register />}
        {page === 'login' && (
          <Login onLogin={setToken} goUpload={() => setPage('upload')} />
        )}
        {page === 'upload' && token && <Upload />}
        {page === 'upload' && !token && (
          <div className="section-card">
            <p className="form-title">Authentication required</p>
            <p className="form-caption">
              Please login first before uploading data records.
            </p>
          </div>
        )}

        {/* Global logout footer */}
        {token && (
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
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

// ---- Register ----
function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsError(false);
    try {
      await apiJson('/api/auth/register', 'POST', { email, password });
      setMsg('Registered successfully. You can now log in.');
    } catch (err) {
      setIsError(true);
      setMsg(err.message);
    }
  };

  return (
    <div className="section-card">
      <h2 className="form-title">Create an account</h2>
      <p className="form-caption">
        Use an email and password you don’t mind using for testing.
      </p>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-field">
          <label>Email</label>
          <input
            className="form-input"
            type="email"
            required
            placeholder="you@example.com"
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="section-footer">
          <button type="submit" className="btn-primary">
            Create account
          </button>
          <small>Passwords are stored as hashes in MongoDB.</small>
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

// ---- Login ----
function Login({ onLogin, goUpload }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsError(false);
    try {
      const data = await apiJson('/api/auth/login', 'POST', { email, password });
      localStorage.setItem('token', data.token);
      onLogin(data.token);
      setMsg('Logged in successfully.');
      goUpload();
    } catch (err) {
      setIsError(true);
      setMsg(err.message);
    }
  };

  return (
    <div className="section-card">
      <h2 className="form-title">Welcome back</h2>
      <p className="form-caption">
        Login to continue uploading image samples and numeric metadata.
      </p>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-field">
          <label>Email</label>
          <input
            className="form-input"
            type="email"
            required
            placeholder="you@example.com"
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
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="section-footer">
          <button type="submit" className="btn-primary">
            Login
          </button>
          <small>Session is handled with a JWT stored in local storage.</small>
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

// ---- Upload ----
function Upload() {
  const [uniqueId, setUniqueId] = useState('');
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [files, setFiles] = useState([null, null, null]);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchId = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/records/new-id`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to get ID');
        setUniqueId(data.uniqueId);
      } catch (err) {
        setIsError(true);
        setMsg(err.message);
      }
    };
    fetchId();
  }, []);

  const handleFileChange = (idx, file) => {
    const newFiles = [...files];
    newFiles[idx] = file;
    setFiles(newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setIsError(false);

    if (files.some((f) => !f)) {
      setIsError(true);
      setMsg('Please select all 3 images.');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('uniqueId', uniqueId);
    formData.append('num1', num1);
    formData.append('num2', num2);
    files.forEach((file) => formData.append('images', file));

    try {
      const res = await fetch(`${API_BASE_URL}/api/records`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setMsg('Uploaded successfully.');
      setIsError(false);
    } catch (err) {
      setIsError(true);
      setMsg(err.message);
    }
  };

  return (
    <div className="section-card">
      <h2 className="form-title">Upload record</h2>
      <p className="form-caption">
        Attach 3 images and 2 numeric fields. All assets are stored in MongoDB for
        later preprocessing.
      </p>

      <div className="badge-id">
        <span className="badge-dot" />
        <span>Unique ID</span>
        <strong>{uniqueId || 'generating…'}</strong>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-field">
          <label>Numeric field 1</label>
          <input
            className="form-input"
            type="number"
            required
            value={num1}
            onChange={(e) => setNum1(e.target.value)}
            placeholder="e.g. 42"
          />
        </div>

        <div className="form-field">
          <label>Numeric field 2</label>
          <input
            className="form-input"
            type="number"
            required
            value={num2}
            onChange={(e) => setNum2(e.target.value)}
            placeholder="e.g. 7.5"
          />
        </div>

        <div className="form-field">
          <label>Images (exactly 3)</label>

          <div className="file-row">
            <span className="file-label">Image 1</span>
            <input
              className="form-file"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(0, e.target.files[0])}
            />
          </div>

          <div className="file-row">
            <span className="file-label">Image 2</span>
            <input
              className="form-file"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(1, e.target.files[0])}
            />
          </div>

          <div className="file-row">
            <span className="file-label">Image 3</span>
            <input
              className="form-file"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(2, e.target.files[0])}
            />
          </div>
        </div>

        <div className="section-footer">
          <button type="submit" className="btn-primary">
            Upload record
          </button>
          <small>Images are uploaded as binary buffers and linked to this ID.</small>
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

export default App;
