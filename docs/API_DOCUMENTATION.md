# Waste Management API - Postman Testing Guide

This document provides comprehensive instructions for testing all API endpoints using Postman.

## Table of Contents
1. [Setup](#setup)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Category Endpoints](#category-endpoints)
4. [Waste Item Endpoints](#waste-item-endpoints)

---

## Setup

### Base URL
```
http://localhost:3000
```

### Environment Variables (Optional)
Create a Postman environment with these variables:
| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:3000` | API base URL |
| `token` | (obtained from login) | JWT authentication token |
| `categoryId` | (created category ID) | For testing item endpoints |




## Category Endpoints

### 1. Create Category (Admin Only)
**POST** `/categories`

Creates a new waste category.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{token}}` |
| `Content-Type` | `application/json` |

#### Request Body (JSON):
```json
{
  "name": "Plastic",
  "description": "Various types of plastic materials including bottles, containers, and packaging",
  "recyclable": true,
  "hazardous": false,
  "compostable": false
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
    "name": "Plastic",
    "description": "Various types of plastic materials including bottles, containers, and packaging",
    "recyclable": true,
    "hazardous": false,
    "compostable": false,
    "createdAt": "2026-02-15T07:00:00.000Z",
    "updatedAt": "2026-02-15T07:00:00.000Z"
  }
}
```

> **Note:** Save the `_id` as `categoryId` in your environment for testing item endpoints.

---

### 2. Get All Categories (Public)
**GET** `/categories`

Returns all categories with pagination.

#### Query Parameters (Optional):
| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `limit` | 10 | Items per page |

#### Example Request:
```
GET /categories?page=1&limit=10
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Plastic",
      "description": "Various types of plastic materials",
      "recyclable": true,
      "hazardous": false,
      "compostable": false,
      "createdAt": "2026-02-15T07:00:00.000Z",
      "updatedAt": "2026-02-15T07:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 3. Get Category by ID (Public)
**GET** `/categories/:id`

Returns a single category by its ID.

#### Example Request:
```
GET /api/categories/67a1b2c3d4e5f6g7h8i9j0k2
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
    "name": "Plastic",
    "description": "Various types of plastic materials",
    "recyclable": true,
    "hazardous": false,
    "compostable": false,
    "createdAt": "2026-02-15T07:00:00.000Z",
    "updatedAt": "2026-02-15T07:00:00.000Z"
  }
}
```

---

### 4. Update Category (Admin Only)
**PUT** `/categories/:id`

Updates an existing category.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{token}}` |
| `Content-Type` | `application/json` |

#### Request Body (JSON):
```json
{
  "description": "Updated description for plastic materials",
  "recyclable": true
}
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
    "name": "Plastic",
    "description": "Updated description for plastic materials",
    "recyclable": true,
    "hazardous": false,
    "compostable": false,
    "createdAt": "2026-02-15T07:00:00.000Z",
    "updatedAt": "2026-02-15T08:00:00.000Z"
  }
}
```

---

### 5. Delete Category (Admin Only)
**DELETE** `/categories/:id`

Deletes a category and all associated waste items.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{token}}` |

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
    "name": "Plastic",
    ...
  },
  "message": "Category and associated items deleted successfully"
}
```

---

## Waste Item Endpoints

### 1. Create Waste Item (Admin Only)
**POST** `/items`

Creates a new waste item.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{token}}` |
| `Content-Type` | `application/json` |

#### Request Body (JSON):
```json
{
  "name": "Plastic Water Bottle",
  "description": "Empty plastic water bottle, typically PET material",
  "category": "{{categoryId}}",
  "recyclable": true,
  "hazardous": false,
  "compostable": false
}
```

#### Response (201 Created):
```json
{
  "success": true,
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Plastic Water Bottle",
    "description": "Empty plastic water bottle, typically PET material",
    "category": {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Plastic",
      "description": "Various types of plastic materials"
    },
    "recyclable": true,
    "hazardous": false,
    "compostable": false,
    "createdAt": "2026-02-15T07:00:00.000Z",
    "updatedAt": "2026-02-15T07:00:00.000Z"
  }
}
```

---

### 2. Get All Waste Items (Public)
**GET** `/api/items`

Returns all waste items with pagination, filtering, and search.

#### Query Parameters:
| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `limit` | 10 | Items per page |
| `search` | - | Search by item name (case-insensitive) |
| `category` | - | Filter by category ID |
| `recyclable` | - | Filter (true/false) |
| `hazardous` | - | Filter (true/false) |
| `compostable` | - | Filter (true/false) |

#### Example Requests:

**Basic pagination:**
```
GET /api/items?page=1&limit=10
```

**Search by name:**
```
GET /api/items?search=bottle
```

**Filter by category:**
```
GET /api/items?category=67a1b2c3d4e5f6g7h8i9j0k2
```

**Filter by recyclable items:**
```
GET /api/items?recyclable=true
```

**Combined filters:**
```
GET /api/items?search=plastic&recyclable=true&hazardous=false&page=1&limit=20
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k3",
      "name": "Plastic Water Bottle",
      "description": "Empty plastic water bottle",
      "category": {
        "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
        "name": "Plastic",
        "description": "Various types of plastic materials"
      },
      "recyclable": true,
      "hazardous": false,
      "compostable": false,
      "createdAt": "2026-02-15T07:00:00.000Z",
      "updatedAt": "2026-02-15T07:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 3. Get Waste Item by ID (Public)
