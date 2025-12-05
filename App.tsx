import React, { useState, useEffect, useRef } from 'react';
import { Settings, Moon, Sun, Lock, Unlock, ArrowRight } from 'lucide-react';
import { SiteConfig } from './types';
import { getStoredConfig, saveStoredConfig, getStoredTheme, saveStoredTheme } from './services/storageService';
import LinkCard from './components/LinkCard';
import AdminModal from './components/AdminModal';
import SearchBar, { SearchEngineType } from './components/SearchBar';

const App: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchEngine, setSearchEngine] = useState<SearchEngineType>('google');
  
  // Load initial state
  useEffect(() => {
    setConfig(getStoredConfig());
    const initialTheme = getStoredTheme();
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveStoredTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAdminClick = () => {
    if (isAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setIsLoginModalOpen(true);
      setLoginError(false);
      setPasswordInput('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPassword = config?.password || 'admin';
    if (passwordInput === currentPassword) {
      setIsAuthenticated(true);
      setIsLoginModalOpen(false);
      setIsAdminOpen(true);
    } else {
      setLoginError(true);
    }
  };

  const handleSaveConfig = (newConfig: SiteConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
  };

  const handleSearch = (query: string, engine: SearchEngineType) => {
    setSearchQuery(query);
    setSearchEngine(engine);
  };

  // Filter links logic
  const getFilteredCategories = () => {
    if (!config) return [];
    
    // Only filter if using site search and there is a query
    if (searchEngine === 'site' && searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      return config.categories.map(cat => ({
        ...cat,
        links: cat.links.filter(link => 
          link.title.toLowerCase().includes(lowerQuery) || 
          (link.description && link.description.toLowerCase().includes(lowerQuery)) ||
          link.url.toLowerCase().includes(lowerQuery)
        )
      })).filter(cat => cat.links.length > 0);
    }
    
    return config.categories;
  };

  const filteredCategories = getFilteredCategories();

  if (!config) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 text-slate-500">加载中...</div>;

  return (
    <div className="min-h-screen flex flex-col relative transition-colors duration-500">
      
      {/* Header */}
      <header className="sticky top-0 z-30 w-full glass border-b border-white/20 dark:border-white/5 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <span className="text-white font-bold text-lg">Z</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
              {config.title}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all active:scale-95 backdrop-blur-sm"
              aria-label="切换主题"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={handleAdminClick}
              className={`p-2.5 rounded-full transition-all active:scale-95 backdrop-blur-sm ${
                isAuthenticated 
                  ? 'text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/20' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
              }`}
              aria-label="设置"
            >
              {isAuthenticated ? <Settings size={18} /> : <Lock size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* Hero & Search Section */}
        <div className="flex flex-col items-center justify-center mb-16 space-y-8 animate-fade-in-up">
           <div className="text-center space-y-4">
             <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                探索<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">无限可能</span>
             </h2>
             <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto opacity-80">
                {config.description}
             </p>
           </div>
           
           <SearchBar onSearch={handleSearch} />
        </div>

        {/* Categories & Links */}
        <div className="space-y-12">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, idx) => (
              <section key={category.id} className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center space-x-3 mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                    {category.title}
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200/60 to-transparent dark:from-slate-700/60"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {category.links.map((link) => (
                    <LinkCard key={link.id} link={link} />
                  ))}
                </div>
              </section>
            ))
          ) : (
             <div className="text-center py-20 opacity-60">
                <p className="text-xl text-slate-500 dark:text-slate-400">没有找到相关链接...</p>
             </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 mt-auto border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} {config.title}. 
            <span className="mx-2 opacity-50">|</span> 
            <span className="opacity-80">Design by ZenNav</span>
          </p>
        </div>
      </footer>

      {/* Custom Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
             onClick={() => setIsLoginModalOpen(false)}
           ></div>
           
           {/* Modal Card */}
           <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border border-white/20 dark:border-slate-700">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
             <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                    <Lock size={32} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">管理员验证</h3>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-8 text-sm">请输入密码以进入后台管理</p>
                
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="输入密码"
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${loginError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all dark:text-white`}
                    />
                  </div>
                  {loginError && <p className="text-red-500 text-xs text-center animate-pulse">密码错误，请重试</p>}
                  
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center group"
                  >
                    解锁后台 <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
             </div>
             <div className="bg-slate-50 dark:bg-slate-950/50 p-4 text-center border-t border-slate-100 dark:border-slate-800">
               <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
               >
                 取消
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Admin Modal */}
      <AdminModal 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        config={config} 
        onSave={handleSaveConfig}
      />
    </div>
  );
};

export default App;