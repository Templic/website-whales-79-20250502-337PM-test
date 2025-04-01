
import { Link } from "wouter";

export function Navigation() {
  return (
    <nav className="bg-[rgba(10,50,92,0.6)] backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold text-[#00ebd6]">
            Dale Loves Whales
          </Link>
          
          <div className="flex flex-wrap gap-6">
            <div className="space-x-6">
              <Link href="/" className="hover:text-[#00ebd6]">Home</Link>
              <Link href="/about" className="hover:text-[#00ebd6]">About</Link>
              <Link href="/music-release" className="hover:text-[#00ebd6]">New Music</Link>
              <Link href="/archived-music" className="hover:text-[#00ebd6]">Archived Music</Link>
              <Link href="/tour" className="hover:text-[#00ebd6]">Tour</Link>
            </div>
            
            <div className="space-x-6">
              <Link href="/engage" className="hover:text-[#00ebd6]">Engage</Link>
              <Link href="/newsletter" className="hover:text-[#00ebd6]">Newsletter</Link>
              <Link href="/blog" className="hover:text-[#00ebd6]">Blog</Link>
              <Link href="/cosmic-experience" className="hover:text-[#00ebd6] text-[#00ebd6]">Cosmic Experience</Link>
              <Link href="/collaboration" className="hover:text-[#00ebd6]">Collaboration</Link>
              <Link href="/contact" className="hover:text-[#00ebd6]">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
