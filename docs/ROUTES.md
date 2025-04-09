# Application Routes Documentation

This document provides a comprehensive overview of the application routes, including active routes, deprecated routes, and routing organization.

## Routes Organization

The application uses the `wouter` library for client-side routing. All routes are defined in the `App.tsx` file.

### Route Categories

The routes are organized into several categories:

1. **Main Pages**: Core application pages
2. **Music & Experience**: Music and cosmic experience pages
3. **Community Pages**: Community-related features
4. **Resource Pages**: Educational and informational resources
5. **Blog**: Blog posts and listings
6. **Shop Routes**: E-commerce functionality
7. **User Account**: Authentication and user portal
8. **Admin Routes**: Administrative functions
9. **Legal & Info**: Terms, privacy, and site information
10. **Demo Pages**: Component demonstrations

## Active Routes

### Main Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `HomePage` | Application landing page |
| `/about` | `AboutPage` | About the project |
| `/contact` | `ContactPage` | Contact form and information |
| `/tour` | `TourPage` | Tour dates and information |
| `/engage` | `EngagePage` | User engagement opportunities |
| `/newsletter` | `NewsletterPage` | Newsletter signup |
| `/collaboration` | `CollaborationPage` | Collaboration opportunities |

### Community Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/community` | `CommunityPage` | Community hub |
| `/enhanced-community` | `EnhancedCommunityPage` | Enhanced community features |

### Music & Experience
| Route | Component | Description |
|-------|-----------|-------------|
| `/music-release` | `NewMusicPage` | New music releases |
| `/archived-music` | `ArchivedMusicPage` | Archive of past releases |
| `/music-archive` | `ArchivedMusicPage` | Alternate path to archive |
| `/cosmic-connectivity` | `CosmicConnectivityPage` | Cosmic connectivity experience |
| `/experience/cosmic-connectivity` | `CosmicConnectivityPage` | Alternative path to cosmic connectivity |
| `/cosmic-experience` | `CosmicExperiencePage` | Primary cosmic experience |
| `/cosmic-immersive` | `CosmicImmersivePage` | Immersive cosmic experience |
| `/cosmic-immersive-experience` | `CosmicImmersivePage` | Alternative path to immersive experience |
| `/cosmic-experience-immersive` | `CosmicImmersivePage` | Another path to immersive experience |

### Resource Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/resources` | `ResourcesPage` | Main resources page |
| `/resources/frequency-guide` | `FrequencyGuidePage` | Frequency guide |
| `/resources/sacred-geometry` | `SacredGeometryPage` | Sacred geometry information |
| `/resources/sound-healing` | `SoundHealingPage` | Sound healing resources |
| `/resources/meditation` | `MeditationTechniquesPage` | Meditation techniques |

### Blog
| Route | Component | Description |
|-------|-----------|-------------|
| `/blog` | `BlogPage` | Blog listing page |
| `/blog/:id` | `BlogPostPage` | Individual blog post display |

### Shop Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/shop` | `ShopPage` | Main shop page |
| `/shop/product/:productId` | `ProductDetailPage` | Individual product page |
| `/cart` | `CartPage` | Shopping cart |
| `/shop/cart` | `CartPage` | Alternative path to cart |
| `/checkout` | `CheckoutPage` | Checkout process |
| `/shop/checkout` | `CheckoutPage` | Alternative path to checkout |
| `/shop/order/:orderId` | `OrderConfirmationPage` | Order confirmation page |
| `/shop/track-order` | `OrderTrackingPage` | Order tracking page |
| `/collaborative-shopping` | `CollaborativeShoppingPage` | Collaborative shopping experience |
| `/shop/collaborative` | `CollaborativeShoppingPage` | Alternative path to collaborative shopping |
| `/shop/collaborative/room/:roomId` | `CollaborativeShoppingPage` | Specific collaborative shopping room |

### User Account
| Route | Component | Description |
|-------|-----------|-------------|
| `/auth` | `AuthPage` | Authentication page |
| `/login` | `LoginPage` | Login page |
| `/recover-password` | `PasswordRecoveryPage` | Password recovery |
| `/reset-password` | `PasswordRecoveryPage` | Password reset |
| `/portal` | `UserPortal` | Protected user portal |

### Admin Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | `AdminPortalPage` | Admin dashboard |
| `/admin/analytics` | `AnalyticsPage` | Analytics dashboard |
| `/admin/security` | `SecuritySettingsPage` | Security settings |
| `/admin/users` | `UsersPage` | User management |
| `/admin/posts` | `PostsPage` | Post management |
| `/admin/music` | `MusicPage` | Music management |

### Legal & Info
| Route | Component | Description |
|-------|-----------|-------------|
| `/sitemap` | `SitemapPage` | Site navigation map |
| `/terms` | `TermsOfService` | Terms of service |
| `/privacy` | `PrivacyPolicy` | Privacy policy |
| `/data-request` | `DataRequestPage` | Data access request |

### Demo Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/components` | `ComponentsCatalog` | Component catalog |
| `/test/cosmic` | `TestCosmicComponentsDemo` | Cosmic components demo |
| `/cosmic-components` | `CosmicComponentsDemo` | Alternative cosmic components demo |
| `/test/audio` | `AudioComponentsDemo` | Audio components demo |
| `/test/new` | `NewComponentsDemo` | New components showcase |
| `/cosmic-test` | `CosmicTest` | Cosmic features test page |

## Deprecated Routes

The following routes have been deprecated and are commented out in `App.tsx`. They are kept for reference but are not active in the application:

| Route | Component | Replacement |
|-------|-----------|-------------|
| `/archive` | `ArchivePage` | `/archived-music` |
| `/button-demo` | `ButtonDemo` | `/components` |

## Adding New Routes

When adding new routes to the application:

1. Add the component import to the appropriate section
2. Add the route definition in the appropriate category
3. Follow the existing pattern for protected routes if needed
4. Document the route in this file

## Deprecating Routes

When deprecating routes:

1. Comment out the route definition in `App.tsx`
2. Add a comment indicating the replacement route (if applicable)
3. Update this documentation to move the route to the deprecated section
4. Retain the component for reference

---

*Last updated: 2025-04-09*
