import React from "react";

const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for does not exist.</p>
      <p>
        <a href="/">Return to Home</a>
      </p>
    </div>
  );
};

export default NotFoundPage;