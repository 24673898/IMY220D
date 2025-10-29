import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import SplashPage from "./pages/SplashPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ProjectPage from "./pages/ProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import SearchPage from './pages/SearchPage';
import './styles/theme.css';

const App = () => {
    return (
        <ThemeProvider>
            <Router>
                <Routes>


                    {/* Splash Page */}
                    <Route path="/" element={<SplashPage />} />

                    {/* Login/Signup pages (same as splash for now) */}
                    <Route path="/login" element={<SplashPage />} />
                    <Route path="/signup" element={<SplashPage />} />

                    {/* Home Page */}
                    <Route path="/home" element={<HomePage />} />

                    {/* Profile Routes */}
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/:id" element={<ProfilePage />} />

                    {/* Projects listing - shows all projects */}
                    <Route path="/projects" element={<ProjectsPage />} />

                    {/* Project Routes - individual project page */}
                    <Route path="/project/:id" element={<ProjectPage />} />

                        {/* Search Route - Add this line */}
                    <Route path="/search" element={<SearchPage />} />

                    {/* Catch-all route - redirects to home */}
                    <Route path="*" element={<HomePage />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);