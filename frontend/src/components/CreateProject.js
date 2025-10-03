import React, { useState } from 'react';
import { projectAPI } from '../services/api';
import './CreateProject.css';

const CreateProject = ({ onCancel, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: '',
        hashtags: '',
        version: '1.0.0'
    });
    const [errors, setErrors] = useState({});

    const projectTypes = [
        'Web Application',
        'Mobile Application',
        'Desktop Application',
        'Library',
        'Framework',
        'API/Backend',
        'Game',
        'Tool/Utility',
        'Other'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Project name is required';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Project name must be at least 3 characters';
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'Project description is required';
        } else if (formData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }
        
        if (!formData.type) {
            newErrors.type = 'Please select a project type';
        }
        
        if (!formData.version.trim()) {
            newErrors.version = 'Version is required';
        } else if (!/^\d+\.\d+\.\d+$/.test(formData.version)) {
            newErrors.version = 'Version must be in format x.x.x (e.g., 1.0.0)';
        }
        
        // Validate hashtags format
        if (formData.hashtags.trim()) {
            const tags = formData.hashtags.split(',').map(tag => tag.trim());
            const invalidTags = tags.filter(tag => !tag.startsWith('#'));
            if (invalidTags.length > 0) {
                newErrors.hashtags = 'All hashtags must start with # (e.g., #react, #javascript)';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // Get current user from localStorage
            const currentUser = localStorage.getItem('user');
            if (!currentUser) {
                alert('Please log in to create a project');
                return;
            }

            const user = JSON.parse(currentUser);

            // Process hashtags
            const tags = formData.hashtags
                ? formData.hashtags.split(',').map(tag => tag.trim())
                : [];

            // Prepare data for API
            const projectData = {
                name: formData.name,
                description: formData.description,
                type: formData.type,
                ownerId: user._id,
                tags: tags,
                version: formData.version || '1.0.0'
            };

            console.log('Creating project with data:', projectData);

            // Make API call
            const data = await projectAPI.createProject(projectData);
            console.log('Project created successfully:', data);
            alert('Project created successfully!');
            onSave(data.project);
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Network error. Please try again.');
        }
    };

    return (
        <div className="create-project-card">
            <div className="create-project-header">
                <h2 className="create-project-title">Create New Project</h2>
                <p className="create-project-subtitle">Share your code with the community</p>
            </div>
            
            <form onSubmit={handleSubmit} className="create-project-form">
                <div className="form-group">
                    <label htmlFor="name">Project Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your project name"
                        className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                </div>
                
                <div className="form-group">
                    <label htmlFor="description">Description *</label>
                    <textarea
                        id="description"
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe what your project does..."
                        className={errors.description ? 'error' : ''}
                        maxLength={1000}
                    />
                    {errors.description && <span className="error-message">{errors.description}</span>}
                    <small className="char-count">{formData.description.length}/1000 characters</small>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="type">Project Type *</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className={errors.type ? 'error' : ''}
                        >
                            <option value="">Select project type</option>
                            {projectTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        {errors.type && <span className="error-message">{errors.type}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="version">Version *</label>
                        <input
                            type="text"
                            id="version"
                            name="version"
                            value={formData.version}
                            onChange={handleInputChange}
                            placeholder="1.0.0"
                            className={errors.version ? 'error' : ''}
                        />
                        {errors.version && <span className="error-message">{errors.version}</span>}
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="hashtags">Programming Languages (Hashtags)</label>
                    <input
                        type="text"
                        id="hashtags"
                        name="hashtags"
                        value={formData.hashtags}
                        onChange={handleInputChange}
                        placeholder="#react, #javascript, #nodejs"
                        className={errors.hashtags ? 'error' : ''}
                    />
                    {errors.hashtags && <span className="error-message">{errors.hashtags}</span>}
                    <small className="input-help">
                        Separate multiple hashtags with commas (e.g., #react, #javascript, #css)
                    </small>
                </div>
                
                <div className="file-upload-section">
                    <label className="file-upload-label">Project Files</label>
                    <div className="file-upload-area">
                        <div className="file-upload-content">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                                      stroke="currentColor" strokeWidth="2"/>
                                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                                <line x1="12" y1="9" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
                                <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <p>Drag and drop files here or <button type="button" className="browse-btn">browse</button></p>
                            <small>Supported formats: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .html, .css, .scss</small>
                        </div>
                    </div>
                </div>
                
                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="create-btn">
                        Create Project
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProject;