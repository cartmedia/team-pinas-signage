# Quickstart: Clean API Integration Testing

## Overview
Manual testing guide for verifying the Clean API Integration feature works correctly after implementation.

## Prerequisites
- Repository cloned locally
- Node.js 18+ installed
- `.env` file configured with database credentials
- Feature branch `002-skip-emergency-stuff` checked out

## Quick Validation Test

### 1. Start Development Server
```bash
npm run dev
```
Expected: Server starts on port 8080 with no errors

### 2. Test Basic Loading (< 2 seconds requirement)
1. Open browser to `http://localhost:8080`
2. Start timer when page begins loading
3. **PASS**: Menu content appears within 2 seconds
4. **FAIL**: Loading screen hangs for more than 3 seconds

### 3. Verify Database Content Display  
1. Check that categories match admin content
2. Check that prices are current (not hardcoded HTML fallback)
3. **PASS**: Content matches database, no "Broodje Ham/Kaas €4,50" fallback
4. **FAIL**: Hardcoded emergency content is still visible

### 4. Test Error Handling
1. Stop development server (Ctrl+C)
2. Refresh browser page
3. **PASS**: Clear error message appears, not 30+ minute hang
4. **FAIL**: Page hangs indefinitely with spinning loader

### 5. Test Recovery Behavior
1. Restart development server (`npm run dev`)
2. Browser should detect server is back
3. **PASS**: Menu reloads automatically within 10 seconds
4. **FAIL**: Page remains in error state

### 6. Verify Admin CMS Still Works
1. Navigate to `http://localhost:8080/admin`
2. **PASS**: Admin interface loads normally
3. **FAIL**: Admin interface broken or unreachable

## Detailed Test Scenarios

### Scenario 1: Fresh Startup
**Given**: Browser has no cached data  
**When**: User navigates to signage URL  
**Then**: 
- Loading screen appears immediately
- Organization name shown in loading text
- Menu data loads from database within 2 seconds
- Loading screen fades out smoothly
- Categories displayed in correct order
- Products show current pricing

### Scenario 2: Network Interruption  
**Given**: Signage is displaying menu normally  
**When**: Network connection is lost  
**Then**:
- Existing menu remains visible 
- Background refresh attempts fail gracefully
- Error indicator shows retry status
- No infinite loading states
- When network returns, fresh data loads automatically

### Scenario 3: API Server Error
**Given**: Database APIs return 500 errors  
**When**: Signage attempts to load data  
**Then**:
- Clear error message displayed to user
- Retry attempts made with exponential backoff
- No silent failures or blank screens
- Recovery occurs automatically when APIs return

### Scenario 4: Partial Data Response
**Given**: API returns malformed or incomplete JSON  
**When**: Signage processes the response  
**Then**:
- Error handled gracefully without JavaScript crashes
- Appropriate error message shown 
- Retry logic activated
- Browser console shows meaningful error details

## Performance Validation

### Loading Performance
- **Requirement**: < 2 second initial load
- **Test**: Measure time from navigation to menu display
- **Acceptance**: 95% of loads complete within 2 seconds

### Refresh Performance  
- **Requirement**: 5-minute automatic refresh cycle
- **Test**: Wait 5 minutes and verify fresh API call
- **Acceptance**: Fresh data fetched automatically

### Error Recovery Performance
- **Requirement**: Automatic recovery when APIs return
- **Test**: Break and restore API connectivity
- **Acceptance**: Recovery within 10 seconds of API restoration

## Browser Console Verification

### Expected Log Messages (Success)
```
🚀 EMERGENCY MODE: Hiding loading screen immediately - customer waiting!
📡 Loading products from API...
Products loaded from database successfully
⚙️ Settings loaded: Team Pinas
🎯 Loading screen hidden - menu ready!
```

### Expected Log Messages (Error)
```
📡 Loading products from API...
⚠️ API request failed, retrying in 1 second...
⚠️ API request failed, retrying in 2 seconds...  
❌ Failed to load menu data after 4 attempts
```

### Forbidden Log Messages
- No more "undefined is not an object (evaluating 'this.config.cache')"
- No more references to CMS Connector failures
- No infinite retry loops or silent failures

## Success Criteria Summary

✅ **Performance**: Menu loads within 2 seconds  
✅ **Reliability**: No infinite loading states  
✅ **Error Handling**: Clear messages, automatic recovery  
✅ **Data Accuracy**: Live database content, no hardcoded fallback  
✅ **Admin Compatibility**: CMS functionality preserved  
✅ **Code Quality**: No emergency fixes or complex connector patterns

## Rollback Plan

If any test fails:
1. Switch back to main branch: `git checkout main`
2. Restart dev server to restore emergency fixes
3. Report specific failure details for debugging
4. Emergency fixes remain active until proper fix deployed

## Production Validation

Before deploying to production:
1. Test with production API endpoints
2. Verify performance under production network conditions
3. Confirm admin CMS access still works
4. Monitor browser console for any new errors
5. Have rollback plan ready for immediate deployment if issues occur