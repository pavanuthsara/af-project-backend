# AI Waste Identification — API Testing Guide

> **Base URL:** `http://localhost:3000`
> Make sure the server is running with `pnpm dev` before testing.

---

## 📋 Overview

This module provides AI-powered waste identification using **Google Gemini's multimodal API** (gemini-2.5-flash). Upload an image of waste, and the system will identify it and provide disposal instructions from the database.

---

## 🔧 Setup

### Environment Variables

Ensure you have your Gemini API key in `.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

To get a Gemini API key:
1. Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key

---

## 📡 API Endpoints

### 1. Identify Waste from Image

**Endpoint:** `POST /api/ai/identify`

**Description:** Upload an image to identify waste type and get disposal instructions.

**Authentication:** None required

**Content-Type:** `multipart/form-data`

**Request Body:**
- `image` (file) — Image file (jpeg, jpg, or png), max 5MB

**Example Request (using cURL):**

```bash
curl -X POST http://localhost:3000/api/ai/identify \
  -F "image=@/path/to/your/image.jpg"
```

**Example Request (using Postman):**
1. Set method to `POST`
2. URL: `http://localhost:3000/api/ai/identify`
3. Go to Body tab
4. Select `form-data`
5. Add key `image` with type `File`
6. Choose an image file

**Success Response (200):**

```json
{
  "success": true,
  "detectedLabel": "plastic bottle",
  "confidence": "high",
  "disposalInstructions": "Rinse and place in recycling bin",
  "category": {
    "_id": "65f1b2c3d4e5f6a7b8c9d0e1",
    "name": "Plastic",
    "description": "Recyclable plastic materials"
  }
}
```

**Error Response - Item Not Found (404):**

```json
{
  "success": false,
  "message": "Item not found in database",
  "detectedLabel": "soccer ball",
  "confidence": "medium"
}
```

**Error Response - No Image (400):**

```json
{
  "success": false,
  "error": "No image file uploaded"
}
```

**Error Response - Invalid File Type (500):**

```json
{
  "success": false,
  "error": "Only image files (jpeg, jpg, png) are allowed"
}
```

**Error Response - Unable to Identify (400):**

```json
{
  "success": false,
  "message": "Unable to identify the image"
}
```

---

## 🧪 Testing Flow

### Recommended Testing Steps:

1. **Prepare Test Images**
   - Gather clear images of common waste items (bottles, cans, paper, etc.)
   - Ensure images are in JPEG, JPG, or PNG format
   - Keep file sizes under 5MB

2. **Send Identification Request**
   - Use Postman or cURL to send a POST request
   - Attach an image file

3. **Verify Response**
   - Check if the detected label matches the image
   - Review the confidence level (high, medium, low)
   - Confirm disposal instructions are returned
   - Verify category information is populated

4. **Test Edge Cases**
   - Upload a non-waste item (e.g., person, landscape)
   - Try different image formats
   - Test with very large or very small images

---

## 📝 Notes

- The AI model used is **Google Gemini 2.5 Flash** with multimodal capabilities
- Images are temporarily stored in `/uploads` and deleted after processing
- The system searches the WasteItem database using case-insensitive regex matching
- Gemini returns a confidence level: `high`, `medium`, or `low`
- If multiple items match, only the first match is returned
- The category field is populated automatically from the WasteItem's category reference

---

## 🐛 Troubleshooting

### Common Issues:

**1. "GEMINI_API_KEY is not set"**
- Make sure you've added `GEMINI_API_KEY` to your `.env` file
- Restart the server after updating `.env`

**2. "Unable to identify the image"**
- The image might be too blurry or unclear
- Try a different image with better quality
- Ensure the image actually contains a recognizable waste item

**3. "Item not found in database"**
- The detected label doesn't match any waste items in the database
- Add the waste item to the database using the waste management endpoints
- The system uses regex matching, so partial matches may work

**4. "Only image files are allowed"**
- Ensure your file is in JPEG, JPG, or PNG format
- Check the file extension is correct

**5. "Gemini API error: 502"**
- Check your API key is valid and has quota remaining
- Ensure you have a stable internet connection
- The Gemini API might be temporarily unavailable

---

## 🔗 Related Endpoints

To add waste items that can be identified:

- `POST /api/items` — Create a new waste item (admin only)
- `GET /api/items` — List all waste items
- `GET /api/categories` — List all waste categories

Refer to `Waste_Classification_API_GUIDE.md` for waste management endpoints.

---

## 🔄 Technology Stack

- **AI Model**: Google Gemini 2.5 Flash (multimodal)
- **Image Processing**: Base64 encoding via fs.readFileSync
- **File Upload**: Multer with disk storage
- **Database**: MongoDB (WasteItem collection)
- **API**: Google Generative Language API v1beta
