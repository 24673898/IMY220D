// frontend/src/services/api.js
// This file contains all API calls for the frontend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Helper function to handle fetch requests
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication API calls
export const authAPI = {
    signup: (userData) => 
        fetchAPI('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        }),

    login: (email, password) =>
        fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    logout: () =>
        fetchAPI('/auth/logout', {
            method: 'POST',
        }),
};

// User API calls
export const userAPI = {
    getProfile: (userId) =>
        fetchAPI(`/users/${userId}`),

    updateProfile: (userId, userData) =>
        fetchAPI(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        }),

    deleteProfile: (userId) =>
        fetchAPI(`/users/${userId}`, {
            method: 'DELETE',
        }),

    getFriends: (userId) =>
        fetchAPI(`/users/${userId}/friends`),

    sendFriendRequest: (userId, friendId) =>
        fetchAPI(`/users/${userId}/friends`, {
            method: 'POST',
            body: JSON.stringify({ friendId }),
        }),

    unfriend: (userId, friendId) =>
        fetchAPI(`/users/${userId}/friends/${friendId}`, {
            method: 'DELETE',
        }),
};

// Project API calls
export const projectAPI = {
    getAllProjects: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return fetchAPI(`/projects?${params}`);
    },

    getProject: (projectId) =>
        fetchAPI(`/projects/${projectId}`),

    createProject: (projectData) =>
        fetchAPI('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData),
        }),

    updateProject: (projectId, projectData) =>
        fetchAPI(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData),
        }),

    deleteProject: (projectId) =>
        fetchAPI(`/projects/${projectId}`, {
            method: 'DELETE',
        }),

    checkoutProject: (projectId, userId) =>
        fetchAPI(`/projects/${projectId}/checkout`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        }),

    checkinProject: (projectId, checkinData) =>
        fetchAPI(`/projects/${projectId}/checkin`, {
            method: 'POST',
            body: JSON.stringify(checkinData),
        }),

    addMember: (projectId, userId) =>
        fetchAPI(`/projects/${projectId}/members`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        }),

    getActivity: (projectId) =>
        fetchAPI(`/projects/${projectId}/activity`),
};

// Activity Feed API calls
export const activityAPI = {
    getLocalFeed: (userId) =>
        fetchAPI(`/checkins/local/${userId}`),

    getGlobalFeed: () =>
        fetchAPI('/checkins/global'),
};

// Search API calls
export const searchAPI = {
    searchUsers: (query) =>
        fetchAPI(`/search/users?q=${encodeURIComponent(query)}`),

    searchProjects: (query, filters = {}) => {
        const params = new URLSearchParams({ q: query, ...filters }).toString();
        return fetchAPI(`/search/projects?${params}`);
    },

    searchCheckins: (query) =>
        fetchAPI(`/search/checkins?q=${encodeURIComponent(query)}`),
};



