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
      "name": "John Doe",
      "email": "john.doe@example.com",
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
      "email": "john.doe@example.com",
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

## Center Endpoints

### Find Nearest Centers

*   **Method:** `GET`
*   **URL:** `/api/centers/nearest?lat=<LATITUDE>&long=<LONGITUDE>`
*   **Description:** Finds centers within 5km of the specified coordinates using geospatial queries.
*   **Query Parameters:**
    *   `lat` (required): Latitude of the user's location (e.g., 40.7128)
    *   `long` (required): Longitude of the user's location (e.g., -74.0060)

*   **Response:**

    ```json
    {
      "success": true,
      "count": 2,
      "centers": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "Downtown Center",
          "address": "123 Main St, New York, NY",
          "location": {
            "type": "Point",
            "coordinates": [-74.0060, 40.7128]
          },
          "contactInfo": {
            "phone": "123-456-7890",
            "email": "downtown@example.com"
          }
        }
      ]
    }
    ```

*   **Postman Instructions:**
    1.  Open Postman.
    2.  Set the request method to `GET`.
    3.  Enter the URL: `http://localhost:3000/api/centers/nearest?lat=40.7128&long=-74.0060`.
    4.  Click "Send".

*   **Technical Details:**
    *   Uses MongoDB's `$near` operator with GeoJSON
    *   Requires a 2dsphere index on the `location` field (automatically created)
    *   Distance calculation is based on spherical geometry
    *   Maximum distance: 5km (5000 meters)
    *   Coordinates format: GeoJSON Point `[longitude, latitude]`
