'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Folder, Image as ImageIcon, FileText, File, Video, Music, Archive, Plus, Upload, X, Trash, Trash2, Edit2, Move, Copy, Download, RefreshCw, FolderPlus, Eye, Link2, AlertCircle, ChevronRight, CornerDownRight, Check } from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  fileName: string;
  originalName: string;
  fileType: string;
  storageProvider: string;
  mimeType: string;
  extension: string;
  size: number;
  storagePath: string;
  thumbnailPath?: string | null;
  visibility: string;
  checksum: string;
  width?: number | null;
  height?: number | null;
  folderId?: string | null;
  createdAt: string;
  metadata?: any;
  usages?: { id: string; entityType: string; entityId: string; fieldName: string }[];
}

interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
  _count?: { mediaItems: number };
}

export default function MediaDashboard() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [trashMode, setTrashMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  
  // Edit & Rename states
  const [editingTitle, setEditingTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [replaceUploading, setReplaceUploading] = useState(false);

  // Preview overlay state
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchMedia();
    fetchFolders();
    setSelectedItem(null);
  }, [currentFolderId, search, selectedType, trashMode]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/media?limit=50&trash=${trashMode}`;
      if (currentFolderId && !trashMode) {
        url += `&folderId=${currentFolderId}`;
      } else if (currentFolderId === null && !trashMode) {
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
    if (trashMode) return;
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

  const handleRename = async () => {
    if (!selectedItem || !editingTitle) return;
    setIsRenaming(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/media/${selectedItem.id}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedItem({ ...selectedItem, title: editingTitle });
        fetchMedia();
        setIsRenaming(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplaceFile = async (files: FileList) => {
    if (!selectedItem || files.length === 0) return;
    setReplaceUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      const res = await fetch(`${BACKEND_URL}/api/media/${selectedItem.id}/replace`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('File contents replaced successfully!');
        fetchMedia();
        setSelectedItem(null);
      }
    } catch (err) {
      console.error(err);
    }
    setReplaceUploading(false);
  };

  const handleDelete = async (item: MediaItem, forcePermanent: boolean = false) => {
    const isPermanent = forcePermanent || trashMode;
    
    // Usage warning checks
    if (item.usages && item.usages.length > 0 && !isPermanent) {
      const confirmDelete = window.confirm(
        `WARNING: This file is currently used in ${item.usages.length} reference places (e.g. course thumbnails, blog covers). Deleting it may break layout structures. Do you still want to trash it?`
      );
      if (!confirmDelete) return;
    } else if (isPermanent) {
      const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${item.title}"? This action CANNOT be undone.`);
      if (!confirmDelete) return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/media/${item.id}?permanent=${isPermanent}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setSelectedItem(null);
        fetchMedia();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (item: MediaItem) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/media/${item.id}/restore`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setSelectedItem(null);
        fetchMedia();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Public asset URL copied to clipboard!');
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return <ImageIcon className="w-12 h-12 text-blue-500" />;
      case 'PDF': return <FileText className="w-12 h-12 text-red-500" />;
      case 'VIDEO': return <Video className="w-12 h-12 text-amber-500" />;
      case 'AUDIO': return <Music className="w-12 h-12 text-emerald-500" />;
      case 'ZIP': return <Archive className="w-12 h-12 text-purple-500" />;
      default: return <File className="w-12 h-12 text-slate-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-[70vh]">
      
      {/* Sidebar Filters */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-6">
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest block w-fit">
            Directories
          </span>
          <h3 className="font-heading font-black text-slate-900 dark:text-white">Quick Filters</h3>
        </div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => { setTrashMode(false); setSelectedType('ALL'); }}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${!trashMode && selectedType === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <span>📁 All Assets</span>
          </button>
          
          <button
            onClick={() => { setTrashMode(false); setSelectedType('IMAGE'); }}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${!trashMode && selectedType === 'IMAGE' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <span>🖼️ Images</span>
          </button>

          <button
            onClick={() => { setTrashMode(false); setSelectedType('PDF'); }}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${!trashMode && selectedType === 'PDF' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <span>📄 PDFs</span>
          </button>

          <button
            onClick={() => { setTrashMode(false); setSelectedType('DOCUMENT'); }}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${!trashMode && selectedType === 'DOCUMENT' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <span>📝 Documents</span>
          </button>

          <button
            onClick={() => { setTrashMode(true); }}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${trashMode ? 'bg-red-500 text-white shadow-md' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'}`}
          >
            <span>🗑️ Trash Directory</span>
          </button>
        </nav>
      </div>

      {/* Main Files Area */}
      <div className={`${selectedItem ? 'lg:col-span-6' : 'lg:col-span-9'} bg-white dark:bg-slate-900/40 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-6`}>
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-white/[0.04] pb-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search DAM assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-xl outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {!trashMode && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowFolderInput(!showFolderInput)}
                className="btn-outline text-xs flex items-center gap-1.5 cursor-pointer py-2.5"
              >
                <FolderPlus className="w-4 h-4" />
                <span>New Folder</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer py-2.5"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Asset</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* New Folder Form */}
        {showFolderInput && (
          <form onSubmit={handleCreateFolder} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
            <input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] rounded-xl outline-none text-slate-900 dark:text-white flex-grow max-w-sm"
              required
            />
            <button type="submit" className="btn-primary text-xs py-2">Create</button>
            <button type="button" onClick={() => setShowFolderInput(false)} className="btn-outline text-xs py-2">Cancel</button>
          </form>
        )}

        {/* Folder Breadcrumb */}
        {!trashMode && (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <button onClick={() => { setCurrentFolderId(null); setCurrentFolder(null); }} className="hover:text-amber-500 cursor-pointer">Root</button>
            {currentFolder && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-800 dark:text-white font-black">{currentFolder.name}</span>
              </>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-slate-100 dark:bg-white/[0.02] rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : folders.length === 0 && items.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Folder className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-heading font-extrabold text-sm text-slate-800 dark:text-white">This folder is empty</h3>
            <p className="text-xs text-slate-500">Drag files here or upload to fill this folder directory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Folders */}
            {!trashMode && folders.map((folder) => (
              <div
                key={folder.id}
                onDoubleClick={() => { setCurrentFolderId(folder.id); setCurrentFolder(folder); }}
                className="p-4 bg-slate-50/60 dark:bg-slate-850/40 border border-slate-150 dark:border-white/[0.04] rounded-3xl hover:border-amber-500/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
              >
                <Folder className="w-10 h-10 text-amber-500 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{folder.name}</span>
              </div>
            ))}

            {/* Media Files */}
            {items.map((item) => {
              const fileUrl = `${BACKEND_URL}/${item.storagePath}`;
              const thumbUrl = item.thumbnailPath ? `${BACKEND_URL}/${item.thumbnailPath}` : fileUrl;

              return (
                <div
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setEditingTitle(item.title); }}
                  onDoubleClick={() => setPreviewItem(item)}
                  className={`p-3 bg-white dark:bg-slate-800/10 border rounded-3xl hover:border-amber-500 transition-all flex flex-col justify-between cursor-pointer group relative ${selectedItem?.id === item.id ? 'border-amber-500 ring-2 ring-amber-500/15' : 'border-slate-150 dark:border-white/[0.04]'}`}
                >
                  <div className="space-y-3">
                    {/* Media Frame Preview */}
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

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); copyUrlToClipboard(fileUrl); }}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    {trashMode ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestore(item); }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-emerald-600 cursor-pointer"
                          title="Restore"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item, true); }}
                          className="p-1.5 bg-slate-50 hover:bg-red-50 rounded-lg text-red-550 cursor-pointer"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item, false); }}
                        className="p-1.5 bg-slate-50 hover:bg-red-50 rounded-lg text-red-500 cursor-pointer ml-auto"
                        title="Trash"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* Details Inspector Sidebar */}
      {selectedItem && (
        <div className="lg:col-span-3 bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-white/[0.06] shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/[0.04] pb-4">
            <h3 className="font-heading font-black text-slate-900 dark:text-white text-sm">Asset Details</h3>
            <button onClick={() => setSelectedItem(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="space-y-4 text-xs">
            <div className="aspect-video w-full rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center">
              {selectedItem.fileType === 'IMAGE' ? (
                <img
                  src={`${BACKEND_URL}/${selectedItem.thumbnailPath || selectedItem.storagePath}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                getFileIcon(selectedItem.fileType)
              )}
            </div>

            <div className="space-y-1.5 border-b border-slate-50 dark:border-white/[0.02] pb-4">
              {/* Rename Form */}
              {isRenaming ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="px-2 py-1 text-xs border rounded-lg bg-white w-full text-slate-900"
                  />
                  <button onClick={handleRename} className="p-1 bg-emerald-500 text-white rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsRenaming(false)} className="p-1 bg-slate-100 text-slate-500 rounded-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{selectedItem.title}</span>
                  <button onClick={() => setIsRenaming(true)} className="p-1 text-slate-400 hover:text-amber-500">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">File Name</span>
                <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 truncate w-32 text-right">{selectedItem.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Type</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{selectedItem.fileType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Size</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{(selectedItem.size / 1024).toFixed(1)} KB</span>
              </div>
              {selectedItem.width && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Dimensions</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{selectedItem.width}x{selectedItem.height} px</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Checksum</span>
                <span className="font-mono text-[9px] text-slate-400 truncate w-32 text-right" title={selectedItem.checksum}>{selectedItem.checksum}</span>
              </div>
            </div>

            {/* Usage Tracking details */}
            <div className="border-t border-slate-100 dark:border-white/[0.04] pt-4 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Usage Tracking</span>
              </h4>
              {selectedItem.usages && selectedItem.usages.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400">This asset is actively referenced by:</p>
                  {selectedItem.usages.map((usage) => (
                    <div key={usage.id} className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{usage.entityType} ({usage.fieldName})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-450 dark:text-slate-500 italic">This asset is not currently in use.</p>
              )}
            </div>

            {/* Replace File trigger */}
            {!trashMode && (
              <div className="border-t border-slate-100 dark:border-white/[0.04] pt-4 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Replace File</h4>
                <p className="text-[9px] text-slate-400">Overwrite file content on disk while preserving configuration links.</p>
                <button
                  onClick={() => replaceInputRef.current?.click()}
                  disabled={replaceUploading}
                  className="w-full btn-outline text-[10px] py-2"
                >
                  {replaceUploading ? 'Uploading...' : 'Choose Replacement File'}
                </button>
                <input
                  type="file"
                  ref={replaceInputRef}
                  onChange={(e) => e.target.files && handleReplaceFile(e.target.files)}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Overlay Lightbox */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col h-[80vh] border border-slate-200">
            <div className="p-4 border-b border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
              <h3 className="font-heading font-black text-slate-900 dark:text-white text-sm">{previewItem.title}</h3>
              <button onClick={() => setPreviewItem(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow bg-slate-950 flex items-center justify-center overflow-hidden relative">
              {previewItem.fileType === 'IMAGE' && (
                <img
                  src={`${BACKEND_URL}/${previewItem.storagePath}`}
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {previewItem.fileType === 'VIDEO' && (
                <video
                  src={`${BACKEND_URL}/${previewItem.storagePath}`}
                  controls
                  className="max-w-full max-h-full"
                />
              )}

              {previewItem.fileType === 'PDF' && (
                <iframe
                  src={`${BACKEND_URL}/${previewItem.storagePath}`}
                  className="w-full h-full border-0"
                />
              )}

              {previewItem.fileType !== 'IMAGE' && previewItem.fileType !== 'VIDEO' && previewItem.fileType !== 'PDF' && (
                <div className="text-center space-y-4 text-white">
                  {getFileIcon(previewItem.fileType)}
                  <p className="text-sm">Preview not supported for .{previewItem.extension} files.</p>
                  <a
                    href={`${BACKEND_URL}/${previewItem.storagePath}`}
                    download
                    className="btn-primary text-xs inline-block"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
