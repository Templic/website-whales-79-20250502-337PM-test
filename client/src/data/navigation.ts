/**
 * Navigation data for the application
 * Defines the structure for main navigation and footer links
 */

// Legacy navigation items (for backward compatibility)
export const navigationLinks = [
  { name: "Home", path: "/", parent: null },
  { name: "Music", path: "/music", parent: null },
  { name: "Tour", path: "/tour", parent: null },
  { name: "Shop", path: "/shop", parent: null },
  { name: "Engage", path: "/engage", parent: null },
  { name: "Blog", path: "/blog", parent: null },
  { name: "Components", path: "/components", parent: null },
]

// Main navigation items
export const mainNavItems = [
  {
    label: "Home",
    href: "/",
    icon: "home",
  },
  {
    label: "Music",
    href: "/music",
    icon: "music",
  },
  {
    label: "Tour",
    href: "/tour",
    icon: "map",
  },
  {
    label: "Shop",
    href: "/shop",
    icon: "shopping-bag",
  },
  {
    label: "Engage",
    href: "/engage",
    icon: "users",
  },
  {
    label: "Blog",
    href: "/blog",
    icon: "book-open",
  },
]

// Footer navigation sections
export const footerNavSections = [
  {
    title: "Music",
    items: [
      { label: "Latest Releases", href: "/music" },
      { label: "Albums", href: "/music/albums" },
      { label: "Singles", href: "/music/singles" },
      { label: "Frequencies", href: "/music/frequencies" },
      { label: "Meditations", href: "/music/meditations" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "About", href: "/about" },
      { label: "Events", href: "/tour" },
      { label: "Connect", href: "/engage" },
      { label: "Newsletter", href: "/engage#newsletter" },
      { label: "Charity", href: "/engage#charity" },
    ],
  },
  {
    title: "Shop",
    items: [
      { label: "All Products", href: "/shop" },
      { label: "Merch", href: "/shop/merch" },
      { label: "Digital", href: "/shop/digital" },
      { label: "Experiences", href: "/shop/experiences" },
      { label: "Gift Cards", href: "/shop/gifts" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Account", href: "/account" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
]

// Mobile navigation (simplified for mobile view)
export const mobileNavItems = [
  {
    label: "Home",
    href: "/",
    icon: "home",
  },
  {
    label: "Music",
    href: "/music",
    icon: "music",
  },
  {
    label: "Shop",
    href: "/shop",
    icon: "shopping-bag",
  },
  {
    label: "Engage",
    href: "/engage",
    icon: "users",
  },
  {
    label: "More",
    href: "#",
    icon: "more-horizontal",
    dropdown: [
      { label: "Tour", href: "/tour", icon: "map" },
      { label: "Blog", href: "/blog", icon: "book-open" },
      { label: "Contact", href: "/contact", icon: "mail" },
      { label: "About", href: "/about", icon: "info" },
    ],
  },
]

// User account navigation
export const userNavItems = [
  {
    label: "Profile",
    href: "/account",
    icon: "user",
  },
  {
    label: "Orders",
    href: "/account/orders",
    icon: "package",
  },
  {
    label: "Favorites",
    href: "/account/favorites",
    icon: "heart",
  },
  {
    label: "Settings",
    href: "/account/settings",
    icon: "settings",
  },
  {
    label: "Sign Out",
    href: "/logout",
    icon: "log-out",
  },
]

// Test and demo navigation
export const testNavItems = [
  {
    label: "Components",
    href: "/components",
    icon: "layout",
  },
  {
    label: "Audio Demo",
    href: "/test/audio",
    icon: "headphones",
  },
  {
    label: "Cosmic Test",
    href: "/test/cosmic",
    icon: "star",
  },
  {
    label: "New Features",
    href: "/test/new",
    icon: "zap",
  },
]