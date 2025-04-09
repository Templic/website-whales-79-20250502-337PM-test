# Repository Structure

This document provides a comprehensive overview of the repository structure and organization.

## Directory Structure

```
/
├── attached_assets/              # Project assets
├── client/                       # Frontend code
│   ├── public/                   # Public static assets
│   │   └── images/               # Image assets
│   └── src/
│       ├── assets/               # Frontend assets
│       ├── components/           # React components
│       │   ├── admin/            # Admin components
│       │   ├── audio/            # Audio components
│       │   ├── auth/             # Authentication components
│       │   ├── common/           # Common utility components
│       │   ├── community/        # Community features
│       │   ├── cosmic/           # Cosmic-themed components
│       │   ├── demo/             # Demonstration components
│       │   ├── features/         # Feature-specific components
│       │   │   ├── admin/        # Admin feature components
│       │   │   ├── audio/        # Audio feature components
│       │   │   ├── community/    # Community feature components
│       │   │   ├── cosmic/       # Cosmic feature components
│       │   │   ├── design-system/# Design system components
│       │   │   ├── immersive/    # Immersive experience components
│       │   │   ├── music/        # Music feature components
│       │   │   ├── privacy/      # Privacy-related components
│       │   │   └── shop/         # Shop components
│       │   ├── immersive/        # Immersive experience components
│       │   ├── layout/           # Layout components
│       │   ├── music/            # Music components
│       │   ├── shop/             # Shop components
│       │   ├── system/           # System components
│       │   └── ui/               # UI components (shadcn)
│       ├── contexts/             # React contexts
│       ├── data/                 # Data files
│       ├── features/             # Feature modules
│       ├── hooks/                # Custom React hooks
│       ├── lib/                  # Utility functions
│       ├── pages/                # Page components
│       │   ├── admin/            # Admin pages
│       │   ├── archived/         # Archived pages
│       │   ├── blog/             # Blog pages
│       │   ├── community/        # Community pages
│       │   ├── experience/       # Experience pages
│       │   ├── music/            # Music pages
│       │   ├── resources/        # Resource pages
│       │   ├── shop/             # Shop pages
│       │   └── test/             # Test pages
│       ├── store/                # State management
│       ├── styles/               # CSS styles
│       ├── types/                # TypeScript type definitions
│       ├── App.tsx               # Main application component
│       └── main.tsx              # Application entry point
├── config/                       # Configuration files
├── dev docs/                     # Development documentation
├── docs/                         # Documentation
│   ├── examples/                 # Example code and templates
│   ├── replit-integration/       # Replit integration documentation
│   ├── ARCHITECTURE.md           # Architecture documentation
│   ├── COMPONENT_DOCUMENTATION_GUIDE.md # Documentation guidelines
│   ├── README.md                 # Documentation index
│   ├── REPOSITORY_STRUCTURE.md   # This file
│   ├── ROUTES.md                 # Routes documentation
│   └── UPDATING_DOCUMENTATION.md # Documentation update guidelines
├── logs/                         # Application logs
│   ├── error/                    # Error logs
│   └── security/                 # Security logs
├── migrations/                   # Database migrations
├── public/                       # Public static assets
│   ├── audio/                    # Audio files
│   └── images/                   # Image assets
├── reports/                      # Security and analytics reports
├── scripts/                      # Utility scripts
├── server/                       # Backend code
│   ├── middleware/               # Express middleware
│   ├── middlewares/              # Additional middlewares
│   ├── routes/                   # Route modules
│   ├── security/                 # Security modules
│   ├── types/                    # TypeScript type definitions
│   ├── routes.ts                 # API route definitions
│   ├── storage.ts                # Data storage interface
│   └── vite.ts                   # Vite server setup
├── shared/                       # Shared code
│   └── schema.ts                 # Database schema
├── static/                       # Static files
│   ├── css/                      # CSS files
│   ├── images/                   # Image files
│   └── js/                       # JavaScript files
├── templates/                    # Template files
├── uploads/                      # User uploads
├── app.py                        # Flask application
├── drizzle.config.ts             # Drizzle ORM configuration
├── forms.py                      # Flask forms
├── package.json                  # NPM package configuration
├── postcss.config.js             # PostCSS configuration
├── README.md                     # Repository readme
├── tailwind.config.ts            # Tailwind CSS configuration
├── theme.json                    # Theme configuration
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite configuration
```

## Key Directories

### Client

The `client` directory contains all the frontend code, organized as follows:

- `src/components`: React components, organized by type and feature
  - `components/admin`: Admin interface components
  - `components/audio`: Audio playback and visualization components
  - `components/cosmic`: Cosmic-themed UI components
  - `components/features`: Feature-specific components organized by domain
  - `components/layout`: Layout components like Header, Footer, and Sidebar
  - `components/shop`: E-commerce components
  - `components/ui`: Shadcn UI components and custom UI elements
- `src/contexts`: React context providers for state management
- `src/data`: Static data files and content
- `src/hooks`: Custom React hooks for shared functionality
- `src/lib`: Utility functions and helpers
- `src/pages`: Page components organized by section
  - `pages/admin`: Administration pages
  - `pages/blog`: Blog and content pages
  - `pages/community`: Community features
  - `pages/music`: Music-related pages
  - `pages/resources`: Educational resource pages
  - `pages/shop`: E-commerce pages
- `src/store`: State management
- `src/styles`: CSS and styling utilities
- `src/types`: TypeScript type definitions
- `src/App.tsx`: Main application component with route definitions
- `src/main.tsx`: Application entry point

### Server

The `server` directory contains all the backend code, organized as follows:

- `middleware`: Express middleware for request processing
- `middlewares`: Additional specialized middleware
- `routes`: Route module definitions
- `security`: Security-related modules and utilities
- `types`: TypeScript type definitions
- `routes.ts`: Main API route definitions
- `storage.ts`: Data storage interface
- `auth.ts`: Authentication logic
- `security.ts`: Security implementation
- `validation.ts`: Data validation utilities
- `vite.ts`: Vite server setup

### Shared

The `shared` directory contains code shared between the frontend and backend:

- `schema.ts`: Database schema definitions with Drizzle ORM and type definitions

### Docs and Reports

The project contains multiple documentation directories:

- `docs`: Core documentation
  - `examples`: Example code and templates
  - `replit-integration`: Replit platform integration docs
  - `ARCHITECTURE.md`: Architecture documentation
  - `ROUTES.md`: Routes documentation
  - Other guides and documentation files
- `reports`: Security reports and audits
  - `security_implementation_report.md`: Security implementation details
  - `vulnerability_remediation_plan.md`: Security vulnerability plans
  - `security_best_practices_guide.md`: Best practices
- `dev docs`: Development-specific documentation and plans

### Static Assets

Static assets are stored in multiple locations:

- `public`: Main public assets directory with audio and images
- `client/public`: Client-specific public assets
- `static`: Additional static files organized by type (CSS, JS, images)
- `uploads`: User-uploaded content

## Component Organization

### Feature-based Organization

Components are organized by feature, with each feature having its own directory:

- `components/features/audio`: Audio-related components
- `components/features/blog`: Blog-related components
- `components/features/cosmic`: Cosmic-themed components
- `components/features/music`: Music-related components
- `components/features/shop`: Shop-related components

Each feature directory follows this pattern:

```
features/
└── feature-name/
    ├── index.ts                 # Exports all components
    ├── README.md                # Feature documentation
    ├── ComponentName.tsx        # Individual components
    ├── ComponentName.test.tsx   # Component tests
    ├── ComponentName.module.css # Component styles (if not using Tailwind)
    └── types.ts                 # Feature-specific types
```

### UI Components

UI components from the shadcn/ui library are in the `components/ui` directory:

- `components/ui/button`: Button component
- `components/ui/card`: Card component
- `components/ui/form`: Form components
- `components/ui/input`: Input component
- etc.

### Layout Components

Layout components are in the `components/layout` directory:

- `components/layout/Header`: Header component
- `components/layout/Footer`: Footer component
- `components/layout/Sidebar`: Sidebar component
- etc.

## Archived Code

Deprecated or archived code is handled as follows:

- **Components**: Deprecated components have `@deprecated` JSDoc comments and remain in their original location until removed
- **Pages**: Archived pages are moved to the `pages/archived` directory
- **Routes**: Deprecated routes are commented out in `App.tsx`

## Adding New Features

When adding new features:

1. Create a new directory in `components/features/`
2. Add a README.md following the template in `docs/examples/feature-readme-example.md`
3. Document components following the guide in `docs/COMPONENT_DOCUMENTATION_GUIDE.md`
4. Add routes in `App.tsx` and document them in `docs/ROUTES.md`

## Modifying Existing Features

When modifying existing features:

1. Update documentation in the feature's README.md
2. Update component documentation
3. Update routes documentation if necessary
4. Update architecture documentation if necessary

## Conclusion

This repository structure provides a clear organization for the codebase, with components organized by feature and clear documentation. Following these conventions ensures consistency and maintainability.

---

*Last updated: 2025-04-09*
