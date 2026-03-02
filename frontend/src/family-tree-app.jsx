import React, { useState, useEffect, useRef } from 'react';
import { Camera, Users, LogOut, Plus, Mail, Check, X, ChevronRight, Settings, Share2, Trees, UserPlus, Trash2, Edit, Save, Home } from 'lucide-react';

// API Configuration - работает и в Docker и в dev режиме
const getApiBaseUrl = () => {
  // В production (Docker) API доступен через nginx на том же домене
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  // В development режиме - прямое подключение к backend
  return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🏗️ Environment:', import.meta.env.MODE);

// API Helper (rest of the code remains the same)
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('📡 API Request:', url);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(error.message || 'Request failed');
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  },

  auth: {
    register: (data) => api.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    login: (data) => api.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  trees: {
    getAll: () => api.request('/api/trees'),
    create: (data) => api.request('/api/trees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getGraph: (treeId) => api.request(`/api/trees/${treeId}/graph`),
  },

  invites: {
    getMy: () => api.request('/api/my/invites'),
    create: (treeId, data) => api.request(`/api/trees/${treeId}/invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    accept: (inviteId) => api.request(`/api/invites/${inviteId}/accept`, {
      method: 'POST',
    }),
    decline: (inviteId) => api.request(`/api/invites/${inviteId}/decline`, {
      method: 'POST',
    }),
  },
};

// Auth Context
const AuthContext = React.createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.auth.login({ email, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const register = async (email, name, password) => {
    const response = await api.auth.register({ email, name, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

// Login/Register Component
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, name, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration">
        <div className="tree-icon-large">
          <Tree size={120} />
        </div>
        <h1>Семейное Древо</h1>
        <p>Создайте историю вашей семьи</p>
      </div>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
            </button>
          </form>

          <div className="auth-switch">
            <button onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard - Tree List
const Dashboard = ({ onSelectTree }) => {
  const [trees, setTrees] = useState([]);
  const [invites, setInvites] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [treesData, invitesData] = await Promise.all([
        api.trees.getAll(),
        api.invites.getMy(),
      ]);
      setTrees(treesData);
      setInvites(invitesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTree = async (title, description) => {
    try {
      await api.trees.create({ title, description });
      await loadData();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create tree:', err);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await api.invites.accept(inviteId);
      await loadData();
    } catch (err) {
      console.error('Failed to accept invite:', err);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    try {
      await api.invites.decline(inviteId);
      await loadData();
    } catch (err) {
      console.error('Failed to decline invite:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <Tree size={32} />
            <h1>Семейное Древо</h1>
          </div>
          <div className="header-actions">
            <div className="user-info">
              <span>{user?.name}</span>
            </div>
            {invites.length > 0 && (
              <button 
                className="btn-icon-badge" 
                onClick={() => setShowInvites(true)}
                title="Приглашения"
              >
                <Mail size={20} />
                <span className="badge">{invites.length}</span>
              </button>
            )}
            <button className="btn-icon" onClick={logout} title="Выход">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="section-header">
            <h2>Мои деревья</h2>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={20} />
              Создать дерево
            </button>
          </div>

          <div className="trees-grid">
            {trees.map((tree) => (
              <div key={tree.id} className="tree-card" onClick={() => onSelectTree(tree)}>
                <div className="tree-card-icon">
                  <Tree size={40} />
                </div>
                <div className="tree-card-content">
                  <h3>{tree.title}</h3>
                  <p>{tree.description || 'Нет описания'}</p>
                  <div className="tree-card-meta">
                    <span className="role-badge">{tree.role}</span>
                    <span className="members-count">
                      <Users size={14} />
                      {tree.memberCount || 0}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="tree-card-arrow" />
              </div>
            ))}

            {trees.length === 0 && (
              <div className="empty-state">
                <Tree size={64} />
                <h3>У вас пока нет деревьев</h3>
                <p>Создайте первое семейное дерево</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreateTreeModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTree}
        />
      )}

      {showInvites && (
        <InvitesModal
          invites={invites}
          onClose={() => setShowInvites(false)}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      )}
    </div>
  );
};

// Create Tree Modal
const CreateTreeModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(title, description);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать новое дерево</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Семья Ивановых"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание вашего семейного дерева"
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invites Modal
const InvitesModal = ({ invites, onClose, onAccept, onDecline }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Приглашения</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="invites-list">
          {invites.map((invite) => (
            <div key={invite.id} className="invite-item">
              <div className="invite-info">
                <h4>{invite.tree.title}</h4>
                <p>От: {invite.inviter.name}</p>
                <span className="role-badge">{invite.role}</span>
              </div>
              <div className="invite-actions">
                <button
                  className="btn-success"
                  onClick={() => onAccept(invite.id)}
                >
                  <Check size={16} />
                  Принять
                </button>
                <button
                  className="btn-danger"
                  onClick={() => onDecline(invite.id)}
                >
                  <X size={16} />
                  Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Tree Viewer - Main visualization component
const TreeViewer = ({ tree, onBack }) => {
  const [graphData, setGraphData] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadGraph();
  }, [tree.id]);

  const loadGraph = async () => {
    try {
      const data = await api.trees.getGraph(tree.id);
      setGraphData(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load graph:', err);
      setLoading(false);
    }
  };

  const handleInvite = async (email, role) => {
    try {
      await api.invites.create(tree.id, { email, role });
      setShowInviteModal(false);
    } catch (err) {
      console.error('Failed to send invite:', err);
    }
  };

  // Canvas drawing
  useEffect(() => {
    if (!graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply transformations
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw connections first
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    graphData.edges?.forEach(edge => {
      const source = graphData.nodes.find(n => n.id === edge.source);
      const target = graphData.nodes.find(n => n.id === edge.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    graphData.nodes?.forEach(node => {
      const isSelected = selectedPerson?.id === node.id;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#3b82f6' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#2563eb' : '#d1d5db';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Draw initials
      ctx.fillStyle = isSelected ? '#ffffff' : '#374151';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = node.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      ctx.fillText(initials, node.x, node.y);

      // Draw name below
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.fillText(node.name, node.x, node.y + 45);
    });

    ctx.restore();
  }, [graphData, scale, offset, selectedPerson]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a node
    const clickedNode = graphData?.nodes?.find(node => {
      const nodeX = (node.x * scale) + offset.x;
      const nodeY = (node.y * scale) + offset.y;
      const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      return distance < 30 * scale;
    });

    if (clickedNode) {
      setSelectedPerson(clickedNode);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 3));
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Загрузка дерева...</p>
      </div>
    );
  }

  return (
    <div className="tree-viewer">
      <header className="tree-viewer-header">
        <div className="header-content">
          <button className="btn-back" onClick={onBack}>
            <Home size={20} />
            Назад
          </button>
          <h1>{tree.title}</h1>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => setShowInviteModal(true)}>
              <Share2 size={20} />
              Пригласить
            </button>
          </div>
        </div>
      </header>

      <div className="tree-viewer-main">
        <div className="tree-canvas-container">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
          
          <div className="canvas-controls">
            <button onClick={() => setScale(prev => Math.min(prev * 1.2, 3))}>+</button>
            <button onClick={() => setScale(prev => Math.max(prev * 0.8, 0.5))}>−</button>
            <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}>⟲</button>
          </div>
        </div>

        {selectedPerson && (
          <div className="person-details">
            <div className="person-details-header">
              <h3>{selectedPerson.name}</h3>
              <button className="btn-icon" onClick={() => setSelectedPerson(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="person-details-content">
              {selectedPerson.birthDate && (
                <p><strong>Дата рождения:</strong> {selectedPerson.birthDate}</p>
              )}
              {selectedPerson.deathDate && (
                <p><strong>Дата смерти:</strong> {selectedPerson.deathDate}</p>
              )}
              {selectedPerson.bio && (
                <p><strong>Биография:</strong> {selectedPerson.bio}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  );
};

// Invite Modal
const InviteModal = ({ onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');

  const handleSubmit = (e) => {
    e.preventDefault();
    onInvite(email, role);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Пригласить пользователя</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Роль</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="VIEWER">Просмотр</option>
              <option value="EDITOR">Редактор</option>
              <option value="ADMIN">Администратор</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Отправить приглашение
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const { user, loading } = useAuth();
  const [selectedTree, setSelectedTree] = useState(null);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (selectedTree) {
    return <TreeViewer tree={selectedTree} onBack={() => setSelectedTree(null)} />;
  }

  return <Dashboard onSelectTree={setSelectedTree} />;
};

// Main render with provider
const FamilyTreeApp = () => {
  return (
    <AuthProvider>
      <App />
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: #1f2937;
        }

        /* Auth Page */
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .auth-decoration {
          position: absolute;
          left: 10%;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.95);
          text-align: left;
          max-width: 500px;
        }

        .tree-icon-large {
          margin-bottom: 2rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .auth-decoration h1 {
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .auth-decoration p {
          font-size: 1.5rem;
          opacity: 0.9;
        }

        .auth-container {
          flex: 1;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .auth-card {
          background: white;
          padding: 3rem;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 450px;
          animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .auth-header h2 {
          font-size: 2rem;
          margin-bottom: 2rem;
          color: #111827;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .btn-primary {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 0.75rem 1.5rem;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-icon {
          padding: 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-icon-badge {
          position: relative;
          padding: 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          color: #6b7280;
        }

        .btn-icon-badge:hover {
          background: #f3f4f6;
        }

        .badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.125rem 0.375rem;
          border-radius: 999px;
          min-width: 1.125rem;
          text-align: center;
        }

        .auth-switch {
          margin-top: 1.5rem;
          text-align: center;
        }

        .auth-switch button {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .auth-switch button:hover {
          text-decoration: underline;
        }

        /* Dashboard */
        .dashboard {
          min-height: 100vh;
          background: #f9fafb;
        }

        .dashboard-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #667eea;
        }

        .logo h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info {
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border-radius: 999px;
          font-weight: 600;
          color: #374151;
        }

        .dashboard-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .section-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
        }

        .trees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .tree-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tree-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }

        .tree-card-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .tree-card-content {
          flex: 1;
          min-width: 0;
        }

        .tree-card-content h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tree-card-content p {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tree-card-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .role-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.625rem;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 999px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .members-count {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .tree-card-arrow {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem 2rem;
          color: #9ca3af;
        }

        .empty-state h3 {
          margin: 1rem 0 0.5rem;
          color: #6b7280;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
          animation: fadeIn 0.2s;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: scaleIn 0.2s;
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .modal-actions button {
          flex: 1;
        }

        /* Invites List */
        .invites-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .invite-item {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .invite-info h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: #111827;
        }

        .invite-info p {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .invite-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-success {
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .btn-success:hover {
          background: #059669;
        }

        .btn-danger {
          padding: 0.5rem 1rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        /* Tree Viewer */
        .tree-viewer {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }

        .tree-viewer-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          flex-shrink: 0;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #374151;
          transition: all 0.2s;
        }

        .btn-back:hover {
          background: #e5e7eb;
        }

        .tree-viewer-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .tree-canvas-container {
          flex: 1;
          position: relative;
          background: linear-gradient(to bottom, #f9fafb, #ffffff);
        }

        .tree-canvas-container canvas {
          width: 100%;
          height: 100%;
          cursor: grab;
        }

        .tree-canvas-container canvas:active {
          cursor: grabbing;
        }

        .canvas-controls {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .canvas-controls button {
          width: 40px;
          height: 40px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.25rem;
          font-weight: 600;
          transition: all 0.2s;
          color: #374151;
        }

        .canvas-controls button:hover {
          background: #f3f4f6;
          border-color: #667eea;
        }

        .person-details {
          width: 350px;
          background: white;
          border-left: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .person-details-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .person-details-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }

        .person-details-content {
          padding: 1.5rem;
        }

        .person-details-content p {
          margin-bottom: 1rem;
          color: #374151;
          line-height: 1.6;
        }

        .person-details-content strong {
          color: #111827;
          display: block;
          margin-bottom: 0.25rem;
        }

        /* Loading */
        .loading-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-screen p {
          margin-top: 1rem;
          font-size: 1.125rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .auth-decoration {
            position: static;
            transform: none;
            text-align: center;
            margin-bottom: 2rem;
          }

          .auth-decoration h1 {
            font-size: 2.5rem;
          }

          .auth-container {
            justify-content: center;
          }

          .person-details {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
          }
        }

        @media (max-width: 768px) {
          .trees-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .section-header .btn-primary {
            width: 100%;
          }

          .person-details {
            width: 100%;
          }
        }
      `}</style>
    </AuthProvider>
  );
};

export default FamilyTreeApp;