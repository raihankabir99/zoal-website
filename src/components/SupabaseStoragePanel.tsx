import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  FileText, 
  File, 
  Eye, 
  Sparkles, 
  AlertCircle, 
  RefreshCw,
  Folder,
  ArrowRight,
  Sliders,
  X
} from 'lucide-react';

interface StorageFile {
  name: string;
  id: string;
  size: number;
  mimeType: string;
  createdAt: string;
  url: string;
  optimizedUrl: string;
}

const BUCKETS = [
  { id: 'products', name: 'Products', description: 'Product catalog images', public: true, accepted: 'Images (PNG, JPG, WEBP, SVG)' },
  { id: 'categories', name: 'Categories', description: 'Category thumbnails', public: true, accepted: 'Images (PNG, JPG, WEBP)' },
  { id: 'brands', name: 'Brands', description: 'Brand partner logos', public: true, accepted: 'Images (PNG, JPG, WEBP, SVG)' },
  { id: 'avatars', name: 'Avatars', description: 'User profile pictures', public: true, accepted: 'Images (PNG, JPG, WEBP)' },
  { id: 'gallery', name: 'Gallery', description: 'Product detail galleries', public: true, accepted: 'Images & MP4 videos' },
  { id: 'banners', name: 'Banners', description: 'Marketing hero banners', public: true, accepted: 'Images (PNG, JPG, WEBP)' },
  { id: 'blogs', name: 'Blogs', description: 'Blog cover photos & assets', public: true, accepted: 'Images (PNG, JPG, WEBP)' },
  { id: 'documents', name: 'Documents', description: 'Catalogs, PDFs & manuals', public: true, accepted: 'Any file format (PDF, DOCX)' },
  { id: 'invoices', name: 'Invoices (Private)', description: 'Customer receipts & orders', public: false, accepted: 'PDFs & receipt images' }
];

