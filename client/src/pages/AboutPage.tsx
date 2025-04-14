import React from "react";

const AboutPage: React.FC = () => {
  return (
    <div className="about-container">
      <h1>About</h1>
      <p>This is the About page of the React application.</p>
      <p>
        This React application works alongside the Flask application. To visit the Flask pages, 
        use the navigation in the Flask templates.
      </p>
    </div>
  );
};

export default AboutPage;