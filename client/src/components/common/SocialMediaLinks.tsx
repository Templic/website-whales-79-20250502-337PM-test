import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaSpotify } from 'react-icons/fa';

/**
 * SocialMediaLinks Component
 * 
 * A component that displays social media links for users to follow updates.
 */
export default function SocialMediaLinks() {
  return (
    <div className="social-media-links bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
      <h2 className="text-3xl font-bold text-[#00ebd6] mb-6 text-center">Follow Us</h2>
      <div className="flex flex-wrap justify-center gap-6">
        <a 
          href="https://www.facebook.com/dalethewhalemusic" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
        >
          <FaFacebook className="text-4xl text-[#00ebd6] mb-2" />
          <span>Facebook</span>
        </a>
        <a 
          href="https://twitter.com/dalethewhale" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
        >
          <FaTwitter className="text-4xl text-[#00ebd6] mb-2" />
          <span>Twitter</span>
        </a>
        <a 
          href="https://www.instagram.com/dalethewhalemusic" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
        >
          <FaInstagram className="text-4xl text-[#00ebd6] mb-2" />
          <span>Instagram</span>
        </a>
        <a 
          href="https://www.youtube.com/@DiamondOrca777/featured" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
        >
          <FaYoutube className="text-4xl text-[#00ebd6] mb-2" />
          <span>YouTube</span>
        </a>
        <a 
          href="https://open.spotify.com/album/3NDnzf57NDrUwkv7QJ22Th" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center p-4 bg-[rgba(48,52,54,0.5)] rounded-lg hover:bg-[rgba(48,52,54,0.7)] transition-colors"
        >
          <FaSpotify className="text-4xl text-[#00ebd6] mb-2" />
          <span>Spotify</span>
        </a>
      </div>
    </div>
  );
}