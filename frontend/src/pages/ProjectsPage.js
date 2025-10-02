import React from 'react';
import Header from '../components/Header';
import ProjectList from '../components/ProjectList';
import './ProjectsPage.css';

const ProjectsPage = () => {
    return (
        <div className="projects-page">
            <Header />
            <div className="projects-container">
                <div className="projects-header">
                    <h1>All Projects</h1>
                    <p>Browse through all available projects on FrankCodeHub</p>
                </div>
                <ProjectList />
            </div>
        </div>
    );
};

export default ProjectsPage;
