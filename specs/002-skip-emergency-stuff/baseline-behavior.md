# Baseline Behavior Documentation
*Created during T003 - Document current loading behavior*

## Current State (Before Refactoring)

### Observed Server Behavior
- **Server Status**: Dev server started successfully on port 8080
- **API Endpoints Working**: 
  - `/.netlify/functions/products` - ✅ Returns 7 categories (~244-333ms response time)
  - `/.netlify/functions/settings` - ✅ Returns settings (~262-390ms response time)
  - Admin endpoints properly secured (401 unauthorized as expected)

### Database Connection
- **Categories Available**: 7 categories loaded successfully
  - Energy & Sportdrank
  - Merchandise  
  - Shakes & Supplementen
  - Snacks
  - Koude dranken
  - Warme dranken
  - Broodjes & Warm

### Current Emergency Fixes (from previous analysis)
1. **CMS Connector Disabled**: Script commented out in HTML due to config errors
2. **HTML Fallback Content**: Static menu content hardcoded in index.html
3. **Complex Timeout Logic**: 1.6 second maximum timeout in MenuSignage.js
4. **Fixed DOM Calculations**: Simplified item counting to avoid blocking

### Known Issues to Fix
- **Performance**: Loading hangs observed in production (30+ minutes)
- **Error Handling**: "undefined is not an object" errors from CMS Connector
- **Reliability**: Emergency fixes mask underlying API integration problems
- **Maintainability**: Complex fallback logic makes debugging difficult

### API Performance Baseline
- **Products API**: 244-333ms response time locally
- **Settings API**: 262-390ms response time locally  
- **Database**: 7 categories successfully queried
- **Connection**: Some connection termination errors observed (database timeout)

### Admin Portal Status
- **Access**: Admin endpoints properly secured (require authentication)
- **Functionality**: Separate from signage display (uses different endpoints)
- **Expected Behavior**: Should remain unaffected by signage refactoring

## Target Improvements
1. **Load Time**: <2 seconds from navigation to menu display
2. **Error Recovery**: Clear messages and automatic retry with exponential backoff
3. **Reliability**: No infinite loading states or silent failures
4. **Code Quality**: Remove emergency fixes and CMS Connector complexity
5. **Admin Compatibility**: Maintain full CMS functionality

## Test Scenarios to Verify
1. Normal loading behavior (should be <2 seconds)
2. Error handling when APIs unavailable
3. Recovery when APIs come back online
4. Admin portal still works at `/admin`
5. No console errors about undefined objects

*This baseline will be compared against behavior after implementing the new API service.*