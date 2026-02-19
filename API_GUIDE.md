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
