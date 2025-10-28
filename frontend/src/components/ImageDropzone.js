import React, { useState, useCallback } from 'react';
import './ImageDropzone.css';

const ImageDropzone = ({ onImageSelect, currentImage, maxSize = 5 * 1024 * 1024 }) => {
    const [dragActive, setDragActive] = useState(false);
    const [preview, setPreview] = useState(currentImage || null);
    const [error, setError] = useState('');

    const validateFile = (file) => {
        // Check file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (PNG, JPG, GIF, etc.)');
            return false;
        }

        // Check file size
        if (file.size > maxSize) {
            setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
            return false;
        }

        setError('');
        return true;
    };

    const handleFile = useCallback((file) => {
        if (!validateFile(file)) {
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Pass file to parent component
        onImageSelect(file);
    }, [onImageSelect, maxSize]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleRemove = (e) => {
        e.preventDefault();
        setPreview(null);
        setError('');
        onImageSelect(null);
    };

    return (
        <div className="image-dropzone-container">
            <div
                className={`image-dropzone ${dragActive ? 'drag-active' : ''} ${preview ? 'has-preview' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {preview ? (
                    <div className="image-preview-container">
                        <img src={preview} alt="Preview" className="image-preview" />
                        <div className="image-overlay">
                            <button
                                type="button"
                                className="remove-image-btn"
                                onClick={handleRemove}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Remove
                            </button>
                            <label htmlFor="file-upload" className="change-image-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5Z"
                                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Change
                            </label>
                        </div>
                    </div>
                ) : (
                    <label htmlFor="file-upload" className="dropzone-label">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="upload-icon">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p className="dropzone-text">
                            <span className="dropzone-highlight">Click to upload</span> or drag and drop
                        </p>
                        <p className="dropzone-hint">PNG, JPG, GIF up to {maxSize / (1024 * 1024)}MB</p>
                    </label>
                )}

                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="file-input"
                />
            </div>

            {error && (
                <div className="dropzone-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {error}
                </div>
            )}
        </div>
    );
};

export default ImageDropzone;
