import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Wand2, Download, LayoutGrid, Link as LinkIcon, Settings2, Eye, EyeOff, Loader2, GripVertical, Cloud, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { SiteConfig, Category, LinkItem } from '../types';
import { analyzeLink } from '../services/geminiService';
import { getGithubToken, saveGithubToken } from '../services/storageService';
import { syncService } from '../services/syncService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  onSave: (newConfig: SiteConfig) => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<SiteConfig>(config);
  const [activeTab, setActiveTab] = useState<number>(-1); // -1 for Global, -2 for Sync, 0+ for Categories
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Drag and Drop State
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [draggedLinkIdx, setDraggedLinkIdx] = useState<number | null>(null);

  // Sync State
  const [githubToken, setGithubToken] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Sync local config when prop changes or modal opens
  useEffect(() => {
    setLocalConfig(config);
    setGithubToken(getGithubToken());
    setSyncStatus('idle');
    setSyncMessage('');
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    
    // 1. Save locally immediately
    onSave(localConfig);

    // 2. Auto-sync to Cloud if token exists
    if (githubToken) {
       try {
         // Determine if we need to create or update
         const existingGist = await syncService.findGist(githubToken);
         
         if (existingGist) {
           await syncService.updateGist(githubToken, existingGist.id, localConfig);
           console.log("Auto-sync: Updated existing Gist");
         } else {
           await syncService.createGist(githubToken, localConfig);
           console.log("Auto-sync: Created new Gist");
         }
       } catch (e) {
         console.error("Auto-sync failed", e);
         // We alert the user but still close because local save succeeded
         alert("本地保存成功，但云端同步失败，请检查网络或 Token。");
       }
    }

    setIsSaving(false);
    onClose();
  };

  const handleUpdateGlobal = (field: keyof SiteConfig, value: string) => {
    setLocalConfig({ ...localConfig, [field]: value });
  };

  const handleUpdateCategory = (idx: number, field: keyof Category, value: string) => {
    const newCats = [...localConfig.categories];
    newCats[idx] = { ...newCats[idx], [field]: value };
    setLocalConfig({ ...localConfig, categories: newCats });
  };

  const handleAddCategory = () => {
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      title: '新分类',
      links: []
    };
    const newCats = [...localConfig.categories, newCat];
    setLocalConfig({
      ...localConfig,
      categories: newCats
    });
    setActiveTab(newCats.length - 1);
  };

  const handleDeleteCategory = (idx: number) => {
    if (confirm('确定要删除这个分类及其所有链接吗？')) {
      const newCats = localConfig.categories.filter((_, i) => i !== idx);
      setLocalConfig({ ...localConfig, categories: newCats });
      setActiveTab(Math.max(-1, activeTab - 1));
    }
  };

  const handleUpdateLink = (catIdx: number, linkIdx: number, field: keyof LinkItem, value: string) => {
    const newCats = [...localConfig.categories];
    const newLinks = [...newCats[catIdx].links];
    newLinks[linkIdx] = { ...newLinks[linkIdx], [field]: value };
    newCats[catIdx].links = newLinks;
    setLocalConfig({ ...localConfig, categories: newCats });
  };

  const handleAddLink = (catIdx: number) => {
    const newLink: LinkItem = {
      id: `link_${Date.now()}`,
      title: '',
      url: '',
      description: '',
      icon: 'Globe'
    };
    const newCats = [...localConfig.categories];
    newCats[catIdx].links.push(newLink);
    setLocalConfig({ ...localConfig, categories: newCats });
  };

  const handleDeleteLink = (catIdx: number, linkIdx: number) => {
    const newCats = [...localConfig.categories];
    newCats[catIdx].links = newCats[catIdx].links.filter((_, i) => i !== linkIdx);
    setLocalConfig({ ...localConfig, categories: newCats });
  };

  const handleAnalyzeLink = async (catIdx: number, linkIdx: number, url: string) => {
    if (!url) return;
    setAnalyzing(`${catIdx}-${linkIdx}`);
    const data = await analyzeLink(url);
    
    const newCats = [...localConfig.categories];
    const newLinks = [...newCats[catIdx].links];
    
    newLinks[linkIdx] = {
        ...newLinks[linkIdx],
        title: newLinks[linkIdx].title || data.title || '',
        description: newLinks[linkIdx].description || data.description || '',
        icon: data.icon || newLinks[linkIdx].icon || 'Globe'
    };

    newCats[catIdx].links = newLinks;
    setLocalConfig({ ...localConfig, categories: newCats });
    setAnalyzing(null);
  };

  const exportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localConfig, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- Drag and Drop Logic ---
  const handleCatDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCatIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleCatDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleCatDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCatIdx === null || draggedCatIdx === targetIndex) return;
    const activeCatId = activeTab >= 0 ? localConfig.categories[activeTab]?.id : null;
    const newCats = [...localConfig.categories];
    const [movedCat] = newCats.splice(draggedCatIdx, 1);
    newCats.splice(targetIndex, 0, movedCat);
    setLocalConfig({ ...localConfig, categories: newCats });
    if (activeCatId) {
        const newActiveIndex = newCats.findIndex(c => c.id === activeCatId);
        setActiveTab(newActiveIndex);
    }
    setDraggedCatIdx(null);
  };
  const handleLinkDragStart = (e: React.DragEvent, index: number) => {
    setDraggedLinkIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleLinkDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleLinkDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedLinkIdx === null || draggedLinkIdx === targetIndex || activeTab < 0) return;
    const newCats = [...localConfig.categories];
    const currentLinks = [...newCats[activeTab].links];
    const [movedLink] = currentLinks.splice(draggedLinkIdx, 1);
    currentLinks.splice(targetIndex, 0, movedLink);
    newCats[activeTab].links = currentLinks;
    setLocalConfig({ ...localConfig, categories: newCats });
    setDraggedLinkIdx(null);
  };

  // --- Sync Logic ---
  const handleSaveToken = () => {
    saveGithubToken(githubToken);
    setSyncStatus('success');
    setSyncMessage('Token 已保存');
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handlePushToCloud = async () => {
    if (!githubToken) {
      setSyncStatus('error');
      setSyncMessage('请先配置 GitHub Token');
      return;
    }
    setSyncStatus('loading');
    setSyncMessage('正在上传到云端...');
    try {
      const existingGist = await syncService.findGist(githubToken);
      if (existingGist) {
        await syncService.updateGist(githubToken, existingGist.id, localConfig);
      } else {
        await syncService.createGist(githubToken, localConfig);
      }
      setSyncStatus('success');
      setSyncMessage('上传成功！其他设备可下载使用。');
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      setSyncMessage('上传失败，请检查 Token 权限。');
    }
  };

  const handlePullFromCloud = async () => {
    if (!githubToken) {
      setSyncStatus('error');
      setSyncMessage('请先配置 GitHub Token');
      return;
    }
    setSyncStatus('loading');
    setSyncMessage('正在从云端下载...');
    try {
      const existingGist = await syncService.findGist(githubToken);
      if (existingGist) {
        const cloudConfig = await syncService.getGistContent(githubToken, existingGist.id);
        setLocalConfig(cloudConfig);
        setSyncStatus('success');
        setSyncMessage('下载成功！配置已更新。');
      } else {
        setSyncStatus('error');
        setSyncMessage('云端未找到 ZenNav 配置文件。');
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      setSyncMessage('下载失败，请检查网络或 Token。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
               <Settings2 size={20} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-800 dark:text-white">网站配置管理</h2>
             </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
             <button
              onClick={exportConfig}
              className="hidden sm:flex items-center px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="下载 JSON 配置文件"
            >
              <Download size={14} className="mr-1.5" /> 导出
            </button>
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-wait"
            >
                {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                {isSaving ? '同步中...' : '保存并关闭'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950/50 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-1">
            <button
                onClick={() => setActiveTab(-1)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                  activeTab === -1
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
            >
                <div className="flex items-center">
                    <Settings2 size={16} className="mr-2" />
                    <span>全局配置</span>
                </div>
                {activeTab === -1 && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
            </button>

            <button
                onClick={() => setActiveTab(-2)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                  activeTab === -2
                    ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
            >
                <div className="flex items-center">
                    <Cloud size={16} className="mr-2" />
                    <span>云端同步</span>
                </div>
                {activeTab === -2 && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
            </button>
            
            <div className="px-2 pt-4 pb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <LayoutGrid size={12} className="mr-1.5" /> 分类列表
              </label>
            </div>

            <div className="space-y-1">
                {localConfig.categories.map((cat, idx) => (
                <div
                    key={cat.id}
                    draggable
                    onDragStart={(e) => handleCatDragStart(e, idx)}
                    onDragOver={(e) => handleCatDragOver(e, idx)}
                    onDrop={(e) => handleCatDrop(e, idx)}
                    onClick={() => setActiveTab(idx)}
                    className={`w-full flex items-center rounded-xl text-sm font-medium transition-all cursor-pointer group relative ${
                    activeTab === idx
                        ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-slate-200 dark:ring-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    } ${draggedCatIdx === idx ? 'opacity-40 border-2 border-dashed border-indigo-300' : ''}`}
                >
                    <div className="p-3 pr-1 text-slate-300 dark:text-slate-600 cursor-grab hover:text-slate-500 dark:hover:text-slate-400">
                        <GripVertical size={14} />
                    </div>
                    <div className="flex-1 py-3 pr-4 flex items-center justify-between">
                        <span className="truncate">{cat.title}</span>
                        {activeTab === idx && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                    </div>
                </div>
                ))}
            </div>

            <button
              onClick={handleAddCategory}
              className="w-full flex items-center justify-center px-4 py-3 mt-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition text-sm"
            >
              <Plus size={16} className="mr-2" /> 新建分类
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900 custom-scrollbar">
            
            {/* Global Settings */}
            {activeTab === -1 && (
                <div className="space-y-6 animate-fade-in max-w-2xl">
                    <div className="flex items-center space-x-3 mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">全局基础设置</h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                    </div>
                    <div className="space-y-5">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">网站主标题</label>
                            <input
                                type="text"
                                value={localConfig.title}
                                onChange={(e) => handleUpdateGlobal('title', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition"
                            />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">网站描述 / 副标题</label>
                            <textarea
                                value={localConfig.description}
                                onChange={(e) => handleUpdateGlobal('description', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition resize-none"
                            />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">管理员密码修改</label>
                             <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={localConfig.password || ''}
                                    onChange={(e) => handleUpdateGlobal('password', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cloud Sync Settings */}
            {activeTab === -2 && (
                <div className="space-y-6 animate-fade-in max-w-2xl">
                     <div className="flex items-center space-x-3 mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">云端多设备同步</h3>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed mb-6">
                        <p className="font-bold mb-1">🔥 自动同步已开启</p>
                        <p>只要您在此处配置了 Token，每次修改内容并点击 <b>“保存并关闭”</b> 时，系统都会自动将最新配置同步到云端。</p>
                        <p>在新设备上，只需输入 Token 并点击“下载”即可恢复数据。</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div>
                             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">GitHub Access Token</label>
                             <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={githubToken}
                                    onChange={(e) => setGithubToken(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition"
                                    placeholder="ghp_xxxxxxxxxxxx"
                                />
                                <button 
                                    onClick={handleSaveToken}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition"
                                >
                                    保存
                                </button>
                             </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-4">
                            <button
                                onClick={handlePushToCloud}
                                disabled={!githubToken || syncStatus === 'loading'}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition flex items-center justify-center shadow-lg shadow-indigo-500/20"
                            >
                                {syncStatus === 'loading' ? <Loader2 className="animate-spin mr-2" /> : <Cloud className="mr-2" />}
                                手动上传 (覆盖云端)
                            </button>
                            <button
                                onClick={handlePullFromCloud}
                                disabled={!githubToken || syncStatus === 'loading'}
                                className="flex-1 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition flex items-center justify-center"
                            >
                                {syncStatus === 'loading' ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
                                手动下载 (覆盖本地)
                            </button>
                        </div>

                        {syncStatus !== 'idle' && (
                             <div className={`flex items-center p-3 rounded-lg text-sm ${
                                 syncStatus === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
                                 syncStatus === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 
                                 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                             }`}>
                                 {syncStatus === 'success' && <CheckCircle2 size={16} className="mr-2" />}
                                 {syncStatus === 'error' && <AlertCircle size={16} className="mr-2" />}
                                 {syncMessage}
                             </div>
                        )}
                    </div>
                </div>
            )}

            {/* Category Settings */}
            {activeTab >= 0 && localConfig.categories[activeTab] && (
               <div className="animate-fade-in space-y-8 pb-10">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-end gap-4">
                       <div className="flex-1 w-full">
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">分类名称</label>
                           <input
                                type="text"
                                value={localConfig.categories[activeTab].title}
                                onChange={(e) => handleUpdateCategory(activeTab, 'title', e.target.value)}
                                className="w-full text-2xl font-bold bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-2 dark:text-white transition"
                            />
                       </div>
                       <button
                           onClick={() => handleDeleteCategory(activeTab)}
                           className="flex items-center px-4 py-2.5 text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition text-sm font-medium w-full sm:w-auto justify-center"
                       >
                           <Trash2 size={16} className="mr-2" /> 删除分类
                       </button>
                   </div>
                   {/* Links List logic (same as before) */}
                   <div className="space-y-4">
                       <div className="flex items-center justify-between">
                           <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">链接列表 (可拖拽排序)</h4>
                           <span className="text-xs text-slate-400">{localConfig.categories[activeTab].links.length} 个链接</span>
                       </div>
                       {localConfig.categories[activeTab].links.map((link, linkIdx) => (
                           <div key={link.id} draggable onDragStart={(e) => handleLinkDragStart(e, linkIdx)} onDragOver={(e) => handleLinkDragOver(e, linkIdx)} onDrop={(e) => handleLinkDrop(e, linkIdx)} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition group ${draggedLinkIdx === linkIdx ? 'opacity-40 border-dashed border-indigo-400' : ''}`}>
                               <div className="flex gap-3">
                                   <div className="flex items-center text-slate-300 dark:text-slate-600 cursor-grab hover:text-slate-500 dark:hover:text-slate-400"><GripVertical size={20} /></div>
                                   <div className="flex-1 flex flex-col md:flex-row gap-4">
                                       <div className="flex-1 space-y-3">
                                           <div className="flex gap-2">
                                               <div className="flex-1 relative">
                                                    <input type="text" value={link.url} onChange={(e) => handleUpdateLink(activeTab, linkIdx, 'url', e.target.value)} placeholder="URL" className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-200" />
                                                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                               </div>
                                                <button onClick={() => handleAnalyzeLink(activeTab, linkIdx, link.url)} disabled={analyzing === `${activeTab}-${linkIdx}`} className="flex items-center px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                                    {analyzing === `${activeTab}-${linkIdx}` ? <Loader2 size={14} className="animate-spin" /> : <><Wand2 size={14} className="mr-1" /> AI 识别</>}
                                                </button>
                                           </div>
                                           <div className="flex gap-2">
                                                <input type="text" value={link.title} onChange={(e) => handleUpdateLink(activeTab, linkIdx, 'title', e.target.value)} placeholder="标题" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white" />
                                                <input type="text" value={link.icon || ''} onChange={(e) => handleUpdateLink(activeTab, linkIdx, 'icon', e.target.value)} placeholder="图标" className="w-24 md:w-32 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                           </div>
                                           <input type="text" value={link.description || ''} onChange={(e) => handleUpdateLink(activeTab, linkIdx, 'description', e.target.value)} placeholder="描述" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                       </div>
                                       <div className="flex md:flex-col justify-end">
                                           <button onClick={() => handleDeleteLink(activeTab, linkIdx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={18} /></button>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       ))}
                       <button onClick={() => handleAddLink(activeTab)} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-medium hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition flex items-center justify-center"><Plus size={20} className="mr-2" /> 添加新链接</button>
                   </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;