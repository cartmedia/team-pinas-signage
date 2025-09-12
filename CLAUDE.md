# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `npm run dev` - Starts Netlify dev server on port 8080
- **Deploy**: `npm run deploy` - Deploys to production via Netlify  
- **Build**: No build step required - static site with serverless functions
- **Database Migration**: `/.netlify/functions/admin-db-migrate` - Run via HTTP request

## Project Architecture

Team Pinas Signage is a digital menu display system with Neon PostgreSQL database, Netlify Functions API, and Auth0 authentication. Built for 16:9 digital displays with real-time menu updates.

### Core Architecture

**Digital Signage Display (`/public/index.html` + `/src/scripts/display/MenuSignage.js`)**
- Self-contained signage optimized for 16:9 screens
- Emergency HTML fallback content that displays immediately
- Direct API calls to `/.netlify/functions/products` and `/.netlify/functions/settings`
- CSS Grid layout with configurable columns (1 or 2 column modes)
- Progressive enhancement: HTML content → database override when loaded
- Loading screen with 1.6 second timeout maximum

**API Layer (`/server/functions/`)**
- **Public APIs** (no auth): `/products`, `/settings`, `/footer` - consumed by signage display
- **Admin APIs** (secured): `/admin-products`, `/admin-categories`, `/footer` (POST/PUT), `/admin-footer-migrate` - used by CMS
- Authentication via API key (`X-API-Key` header) or JWT tokens
- Neon PostgreSQL connection with optimized connection pooling
- 5-minute response caching for performance
- **Footer Migration**: Active feature (004-footer-content-migration) to centralize footer data

**Admin CMS (`/public/admin.html` + `/src/scripts/admin/admin.js`)**
- Full-featured management dashboard for categories and products
- Secured admin endpoints requiring authentication
- Real-time statistics and CRUD operations
- Accessible via `/admin` or `/admin.html`

### Critical Implementation Details

**Current State** (Branch: 005-zorg-ervoor-dat):
- **Footer Continuous Scrolling**: Implementing ticker-tape style scrolling footer animation
- **Performance-First Approach**: GPU-accelerated CSS transforms with hardware acceleration
- **Progressive Enhancement**: Graceful fallback to static footer on animation failure
- **Real-time Configuration**: Live updates from admin panel without page refresh

**Emergency Fixes Applied** (on main branch - being removed):
- **CMS Connector Disabled**: The `/src/scripts/shared/cms-connector.js` is disabled in HTML due to configuration errors
- **Direct API Strategy**: Signage uses simple fetch calls instead of complex connector patterns
- **HTML Fallback**: Emergency menu content in HTML shows immediately while API loads
- **Simplified Logic**: Complex DOM calculations replaced with fixed item counts

**Data Flow**:
1. **Immediate**: HTML fallback content displays instantly
2. **API Override**: Direct calls to `/products` and `/settings` endpoints
3. **Fallback Chain**: API → local JSON → hardcoded emergency data

**Loading Screen Logic**:
- Maximum 1.6 seconds before forcing display
- Emergency mode shows HTML content immediately if APIs fail
- User sees content within 800ms in worst case

### Environment Variables

**Required**:
- `NEON_DATABASE_URL`: PostgreSQL connection string
- `ADMIN_API_KEY`: Secure key for admin endpoints
- `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`: Auth0 configuration

**Setup**: Create `.env` file with these values for local development

### Database Schema

Categories and products tables with relationships:
- Categories: `id`, `title`, `display_order`, `created_at`, `updated_at`
- Products: `id`, `name`, `price`, `category_id`, `display_order`, `on_sale`, `is_new`
- Footer Config: `id`, `footer_text`, `scroll_speed`, `text_color`, `background_color`, `font_size`, `scroll_direction`, `divider_image`, `is_active`
- Migration Status: `id`, `migration_name`, `status`, `started_at`, `completed_at`, `error_message`, `data_summary`

### API Endpoints

**Public APIs** (used by signage):
- `GET /.netlify/functions/products` - Returns categorized menu items
- `GET /.netlify/functions/settings` - Returns app settings (org name, etc.)
- `GET /.netlify/functions/footer` - Returns footer configuration and content

**Admin APIs** (require authentication):
- `GET/POST/PUT/DELETE /.netlify/functions/admin-categories`
- `GET/POST/PUT/DELETE /.netlify/functions/admin-products`
- `PUT /.netlify/functions/footer` - Update footer configuration
- `GET/POST /.netlify/functions/admin-footer-migrate` - Footer migration management

### Directory Structure

```
public/                 # Static files served directly
├── index.html         # Main signage display  
├── admin.html         # CMS admin interface
└── assets/           # Images, logos, fallback data

src/scripts/
├── display/          # Signage display logic
├── admin/            # CMS admin logic  
└── shared/           # Common utilities

server/functions/     # Netlify Functions (API endpoints)
config/              # Configuration files
database/schema/     # SQL schema files
```

### Key Patterns & Conventions

**Performance First**: All code prioritized for sub-second loading
- CSS uses `vh` units for consistent scaling
- Hardware-accelerated animations with `transform3d`
- Minimal JavaScript blocking with deferred script loading

**Progressive Enhancement**: 
- HTML content visible immediately
- JavaScript enhances with database content
- Never leave users with blank screens

**Error Handling**: 
- Multiple fallback layers (API → cache → static → emergency)
- Always show something meaningful to customers
- Graceful degradation for all network conditions

### Development Workflow

1. `npm run dev` starts local server
2. Test signage at `http://localhost:8080/`  
3. Test admin at `http://localhost:8080/admin`
4. APIs available at `http://localhost:8080/.netlify/functions/*`
5. Changes hot-reload automatically

### Critical Notes

- **CMS Connector is disabled**: Don't re-enable without fixing config issues
- **Loading performance is critical**: Customer-facing display cannot hang
- **Authentication**: Admin functions require API key, display functions are public
- **Database**: Neon PostgreSQL with connection pooling
- **Dutch locale**: Clock and currency formatting for Netherlands market