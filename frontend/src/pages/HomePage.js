// frontend/src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Feed from '../components/Feed';
import './HomePage.css'; // Keep your existing CSS

const HomePage = () => {
    const [activeTab, setActiveTab] = useState('local');
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    // Get user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // Redirect to splash if not logged in
            window.location.href = '/';
        }
    }, []);

    // Load activity when user or tab changes
    useEffect(() => {
        if (user) {
            loadActivity();
        }
    }, [activeTab, user]);

    const loadActivity = async () => {
        try {
            setLoading(true);
            setError(null);

            let url;
            if (activeTab === 'local') {
                url = `http://localhost:3000/api/checkins/local/${user._id}`;
            } else {
                url = 'http://localhost:3000/api/checkins/global';
            }

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setActivity(data.activity);
            } else {
                setError(data.error || 'Failed to load activity');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Load activity error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="home-page">
            <Header />
            
            <div className="container">
                <h1>Activity Feed</h1>

                {/* Tab buttons */}
                <div className="feed-tabs">
                    <button 
                        className={activeTab === 'local' ? 'active' : ''}
                        onClick={() => setActiveTab('local')}
                    >
                        Local Feed (Friends)
                    </button>
                    <button 
                        className={activeTab === 'global' ? 'active' : ''}
                        onClick={() => setActiveTab('global')}
                    >
                        Global Feed (All Users)
                    </button>
                </div>

                {/* Use your existing Feed component */}
                {loading && <div className="loading">Loading activity...</div>}
                {error && <div className="error">{error}</div>}
                {!loading && !error && <Feed activity={activity} />}
            </div>
        </div>
    );
};

export default HomePage;