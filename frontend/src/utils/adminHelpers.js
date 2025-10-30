// Helper functions for admin functionality

// Check if a user is an admin
export const isAdmin = (user) => {
    return user && user.role === 'admin';
};

// Check if current user can edit a resource (is admin or is owner)
export const canEdit = (currentUser, resourceOwnerId) => {
    if (!currentUser) return false;
    if (isAdmin(currentUser)) return true;
    return currentUser._id === resourceOwnerId || currentUser._id.toString() === resourceOwnerId.toString();
};

// Check if current user can delete a resource (is admin or is owner)
export const canDelete = (currentUser, resourceOwnerId) => {
    return canEdit(currentUser, resourceOwnerId);
};

// Check if current user is a project member or admin
export const canAccessProject = (currentUser, project) => {
    if (!currentUser || !project) return false;
    if (isAdmin(currentUser)) return true;

    const userId = currentUser._id.toString();
    return project.members.some(memberId =>
        memberId === userId || memberId.toString() === userId
    );
};

// Get current user from localStorage
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

// Update user in localStorage (e.g., after role change)
export const updateStoredUser = (user) => {
    try {
        localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
        console.error('Error updating stored user:', error);
    }
};
