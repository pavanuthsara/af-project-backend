# Recycle Centre API Guide

This document covers only the Recycle Centre module APIs.

## Base URL

`http://localhost:3000`

## Authentication

Protected endpoints require JWT in the header:

`Authorization: Bearer <YOUR_TOKEN>`

Role requirements by route:
- Admin token: create and delete recycle centres
- Manager token: update recycle centres
- User token: list and search recycle centres

## Recycle Centre Data Model

```json
{
  "name": "Green Valley Recycling Hub",
  "address": "123 Main St, Springfield",
  "location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.73061]
  },
  "acceptedWasteTypes": ["Plastic", "Paper", "Glass"],
  "operatingHours": "Mon-Fri 08:00-18:00",
  "maxCapacityKg": 50000,
  "currentLoadKg": 1200
}
```

Validation notes:
- `location.type` must be `Point`
- `location.coordinates` must be `[lng, lat]`
- `maxCapacityKg >= 1`
- `0 <= currentLoadKg <= maxCapacityKg`
- `acceptedWasteTypes` must be a non-empty array

## 1. Register Recycle Centre (Admin)

- Method: `POST`
- URL: `/admin/recycling-centers`
- Auth: Admin JWT

Request body:

```json
{
  "name": "Green Valley Recycling Hub",
  "address": "123 Main St, Springfield",
  "location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.73061]
  },
  "acceptedWasteTypes": ["Plastic", "Paper", "Glass"],
  "operatingHours": "Mon-Fri 08:00-18:00",
  "maxCapacityKg": 50000,
  "currentLoadKg": 1200
}
```

Success response (`201`):

```json
{
  "message": "Recycling center registered successfully",
  "recyclingCenter": {
    "id": "507f191e810c19729de860ea",
    "name": "Green Valley Recycling Hub",
    "address": "123 Main St, Springfield",
    "location": {
      "type": "Point",
      "coordinates": [-73.935242, 40.73061]
    },
    "acceptedWasteTypes": ["Plastic", "Paper", "Glass"],
    "operatingHours": "Mon-Fri 08:00-18:00",
    "maxCapacityKg": 50000,
    "currentLoadKg": 1200
  }
}
```

Common errors:
- `400` Missing required fields / invalid location / invalid capacities
- `401` Missing or invalid token
- `403` Not an admin
- `409` Recycling center already exists





## 2. View All Recycle Centres (User)

- Method: `GET`
- URL: `/recycling-centers`
- Auth: User JWT

Success response (`200`):

```json
{
  "recyclingCenters": [
    {
      "id": "507f191e810c19729de860ea",
      "name": "Green Valley Recycling Hub",
      "address": "123 Main St, Springfield",
      "location": {
        "type": "Point",
        "coordinates": [-73.935242, 40.73061]
      },
      "acceptedWasteTypes": ["Plastic", "Paper", "Glass"],
      "operatingHours": "Mon-Fri 08:00-18:00",
      "maxCapacityKg": 50000,
      "currentLoadKg": 1200
    }
  ]
}
```

Notes:
- Returns an empty array if no data exists: `"recyclingCenters": []`

Common errors:
- `401` Missing or invalid token

## 2.1 Get Recycle Centres By Waste Type (User)

- Method: `GET`
- URL: `/recycling-centers/by-waste/:wasteType`
- Auth: User JWT
- Description: Returns recycle centres that accept the given waste type (case-insensitive exact match).

Example:

`GET /recycling-centers/by-waste/Plastic`

Success response (`200`):

```json
{
  "wasteType": "Plastic",
  "recyclingCenters": [
    {
      "id": "507f191e810c19729de860ea",
      "name": "Green Valley Recycling Hub",
      "address": "123 Main St, Springfield",
      "location": {
        "type": "Point",
        "coordinates": [-73.935242, 40.73061]
      },
      "acceptedWasteTypes": ["Plastic", "Paper", "Glass"],
      "operatingHours": "Mon-Fri 08:00-18:00",
      "maxCapacityKg": 50000,
      "currentLoadKg": 1200
    }
  ]
}
```

Common errors:
- `400` Missing/invalid waste type
- `401` Missing or invalid token

## 2.2 View One Recycle Centre (User)

- Method: `GET`
- URL: `/recycling-centers/:id`
- Auth: User JWT

Path param:
- `id`: MongoDB ObjectId (24-char hex string)

