import React from 'react';

const AdminBadge = ({ isAdmin, style }) => {
    if (!isAdmin) return null;

    return (
        <span
            style={{
                display: 'inline-block',
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginLeft: '8px',
                ...style
            }}
        >
            ADMIN
        </span>
    );
};

export default AdminBadge;
