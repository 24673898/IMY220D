// frontend/src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Feed from '../components/Feed';
import './HomePage.css';

const HomePage = () => {
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

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="home-page">
            <Header />

            <div className="container">
                <Feed />
            </div>
        </div>
    );
};

export default HomePage;