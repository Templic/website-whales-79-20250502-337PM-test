import React from "react";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

export function SocialLinks() {
  return (
    <div className="flex space-x-4">
      <a 
        href="https://facebook.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary"
      >
        <FaFacebook size={24} />
      </a>
      <a 
        href="https://instagram.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary"
      >
        <FaInstagram size={24} />
      </a>
      <a 
        href="https://twitter.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary"
      >
        <FaTwitter size={24} />
      </a>
    </div>
  );
}
