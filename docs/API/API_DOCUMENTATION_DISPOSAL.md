# Waste Management API - Disposal Activity Documentation

This document covers all Disposal Activity endpoints including CO₂ impact tracking via Climatiq API.

## Table of Contents
1. [Setup](#setup)
2. [Authentication](#authentication)
3. [Disposal Endpoints](#disposal-endpoints)
4. [Carbon Impact (CO₂)](#carbon-impact)
5. [Error Responses](#error-responses)
6. [Testing Workflow](#testing-workflow)

---

## Setup

### Base URL
```
http://localhost:3000
```

### Environment Variables
Create a Postman environment with these variables:
| Variable | Value | Description |
|----------|-------|-------------|
| `baseUrl` | `http://localhost:3000` | API base URL |
| `userToken` | (obtained from login) | JWT token for regular user |
| `adminToken` | (obtained from admin login) | JWT token for admin |
| `disposalId` | (from created disposal log) | For update/delete testing |
| `wasteId` | (from existing waste item) | Waste item reference |

### Available Waste Item IDs (Already in DB)
| Name | wasteId | Category |
|------|---------|----------|
| Plastic Water Bottle | `699dc942fa2120d62a867da5` | Plastic (recyclable) |
| AA Battery | `699dce1fa9fe40a49c809291` | Hazardous Waste |

---

## Authentication

All disposal endpoints require a valid JWT token.

### Register User
**POST** `/signup`

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |

**Body:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test@1234",
  "role": "user"
}
```

**Response (201):**
```json
{
  "message": "User registered and logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "69a1427a739ad6f125e98b49",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### Login
**POST** `/login`

**Body:**
```json
{
  "email": "test@example.com",
  "password": "Test@1234"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "69a1427a739ad6f125e98b49",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

> Save the `token` and use it as `Bearer {{userToken}}` in all disposal requests.

---

## Disposal Endpoints

### 1. Create Disposal Log
**POST** `/disposal`

Creates a new disposal activity log and automatically calculates CO₂ saved using the Climatiq API (falls back to EPA WARM factors if unavailable).

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{userToken}}` |
| `Content-Type` | `application/json` |

#### Request Body:
```json
{
  "wasteId": "699dc942fa2120d62a867da5",
  "quantity": 3,
  "weight": 1.5,
  "unit": "kg",
  "disposalGuideline": "Rinse thoroughly and place in the blue recycling bin. Remove caps before recycling."
}
```

#### Field Reference:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wasteId` | ObjectId | ✅ | Reference to waste item |
| `quantity` | Number | ✅ | Number of items |
| `weight` | Number | ✅ | Weight of waste |
| `unit` | String | ✅ | `kg`, `g`, `lbs`, `oz` |
| `disposalGuideline` | String | ❌ | How to dispose of this waste |

#### Response (201 Created):
```json
{
  "message": "Disposal log created successfully",
  "data": {
    "id": "69a142df739ad6f125e98b4e",
    "userId": "69a1427a739ad6f125e98b49",
    "wasteId": "699dc942fa2120d62a867da5",
    "quantity": 3,
    "weight": 1.5,
    "unit": "kg",
    "timestamp": "2026-02-27T07:08:15.488Z",
    "disposalGuideline": "Rinse thoroughly and place in the blue recycling bin. Remove caps before recycling.",
    "co2Saved": 1.53,
    "co2Source": "climatiq",
    "disposalMethod": "recycled",
    "createdAt": "2026-02-27T07:08:15.488Z",
    "updatedAt": "2026-02-27T07:08:15.488Z"
  },
  "carbonImpact": {
    "co2Saved": 1.53,
    "co2SavedUnit": "kg CO₂e",
    "disposalMethod": "recycled",
    "source": "climatiq",
    "message": "You saved 1.53 kg CO₂e by recycled this waste! 🌱"
  }
}
```

> **Note:** Save the `id` from `data` as `disposalId` for update/delete testing.

---

### 2. Get Disposal History
**GET** `/disposal/history`

Returns all disposal logs for the authenticated user.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{userToken}}` |

#### Query Parameters (Optional):
| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `limit` | 10 | Items per page |
| `startDate` | - | Filter from date (ISO 8601) |
| `endDate` | - | Filter to date (ISO 8601) |

#### Example Requests:
```
GET /disposal/history
GET /disposal/history?page=1&limit=10
GET /disposal/history?startDate=2026-01-01&endDate=2026-12-31
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "69a142df739ad6f125e98b4e",
      "userId": "69a1427a739ad6f125e98b49",
      "wasteId": "699dc942fa2120d62a867da5",
      "quantity": 3,
      "weight": 1.5,
      "unit": "kg",
      "timestamp": "2026-02-27T07:08:15.488Z",
      "disposalGuideline": "Rinse thoroughly and place in the blue recycling bin.",
      "co2Saved": 1.53,
      "co2Source": "climatiq",
      "disposalMethod": "recycled",
      "createdAt": "2026-02-27T07:08:15.488Z",
      "updatedAt": "2026-02-27T07:08:15.488Z"
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

### 3. Update Disposal Log
**PUT** `/disposal/:id`

Updates an existing disposal log. If `weight`, `unit`, or `wasteId` is changed, CO₂ is automatically recalculated.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{userToken}}` |
| `Content-Type` | `application/json` |

#### Request Body (all fields optional):
```json
{
  "weight": 2.5,
  "quantity": 5,
  "unit": "kg",
  "disposalGuideline": "Updated: Crush first before recycling."
}
```

#### CO₂ Recalculation Triggers:
| Field Changed | CO₂ Recalculated? |
|---------------|-------------------|
| `weight` | ✅ Yes |
| `unit` | ✅ Yes |
| `wasteId` | ✅ Yes |
| `quantity` | ❌ No |
| `disposalGuideline` | ❌ No |

#### Response (200 OK):
```json
{
  "message": "Disposal log updated successfully",
  "data": {
    "id": "69a142df739ad6f125e98b4e",
    "userId": "69a1427a739ad6f125e98b49",
    "wasteId": "699dc942fa2120d62a867da5",
    "quantity": 5,
    "weight": 2.5,
    "unit": "kg",
    "timestamp": "2026-02-27T07:08:15.488Z",
    "disposalGuideline": "Updated: Crush first before recycling.",
    "co2Saved": 2.55,
    "co2Source": "epa_warm",
    "disposalMethod": "recycled",
    "createdAt": "2026-02-27T07:08:15.488Z",
    "updatedAt": "2026-02-27T08:00:00.000Z"
  }
}
```

---

### 4. Delete Disposal Log
**DELETE** `/disposal/:id`

Deletes a disposal log by ID.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{userToken}}` |

#### Example Request:
```
DELETE /disposal/69a142df739ad6f125e98b4e
```

#### Response (200 OK):
```json
{
  "message": "Disposal log deleted successfully",
  "data": {
    "id": "69a142df739ad6f125e98b4e"
  }
}
```

---

### 5. Get Disposal Stats
**GET** `/disposal/stats`

Returns aggregated statistics for the authenticated user's disposal activity.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{userToken}}` |

#### Response (200 OK):
```json
{
  "success": true,
  "data": {
    "totalDisposals": 10,
    "totalWeight": 15.5,
    "totalCo2Saved": 15.81,
    "byMethod": {
      "recycled": 8,
      "composted": 1,
      "landfill": 1
    },
    "byUnit": {
      "kg": 9,
      "g": 1
    }
  }
}
```

---

### 6. Get User Waste Stats
**GET** `/disposal/waste-stats`

Returns per-waste-item breakdown of the user's disposal activity.

#### Headers:
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{userToken}}` |

#### Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "wasteId": "699dc942fa2120d62a867da5",
      "wasteName": "Plastic Water Bottle",
      "totalDisposals": 5,
      "totalWeight": 7.5,
      "totalCo2Saved": 7.65,
      "disposalMethod": "recycled"
    }
  ]
}
```

---

## Carbon Impact

### How CO₂ Savings are Calculated

$$\text{CO}_2\text{ Saved} = \text{CO}_2\text{ (Landfill)} - \text{CO}_2\text{ (Actual Method)}$$

### Source Priority
1. **Climatiq API** (primary) — real-world scientific emission factors
2. **EPA WARM v16** (fallback) — used when Climatiq is unavailable

### CO₂ Source in Response
| `co2Source` value | Meaning |
|---|---|
| `"climatiq"` | ✅ Climatiq API responded successfully |
| `"epa_warm"` | ⚠️ Climatiq failed, EPA fallback used |
| `null` | CO₂ calculation was not performed |

### EPA WARM Savings Factors
| Material | Recycled (kg CO₂e/kg) | Composted | Landfill |
|----------|-----------------------|-----------|----------|
| Plastic | 1.02 | 0 | 0 |
| Paper | 2.58 | 0.20 | 0 |
| Glass | 0.29 | 0 | 0 |
| Aluminum | 9.13 | 0 | 0 |
| Metal | 1.75 | 0 | 0 |
| Organic | 0 | 0.05 | -0.50 ⚠️ |
| Electronic | 0.05 | 0 | 0 |

> ⚠️ Negative CO₂ for organic landfill means methane is **generated**, not saved.

### Unit Conversion (before calculation)
| Unit | Multiplier to kg |
|------|-----------------|
| `kg` | × 1 |
| `g` | × 0.001 |
| `lbs` | × 0.453592 |
| `oz` | × 0.0283495 |

### Disposal Method (auto-detected from waste item flags)
| Waste Item Flags | Method |
|------------------|--------|
| `recyclable: true` | `recycled` |
| `compostable: true` | `composted` |
| neither | `landfill` |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Weight is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token."
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. You can only modify your own disposal logs."
}
```

### 404 Not Found
```json
{
  "error": "Disposal log not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## Testing Workflow

### Step-by-Step Order:

1. **Sign up as user** — `POST /signup`
2. **Login** — `POST /login` → save `token`
3. **Create disposal log (Plastic, 1.5kg)** — `POST /disposal` → save `disposalId`
4. **Verify CO₂ in response** — check `carbonImpact.co2Saved` and `co2Source`
5. **Get disposal history** — `GET /disposal/history`
6. **Update weight (2.5kg)** — `PUT /disposal/{{disposalId}}` → verify CO₂ recalculated
7. **Update guideline only** — `PUT /disposal/{{disposalId}}` → verify CO₂ unchanged
8. **Get disposal stats** — `GET /disposal/stats`
9. **Get waste stats** — `GET /disposal/waste-stats`
10. **Delete disposal log** — `DELETE /disposal/{{disposalId}}`

---

## Sample Test Cases

### Test 1 — Plastic Recycled (1.5 kg)
```json
{
  "wasteId": "699dc942fa2120d62a867da5",
  "quantity": 3,
  "weight": 1.5,
  "unit": "kg",
  "disposalGuideline": "Rinse and place in the blue recycling bin."
}
```
**Expected CO₂ saved:** `~1.53 kg CO₂e`

---

### Test 2 — Plastic Recycled (500g)
```json
{
  "wasteId": "699dc942fa2120d62a867da5",
  "quantity": 1,
  "weight": 500,
  "unit": "g"
}
```
**Expected CO₂ saved:** `~0.51 kg CO₂e`

---

### Test 3 — No disposal guideline (optional field)
```json
{
  "wasteId": "699dc942fa2120d62a867da5",
  "quantity": 1,
  "weight": 2,
  "unit": "kg"
}
```
**Expected:** `disposalGuideline: null` in response

---

### Test 4 — Update weight only (CO₂ recalculated)
```json
{
  "weight": 2.5
}
```
**Expected CO₂ saved:** `~2.55 kg CO₂e` (recalculated)

---

### Test 5 — Update guideline only (CO₂ unchanged)
```json
{
  "disposalGuideline": "Updated guideline text."
}
```
**Expected:** `co2Saved` remains the same as before

---

### Test 6 — Hazardous waste (AA Battery)
```json
{
  "wasteId": "699dce1fa9fe40a49c809291",
  "quantity": 2,
  "weight": 0.05,
  "unit": "kg",
  "disposalGuideline": "Take to a designated e-waste collection point."
}
```
**Expected CO₂ saved:** `~0.005 kg CO₂e` (electronic factor: 0.05)