import React from "react";
import { Link } from "wouter";
import { useAuth } from "../hooks/useAuth";

export const AuthButton: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <span className="text-gray-600">Loading...</span>;
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm mr-2">
          Hello, {user?.username || "User"}
        </span>
        <a
          href="/api/logout"
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Log out
        </a>
      </div>
    );
  }

  return (
    <a
      href="/api/login"
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
    >
      Log in
    </a>
  );
};