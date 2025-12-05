import React, { useState, useEffect } from 'react';
import { Search, Globe, Command } from 'lucide-react';

export type SearchEngineType = 'google' | 'baidu' | 'bing' | 'github' | 'site';

interface SearchBarProps {
  onSearch: (query: string, engine: SearchEngineType) => void;
}

const ENGINES: { id: SearchEngineType; name: string; url: string; placeholder: string }[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', placeholder: 'Google 搜索...' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', placeholder: '百度一下...' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', placeholder: '微软必应搜索...' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=', placeholder: '搜索代码仓库...' },
  { id: 'site', name: '站内', url: '', placeholder: '快速查找我的收藏...' },
];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [activeEngine, setActiveEngine] = useState<SearchEngineType>('google');
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const currentEngine = ENGINES.find(e => e.id === activeEngine) || ENGINES[0];

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() && activeEngine !== 'site') return;

    if (activeEngine === 'site') {
      // 站内搜索逻辑由父组件处理
    } else {
      window.open(`${currentEngine.url}${encodeURIComponent(query)}`, '_blank');
    }
  };

  // 实时触发站内搜索
  useEffect(() => {
    if (activeEngine === 'site') {
      onSearch(query, 'site');
    } else {
      // 切换回非站内搜索时，清除父组件的过滤状态
      onSearch('', activeEngine);
    }
  }, [query, activeEngine, onSearch]);

  return (
    <div className="w-full max-w-2xl mx-auto relative z-20">
      {/* Engine Tabs */}
      <div className="flex justify-center mb-4 space-x-1 sm:space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
        {ENGINES.map((engine) => (
          <button
            key={engine.id}
            onClick={() => setActiveEngine(engine.id)}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 backdrop-blur-md ${
              activeEngine === engine.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            {engine.name}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSearch}
        className={`relative group transition-all duration-300 ${
          isFocused ? 'scale-[1.02]' : 'scale-100'
        }`}
      >
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl transition-opacity duration-500 ${isFocused ? 'opacity-40' : 'opacity-0'}`}></div>
        
        <div className={`relative flex items-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl shadow-xl transition-all duration-300 ${
          isFocused ? 'ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/20' : ''
        }`}>
          
          <div className="pl-5 text-slate-400 dark:text-slate-500">
             {activeEngine === 'site' ? <Command size={20} /> : <Globe size={20} />}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={currentEngine.placeholder}
            className="w-full bg-transparent px-4 py-4 text-base sm:text-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            className="mr-2 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;