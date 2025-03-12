import { Link } from "wouter";
import { useState } from "react";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="bg-[#0a325c] flex flex-wrap items-center justify-between p-4 sticky top-0 z-50 border-b border-[#00ebd6] shadow-lg">
      <Link href="/" className="text-[#00ebd6] text-2xl font-bold no-underline font-montserrat">
        Dale Loves Whales
      </Link>

      <nav className="flex-grow md:flex md:items-center md:w-auto">
        <ul className="flex flex-col md:flex-row md:gap-8 list-none p-0">
          <li><Link href="/" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Home</Link></li>
          <li><Link href="/about" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">About</Link></li>
          <li><Link href="/music-release" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">New Music</Link></li>
          <li><Link href="/music" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Archived Music</Link></li>
          <li><Link href="/tour" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Tour</Link></li>
          <li><Link href="/engage" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Engage</Link></li>
          <li><Link href="/newsletter" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Newsletter</Link></li>
          <li><Link href="/blog" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Blog</Link></li>
          <li><Link href="/collaboration" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Collaboration</Link></li>
          <li><Link href="/contact" className="text-[#e8e6e3] hover:text-[#00ebd6] font-medium uppercase text-sm tracking-wide p-2">Contact</Link></li>
        </ul>
      </nav>

      <div className="search-container flex justify-center mt-5">
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 text-base border border-gray-300 rounded-md w-[300px]"
        />
        <button 
          type="button" 
          className="px-5 py-2 ml-2 text-base bg-[#00ebd6] text-[#303436] border-none rounded-md cursor-pointer hover:bg-[#0056b3]"
        >
          Search
        </button>
      </div>
    </header>
  );
}