import React from 'react';
import { useLocation } from 'wouter';

interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className = "" }) => {
  const [, navigate] = useLocation();
  // For this implementation, we're assuming the user is not logged in
  // In a real app, you would check the auth state
  const user = null; 

  return (
    <div className={className}>
      {user ? (
        <div className="relative">
          <button
            className="flex items-center space-x-1 focus:outline-none"
            aria-expanded="false"
            aria-haspopup="true"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </button>
          
          {/* User dropdown menu would go here */}
        </div>
      ) : (
        <button 
          className="
            px-4 py-1.5 rounded-md 
            bg-gradient-to-r from-cyan-500 to-purple-600 
            text-white text-sm font-medium 
            hover:from-cyan-600 hover:to-purple-700 
            transition-colors
          "
          onClick={() => navigate('/login')}
        >
          Log In
        </button>
      )}
    </div>
  );
};

export default UserMenu;