import React from "react";

const HomePage: React.FC = () => {
  return (
    <div className="home-container">
      <h1>Home Page</h1>
      <p>Welcome to the React portion of the hybrid application.</p>
      <p>
        This React application works alongside the Flask application. To visit the Flask pages, 
        use the navigation in the Flask templates.
      </p>
    </div>
  );
};

export default HomePage;