'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Folder, Image as ImageIcon, FileText, File, Video, Music, Archive, Plus, Upload, X, Check, Heart, ChevronRight, FolderPlus } from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  fileName: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  extension: string;
  size: number;
  storagePath: string;
  thumbnailPath?: string | null;
  visibility: string;
  folderId?: string | null;
  createdAt: string;
}

interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
}

interface MediaPickerProps {
  onSelect: (url: string, item: MediaItem) => void;
  onClose: () => void;
  allowedTypes?: string[]; // e.g., ['IMAGE', 'PDF']
}

export default function MediaPicker({ onSelect, onClose, allowedTypes }: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchMedia();
    fetchFolders();
  }, [currentFolderId, search, selectedType]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/media?limit=50&trash=false`;
      if (currentFolderId) {
        url += `&folderId=${currentFolderId}`;
      } else if (currentFolderId === null) {
        url += `&folderId=null`;
      }
      if (selectedType !== 'ALL') {
        url += `&fileType=${selectedType}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchFolders = async () => {
    try {
      const url = `${BACKEND_URL}/api/media/folders?parentId=${currentFolderId || 'null'}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFolders(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/media/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewFolderName('');
        setShowFolderInput(false);
        fetchFolders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      const res = await fetch(`${BACKEND_URL}/api/media/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        fetchMedia();
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const navigateToFolder = async (folder: FolderItem | null) => {
    setCurrentFolderId(folder ? folder.id : null);
    setCurrentFolder(folder);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'PDF': return <FileText className="w-8 h-8 text-red-500" />;
      case 'VIDEO': return <Video className="w-8 h-8 text-amber-500" />;
      case 'AUDIO': return <Music className="w-8 h-8 text-emerald-500" />;
      case 'ZIP': return <Archive className="w-8 h-8 text-purple-500" />;
      default: return <File className="w-8 h-8 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] shadow-2xl rounded-3xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-heading font-black text-slate-900 dark:text-white">Media Asset Picker</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">WordPress Style DAM Console</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-450 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/[0.04] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-xl outline-none w-52 text-slate-900 dark:text-white"
              />
            </div>

            {/* Type Filters */}
            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] p-0.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-450">
              {['ALL', 'IMAGE', 'PDF', 'DOCUMENT', 'VIDEO', 'AUDIO'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${selectedType === t ? 'bg-amber-500 text-slate-950' : 'hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Create Folder Trigger */}
            <button
              onClick={() => setShowFolderInput(!showFolderInput)}
              className="btn-outline text-xs flex items-center gap-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>

            {/* Direct Upload Trigger */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* New Folder Inline Form */}
        {showFolderInput && (
          <form onSubmit={handleCreateFolder} className="p-4 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-3">
            <input
              type="text"
              placeholder="Enter folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-xl outline-none text-slate-900 dark:text-white flex-grow max-w-sm"
              required
            />
            <button type="submit" className="btn-primary text-xs py-2">Create Folder</button>
            <button type="button" onClick={() => setShowFolderInput(false)} className="btn-outline text-xs py-2">Cancel</button>
          </form>
        )}

        {/* Breadcrumb Navigation */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-white/[0.02] flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
          <button onClick={() => navigateToFolder(null)} className="hover:text-amber-500 cursor-pointer">Root</button>
          {currentFolder && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-800 dark:text-white font-black">{currentFolder.name}</span>
            </>
          )}
        </div>

        {/* Content Body */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex-grow p-6 overflow-y-auto ${dragActive ? 'bg-amber-500/5 border-2 border-dashed border-amber-500' : ''}`}
        >
          {uploading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 text-xs text-blue-700 animate-pulse">
              <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
              <span>Uploading asset to DAM filesystem...</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-slate-100 dark:bg-white/[0.02] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : folders.length === 0 && items.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <Upload className="w-12 h-12 text-slate-350 dark:text-slate-650 mx-auto" />
              <h3 className="font-heading font-extrabold text-sm text-slate-800 dark:text-white">This folder is empty</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Drag & drop files here to upload instantly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
              
              {/* Folders */}
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  onDoubleClick={() => navigateToFolder(folder)}
                  className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/[0.04] rounded-3xl hover:border-amber-500/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group text-center"
                >
                  <Folder className="w-10 h-10 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{folder.name}</span>
                </div>
              ))}

              {/* Media Items */}
              {items.map((item) => {
                const fileUrl = `${BACKEND_URL}/${item.storagePath}`;
                const thumbUrl = item.thumbnailPath ? `${BACKEND_URL}/${item.thumbnailPath}` : fileUrl;

                return (
                  <div
                    key={item.id}
                    onDoubleClick={() => onSelect(fileUrl, item)}
                    className="p-3 bg-white dark:bg-slate-800/30 border border-slate-150 dark:border-white/[0.04] rounded-3xl hover:border-amber-500 transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Preview Box */}
                      <div className="aspect-video w-full rounded-2xl bg-slate-50 dark:bg-slate-900/60 overflow-hidden flex items-center justify-center relative">
                        {item.fileType === 'IMAGE' ? (
                          <img
                            src={thumbUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          getFileIcon(item.fileType)
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {item.fileType}
                        </span>
                        <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                          {item.extension.toUpperCase()} · {(item.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelect(fileUrl, item)}
                      className="mt-3 btn-outline py-1.5 text-[10px] w-full text-center group-hover:bg-slate-900 group-hover:text-white transition-all"
                    >
                      Choose
                    </button>
                  </div>
                );
              })}

            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
