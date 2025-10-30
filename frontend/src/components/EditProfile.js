import React, { useState } from 'react';
import ImageDropzone from './ImageDropzone';
import { userAPI } from '../services/api';
import './EditProfile.css';

const EditProfile = ({ user, onCancel, onSave }) => {
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        email: user?.email || '',
        bio: user?.bio || '',
        location: user?.location || '',
        website: user?.website || ''
    });
    const [errors, setErrors] = useState({});
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

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
        
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (formData.website && !formData.website.startsWith('http')) {
            newErrors.website = 'Website must start with http:// or https://';
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
            // Upload profile image first if a new one was selected
            if (profileImageFile) {
                setUploadingImage(true);
                await userAPI.uploadProfileImage(user.id, profileImageFile);
            }

            // Then save the rest of the profile data
            console.log('Profile updated:', formData);
            alert('Profile updated successfully!');
            onSave(formData);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleImageSelect = (file) => {
        setProfileImageFile(file);
    };

    return (
        <div className="edit-profile-card">
            <div className="edit-profile-header">
                <h2 className="edit-profile-title">Edit Profile</h2>
                <p className="edit-profile-subtitle">Update your personal information</p>
            </div>

            <form onSubmit={handleSubmit} className="edit-profile-form">
                <div className="form-group">
                    <label>Profile Image</label>
                    <ImageDropzone
                        onImageSelect={handleImageSelect}
                        currentImage={user?.profileImage}
                        maxSize={5 * 1024 * 1024}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={errors.firstName ? 'error' : ''}
                        />
                        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={errors.lastName ? 'error' : ''}
                        />
                        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className={errors.username ? 'error' : ''}
                        />
                        {errors.username && <span className="error-message">{errors.username}</span>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={errors.email ? 'error' : ''}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                        id="bio"
                        name="bio"
                        rows="4"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                        maxLength={500}
                    />
                    <small className="char-count">{formData.bio.length}/500 characters</small>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="location">Location</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="City, Country"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="website">Website</label>
                        <input
                            type="url"
                            id="website"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            placeholder="https://yourwebsite.com"
                            className={errors.website ? 'error' : ''}
                        />
                        {errors.website && <span className="error-message">{errors.website}</span>}
                    </div>
                </div>
                
                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={onCancel} disabled={uploadingImage}>
                        Cancel
                    </button>
                    <button type="submit" className="save-btn" disabled={uploadingImage}>
                        {uploadingImage ? 'Uploading...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;