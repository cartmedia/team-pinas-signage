# Products API Contract

## Endpoint
`GET /.netlify/functions/products`

## Description
Returns categorized menu data for the digital signage display.

## Request
- **Method**: GET
- **Authentication**: None required (public endpoint)
- **Headers**: None required
- **Query Parameters**: None

## Response

### Success Response (200 OK)
```json
{
  "categories": [
    {
      "id": 1,
      "title": "Broodjes & Warm",
      "display_order": 1,
      "items": [
        {
          "id": 10,
          "name": "Broodje Ham/Kaas", 
          "price": 4.50,
          "display_order": 1,
          "on_sale": false,
          "is_new": false
        },
        {
          "id": 11,
          "name": "Warme Chocolademelk",
          "price": 2.50, 
          "display_order": 2,
          "on_sale": true,
          "is_new": false
        }
      ]
    },
    {
      "id": 2,
      "title": "Koude Dranken",
      "display_order": 2, 
      "items": [
        {
          "id": 20,
          "name": "Coca Cola",
          "price": 2.50,
          "display_order": 1,
          "on_sale": false,
          "is_new": true
        }
      ]
    }
  ],
  "lastUpdated": "2025-09-11T12:00:00Z",
  "source": "database"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "error": "Database connection failed",
  "timestamp": "2025-09-11T12:00:00Z"
}
```

### Error Response (503 Service Unavailable)
```json
{
  "error": "Service temporarily unavailable",
  "timestamp": "2025-09-11T12:00:00Z"
}
```

## Response Schema

### Root Object
- `categories`: Array of Category objects (required)
- `lastUpdated`: ISO 8601 timestamp (required)
- `source`: String indicating data source (required)

### Category Object
- `id`: Positive integer (required)
- `title`: Non-empty string (required) 
- `display_order`: Positive integer (required)
- `items`: Array of Product objects (required, may be empty)

### Product Object  
- `id`: Positive integer (required)
- `name`: Non-empty string (required)
- `price`: Positive decimal with max 2 decimal places (required)
- `display_order`: Positive integer (required)
- `on_sale`: Boolean (required)
- `is_new`: Boolean (required)

## Business Rules
- Categories ordered by `display_order` ascending
- Products within categories ordered by `display_order` ascending  
- Empty categories (no items) are included but may be filtered by client
- `price` values represent euros
- Categories and products with same `display_order` are sorted alphabetically by title/name

## Performance Characteristics
- **Response Time**: < 1 second under normal load
- **Cache Duration**: 5 minutes via HTTP cache headers
- **Rate Limiting**: None (public endpoint)

## Error Handling
- Database errors return 500 status
- Temporary outages return 503 status
- Malformed requests return 400 status
- CORS headers included for browser access