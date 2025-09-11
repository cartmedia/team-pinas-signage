# Research: Dedicated Footer Content Endpoint

## Research Tasks Completed

### 1. Footer Content Structure Analysis

**Decision**: Use dedicated footer database table with columns for text, styling, and display properties
**Rationale**: 
- Currently footer content is mixed with general settings in the settings table
- Need granular control over footer-specific properties
- Separation allows independent management without affecting other display settings

**Alternatives considered**:
- JSON column in existing settings table (rejected - harder to query/validate)
- File-based configuration (rejected - not suitable for real-time updates)

### 2. API Endpoint Design Patterns

**Decision**: Follow existing Netlify Functions pattern with dedicated `/footer` endpoint
**Rationale**:
- Consistent with existing `/settings` and `/products` endpoints
- Supports both GET (for signage) and PUT/POST (for admin management)
- Can reuse existing auth middleware and caching patterns

**Alternatives considered**:
- Extend existing settings endpoint (rejected - violates separation of concerns)
- GraphQL endpoint (rejected - overkill for simple CRUD operations)

### 3. Database Schema Requirements

**Decision**: Create `footer_config` table with following structure:
- `id` (primary key)
- `footer_text` (text content with dividers)
- `text_color` (hex color value)
- `background_color` (optional override)
- `scroll_speed` (pixels per second)
- `scroll_direction` (left/right/static)
- `divider_image` (path to separator icon)
- `font_size` (vh units)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamps)

**Rationale**: Supports all current footer functionality plus extensibility for future features

### 4. Backward Compatibility Strategy

**Decision**: Gradual migration approach
- Phase 1: Create new endpoint, keep existing settings footer properties
- Phase 2: Update frontend to use new endpoint with fallback
- Phase 3: Remove footer properties from settings table

**Rationale**: Zero-downtime deployment with safe rollback capability

### 5. Caching Strategy

**Decision**: Apply same 5-minute cache headers as existing endpoints
**Rationale**: Footer content changes infrequently, caching improves performance

### 6. Authentication Requirements

**Decision**: Public GET endpoint (like settings), protected PUT/POST endpoints (like admin-settings)
**Rationale**: Signage displays need unauthenticated access, admin operations need protection

## Resolved NEEDS CLARIFICATION Items

1. **Specific properties beyond text and colors**: Font size, scroll speed, scroll direction, divider image path, background color override
2. **Admin interface vs API-only**: API-only initially, admin interface can be added later using existing admin panel patterns
3. **Real-time vs refresh-based updates**: Refresh-based with 5-minute cache, consistent with existing endpoints
4. **Relationship to current settings endpoint**: Separate endpoint that gradually replaces footer-related settings

## Implementation Approach

1. Create new database table for footer configuration
2. Implement new Netlify function `/footer` following existing patterns
3. Update frontend JavaScript to call new endpoint with fallback to settings
4. Migrate existing footer settings data to new table
5. Update admin interface to manage footer through new endpoint

## Performance Considerations

- 5-minute response caching reduces database load
- Single database query per request
- Minimal JSON payload size
- No impact on existing endpoints

## Security Considerations

- Reuse existing auth middleware for admin operations
- Input validation for color values and text content
- SQL injection protection through parameterized queries
- Rate limiting through existing Netlify protections