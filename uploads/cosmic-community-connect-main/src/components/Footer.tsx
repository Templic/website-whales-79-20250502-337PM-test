
import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative mt-20 pt-16 pb-8 bg-cosmic-dark/50 border-t border-cosmic-primary/10">
      <div className="wave-animation" />
      
      <div className="cosmic-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col">
            <Link to="/" className="flex items-center mb-4">
              <div className="relative w-10 h-10 mr-2">
                <div className="absolute inset-0 bg-cosmic-primary rounded-full opacity-20 animate-pulse-gentle"></div>
                <div className="absolute inset-2 bg-cosmic-primary rounded-full"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cosmic-light via-cosmic-primary to-cosmic-blue bg-clip-text text-transparent">
                Eventful Newness
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              A cosmic community hub for healing through connection and shared experiences.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-cosmic-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-muted-foreground hover:text-cosmic-primary transition-colors">
                  Community
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-muted-foreground hover:text-cosmic-primary transition-colors">
                  Shop
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-cosmic-primary transition-colors flex items-center">
                  <Instagram className="w-4 h-4 mr-2" /> Instagram
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-cosmic-primary transition-colors flex items-center">
                  <Twitter className="w-4 h-4 mr-2" /> Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-cosmic-primary transition-colors flex items-center">
                  <Youtube className="w-4 h-4 mr-2" /> YouTube
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Join Our Newsletter</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Stay updated with the latest cosmic releases and community events.
            </p>
            <form className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="cosmic-input"
              />
              <button type="submit" className="cosmic-button">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-cosmic-primary/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Eventful Newness. All rights reserved.
          </p>
          <div className="flex items-center mt-4 md:mt-0">
            <span className="text-sm text-muted-foreground flex items-center">
              Made with <Heart className="h-3 w-3 mx-1 text-cosmic-primary" /> for the cosmic community
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
