# API Guide

This document provides a guide on how to use the APIs of this project with Postman.

## Authentication

Authentication is handled using JSON Web Tokens (JWT). When you log in, you will receive a token that you need to include in the headers of subsequent requests to protected routes.

**Header:** `Authorization: Bearer <YOUR_TOKEN>`

## User Endpoints

### User Signup

*   **Method:** `POST`
*   **URL:** `/signup`
*   **Description:** Registers a new user.
*   **Request Body:**

    ```json
    {
      "name": "dmith",
      "email": "damith@example.com",
      "password": "yourpassword"
    }
    ```

*   **Response:**

    ```json
    {
      "message": "User registered successfully"
    }
    ```

*   **Postman Instructions:**
    1.  Open Postman.
    2.  Set the request method to `POST`.
    3.  Enter the URL: `http://localhost:3000/signup`.
    4.  Go to the "Body" tab, select "raw", and choose "JSON".
    5.  Paste the request body JSON.
    6.  Click "Send".

### User Login

*   **Method:** `POST`
*   **URL:** `/login`
*   **Description:** Logs in a user and returns a JWT.
*   **Request Body:**

    ```json
    {
      "email": "damith@example.com",
      "password": "yourpassword"
    }
    ```

*   **Response:**

    ```json
    {
      "token": "your_jwt_token"
    }
    ```

*   **Postman Instructions:**
    1.  Open Postman.
    2.  Set the request method to `POST`.
    3.  Enter the URL: `http://localhost:3000/login`.
    4.  Go to the "Body" tab, select "raw", and choose "JSON".
    5.  Paste the request body JSON.
    6.  Click "Send".

### View Recycling Centers

*   **Method:** `GET`
*   **URL:** `/recycling-centers`
*   **Description:** Returns the list of recycling centers. This is a protected route and requires a user JWT.
*   **Headers:**
    *   `Authorization: Bearer <YOUR_TOKEN>`
*   **Response (`200 OK`):**

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

*   **Notes:**
    *   Returns an empty array (`"recyclingCenters": []`) if no recycling centers exist.
*   **Error Responses:**
    *   `401` Access denied. No token provided / Invalid token
*   **Manager Test Signup (Current Build / Testing):**
    *   There is no separate manager signup endpoint. For testing manager-protected routes in the current build, `/signup` accepts a `role` field.

    ```json
    {
      "name": "Manager User",
      "email": "damithmanager@example.com",
      "password": "password123",
      "role": "manager"
    }
    ```

*   **Postman Instructions:**
    1.  First, log in as a user to get a token.
    2.  Open a new request in Postman.
    3.  Set the request method to `GET`.
    4.  Enter the URL: `http://localhost:3000/recycling-centers`.
    5.  Go to the "Headers" tab and add:
        *   **Key:** `Authorization`
        *   **Value:** `Bearer <YOUR_TOKEN>`
    6.  Click "Send".

## Admin Endpoints

### Admin Login

*   **Method:** `POST`
*   **URL:** `/admin/login`
*   **Description:** Logs in an admin and returns a JWT.
*   **Request Body:**

    ```json
    {
      "email": "admin@example.com",
      "password": "adminpassword"
    }
    ```

*   **Response:**

    ```json
    {
      "token": "your_admin_jwt_token"
    }
    ```

*   **Postman Instructions:**
    1.  Open Postman.
    2.  Set the request method to `POST`.
    3.  Enter the URL: `http://localhost:3000/admin/login`.
    4.  Go to the "Body" tab, select "raw", and choose "JSON".
    5.  Paste the request body JSON.
    6.  Click "Send".

### Register Admin

*   **Method:** `POST`
*   **URL:** `/admin/register`
*   **Description:** Registers a new admin. This is a protected route and requires an admin JWT.
*   **Request Body:**

    ```json
    {
      "name": "New Admin",
      "email": "new.admin@example.com",
      "password": "newadminpassword"
    }
    ```

*   **Response:**

    ```json
    {
      "message": "Admin registered successfully"
    }
    ```

*   **Postman Instructions:**
    1.  First, log in as an admin to get a token.
    2.  Open a new request in Postman.
    3.  Set the request method to `POST`.
    4.  Enter the URL: `http://localhost:3000/admin/register`.
    5.  Go to the "Headers" tab and add a new header:
        *   **Key:** `Authorization`
        *   **Value:** `Bearer <YOUR_ADMIN_TOKEN>`
    6.  Go to the "Body" tab, select "raw", and choose "JSON".
    7.  Paste the request body JSON.
    8.  Click "Send".

### Delete Recycling Center

*   **Method:** `DELETE`
*   **URL:** `/admin/recycling-centers/:id`
*   **Description:** Deletes a recycling center by ID. This is a protected route and requires an admin JWT.
*   **Request Params:**
    *   `id` (MongoDB ObjectId)
*   **Response:**
    *   `204 No Content` on success
*   **Error Responses:**
    *   `400` Invalid recycling center id
    *   `401` Access denied. No token provided / Invalid token
    *   `403` Forbidden: Not an admin
    *   `404` Recycling center not found
