import React, { useState } from 'react';
import { projectAPI } from '../services/api';
import ImageDropzone from './ImageDropzone';
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

            // Make API call to create project
            const data = await projectAPI.createProject(projectData);
            console.log('Project created successfully:', data);

            // Upload project image if one was selected
            if (projectImageFile && data.project?._id) {
                setUploadingImage(true);
                try {
                    await projectAPI.uploadProjectImage(data.project._id, projectImageFile);
                    console.log('Project image uploaded successfully');
                } catch (imageError) {
                    console.error('Error uploading project image:', imageError);
                    // Don't fail the whole operation if image upload fails
                    alert('Project created but image upload failed. You can add an image later.');
                }
                setUploadingImage(false);
            }

            alert('Project created successfully!');
            onSave(data.project);
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Network error. Please try again.');
            setUploadingImage(false);
        }
    };

    const handleImageSelect = (file) => {
        setProjectImageFile(file);
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
                
                <div className="form-group">
                    <label>Project Cover Image</label>
                    <ImageDropzone
                        onImageSelect={handleImageSelect}
                        maxSize={5 * 1024 * 1024}
                    />
                    <small className="input-help">
                        Upload a cover image for your project (optional)
                    </small>
                </div>
                
                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={onCancel} disabled={uploadingImage}>
                        Cancel
                    </button>
                    <button type="submit" className="create-btn" disabled={uploadingImage}>
                        {uploadingImage ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProject;