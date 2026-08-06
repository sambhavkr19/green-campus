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
  TreePine, 
  Recycle, 
  Zap, 
  Award,
  Layers,
  Terminal,
  Plus,
  Users,
  MapPin,
  Trophy,
  Filter,
  Sparkles,
  Check
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

interface Initiative {
  _id: string;
  title: string;
  description: string;
  category: 'TreePlantation' | 'EWasteCollection' | 'EnergyAudit' | 'WasteManagement' | 'AwarenessCampaign';
  location: string;
  organizerName?: string;
  organizer?: { name: string; department?: string };
  targetParticipants: number;
  currentParticipants: string[];
  status: string;
  createdAt: string;
}

interface LeaderboardEntry {
  id?: string;
  _id?: string;
  name: string;
  department: string;
  greenPoints: number;
  role: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'initiatives' | 'leaderboard' | 'tester' | 'overview'>('initiatives');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  // Initiatives state
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loadingInitiatives, setLoadingInitiatives] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinMsg, setJoinMsg] = useState<{ id: string; msg: string; success: boolean } | null>(null);

  // New initiative form state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newInitiative, setNewInitiative] = useState({
    title: '',
    description: '',
    category: 'TreePlantation',
    location: 'Central Lawn, CSJMU Campus',
    targetParticipants: 50,
  });
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [formData, setFormData] = useState({
    name: 'Aarav Student',
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
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data: HealthResponse = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Health check failed', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchInitiatives = async () => {
    setLoadingInitiatives(true);
    try {
      const res = await fetch('/api/initiatives');
      if (res.ok) {
        const data = await res.json();
        setInitiatives(data.initiatives || []);
      }
    } catch (err) {
      console.error('Failed to load initiatives', err);
    } finally {
      setLoadingInitiatives(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/initiatives/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchInitiatives();
    fetchLeaderboard();
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

  const handleJoinInitiative = async (id: string) => {
    if (!currentToken) {
      setActiveTab('tester');
      setAuthError('Please register or login first to participate and earn Green Points!');
      return;
    }

    setJoiningId(id);
    setJoinMsg(null);

    try {
      const res = await fetch(`/api/initiatives/${id}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to join initiative');
      }

      setJoinMsg({ id, msg: data.message || 'Joined successfully! +50 Green Points', success: true });
      
      if (data.updatedGreenPoints !== undefined && currentUser) {
        setCurrentUser({ ...currentUser, greenPoints: data.updatedGreenPoints });
      }

      fetchInitiatives();
      fetchLeaderboard();
    } catch (err: any) {
      setJoinMsg({ id, msg: err.message, success: false });
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentToken) {
      setShowCreateModal(false);
      setActiveTab('tester');
      setAuthError('Please register or login first to create a campus initiative!');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch('/api/initiatives', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInitiative)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to create initiative');

      setShowCreateModal(false);
      setNewInitiative({
        title: '',
        description: '',
        category: 'TreePlantation',
        location: 'Central Lawn, CSJMU Campus',
        targetParticipants: 50,
      });

      if (currentUser) {
        setCurrentUser({ ...currentUser, greenPoints: currentUser.greenPoints + 100 });
      }

      fetchInitiatives();
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const categoryIcons: Record<string, any> = {
    TreePlantation: TreePine,
    EWasteCollection: Recycle,
    EnergyAudit: Zap,
    WasteManagement: Leaf,
    AwarenessCampaign: Sparkles,
  };

  const filteredInitiatives = selectedCategory === 'All' 
    ? initiatives 
    : initiatives.filter(i => i.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Leaf className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Green CSJMU Initiative</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Full-Stack MERN
                </span>
              </div>
              <p className="text-xs text-slate-400">Chhatrapati Shahu Ji Maharaj University • Sustainability Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <Award className="w-4 h-4 text-emerald-400" />
                <div className="text-xs text-left">
                  <p className="font-semibold text-emerald-300">{currentUser.name}</p>
                  <p className="text-slate-400 text-[10px]">{currentUser.greenPoints} Green Points</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('tester')}
                className="text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg transition font-semibold"
              >
                Register / Login
              </button>
            )}

            <button
              onClick={fetchHealth}
              disabled={loadingHealth}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Refresh Health Check"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Health</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <nav className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'initiatives', label: 'Campus Drives', icon: Leaf },
              { id: 'leaderboard', label: 'Green Leaderboard', icon: Trophy },
              { id: 'tester', label: 'Auth & JWT Tester', icon: KeyRound },
              { id: 'overview', label: 'System Architecture', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
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

          {activeTab === 'initiatives' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/50"
            >
              <Plus className="w-4 h-4" /> Launch Campus Drive (+100 PTS)
            </button>
          )}
        </div>

        {/* Tab 1: Campus Initiatives */}
        {activeTab === 'initiatives' && (
          <div className="space-y-6">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Category:
              </span>
              {['All', 'TreePlantation', 'EWasteCollection', 'EnergyAudit', 'AwarenessCampaign'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat === 'All' ? 'All Initiatives' : cat}
                </button>
              ))}
            </div>

            {loadingInitiatives ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Fetching live CSJMU green drives...</span>
              </div>
            ) : filteredInitiatives.length === 0 ? (
              <div className="bg-slate-950 p-12 rounded-2xl border border-slate-800 text-center">
                <Leaf className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-300">No initiatives in this category yet</h3>
                <p className="text-xs text-slate-500 mt-1">Be the first to create an eco drive on CSJMU campus!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredInitiatives.map((item) => {
                  const Icon = categoryIcons[item.category] || Leaf;
                  const isJoined = currentUser && item.currentParticipants?.includes(currentUser.id);

                  return (
                    <div
                      key={item._id}
                      className="bg-slate-950 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                                {item.category}
                              </span>
                              <h3 className="text-base font-semibold text-white leading-snug">
                                {item.title}
                              </h3>
                            </div>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                            +50 PTS
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-teal-400" />
                            {item.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            {item.currentParticipants?.length || 0} / {item.targetParticipants} Registered
                          </span>
                        </div>
                      </div>

                      {joinMsg && joinMsg.id === item._id && (
                        <div className={`p-2.5 rounded-lg text-xs ${joinMsg.success ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}>
                          {joinMsg.msg}
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Organized by: <strong className="text-slate-300">{item.organizerName || item.organizer?.name || 'CSJMU Volunteer'}</strong>
                        </span>

                        <button
                          onClick={() => handleJoinInitiative(item._id)}
                          disabled={joiningId === item._id || isJoined}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            isJoined
                              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 cursor-default'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/40'
                          }`}
                        >
                          {joiningId === item._id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isJoined ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Registered
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Join & Earn 50 PTS
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Green Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  CSJMU Campus Green Leaderboard
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Top eco-conscious students, faculty, and departmental champions.</p>
              </div>
              <button
                onClick={fetchLeaderboard}
                disabled={loadingLeaderboard}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeaderboard ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            <div className="space-y-3">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.id || entry._id || idx}
                  className={`p-4 rounded-xl border flex items-center justify-between transition ${
                    idx === 0
                      ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/30'
                      : idx === 1
                      ? 'bg-gradient-to-r from-slate-900 to-slate-950 border-slate-700'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{entry.name}</p>
                      <p className="text-xs text-slate-400">{entry.department} • <span className="capitalize">{entry.role}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {entry.greenPoints} PTS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Auth & JWT Tester */}
        {activeTab === 'tester' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  JWT Authentication API Tester
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
                      <span className="text-xs text-slate-400">Authenticated Active Session</span>
                      <span className="text-xs text-emerald-400 font-semibold">{currentUser.greenPoints} Green Points</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                    <p className="text-xs text-slate-400">{currentUser.email} • {currentUser.department} ({currentUser.role})</p>
                  </div>
                )}

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto min-h-[220px] max-h-[350px]">
                  {authResult ? (
                    <pre className="text-emerald-300 leading-relaxed">
                      {JSON.stringify(authResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
                      <Code2 className="w-8 h-8 mb-2 opacity-50" />
                      <p>Submit registration or login to execute request to backend</p>
                    </div>
                  )}
                </div>
              </div>

              {currentToken && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Bearer Token:</p>
                  <p className="text-xs font-mono text-slate-300 truncate bg-slate-900 p-2 rounded border border-slate-800">
                    {currentToken}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: System Architecture Overview */}
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
                <h3 className="text-base font-semibold text-white mb-1">MongoDB & Fallback Layer</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Handled in <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">src/config/db.ts</code> with non-blocking buffer policy and in-memory store for smooth offline fallback.
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
          </div>
        )}

        {/* Modal: Create Eco-Drive */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" /> Launch Campus Initiative
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateInitiative} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initiative Title</label>
                  <input
                    type="text"
                    value={newInitiative.title}
                    onChange={(e) => setNewInitiative({ ...newInitiative, title: e.target.value })}
                    placeholder="e.g. Campus Herbal Garden Plantation Drive"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={newInitiative.category}
                    onChange={(e) => setNewInitiative({ ...newInitiative, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="TreePlantation">Tree Plantation</option>
                    <option value="EWasteCollection">E-Waste Collection</option>
                    <option value="EnergyAudit">Energy Audit</option>
                    <option value="AwarenessCampaign">Awareness Campaign</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Campus Location</label>
                  <input
                    type="text"
                    value={newInitiative.location}
                    onChange={(e) => setNewInitiative({ ...newInitiative, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={newInitiative.description}
                    onChange={(e) => setNewInitiative({ ...newInitiative, description: e.target.value })}
                    placeholder="Describe the goals and impact of this initiative..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5"
                  >
                    {createLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Publish Initiative (+100 PTS)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Green CSJMU Initiative • MERN Stack (Express, MongoDB, JWT Auth, Mongoose)
        </div>
      </footer>
    </div>
  );
}
