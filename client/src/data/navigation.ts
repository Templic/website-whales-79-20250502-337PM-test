// Navigation links for the main application
// This file centralizes all the navigation structure for the site

export interface NavigationLink {
  id: string;
  title: string;
  path: string;
  icon?: string;
  parent?: string;
  children?: string[];
  requiresAuth?: boolean;
  adminOnly?: boolean;
  isExternal?: boolean;
  order?: number;
}

export const navigationLinks: NavigationLink[] = [
  {
    id: 'home',
    title: 'Home',
    path: '/',
    order: 1
  },
  {
    id: 'about',
    title: 'About',
    path: '/about',
    order: 2
  },
  {
    id: 'music',
    title: 'Music',
    path: '/music',
    order: 3,
    children: ['new-music', 'archived-music']
  },
  {
    id: 'new-music',
    title: 'New Releases',
    path: '/music/new',
    parent: 'music',
    order: 1
  },
  {
    id: 'archived-music',
    title: 'Archived Music',
    path: '/music/archived',
    parent: 'music',
    order: 2
  },
  {
    id: 'tour',
    title: 'Tour',
    path: '/tour',
    order: 4
  },
  {
    id: 'shop',
    title: 'Shop',
    path: '/shop',
    order: 5
  },
  {
    id: 'engage',
    title: 'Engage',
    path: '/engage',
    order: 6
  },
  {
    id: 'blog',
    title: 'Blog',
    path: '/blog',
    order: 7
  },
  {
    id: 'contact',
    title: 'Contact',
    path: '/contact',
    order: 8
  },
  {
    id: 'account',
    title: 'Account',
    path: '/account',
    requiresAuth: true,
    order: 9
  },
  {
    id: 'admin',
    title: 'Admin',
    path: '/admin',
    requiresAuth: true,
    adminOnly: true,
    order: 10
  }
];

// Helper function to get navigation links by parent
export const getChildLinks = (parentId: string): NavigationLink[] => {
  return navigationLinks
    .filter(link => link.parent === parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

// Helper function to get top-level navigation links
export const getTopLevelLinks = (): NavigationLink[] => {
  return navigationLinks
    .filter(link => !link.parent)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

// Helper function to get links that match authentication state
export const getAuthFilteredLinks = (isAuthenticated: boolean, isAdmin: boolean): NavigationLink[] => {
  return navigationLinks.filter(link => {
    if (link.requiresAuth && !isAuthenticated) return false;
    if (link.adminOnly && !isAdmin) return false;
    return true;
  });
};