**GET** `/api/items/:id`

Returns a single waste item by its ID.

#### Example Request:
```
GET /api/items/67a1b2c3d4e5f6g7h8i9j0k3
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Plastic Water Bottle",
    "description": "Empty plastic water bottle",
    "category": {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Plastic",
      "description": "Various types of plastic materials"
    },
    "recyclable": true,
    "hazardous": false,
    "compostable": false,
    "createdAt": "2026-02-15T07:00:00.000Z",
    "updatedAt": "2026-02-15T07:00:00.000Z"
  }
}
```

---

### 4. Update Waste Item (Admin Only)
**PUT** `/api/items/:id`

Updates an existing waste item.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{token}}` |
| `Content-Type` | `application/json` |

#### Request Body (JSON):
```json
{
  "description": "Updated description for plastic water bottles",
  "recyclable": true
}
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Plastic Water Bottle",
    "description": "Updated description for plastic water bottles",
    "category": {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Plastic",
      "description": "Various types of plastic materials"
    },
    "recyclable": true,
    "hazardous": false,
    "compostable": false,
    "createdAt": "2026-02-15T07:00:00.000Z",
    "updatedAt": "2026-02-15T08:00:00.000Z"
  }
}
```

---

### 5. Delete Waste Item (Admin Only)
**DELETE** `/api/items/:id`

Deletes a waste item.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{token}}` |

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k3",
    "name": "Plastic Water Bottle",
    ...
  },
  "message": "Waste item deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Category name already exists"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Category not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

---

## Testing Workflow

### Step-by-Step Testing Order:

1. **Create a regular user** - `POST /signup`
2. **Create an admin user** - `POST /signup` (then update role in DB)
3. **Login as admin** - `POST /login` (save the token)
4. **Create a category** - `POST /api/categories` (save the category ID)
5. **Get all categories** - `GET /api/categories`
6. **Create a waste item** - `POST /api/items` (use category ID)
7. **Get all items** - `GET /api/items`
8. **Search items** - `GET /api/items?search=bottle`
9. **Filter items** - `GET /api/items?recyclable=true`
10. **Update a category** - `PUT /api/categories/:id`
11. **Update an item** - `PUT /api/items/:id`
12. **Delete an item** - `DELETE /api/items/:id`
13. **Delete a category** - `DELETE /api/categories/:id`

---

## Sample Categories to Create

### Plastic
```json
{
  "name": "Plastic",
  "description": "Various plastic materials including bottles, containers, and packaging",
  "recyclable": true,
  "hazardous": false,
  "compostable": false
}
```

### Paper
```json
{
  "name": "Paper",
  "description": "Paper products including newspapers, cardboard, and office paper",
  "recyclable": true,
  "hazardous": false,
  "compostable": true
}
```

### Electronic Waste
```json
{
  "name": "Electronic Waste",
  "description": "Electronic devices and components including batteries, computers, and phones",
  "recyclable": true,
  "hazardous": true,
  "compostable": false
}
```

### Organic
```json
{
  "name": "Organic",
  "description": "Food scraps, yard waste, and other biodegradable materials",
  "recyclable": false,
  "hazardous": false,
  "compostable": true
}
```

---

## Sample Waste Items to Create

### Plastic Water Bottle
```json
{
  "name": "Plastic Water Bottle",
  "description": "Empty PET plastic water bottle",
  "category": "{{categoryId}}",
  "recyclable": true,
  "hazardous": false,
  "compostable": false
}
```

### Newspaper
```json
{
  "name": "Newspaper",
  "description": "Used newspapers and magazines",
  "category": "{{categoryId}}",
  "recyclable": true,
  "hazardous": false,
  "compostable": true
}
```

### AA Battery
```json
{
  "name": "AA Battery",
  "description": "Standard AA alkaline battery",
  "category": "{{categoryId}}",
  "recyclable": true,
  "hazardous": true,
  "compostable": false
}
```

### Food Scraps
```json
{
  "name": "Food Scraps",
  "description": "Fruit and vegetable scraps, coffee grounds, eggshells",
  "category": "{{categoryId}}",
  "recyclable": false,
  "hazardous": false,
  "compostable": true
}