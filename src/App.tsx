import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  CheckCircle2, 
  Server, 
  Database, 
  ShieldCheck, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  UserCheck, 
  RefreshCw, 
  Code2, 
  Activity, 
  TreePine, 
  Recycle, 
  Zap, 
  Award,
  Layers,
  Terminal,
  ArrowRight
} from 'lucide-react';

interface HealthResponse {
  status: string;
  project: string;
  timestamp: string;
  environment: string;
  database: {
    status: string;
    connected: boolean;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  greenPoints: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tester' | 'routes' | 'models'>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Auth tester state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [formData, setFormData] = useState({
    name: 'CSJMU Student',
    email: 'student@csjmu.ac.in',
    password: 'password123',
    department: 'Computer Science & Engineering',
    role: 'student'
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: HealthResponse = await res.json();
      setHealth(data);
    } catch (err: any) {
      setHealthError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthResult(null);

    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = authMode === 'register' 
      ? formData 
      : { email: formData.email, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      setAuthResult(data);
      if (data.token) {
        setCurrentToken(data.token);
        setCurrentUser(data.user);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Auth execution failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFetchMe = async () => {
    if (!currentToken) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch user profile');
      setCurrentUser(data.user);
      setAuthResult(data);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Leaf className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Green CSJMU Initiative</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Backend Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">Chhatrapati Shahu Ji Maharaj University • Sustainability Stack</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHealth}
              disabled={loadingHealth}
              className="flex items-center gap-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Refresh Health Check"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{loadingHealth ? 'Checking...' : 'Check API'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${health?.database.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300">
                DB: <strong className="text-slate-100">{health?.database.status || 'Active'}</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Status Banner */}
        <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 rounded-2xl p-6 border border-emerald-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Backend Foundation Operational
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Backend Architecture Active & Ready for Integration
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                The Express.js backend, MongoDB/Mongoose connection layer, JWT Authentication middleware, 
                asynchronous error handling, and environment configuration have been initialized.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-[280px]">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400">Server Port</p>
                <p className="text-base font-bold text-emerald-400">3000</p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400">Auth System</p>
                <p className="text-base font-bold text-teal-400">JWT + bcrypt</p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-400">ORM / DB</p>
                <p className="text-base font-bold text-indigo-400">Mongoose</p>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Architecture Overview', icon: Layers },
            { id: 'tester', label: 'Live JWT Auth Tester', icon: KeyRound },
            { id: 'routes', label: 'API Routes & Endpoints', icon: Server },
            { id: 'models', label: 'Data Models & Schemas', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab 1: Architecture Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Express Server Entry</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Configured in <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">server.ts</code> with Vite development middleware, CORS policy, body parsers, and global error handlers.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Port: 3000</span>
                <span className="text-emerald-400 font-mono">/api/*</span>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">MongoDB Connection</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Handled in <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">src/config/db.ts</code> with connection string sanitizer, event listeners, and safe fallback mechanisms.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Database</span>
                <span className="text-emerald-400 font-mono">green_csjmu</span>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">JWT Security Layer</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Authorization middleware in <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">src/middleware/auth.ts</code> protecting routes, enforcing Bearer tokens, and checking roles.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Security</span>
                <span className="text-purple-400 font-mono">30-day JWT</span>
              </div>
            </div>

            {/* Campus Sustainability Modules preview */}
            <div className="md:col-span-2 lg:col-span-3 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                Planned Campus Sustainability Initiatives
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Data models created for tracking campus initiatives, student involvement, green points reward leaderboard, and e-waste collection.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 transition">
                  <TreePine className="w-6 h-6 text-emerald-400 mb-2" />
                  <h4 className="text-sm font-medium text-slate-200">Tree Plantation</h4>
                  <p className="text-xs text-slate-400 mt-1">Campus drive logging & participant tracking</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:border-teal-500/40 transition">
                  <Recycle className="w-6 h-6 text-teal-400 mb-2" />
                  <h4 className="text-sm font-medium text-slate-200">E-Waste Drive</h4>
                  <p className="text-xs text-slate-400 mt-1">Recycling collection points & rewards</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:border-amber-500/40 transition">
                  <Zap className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="text-sm font-medium text-slate-200">Energy Auditing</h4>
                  <p className="text-xs text-slate-400 mt-1">Departmental energy saving campaigns</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:border-indigo-500/40 transition">
                  <Award className="w-6 h-6 text-indigo-400 mb-2" />
                  <h4 className="text-sm font-medium text-slate-200">Green Points</h4>
                  <p className="text-xs text-slate-400 mt-1">Gamified sustainability reward leaderboard</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live JWT Auth Tester */}
        {activeTab === 'tester' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  Auth API Tester
                </h3>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`px-3 py-1 rounded-md font-medium transition ${authMode === 'register' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    Register
                  </button>
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`px-3 py-1 rounded-md font-medium transition ${authMode === 'login' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    Login
                  </button>
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : authMode === 'register' ? (
                    <>
                      <UserPlus className="w-4 h-4" /> Register User API
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Login User API
                    </>
                  )}
                </button>
              </form>

              {currentToken && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <button
                    onClick={handleFetchMe}
                    disabled={authLoading}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium py-2 rounded-lg border border-slate-700 transition flex items-center justify-center gap-2 text-xs"
                  >
                    <UserCheck className="w-4 h-4" /> Test GET /api/auth/me (Protected Route)
                  </button>
                </div>
              )}
            </div>

            {/* Response console */}
            <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    API Response Console
                  </h3>
                  {authResult && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      HTTP 200 / 201 OK
                    </span>
                  )}
                </div>

                {authError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 mb-4">
                    <strong>API Error:</strong> {authError}
                  </div>
                )}

                {currentUser && (
                  <div className="mb-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Authenticated Profile</span>
                      <span className="text-xs text-emerald-400 font-semibold">{currentUser.greenPoints} Green Points</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                    <p className="text-xs text-slate-400">{currentUser.email} • {currentUser.department} ({currentUser.role})</p>
                  </div>
                )}

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto min-h-[200px] max-h-[350px]">
                  {authResult ? (
                    <pre className="text-emerald-300 leading-relaxed">
                      {JSON.stringify(authResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
                      <Code2 className="w-8 h-8 mb-2 opacity-50" />
                      <p>Submit the form to execute live request to Express endpoints</p>
                    </div>
                  )}
                </div>
              </div>

              {currentToken && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Active JWT Bearer Token:</p>
                  <p className="text-xs font-mono text-slate-300 truncate bg-slate-900 p-2 rounded border border-slate-800">
                    {currentToken}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Routes & Endpoints */}
        {activeTab === 'routes' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Registered API Endpoints</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold rounded">GET</span>
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-200">/api/health</p>
                  <p className="text-xs text-slate-400 mt-0.5">Returns API status, database state, environment info, and server timestamp.</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold rounded">POST</span>
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-200">/api/auth/register</p>
                  <p className="text-xs text-slate-400 mt-0.5">Registers new student/faculty with hashed password and generates JWT token.</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold rounded">POST</span>
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-200">/api/auth/login</p>
                  <p className="text-xs text-slate-400 mt-0.5">Authenticates credentials, compares bcrypt password hash, and yields JWT.</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold rounded">GET</span>
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-200">/api/auth/me</p>
                  <p className="text-xs text-slate-400 mt-0.5">Protected route requiring valid Bearer JWT. Returns current user profile.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Data Models */}
        {activeTab === 'models' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-semibold text-emerald-400 font-mono mb-2">User Model Schema (src/models/userModel.ts)</h4>
              <ul className="text-xs text-slate-300 space-y-2 font-mono bg-slate-900 p-4 rounded-xl border border-slate-800">
                <li>• <span className="text-blue-400">name</span>: String (required)</li>
                <li>• <span className="text-blue-400">email</span>: String (unique, required)</li>
                <li>• <span className="text-blue-400">password</span>: String (hashed via bcrypt)</li>
                <li>• <span className="text-blue-400">role</span>: 'student' | 'faculty' | 'admin'</li>
                <li>• <span className="text-blue-400">department</span>: String</li>
                <li>• <span className="text-blue-400">greenPoints</span>: Number (default: 0)</li>
                <li>• <span className="text-slate-500">timestamps</span>: createdAt, updatedAt</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-semibold text-teal-400 font-mono mb-2">Initiative Model Schema (src/models/initiativeModel.ts)</h4>
              <ul className="text-xs text-slate-300 space-y-2 font-mono bg-slate-900 p-4 rounded-xl border border-slate-800">
                <li>• <span className="text-blue-400">title</span>: String (required)</li>
                <li>• <span className="text-blue-400">description</span>: String</li>
                <li>• <span className="text-blue-400">category</span>: TreePlantation | EWaste | EnergyAudit ...</li>
                <li>• <span className="text-blue-400">organizer</span>: ObjectId (ref: 'User')</li>
                <li>• <span className="text-blue-400">currentParticipants</span>: [ObjectId]</li>
                <li>• <span className="text-blue-400">status</span>: 'Upcoming' | 'Active' | 'Completed'</li>
                <li>• <span className="text-slate-500">timestamps</span>: createdAt, updatedAt</li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Green CSJMU Initiative Hackathon Project • Full-Stack Express + MongoDB + JWT + React Stack
        </div>
      </footer>
    </div>
  );
}
