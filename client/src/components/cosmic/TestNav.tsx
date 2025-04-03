import React from 'react';
import { Link, useLocation } from 'wouter';
import CosmicButton from '../ui/cosmic-button';

const TestNav: React.FC = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/cosmic-components', label: 'Cosmic Components' },
    { path: '/about', label: 'About' },
  ];

  return (
    <div className="flex justify-center mb-8 p-4">
      <nav className="flex space-x-4 bg-gray-800/50 backdrop-blur-md p-2 rounded-full">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a>
              <CosmicButton
                variant={isActive(item.path) ? "cosmic" : "ghost"}
                size="sm"
              >
                {item.label}
              </CosmicButton>
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default TestNav;