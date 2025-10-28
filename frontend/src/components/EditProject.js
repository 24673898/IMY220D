import React, { useState } from 'react';
import ImageDropzone from './ImageDropzone';
import { projectAPI } from '../services/api';
import './EditProject.css';

const EditProject = ({ project, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: project.name,
        description: project.description,
        type: project.type,
        version: project.version,
        hashtags: project.tags.join(', ')
    });
    const [errors, setErrors] = useState({});
    const [projectImageFile, setProjectImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

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

        if (validateForm()) {
            try {
                // Upload project image first if a new one was selected
                if (projectImageFile && project._id) {
                    setUploadingImage(true);
                    await projectAPI.uploadProjectImage(project._id, projectImageFile);
                }

                // Process hashtags
                const processedData = {
                    ...formData,
                    hashtags: formData.hashtags
                        ? formData.hashtags.split(',').map(tag => tag.trim())
                        : [],
                    id: project.id
                };

                console.log('Project updated:', processedData);
                onSave(processedData);
            } catch (error) {
                console.error('Error updating project:', error);
                alert(`Failed to update project: ${error.message}`);
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const handleImageSelect = (file) => {
        setProjectImageFile(file);
    };

    const handleDelete = () => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
        );
        
        if (confirmDelete) {
            console.log('Delete project:', project.name);
            // TODO: Implement delete functionality
            alert('Project deleted! (This would redirect to projects list)');
        }
    };

    return (
        <div className="edit-project-card">
            <div className="edit-project-header">
                <h2 className="edit-project-title">Edit Project</h2>
                <p className="edit-project-subtitle">Update your project information</p>
            </div>
            
            <form onSubmit={handleSubmit} className="edit-project-form">
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
                
                <div className="form-group">
                    <label>Project Cover Image</label>
                    <ImageDropzone
                        onImageSelect={handleImageSelect}
                        currentImage={project.projectImage}
                        maxSize={5 * 1024 * 1024}
                    />
                    <small className="input-help">
                        Upload a new cover image for your project (optional)
                    </small>
                </div>
                
                <div className="form-actions">
                    <div className="form-actions-left">
                        <button type="button" className="delete-btn" onClick={handleDelete}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" 
                                      stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            Delete Project
                        </button>
                    </div>
                    
                    <div className="form-actions-right">
                        <button type="button" className="cancel-btn" onClick={onCancel} disabled={uploadingImage}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={uploadingImage}>
                            {uploadingImage ? 'Uploading...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditProject;