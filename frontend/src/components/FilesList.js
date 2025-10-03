import React, { useState, useEffect } from 'react';
import './FilesList.css';

const FilesList = ({ projectId, canUpload = false, onFilesUpdate }) => {
    const [viewMode, setViewMode] = useState('list');
    const [sortBy, setSortBy] = useState('name');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFiles = async () => {
            if (!projectId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`/api/projects/${projectId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch project');
                }

                const data = await response.json();
                setFiles(data.project.files || []);
            } catch (err) {
                console.error('Error fetching files:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [projectId]);

    // Dummy files data for display format reference
    const filesDataOld = [
        {
            id: 1,
            name: 'server.js',
            type: 'javascript',
            size: '12.4 KB',
            lastModified: '2 hours ago',
            modifiedBy: 'Frank Johnson',
            path: '/backend/',
            isFolder: false,
            language: 'JavaScript'
        },
        {
            id: 2,
            name: 'components',
            type: 'folder',
            size: '8 files',
            lastModified: '1 day ago',
            modifiedBy: 'Sarah Wilson',
            path: '/src/',
            isFolder: true,
            language: null
        },
        {
            id: 3,
            name: 'Dashboard.jsx',
            type: 'react',
            size: '8.7 KB',
            lastModified: '2 days ago',
            modifiedBy: 'Mike Chen',
            path: '/src/components/',
            isFolder: false,
            language: 'React/JSX'
        },
        {
            id: 4,
            name: 'styles.css',
            type: 'css',
            size: '5.2 KB',
            lastModified: '3 days ago',
            modifiedBy: 'Lisa Brown',
            path: '/src/',
            isFolder: false,
            language: 'CSS'
        },
        {
            id: 5,
            name: 'auth.js',
            type: 'javascript',
            size: '15.8 KB',
            lastModified: '5 days ago',
            modifiedBy: 'Frank Johnson',
            path: '/backend/middleware/',
            isFolder: false,
            language: 'JavaScript'
        },
        {
            id: 6,
            name: 'package.json',
            type: 'json',
            size: '2.1 KB',
            lastModified: '1 week ago',
            modifiedBy: 'Frank Johnson',
            path: '/',
            isFolder: false,
            language: 'JSON'
        },
        {
            id: 7,
            name: 'README.md',
            type: 'markdown',
            size: '3.4 KB',
            lastModified: '1 week ago',
            modifiedBy: 'Frank Johnson',
            path: '/',
            isFolder: false,
            language: 'Markdown'
        },
        {
            id: 8,
            name: 'assets',
            type: 'folder',
            size: '15 files',
            lastModified: '1 week ago',
            modifiedBy: 'Sarah Wilson',
            path: '/public/',
            isFolder: true,
            language: null
        }
    ];

    const getFileIcon = (file) => {
        if (file.isFolder) {
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="folder-icon">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" 
                          stroke="currentColor" strokeWidth="2"/>
                </svg>
            );
        }

        switch (file.type) {
            case 'javascript':
            case 'react':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="js-icon">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 12h8M8 16h6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                );
            case 'css':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="css-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                              stroke="currentColor" strokeWidth="2"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                );
            case 'json':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="json-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                              stroke="currentColor" strokeWidth="2"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                        <path d="M10 12h4M10 16h2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                );
            case 'markdown':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="md-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                              stroke="currentColor" strokeWidth="2"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                        <path d="M7 13l3 3 7-7" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                );
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="file-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                              stroke="currentColor" strokeWidth="2"/>
                        <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                );
        }
    };

    const handleFileClick = (file) => {
        console.log('View file:', file.name);
        // TODO: Implement file viewing functionality
    };

    const handleDownloadFile = (file, e) => {
        e.stopPropagation();
        console.log('Download file:', file.name);
        // TODO: Implement file download functionality
    };

    const sortedFiles = [...files].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            case 'size':
                return (a.size || 0) - (b.size || 0);
            case 'modified':
                return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
            default:
                return 0;
        }
    });

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const now = new Date();
        const fileDate = new Date(timestamp);
        const diffMs = now - fileDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return fileDate.toLocaleDateString();
    };

    const getFileType = (filename) => {
        if (!filename) return 'file';
        const ext = filename.split('.').pop().toLowerCase();
        const typeMap = {
            'js': 'javascript',
            'jsx': 'react',
            'ts': 'javascript',
            'tsx': 'react',
            'css': 'css',
            'scss': 'css',
            'json': 'json',
            'md': 'markdown',
            'html': 'html',
            'py': 'python',
            'java': 'java'
        };
        return typeMap[ext] || 'file';
    };

    if (loading) {
        return (
            <div className="files-list-container">
                <div className="files-header">
                    <h3 className="files-title">Project Files</h3>
                </div>
                <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>
                    Loading files...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="files-list-container">
                <div className="files-header">
                    <h3 className="files-title">Project Files</h3>
                </div>
                <div className="error" style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
                    Failed to load files: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="files-list-container">
            <div className="files-header">
                <h3 className="files-title">Project Files</h3>

                <div className="files-controls">
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/>
                                <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/>
                                <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/>
                                <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2"/>
                                <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2"/>
                                <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                                <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </button>
                    </div>

                    <div className="sort-control">
                        <label htmlFor="sort-files">Sort by:</label>
                        <select
                            id="sort-files"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="name">Name</option>
                            <option value="size">Size</option>
                            <option value="modified">Last Modified</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={`files-content ${viewMode}`}>
                {sortedFiles.map((file, index) => {
                    const fileType = getFileType(file.name);
                    const fileObj = {
                        ...file,
                        type: fileType,
                        isFolder: false
                    };

                    return (
                        <div
                            key={file._id || index}
                            className="file-item file"
                            onClick={() => handleFileClick(file)}
                        >
                            <div className="file-icon-container">
                                {getFileIcon(fileObj)}
                            </div>

                            <div className="file-info">
                                <div className="file-name-section">
                                    <span className="file-name">{file.name}</span>
                                </div>

                                <div className="file-details">
                                    <span className="file-path">{file.path || '/'}</span>
                                    <span className="file-size">{formatFileSize(file.size)}</span>
                                </div>

                                <div className="file-meta">
                                    <span className="file-modified">
                                        Uploaded {formatTimeAgo(file.uploadedAt)}
                                    </span>
                                </div>
                            </div>

                            <div className="file-actions">
                                <button
                                    className="file-action-btn"
                                    onClick={(e) => handleDownloadFile(file, e)}
                                    title="Download file"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sortedFiles.length === 0 && (
                <div className="empty-files">
                    <div className="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                                  stroke="currentColor" strokeWidth="2"/>
                        </svg>
                    </div>
                    <h4>No Files Found</h4>
                    <p>This project doesn't have any files yet. Check in some files to get started.</p>
                </div>
            )}
        </div>
    );
};

export default FilesList;