Example:

`GET /recycling-centers/507f191e810c19729de860ea`

Success response (`200`):

```json
{
  "recyclingCenter": {
    "id": "507f191e810c19729de860ea",
    "name": "Green Valley Recycling Hub",
    "address": "123 Main St, Springfield",
    "location": {
      "type": "Point",
      "coordinates": [-73.935242, 40.73061]
    },
    "acceptedWasteTypes": ["Plastic", "Paper", "Glass"],
    "operatingHours": "Mon-Fri 08:00-18:00",
    "maxCapacityKg": 50000,
    "currentLoadKg": 1200
  }
}
```

Common errors:
- `400` Invalid recycling center id
- `401` Missing or invalid token
- `404` Recycling center not found

## 3. Search Recycle Centres (User)

- Method: `POST`
- URL: `/recycling-centers/search`
- Auth: User JWT
- Description: Natural-language query is converted to search filters using Gemini.

Request body (either key is accepted):

```json
{
  "query": "plastic recycling centres in Colombo"
}
```

or

```json
{
  "q": "plastic recycling centres in Colombo"
}
```

Success response (`200`):

```json
{
  "query": "plastic recycling centres in Colombo",
  "filters": {
    "acceptedWasteTypes": ["Plastic"],
    "city": "Colombo",
    "name": null,
    "addressKeywords": [],
    "maxDistanceKm": null
  },
  "recyclingCenters": [
    {
      "id": "507f191e810c19729de860ea",
      "name": "Green Valley Recycling Hub",
      "address": "123 Main St, Springfield",
      "location": {
        "type": "Point",
        "coordinates": [-73.935242, 40.73061]
      },
      "acceptedWasteTypes": ["Plastic", "Paper", "Glass"],
      "operatingHours": "Mon-Fri 08:00-18:00",
      "maxCapacityKg": 50000,
      "currentLoadKg": 1200
    }
  ]
}
```

Common errors:
- `400` Query is required
- `401` Missing or invalid token
- `500` AI/filter extraction or search processing error

## 4. Update Recycle Centre (Manager)

- Method: `PUT`
- URL: `/manager/recycling-centers/:id`
- Auth: Manager JWT

Path param:
- `id`: MongoDB ObjectId (24-char hex string)

Request body:

```json
{
  "name": "Green Valley Recycling Hub",
  "address": "123 Main St, Springfield",
  "location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.73061]
  },
  "acceptedWasteTypes": ["Plastic", "Paper", "Glass", "Metal"],
  "operatingHours": "Mon-Sat 08:00-18:00",
  "maxCapacityKg": 60000,
  "currentLoadKg": 1800
}
```

Success response (`200`):

```json
{
  "message": "Recycling center updated successfully",
  "recyclingCenter": {
    "id": "507f191e810c19729de860ea",
    "name": "Green Valley Recycling Hub",
    "address": "123 Main St, Springfield",
    "location": {
      "type": "Point",
      "coordinates": [-73.935242, 40.73061]
    },
    "acceptedWasteTypes": ["Plastic", "Paper", "Glass", "Metal"],
    "operatingHours": "Mon-Sat 08:00-18:00",
    "maxCapacityKg": 60000,
    "currentLoadKg": 1800
  }
}
```

Common errors:
- `400` Invalid id / missing required fields / invalid location / invalid capacities
- `401` Missing or invalid token
- `403` Not a manager
- `404` Recycling center not found
- `409` Recycling center already exists

## 5. Delete Recycle Centre (Admin)

- Method: `DELETE`
- URL: `/admin/recycling-centers/:id`
- Auth: Admin JWT

Path param:
- `id`: MongoDB ObjectId (24-char hex string)

Success response:
- `204 No Content`

Common errors:
- `400` Invalid recycling center id
- `401` Missing or invalid token
- `403` Not an admin
- `404` Recycling center not found

## Quick Postman Flow

1. Login and copy token (`/login`, `/admin/login`, or manager user login).
2. Add `Authorization: Bearer <TOKEN>` to protected requests.
3. Use admin token for create/delete, manager token for update, user token for list/search.

https://platform-api-team-1457.postman.co/workspace/Postman-API-Fundamentals-Studen~9db8bb71-e1ee-4f2f-befe-c8b7989c7aec/collection/40171597-969748c0-4b55-4666-afde-bc5aa1488675?action=share&source=copy-link&creator=40171597
