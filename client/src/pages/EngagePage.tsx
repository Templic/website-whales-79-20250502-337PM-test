
import { FaYoutube, FaSpotify, FaInstagram } from "react-icons/fa";

export default function EngagePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Engage</h1>
      
      <section className="banner bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-6">🐳DÅLË LØVËS WHÄLËS🐳 / Dale Loves Whales</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-[#00ebd6]">Music & Podcast</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <FaYoutube className="text-2xl mr-2 text-red-500" />
                <a href="https://youtu.be/jzpvkq3Krjg?si=m3CHcSZrFWPsoeoU" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  Debut Song "Feels So Good"
                </a>
              </li>
              <li className="flex items-center">
                <FaSpotify className="text-2xl mr-2 text-green-500" />
                <a href="https://untitled.stream/library/project/0isqrDZPIX7zPnGlN4GUn" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  Stream "Feels So Good"
                </a>
              </li>
              <li className="flex items-center">
                <FaSpotify className="text-2xl mr-2 text-green-500" />
                <a href="https://creators.spotify.com/pod/show/dale-ham" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  🕊🕉🕊💟🕊️ THE 🌺♾️🌺 IRIDESCENT 🌺♾️🌺DOVE 🕊🕉🕊
                </a>
              </li>
              <li className="flex items-center">
                <FaSpotify className="text-2xl mr-2 text-green-500" />
                <a href="https://open.spotify.com/album/3NDnzf57NDrUwkv7QJ22Th" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  Spotify Album
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-[#00ebd6]">YouTube Channels</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <FaYoutube className="text-2xl mr-2 text-red-500" />
                <a href="https://www.youtube.com/@DiamondOrca777/featured" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  🐳DÅLË LØVËS WHÄLËS🐳 @DiamondOrca777
                </a>
              </li>
              <li className="flex items-center">
                <FaYoutube className="text-2xl mr-2 text-red-500" />
                <a href="https://www.youtube.com/channel/UCewdO8AO3aBVzgWzeMG5paQ" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  AC3-2085 @AC3-2085
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-[#00ebd6]">Instagram</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <FaInstagram className="text-2xl mr-2 text-pink-500" />
                <a href="https://www.instagram.com/dale_loves_whales?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  Dale Loves Whales
                </a>
              </li>
              <li className="flex items-center">
                <FaInstagram className="text-2xl mr-2 text-pink-500" />
                <a href="https://www.instagram.com/dalethewhalemusic/" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  dalethewhalemusic
                </a>
              </li>
              <li className="flex items-center">
                <FaInstagram className="text-2xl mr-2 text-pink-500" />
                <a href="https://www.instagram.com/ac3productionsllc/" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  ac3productionsllc
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-[rgba(48,52,54,0.5)] p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-[#00ebd6]">Contact Information</h3>
            <div className="space-y-4 text-white">
              <p>For Business, Marketing, or Event Inquiries:</p>
              <p>
                <a href="mailto:ac3productionsllc@gmail.com" className="hover:text-[#00ebd6]">
                  ac3productionsllc@gmail.com
                </a>
              </p>
              <p>📱 804-437-5418</p>
              <p>
                <a href="https://calendly.com/ac3productionsllc/30min?month=2025-01" target="_blank" rel="noopener noreferrer" className="hover:text-[#00ebd6]">
                  Book Online
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
