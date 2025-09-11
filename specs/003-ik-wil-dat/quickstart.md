# Quickstart: Footer Content Endpoint Testing

## Prerequisites

- Team Pinas signage repository cloned
- Local development server running (`npm run dev`)
- Database connection configured
- Admin API key available in environment

## Test Scenarios

### 1. Test GET /footer (Public Access)

**Scenario**: Verify signage can retrieve active footer configuration

```bash
# Test endpoint availability
curl -s http://localhost:8080/.netlify/functions/footer | jq

# Expected response format:
{
  "footer": {
    "id": 1,
    "footer_text": "Team Pinas - Verse maaltijden voor iedereen",
    "text_color": "#101010",
    "background_color": null,
    "scroll_speed": 30,
    "scroll_direction": "left",
    "divider_image": "assets/images/pinas_kroon.svg",
    "font_size": "3vh",
    "is_active": true,
    "created_at": "2025-09-11T...",
    "updated_at": "2025-09-11T..."
  }
}

# Verify caching headers
curl -I http://localhost:8080/.netlify/functions/footer
# Should include: Cache-Control: public, max-age=300
```

### 2. Test POST /footer (Admin Only)

**Scenario**: Admin creates new footer configuration

```bash
# Test unauthorized access
curl -X POST http://localhost:8080/.netlify/functions/footer \
  -H "Content-Type: application/json" \
  -d '{"footer_text": "Test message"}'
# Expected: 401 Unauthorized

# Test authorized creation
curl -X POST http://localhost:8080/.netlify/functions/footer \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "footer_text": "New promotional message with special offers",
    "text_color": "#ffffff",
    "background_color": "#c19d6c",
    "scroll_speed": 25,
    "scroll_direction": "left",
    "font_size": "3.2vh"
  }' | jq

# Expected: 201 Created with new footer configuration
```

### 3. Test PUT /footer (Admin Only)

**Scenario**: Admin updates existing footer configuration

```bash
# Test partial update
curl -X PUT http://localhost:8080/.netlify/functions/footer \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "footer_text": "Updated message for special event",
    "scroll_speed": 35
  }' | jq

# Expected: 200 OK with updated configuration

# Test invalid data
curl -X PUT http://localhost:8080/.netlify/functions/footer \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text_color": "invalid-color",
    "scroll_speed": 300
  }'
# Expected: 400 Bad Request with validation errors
```

### 4. Test Frontend Integration

**Scenario**: Verify signage display uses new footer endpoint

```javascript
// Browser console test on http://localhost:8080
// Check if footer loads from new endpoint
fetch('/.netlify/functions/footer')
  .then(r => r.json())
  .then(data => {
    console.log('Footer config:', data.footer);
    
    // Verify footer text appears in DOM
    const footerText = document.querySelector('.ScrollingText span');
    console.log('Current footer text:', footerText?.textContent);
  });

// Test fallback behavior (simulate endpoint failure)
// Temporarily block request in DevTools Network tab
// Verify footer still displays with fallback content
```

### 5. Test Database State

**Scenario**: Verify database operations work correctly

```sql
-- Check active configuration
SELECT * FROM footer_config WHERE is_active = true;

-- Verify only one active config exists
SELECT COUNT(*) FROM footer_config WHERE is_active = true;
-- Expected: 1

-- Test constraint violations
INSERT INTO footer_config (footer_text, text_color, is_active) 
VALUES ('Test', 'invalid-color', true);
-- Expected: CHECK constraint violation

-- Test unique active constraint
UPDATE footer_config SET is_active = true WHERE id > 1;
-- Expected: UNIQUE constraint violation (if multiple rows exist)
```

### 6. Test Error Scenarios

**Scenario**: Verify proper error handling

```bash
# Test with no active configuration
# (Temporarily update all records to is_active = false)
curl -s http://localhost:8080/.netlify/functions/footer
# Expected: 404 Not Found

# Test malformed JSON
curl -X POST http://localhost:8080/.netlify/functions/footer \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d 'invalid-json'
# Expected: 400 Bad Request

# Test missing required fields
curl -X POST http://localhost:8080/.netlify/functions/footer \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 Bad Request with validation details
```

### 7. Test Migration Compatibility

**Scenario**: Verify new endpoint works alongside existing settings

```bash
# Compare footer data between endpoints
OLD_FOOTER=$(curl -s http://localhost:8080/.netlify/functions/settings | jq -r '.settings.footer_text')
NEW_FOOTER=$(curl -s http://localhost:8080/.netlify/functions/footer | jq -r '.footer.footer_text')

echo "Old endpoint: $OLD_FOOTER"
echo "New endpoint: $NEW_FOOTER"
# Should show consistent footer content during migration phase
```

## Success Criteria

- ✅ GET /footer returns valid footer configuration with 5-minute cache headers
- ✅ POST /footer creates new configuration (admin auth required)
- ✅ PUT /footer updates existing configuration (admin auth required)
- ✅ Database constraints prevent invalid data and multiple active configs
- ✅ Frontend successfully loads footer from new endpoint
- ✅ Error responses include appropriate HTTP status codes and messages
- ✅ Unauthorized requests are properly rejected
- ✅ Migration maintains data consistency between old and new endpoints

## Performance Benchmarks

- Response time < 500ms for GET requests
- Database query time < 100ms
- Cache hit rate > 90% for repeated GET requests
- No memory leaks during extended testing

## Rollback Plan

If issues occur:
1. Update frontend to use old settings endpoint only
2. Disable new footer endpoint via environment variable
3. Remove footer_config table if needed
4. Restore original footer properties in settings table