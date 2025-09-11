# Data Model: Clean API Integration

## Overview
Data model documentation for the Team Pinas signage API integration. This describes the existing data structures that will be used without modification.

## Core Entities

### Category
Represents a menu section (e.g., "Broodjes & Warm", "Koude Dranken")

**Attributes**:
- `id`: Unique identifier (integer)
- `title`: Display name for the category (string)
- `display_order`: Sort order for category presentation (integer)
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last modification

**Validation Rules**:
- `title` must not be empty
- `display_order` must be positive integer
- Categories with same `display_order` sorted by `title` alphabetically

**Business Rules**:
- Categories are displayed in ascending `display_order`
- Empty categories (no products) are hidden from display
- Maximum 4 categories supported by current layout

### Product
Represents individual menu items within categories

**Attributes**:
- `id`: Unique identifier (integer) 
- `name`: Item name displayed to customers (string)
- `price`: Cost in euros (decimal, 2 decimal places)
- `category_id`: Foreign key to parent Category (integer)
- `display_order`: Sort order within category (integer) 
- `on_sale`: Boolean flag for promotional pricing
- `is_new`: Boolean flag for newly added items
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last modification

**Validation Rules**:
- `name` must not be empty
- `price` must be positive decimal with max 2 decimal places
- `category_id` must reference existing Category
- `display_order` must be positive integer

**Business Rules**:
- Products displayed in ascending `display_order` within category
- `on_sale` items show promotional badge and highlighting
- `is_new` items show "NEW" badge with special styling
- Items can be both `on_sale` and `is_new` simultaneously

### Settings
System configuration for signage display

**Attributes**:
- `organization_name`: Business name shown in header (string)
- `display_preferences`: JSON object for layout settings
- `updated_at`: Timestamp of last modification

**Validation Rules**:
- `organization_name` defaults to "Team Pinas"
- Settings changes require admin authentication

**Business Rules**:
- Organization name appears in loading screen and header
- Settings cached for 5 minutes to reduce API calls

## Relationships

### Category → Products (One-to-Many)
- Each Category can contain multiple Products
- Each Product belongs to exactly one Category
- Products without valid Category are excluded from display
- Category deletion cascades to hide associated Products

## API Response Format

### Products Endpoint Response
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
        }
      ]
    }
  ],
  "lastUpdated": "2025-09-11T12:00:00Z",
  "source": "database"
}
```

### Settings Endpoint Response
```json
{
  "settings": {
    "organization_name": "Team Pinas"
  }
}
```

## State Management

### Frontend State
The signage display maintains minimal state:
- `categories`: Array of category objects with nested products
- `settings`: Organization settings object
- `loading`: Boolean for loading state
- `error`: Error message string (null when no error)
- `lastUpdated`: Timestamp of last successful data fetch

### State Transitions
1. **Initial**: `loading: true, categories: [], error: null`
2. **Loading**: API request in progress
3. **Loaded**: `loading: false, categories: [data], error: null`
4. **Error**: `loading: false, categories: [], error: "message"`
5. **Retrying**: `loading: true, error: "Retrying..."`

### Cache Strategy
- Browser caches API responses for 5 minutes via HTTP headers
- No client-side persistence required
- Fresh data fetched every 5 minutes automatically
- Manual refresh available via page reload

## Data Flow

### Startup Sequence
1. Display loading screen
2. Fetch settings (for organization name)
3. Fetch products (for menu data)
4. Render menu or show error message
5. Hide loading screen

### Refresh Cycle
1. Every 5 minutes: Re-fetch products data
2. On error: Retry with exponential backoff
3. On network recovery: Immediate re-fetch

### Error Handling
- Malformed JSON: Show "Data format error" message
- Network error: Show "Connection error - retrying..." 
- Server error (5xx): Show "Server temporarily unavailable"
- Timeout: Show "Request timeout - retrying..."

## No Schema Changes Required
This refactor uses the existing database schema without modifications. All current data relationships and constraints remain unchanged.