export default function SupabaseStoragePanel() {
  const [activeBucket, setActiveBucket] = useState('products');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Image Optimization interactive state
  const [optWidth, setOptWidth] = useState(400);
  const [optHeight, setOptHeight] = useState(400);
  const [optQuality, setOptQuality] = useState(85);
  const [optResize, setOptResize] = useState<'cover' | 'contain' | 'fill'>('cover');

  // Preview Modal state
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [copiedField, setCopiedField] = useState<'public' | 'optimized' | 'name' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Media Library state extensions (Search, Sort, Tags, Folders, Bulk Selection)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Dynamically derive subfolders from the current file names
  const derivedFolders = useMemo(() => {
    const foldersSet = new Set<string>();
    files.forEach(f => {
      if (f.name.includes('/')) {
        const parts = f.name.split('/');
        // Extract the prefix directory
        const folderPath = parts.slice(0, parts.length - 1).join('/');
        if (folderPath) foldersSet.add(folderPath);
      }
    });
    return Array.from(foldersSet);
  }, [files]);

  // Dynamically assign or mock tags to files based on extension, bucket, or name
  const getFileTags = (file: StorageFile) => {
    const tags = ['all'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext) {
      if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
        tags.push('images');
      } else if (['pdf', 'docx', 'doc', 'txt', 'xlsx'].includes(ext)) {
        tags.push('documents');
      } else if (['mp4', 'webm', 'mov'].includes(ext)) {
        tags.push('videos');
      }
    }
    if (file.size > 1024 * 1024) {
      tags.push('large');
    } else {
      tags.push('optimized');
    }
    // Add custom business tags based on bucket name
    if (activeBucket === 'products') tags.push('apparel', 'luxury');
    if (activeBucket === 'coffee') tags.push('beans', 'cafe');
    if (activeBucket === 'invoices') tags.push('finance', 'receipts');
    return tags;
  };

  // Filter and sort the files
  const processedFiles = useMemo(() => {
    let result = [...files];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }

    // Subfolder filter
    if (selectedFolder !== 'all') {
      if (selectedFolder === 'root') {
        result = result.filter(f => !f.name.includes('/'));
      } else {
        result = result.filter(f => f.name.startsWith(selectedFolder + '/'));
      }
    }

    // Tag filter
    if (selectedTag !== 'all') {
      result = result.filter(f => getFileTags(f).includes(selectedTag));
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comparison = a.size - b.size;
      } else if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, selectedFolder, selectedTag, sortBy, sortOrder]);

  // Bulk Delete implementation
  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete these ${selectedFiles.length} files?`)) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    let successCount = 0;
    let failCount = 0;

    for (const filePath of selectedFiles) {
      try {
        const response = await fetch('/api/storage/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: activeBucket, path: filePath }),
        });
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    setSuccessMsg(`Bulk delete completed: ${successCount} files deleted successfully.${failCount > 0 ? ` ${failCount} files failed to delete.` : ''}`);
    setSelectedFiles([]);
    fetchFiles(activeBucket);
  };

  // Fetch files in active bucket
  const fetchFiles = async (bucketId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/storage/list?bucket=${bucketId}`);
      const data = await response.json();
      if (response.ok) {
        setFiles(data.files || []);
      } else {
        setError(data.error || 'Failed to retrieve files from Supabase.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Connection to backend failed. Please check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(activeBucket);
    setSearchQuery('');
    setSelectedTag('all');
    setSelectedFolder('all');
    setSelectedFiles([]);
  }, [activeBucket]);

  // Handle Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle Drop events
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle click to upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  // Upload file logic
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', activeBucket);

    try {
      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(`"${file.name}" uploaded successfully!`);
        fetchFiles(activeBucket);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(data.error || 'Failed to upload file.');
      }
    } catch (err: any) {
      setError('Upload failed. Please verify your connection.');
    } finally {
      setUploading(false);
    }
  };

  // Delete file logic
  const handleDeleteFile = async (filePath: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this file?')) {
      return;
    }

    try {
      const response = await fetch('/api/storage/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: activeBucket, path: filePath }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('File deleted successfully.');
        setFiles(prev => prev.filter(f => f.name !== filePath));
        if (selectedFile?.name === filePath) {
          setSelectedFile(null);
        }
      } else {
        setError(data.error || 'Failed to delete file.');
      }
    } catch (err: any) {
      setError('Could not delete file.');
    }
  };

  const copyToClipboard = (text: string, type: 'public' | 'optimized' | 'name') => {
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');

  // Generate customized live optimization URL for testing
  const getInteractiveOptimizedUrl = (fileName: string) => {
    const bucket = activeBucket;
    if (bucket === 'invoices') return `/api/storage/private/${bucket}/${fileName}`;
    
    // We proxy optimization through backend rendering parameters
    const params = new URLSearchParams({
      bucket,
      path: fileName,
      width: optWidth.toString(),
      height: optHeight.toString(),
      quality: optQuality.toString(),
      resize: optResize
    });
    return `/api/storage/optimize?${params.toString()}`;
  };

  // Get bucket description matching ID
  const bucketMeta = BUCKETS.find(b => b.id === activeBucket);

  return (
    <div className="bg-charcoal-dark text-white border border-white/10 rounded-lg p-6 max-w-7xl mx-auto my-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-gold-pure mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-widest font-semibold">ZOAL Luxury Hub</span>
          </div>
          <h2 className="text-2xl font-serif text-white font-semibold">Supabase Enterprise Storage</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage product images, category banners, lookbooks, blogs, and secure invoices using enterprise-grade CDN storage.
          </p>
        </div>
        <button 
          onClick={() => fetchFiles(activeBucket)}
          disabled={loading}
          className="mt-4 md:mt-0 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10 px-4 py-2.5 rounded-xs transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Storage
        </button>
      </div>

      {/* Grid Layout: Buckets Sidebar + Core View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Bucket selection sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <span className="block text-xs uppercase tracking-wider font-mono text-gray-500 font-semibold mb-3 px-2">Storage Buckets</span>
          {BUCKETS.map(bucket => {
            const isActive = activeBucket === bucket.id;
            return (
              <button
                key={bucket.id}
                onClick={() => {
                  setActiveBucket(bucket.id);
                  setSuccessMsg(null);
                  setError(null);
                }}
                className={`w-full text-left p-3.5 rounded-xs transition-all flex items-center gap-3 border ${
                  isActive 
                    ? 'bg-white/5 border-gold-pure text-white font-medium shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-xs ${isActive ? 'bg-gold-pure/10 text-gold-pure' : 'bg-white/5 text-gray-400'}`}>
                  <Folder className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{bucket.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${bucket.public ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {bucket.public ? 'PUBLIC' : 'SECURE'}
                    </span>
                  </div>
                  <span className="block text-[10px] text-gray-500 truncate mt-0.5">{bucket.description}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Notifications */}
          {error && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-4 rounded-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Storage Warning</p>
                <p className="text-xs text-red-300/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-4 rounded-xs flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Success</p>
                <p className="text-xs text-emerald-300/80 mt-1">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Bucket Spec Card */}
          <div className="bg-white/2 border border-white/5 rounded-xs p-4 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h3 className="text-base font-medium flex items-center gap-2">
                Active Bucket: <span className="text-gold-pure">{bucketMeta?.name}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {bucketMeta?.description}. Allowed filetypes: <span className="text-gray-300 font-mono text-[11px]">{bucketMeta?.accepted || 'Any binary format'}</span>.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xs px-3 py-1.5 self-start">
              <span className="text-[11px] font-mono text-gray-400">Security Rule:</span>
              <span className="text-xs font-mono font-medium text-gold-pure">
                {bucketMeta?.public ? 'Public CDN Cacheable' : 'Private JWT Verified proxy'}
              </span>
            </div>
          </div>

          {/* Upload Area */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xs p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
              dragActive 
                ? 'border-gold-pure bg-gold-pure/5' 
                : 'border-white/10 hover:border-white/20 bg-transparent'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            {uploading ? (
              <div className="space-y-3">
                <RefreshCw className="w-8 h-8 text-gold-pure animate-spin mx-auto" />
                <p className="text-sm font-mono text-gold-pure">Streaming to Supabase Storage...</p>
                <p className="text-xs text-gray-500">Allocating CDN chunks and caching headers</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-full inline-block mb-1 text-gold-pure">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">
                  Drag & Drop file here, or <span className="text-gold-pure hover:underline">browse files</span>
                </p>
                <p className="text-xs text-gray-500">
                  Maximum file size: {activeBucket === 'documents' ? '20MB' : '10MB'}. Drag catalog images, lookbooks, etc.
                </p>
              </div>
            )}
          </div>

          {/* Files Grid List */}
          <div className="space-y-4">
            {/* Search & Sort Panel */}
            <div className="bg-white/2 border border-white/5 p-4 rounded-xs space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search Input */}
                <div className="w-full md:w-auto flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search media files by name..."
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xs p-2 text-xs outline-none focus:border-gold-pure pl-8 font-sans"
                  />
                  <div className="absolute left-2.5 top-2.5 text-gray-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Subfolder Dropdown */}
                <div className="w-full md:w-auto flex items-center gap-2">
                  <span className="text-xs text-gray-500 shrink-0 font-mono">Folder:</span>
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="bg-black/40 border border-white/10 text-xs text-gray-300 rounded-xs p-2 outline-none focus:border-gold-pure w-full md:w-40 font-mono"
                  >
                    <option value="all">All Folders</option>
                    <option value="root">Root Directory</option>
                    {derivedFolders.map(folder => (
                      <option key={folder} value={folder}>{folder}</option>
                    ))}
                  </select>
                </div>

                {/* Sort dropdown */}
                <div className="w-full md:w-auto flex items-center gap-2">
                  <span className="text-xs text-gray-500 shrink-0 font-mono">Sort:</span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [by, order] = e.target.value.split('-') as [any, any];
                      setSortBy(by);
                      setSortOrder(order);
                    }}
                    className="bg-black/40 border border-white/10 text-xs text-gray-300 rounded-xs p-2 outline-none focus:border-gold-pure w-full md:w-48 font-mono"
                  >
                    <option value="date-desc">Latest Uploads</option>
                    <option value="date-asc">Oldest Uploads</option>
                    <option value="name-asc">Filename (A-Z)</option>
                    <option value="name-desc">Filename (Z-A)</option>
                    <option value="size-desc">File Size (Max-Min)</option>
                    <option value="size-asc">File Size (Min-Max)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Tag Clouds */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase font-mono text-gray-500 mr-2">Quick Tags:</span>
                {['all', 'images', 'documents', 'videos', 'large', 'optimized', 'luxury'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1 rounded-full text-[10px] font-mono transition-all border cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-gold-pure/15 text-gold-pure border-gold-pure/45'
                        : 'bg-black/20 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Selection and Operations bar */}
            {selectedFiles.length > 0 && (
              <div className="bg-gold-pure/5 border border-gold-pure/30 p-3 rounded-xs flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === processedFiles.length && processedFiles.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFiles(processedFiles.map(f => f.name));
                      } else {
                        setSelectedFiles([]);
                      }
                    }}
                    className="w-4 h-4 accent-gold-pure rounded-sm cursor-pointer"
                  />
                  <span className="text-xs text-gold-pure font-mono font-medium">
                    {selectedFiles.length} of {processedFiles.length} items selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-[10px] uppercase border border-white/10 rounded-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-1 bg-red-950 text-red-400 hover:bg-red-900 font-mono text-[10px] uppercase border border-red-500/30 rounded-xs transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Main view header */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-mono text-gray-500 font-semibold">
                Uploaded Files ({processedFiles.length} of {files.length})
              </span>
              {processedFiles.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedFiles.length === processedFiles.length) {
                      setSelectedFiles([]);
                    } else {
                      setSelectedFiles(processedFiles.map(f => f.name));
                    }
                  }}
                  className="text-xs text-gold-pure hover:underline font-mono"
                >
                  {selectedFiles.length === processedFiles.length ? 'Deselect All' : 'Select All Files'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-8 h-8 text-gold-pure animate-spin mx-auto mb-3" />
                <p className="text-xs text-gray-500 font-mono">Loading files list...</p>
              </div>
            ) : processedFiles.length === 0 ? (
              <div className="border border-white/5 rounded-xs py-12 text-center text-gray-500">
                <ImageIcon className="w-8 h-8 text-white/5 mx-auto mb-2" />
                <p className="text-sm font-medium">No files matching the current filters.</p>
                <p className="text-xs text-gray-600 mt-1">Try resetting search queries or directory selection tags.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {processedFiles.map(file => {
                  const isImg = isImage(file.mimeType);
                  const isVid = isVideo(file.mimeType);
                  const isSel = selectedFiles.includes(file.name);
                  return (
                    <div 
                      key={file.id || file.name}
                      className={`bg-white/2 border rounded-xs overflow-hidden transition-all group flex flex-col justify-between ${
                        isSel ? 'border-gold-pure/60 ring-1 ring-gold-pure/30' : 'border-white/5 hover:border-white/15'
                      }`}
                    >
                      {/* Media Preview Box */}
                      <div className="aspect-square bg-black/40 flex items-center justify-center relative overflow-hidden border-b border-white/5">
                        {/* Checkbox overlay */}
                        <div className="absolute top-2 left-2 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                          <input 
                            type="checkbox"
                            checked={isSel}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (isSel) {
                                setSelectedFiles(prev => prev.filter(name => name !== file.name));
                              } else {
                                setSelectedFiles(prev => [...prev, file.name]);
                              }
                            }}
                            className="w-4.5 h-4.5 accent-gold-pure rounded-sm cursor-pointer"
                          />
                        </div>

                        {isImg ? (
                          <img 
                            src={file.optimizedUrl || file.url} 
                            alt={file.name} 
                            className="object-cover w-full h-full group-hover:scale-105 transition-all duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : isVid ? (
                          <div className="text-center p-4">
                            <span className="text-[10px] font-mono text-gold-pure border border-gold-pure/20 bg-gold-pure/5 px-2 py-0.5 rounded-full inline-block mb-1">VIDEO</span>
                            <p className="text-xs font-semibold truncate text-gray-300">{file.name}</p>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            {file.mimeType.includes('pdf') ? (
                              <FileText className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            ) : (
                              <File className="w-8 h-8 text-gold-pure mx-auto mb-2" />
                            )}
                            <p className="text-xs font-semibold truncate text-gray-300">{file.name}</p>
                            <span className="text-[9px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded-xs text-gray-400 mt-2 inline-block">
                              {file.mimeType.split('/')[1] || 'FILE'}
                            </span>
                          </div>
                        )}

                        {/* Top-right Actions overlay */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(file);
                            }}
                            className="p-1.5 bg-black/80 hover:bg-black border border-white/10 rounded-xs text-white transition-all"
                            title="Interactive Image Optimizer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.name);
                            }}
                            className="p-1.5 bg-red-950/90 hover:bg-red-950 border border-red-500/30 rounded-xs text-red-400 transition-all"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* File Metadata Info */}
                      <div className="p-3">
                        <p className="text-xs font-medium truncate text-white" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 font-mono">
                          <span>{formatBytes(file.size)}</span>
                          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* URL Utility Bar */}
                      <div className="p-2 bg-white/2 border-t border-white/5 flex gap-1">
                        <button 
                          onClick={() => copyToClipboard(file.url, 'public')}
                          className="flex-1 py-1 px-1.5 bg-white/5 hover:bg-white/10 rounded-xs text-[10px] font-mono text-gray-300 hover:text-white flex items-center justify-center gap-1 transition-all"
                        >
                          <Copy className="w-2.5 h-2.5 text-gold-pure" />
                          Copy Link
                        </button>
                        {isImg && activeBucket !== 'invoices' && (
                          <button 
                            onClick={() => copyToClipboard(getInteractiveOptimizedUrl(file.name), 'optimized')}
                            className="py-1 px-1.5 bg-gold-pure/10 hover:bg-gold-pure/20 text-gold-pure border border-gold-pure/10 rounded-xs text-[10px] font-mono flex items-center gap-1 transition-all"
                            title="Copy image optimization rendering URL"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            Optimize
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED INTERACTIVE OPTIMIZATION WORKBENCH MODAL */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-charcoal-dark border border-white/10 rounded-xs w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-2">
                <Sparkles className="text-gold-pure w-5 h-5" />
                <h3 className="text-base font-serif text-white font-medium">Supabase CDN Image Optimization Workbench</h3>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Workbench Split Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 p-6 gap-6">
              
              {/* Left Column: Interactive Parameters Slider Control */}
              <div className="space-y-5 bg-white/2 border border-white/5 rounded-xs p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="w-4 h-4 text-gold-pure" />
                  <span className="text-xs uppercase tracking-wider font-mono text-gray-400 font-semibold">Optimization Engine Adjusters</span>
                </div>

                {/* Width parameter */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-gray-400">Target Width:</span>
                    <span className="text-gold-pure">{optWidth}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="1600" 
                    step="50"
                    value={optWidth}
                    onChange={(e) => setOptWidth(parseInt(e.target.value))}
                    className="w-full accent-gold-pure bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-1">
                    <span>50px</span>
                    <span>1600px (Desktop Full)</span>
                  </div>
                </div>

                {/* Height parameter */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-gray-400">Target Height:</span>
                    <span className="text-gold-pure">{optHeight}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="1600" 
                    step="50"
                    value={optHeight}
                    onChange={(e) => setOptHeight(parseInt(e.target.value))}
                    className="w-full accent-gold-pure bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-1">
                    <span>50px</span>
                    <span>1600px</span>
                  </div>
                </div>

                {/* Quality parameter */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-gray-400">JPEG/WEBP Quality:</span>
                    <span className="text-gold-pure">{optQuality}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={optQuality}
                    onChange={(e) => setOptQuality(parseInt(e.target.value))}
                    className="w-full accent-gold-pure bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-1">
                    <span>10% (Compress)</span>
                    <span>100% (Lossless)</span>
                  </div>
                </div>

                {/* Resize parameter */}
                <div>
                  <span className="block text-xs font-mono text-gray-400 mb-1.5">Image Fit / Resize Mode:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cover', 'contain', 'fill'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setOptResize(mode)}
                        className={`py-1.5 px-2 text-xs font-mono border rounded-xs transition-all ${
                          optResize === mode 
                            ? 'bg-gold-pure/10 border-gold-pure text-gold-pure' 
                            : 'bg-white/5 border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info summary */}
                <div className="bg-black/40 border border-white/5 rounded-xs p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                    <ArrowRight className="w-3 h-3 text-gold-pure" />
                    Supabase Optimization Features
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Automatically converts images to next-generation formats (like <strong>AVIF</strong> or <strong>WebP</strong>) based on client request headers, resizing on-the-fly and serving from edge nodes for sub-millisecond response times.
                  </p>
                </div>
              </div>

              {/* Right Column: Live comparative Preview */}
              <div className="flex flex-col justify-between space-y-4">
                <span className="text-xs uppercase tracking-wider font-mono text-gray-400 font-semibold block">Live CDN Render Preview</span>
                
                {/* Image Rendering Container */}
                <div className="flex-1 aspect-video bg-black/60 rounded-xs border border-white/10 overflow-hidden flex items-center justify-center relative">
                  {isImage(selectedFile.mimeType) ? (
                    <img 
                      src={getInteractiveOptimizedUrl(selectedFile.name)} 
                      alt="Live optimize preview"
                      className="max-h-full max-w-full object-contain"
                      style={{
                        width: optResize === 'fill' ? `${optWidth}px` : 'auto',
                        height: optResize === 'fill' ? `${optHeight}px` : 'auto',
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <FileText className="w-12 h-12 text-gold-pure mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Optimization is only applicable to image buckets.</p>
                    </div>
                  )}

                  {/* Badges indicating optimization is active */}
                  {activeBucket !== 'invoices' && (
                    <div className="absolute bottom-3 left-3 flex gap-1">
                      <span className="text-[9px] font-mono font-bold bg-gold-pure/90 text-charcoal-dark px-2 py-0.5 rounded-full shadow-md">
                        CDN OPTIMIZED
                      </span>
                      <span className="text-[9px] font-mono bg-black/80 text-white px-2 py-0.5 rounded-full shadow-md">
                        {optWidth}x{optHeight} @ {optQuality}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Copy Link Utility */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Public CDN Address:</span>
                    <button 
                      onClick={() => copyToClipboard(selectedFile.url, 'public')}
                      className="text-gold-pure hover:underline flex items-center gap-1"
                    >
                      {copiedField === 'public' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy public URL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    readOnly 
                    value={selectedFile.url}
                    className="w-full bg-black/50 border border-white/10 text-[11px] font-mono p-2 rounded-xs text-gray-400 select-all focus:outline-none"
                  />

                  {activeBucket !== 'invoices' && (
                    <>
                      <div className="flex items-center justify-between text-xs font-mono mt-2">
                        <span className="text-gold-pure flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Optimized Render Link:
                        </span>
                        <button 
                          onClick={() => copyToClipboard(getInteractiveOptimizedUrl(selectedFile.name), 'optimized')}
                          className="text-gold-pure hover:underline flex items-center gap-1"
                        >
                          {copiedField === 'optimized' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Optimized Link</span>
                            </>
                          )}
                        </button>
                      </div>
                      <input 
                        type="text" 
                        readOnly 
                        value={getInteractiveOptimizedUrl(selectedFile.name)}
                        className="w-full bg-black/50 border border-gold-pure/20 text-[11px] font-mono p-2 rounded-xs text-gold-pure/80 select-all focus:outline-none"
                      />
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4 bg-black/20 flex justify-end">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-all rounded-xs"
              >
                Close Workbench
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
