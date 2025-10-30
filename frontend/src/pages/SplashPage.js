import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';
import './SplashPage.css';

const SplashPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleForm = () => {
        setIsSignUp(!isSignUp);
    };

    return (
        <div className="splash-container">
            <div className="splash-content" style={{
                transform: `translateY(${scrollY * 0.5}px)`
            }}>
                {/* Left Side - Branding and Features */}
                <div className="splash-left">
                    <div className="branding">
                        <div className="logo">
                            <div className="logo-icon">
                            <img src="/assets/images/logo.png" alt="Logo" width="60" height="60" />
                        </div>
                            <h1 className="site-title">FrankCodeHub</h1>
                        </div>
                        
                        <h2 className="tagline">Where Code Meets Collaboration</h2>
                        
                        <p className="description">
                            Join thousands of developers who share, collaborate, and build amazing projects 
                            together. Share your code with the community, discover trending projects and 
                            technologies, and connect with fellow developers worldwide.
                        </p>
                        
                        <ul className="features-list">
                            <li>Share your coding projects with the community</li>
                            <li>Collaborate with friends on shared projects</li>
                            <li>Discover trending projects and technologies</li>
                            <li>Simple version control with check-in/check-out system</li>
                            <li>Connect with developers worldwide</li>
                        </ul>
                    </div>
                </div>
                
                {/* Right Side - Forms */}
                <div className="splash-right">
                    <div className="form-container">
                        {!isSignUp ? (
                            <LoginForm onToggleForm={toggleForm} />
                        ) : (
                            <SignUpForm onToggleForm={toggleForm} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplashPage;