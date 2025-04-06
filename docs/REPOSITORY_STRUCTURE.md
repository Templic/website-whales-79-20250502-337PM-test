# Repository Structure

This document provides a comprehensive overview of the repository structure and organization.

## Directory Structure

```
/
├── .config/                      # Configuration files
├── .storybook/                   # Storybook configuration
├── client/                       # Frontend code
│   └── src/
│       ├── components/           # React components
│       │   ├── features/         # Feature-specific components
│       │   │   ├── audio/        # Audio-related components
│       │   │   ├── blog/         # Blog-related components
│       │   │   ├── cosmic/       # Cosmic-themed components
│       │   │   ├── music/        # Music-related components
│       │   │   ├── shop/         # Shop-related components
│       │   │   └── ...
│       │   ├── layout/           # Layout components
│       │   ├── ui/               # UI components (shadcn)
│       │   └── ...
│       ├── hooks/                # Custom React hooks
│       ├── lib/                  # Utility functions
│       ├── pages/                # Page components
│       │   ├── archived/         # Archived pages
│       │   ├── HomePage.tsx      # Home page
│       │   ├── AboutPage.tsx     # About page
│       │   └── ...
│       ├── store/                # State management
│       ├── types/                # TypeScript type definitions
│       ├── App.tsx               # Main application component
│       └── main.tsx              # Application entry point
├── docs/                         # Documentation
│   ├── examples/                 # Example code and templates
│   ├── ARCHITECTURE.md           # Architecture documentation
│   ├── COMPONENT_DOCUMENTATION_GUIDE.md # Documentation guidelines
│   ├── IMPLEMENTATION_PLAN.md    # Implementation plan
│   ├── README.md                 # Documentation index
│   ├── REPOSITORY_REORGANIZATION_PLAN.md # Reorganization plan
│   ├── REPOSITORY_STRUCTURE.md   # This file
│   ├── ROUTES.md                 # Routes documentation
│   └── UPDATING_DOCUMENTATION.md # Documentation update guidelines
├── public/                       # Static assets
├── scripts/                      # Utility scripts
├── server/                       # Backend code
│   ├── controllers/              # Request handlers
│   ├── middlewares/              # Express middlewares
│   ├── routes.ts                 # API route definitions
│   ├── storage.ts                # Data storage interface
│   ├── vite.ts                   # Vite server setup
│   └── ...
├── shared/                       # Shared code
│   ├── schema.ts                 # Database schema
│   └── ...
├── static/                       # Static files
├── templates/                    # Template files
├── uploads/                      # User uploads
├── .gitignore                    # Git ignore file
├── app.py                        # Flask application
├── drizzle.config.ts             # Drizzle ORM configuration
├── forms.py                      # Flask forms
├── package.json                  # NPM package configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── theme.json                    # Theme configuration
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite configuration
```

## Key Directories

### Client

The `client` directory contains all the frontend code, organized as follows:

- `src/components`: React components, organized by feature
- `src/hooks`: Custom React hooks
- `src/lib`: Utility functions
- `src/pages`: Page components that map to routes
- `src/store`: State management
- `src/types`: TypeScript type definitions
- `src/App.tsx`: Main application component defining routes
- `src/main.tsx`: Application entry point

### Server

The `server` directory contains all the backend code, organized as follows:

- `controllers`: Request handlers
- `middlewares`: Express middlewares
- `routes.ts`: API route definitions
- `storage.ts`: Data storage interface
- `vite.ts`: Vite server setup

### Shared

The `shared` directory contains code shared between the frontend and backend:

- `schema.ts`: Database schema definitions with Drizzle ORM

### Docs

The `docs` directory contains all documentation:

- `examples`: Example code and templates
- `ARCHITECTURE.md`: Architecture documentation
- `COMPONENT_DOCUMENTATION_GUIDE.md`: Documentation guidelines
- `IMPLEMENTATION_PLAN.md`: Implementation plan
- `README.md`: Documentation index
- `REPOSITORY_REORGANIZATION_PLAN.md`: Reorganization plan
- `REPOSITORY_STRUCTURE.md`: Repository structure overview
- `ROUTES.md`: Routes documentation
- `UPDATING_DOCUMENTATION.md`: Documentation update guidelines

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
