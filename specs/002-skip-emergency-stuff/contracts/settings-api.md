# Settings API Contract

## Endpoint
`GET /.netlify/functions/settings`

## Description
Returns system configuration settings for the digital signage display.

## Request
- **Method**: GET
- **Authentication**: None required (public endpoint)
- **Headers**: None required
- **Query Parameters**: None

## Response

### Success Response (200 OK)
```json
{
  "settings": {
    "organization_name": "Team Pinas"
  }
}
```

### Error Response (500 Internal Server Error)
```json
{
  "error": "Unable to load settings",
  "timestamp": "2025-09-11T12:00:00Z"
}
```

### Error Response (503 Service Unavailable)
```json
{
  "error": "Settings service temporarily unavailable", 
  "timestamp": "2025-09-11T12:00:00Z"
}
```

## Response Schema

### Root Object
- `settings`: Settings object (required)

### Settings Object
- `organization_name`: Non-empty string (required)
  - Used in loading screen text and header display
  - Default value: "Team Pinas"

## Business Rules
- Settings are cached for 5 minutes to reduce API load
- Missing `organization_name` defaults to "Team Pinas"
- Settings updates require admin authentication (separate endpoint)

## Performance Characteristics
- **Response Time**: < 500ms under normal load
- **Cache Duration**: 5 minutes via HTTP cache headers  
- **Rate Limiting**: None (public endpoint)
- **Fallback**: Client uses default "Team Pinas" if API fails

## Error Handling
- Database errors return 500 status
- Temporary outages return 503 status
- CORS headers included for browser access
- Client should gracefully handle failures with default values

## Usage Context
- Loaded during signage startup to customize loading text
- Used to personalize the display header
- Not critical for core functionality - menu display works without settings