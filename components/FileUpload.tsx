import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadCloudIcon, FileTextIcon, XIcon, TrashIcon, LinkIcon } from './icons';
import { KnowledgeSource } from '../types';

interface FileUploadProps {
  sources: KnowledgeSource[];
  setSources: React.Dispatch<React.SetStateAction<KnowledgeSource[]>>;
}

const FileUpload: React.FC<FileUploadProps> = ({ sources, setSources }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const uploadingInProgress = useRef(new Set<string>());

  useEffect(() => {
    const filesToProcess = sources.filter(
      s => s.type === 'file' && s.status === 'uploading' && !uploadingInProgress.current.has(s.id)
    );

    filesToProcess.forEach(sourceToProcess => {
      uploadingInProgress.current.add(sourceToProcess.id);
      const interval = setInterval(() => {
        setSources(currentSources => {
          const sourceIndex = currentSources.findIndex(s => s.id === sourceToProcess.id);
          if (sourceIndex === -1) {
            clearInterval(interval);
            uploadingInProgress.current.delete(sourceToProcess.id);
            return currentSources;
          }
          const source = currentSources[sourceIndex];
          if (source.status !== 'uploading') {
            clearInterval(interval);
            uploadingInProgress.current.delete(sourceToProcess.id);
            return currentSources;
          }
          const newProgress = (source.progress || 0) + 20;
          const updatedSources = [...currentSources];
          if (newProgress >= 100) {
            updatedSources[sourceIndex] = { ...source, progress: 100, status: 'completed' };
            clearInterval(interval);
            uploadingInProgress.current.delete(sourceToProcess.id);
          } else {
            updatedSources[sourceIndex] = { ...source, progress: newProgress };
          }
          return updatedSources;
        });
      }, 250);
    });
  }, [sources, setSources]);


  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const addNewFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(
        (file) => file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    const sourcesToUpload: KnowledgeSource[] = validFiles.map(file => ({
        id: `${file.name}-${Date.now()}`,
        type: 'file',
        source: file,
        progress: 0,
        status: 'uploading',
    }));

    setSources((prevSources) => [...prevSources, ...sourcesToUpload]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addNewFiles(Array.from(e.dataTransfer.files));
    }
  }, [setSources]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        addNewFiles(Array.from(e.target.files));
        e.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  const handleAddUrl = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    
    // Basic URL validation
    try {
        new URL(urlInput);
    } catch (_) {
        alert("Please enter a valid URL.");
        return;
    }

    const newSource: KnowledgeSource = {
      id: `url-${Date.now()}`,
      type: 'url',
      source: urlInput.trim(),
      status: 'completed', // For URLs, we'll consider them immediately ready
    };
    setSources(prev => [...prev, newSource]);
    setUrlInput('');
  };

  const removeSource = (id: string) => {
    setSources((prevSources) => prevSources.filter(source => source.id !== id));
  };
  
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to remove all knowledge sources? This action cannot be undone.")) {
      setSources([]);
    }
  };

  const completedCount = sources.filter(s => s.status === 'completed').length;
  const uploadingCount = sources.filter(s => s.status === 'uploading').length;
  const totalCount = sources.length;
  const allUploadsDone = uploadingCount === 0 && totalCount > 0;

  let overallProgress = 0;
  if (totalCount > 0) {
      const fileSources = sources.filter(s => s.type === 'file');
      if (fileSources.length > 0) {
        const totalProgressValue = fileSources.reduce((acc, s) => acc + (s.progress || 0), 0);
        overallProgress = Math.round(totalProgressValue / fileSources.length);
      } else {
        overallProgress = 100; // All sources are URLs and are 'completed'
      }
  }
  
  const getSourceName = (source: KnowledgeSource): string => {
      return source.type === 'file' ? (source.source as File).name : source.source as string;
  }

  return (
    <div className="w-full">
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('file')}
                    className={`w-1/2 py-3 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'file'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                    Upload Files
                </button>
                <button
                    onClick={() => setActiveTab('url')}
                    className={`w-1/2 py-3 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'url'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                    Add from URL
                </button>
            </nav>
        </div>

        {activeTab === 'file' && (
            <label
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                ${isDragging ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloudIcon className={`w-10 h-10 mb-3 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-primary">Click to upload files</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF or DOCX (multiple files supported)</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" multiple accept=".pdf,.docx" onChange={handleFileChange} />
            </label>
        )}

        {activeTab === 'url' && (
            <div className="h-40 flex flex-col justify-center">
                <form onSubmit={handleAddUrl}>
                    <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website URL</label>
                    <input
                        type="url"
                        id="url-input"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/article"
                        className="w-full px-3 py-2 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!urlInput.trim()}
                        className="mt-3 w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Add URL
                    </button>
                </form>
            </div>
        )}

        {sources.length > 0 && (
            <div className="mt-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Knowledge Base Sources</h3>
                <button 
                    onClick={handleClearAll} 
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                    aria-label="Remove all sources"
                >
                    <TrashIcon className="w-4 h-4" />
                    Clear All
                </button>
            </div>
            
            <div className="mt-2 text-sm">
                {allUploadsDone ? (
                    <div className="p-2 text-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md font-medium">
                        All {completedCount} {completedCount > 1 ? 'sources are' : 'source is'} ready.
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-gray-700 dark:text-gray-300">
                                {`Processing ${uploadingCount} of ${sources.filter(s => s.type==='file').length} files...`}
                            </span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{overallProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${overallProgress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            <ul className="mt-2 space-y-2">
                {sources.map((source) => (
                <li key={source.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                    <div className="flex items-center space-x-2 overflow-hidden flex-1">
                        {source.type === 'file' ? 
                            <FileTextIcon className="w-5 h-5 text-primary flex-shrink-0" /> :
                            <LinkIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        }
                        <div className="flex-1 overflow-hidden">
                            <span className="text-sm truncate block" title={getSourceName(source)}>{getSourceName(source)}</span>
                            {source.status === 'uploading' && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mt-1">
                                    <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${source.progress}%` }}></div>
                                </div>
                            )}
                            {source.status === 'completed' && (
                                <p className="text-xs text-green-600 dark:text-green-400">Ready</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pl-2">
                        {source.status === 'uploading' && (
                            <span className="text-sm text-gray-500 w-9 text-right">{source.progress}%</span>
                        )}
                        <button onClick={() => removeSource(source.id)} className="p-1 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </li>
                ))}
            </ul>
            </div>
        )}
    </div>
  );
};

export default FileUpload;
