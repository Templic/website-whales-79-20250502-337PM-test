/**
 * streaming-links.tsx
 * 
 * Component Type: common
 * Migrated from imported components.
 */
/**
 * streaming-links.tsx
 * 
 * IMPORTED COMPONENT
 * Originally from: tmp_import/components
 * 
 * This component was imported as part of the repository reorganization.
 * Modifications may be needed to ensure compatibility with the current codebase.
 */
import Image from "next/image"
import Link from "next/link"

export function StreamingLinks() {
  const platforms = [
    {
      name: "Spotify",
      icon: "/placeholder.svg?height=40&width=40",
      url: "#",
      color: "from-green-500 to-green-600",
    },
    {
      name: "Apple Music",
      icon: "/placeholder.svg?height=40&width=40",
      url: "#",
      color: "from-pink-500 to-pink-600",
    },
    {
      name: "YouTube Music",
      icon: "/placeholder.svg?height=40&width=40",
      url: "#",
      color: "from-red-500 to-red-600",
    },
    {
      name: "Amazon Music",
      icon: "/placeholder.svg?height=40&width=40",
      url: "#",
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Bandcamp",
      icon: "/placeholder.svg?height=40&width=40",
      url: "#",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      name: "SoundCloud",
      icon: "/placeholder.svg?height=40&width=40",
      url: "#",
      color: "from-orange-500 to-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
      {platforms.map((platform) => (
        <Link
          key={platform.name}
          href={platform.url}
          className="group flex flex-col items-center justify-center rounded-xl bg-black/20 p-4 backdrop-blur-sm transition-all hover:bg-white/5"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${platform.color} mb-3`}
          >
            <Image
              src={platform.icon || "/placeholder.svg"}
              width={24}
              height={24}
              alt={platform.name}
              className="h-6 w-6"
            />
          </div>
          <span className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
            {platform.name}
          </span>
        </Link>
      ))}
    </div>
  )
}

