# HerGuardian AI

# API Documentation

Version: 1.0

---

# Purpose

This document defines all backend APIs required for HerGuardian AI.

The backend should be developed using:

- Node.js
- Node.js + Express
- MongoDB (Mongoose)

All APIs should return JSON responses.

The frontend must communicate only through these APIs.

---

# BASE URL

Development

http://localhost:8000

Production

(To be added after deployment)

---

# API RESPONSE FORMAT

Every API should return a consistent structure.

Example Success Response

{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}

Example Error Response

{
  "success": false,
  "message": "Something went wrong.",
  "error": {}
}

---

# USER MANAGEMENT APIs

## Register User

POST

/api/register

Purpose

Register a new user.

Request

{
    "name": "",
    "preferred_name": "",
    "age": 21,
    "country": "",
    "preferred_language": "English"
}

Response

{
    "success": true,
    "message": "Registration successful."
}

---

## Get User Profile

GET

/api/profile/{user_id}

Purpose

Return user information.

---

## Update Profile

PUT

/api/profile/{user_id}

Purpose

Update profile information.

---

# AI CHAT APIs

## Chat with HerGuardian AI

POST

/api/chat

Purpose

Send user message to the Master AI Agent.

Request

{
    "message":"",
    "module":"nutrition"
}

Response

{
    "reply":"",
    "tool_used":"Nutrition Tool"
}

---

## Conversation History

GET

/api/chat/history/{user_id}

Purpose

Return recent conversations.

---

# HEALTH MODULE

## Get Health Articles

GET

/api/health

Purpose

Return women's health resources.

---

## Search Health

POST

/api/health/search

Supports

Text

Voice

---

# NUTRITION MODULE

GET

/api/nutrition

Return vegetarian recipes.

---

POST

/api/nutrition/search

Search recipes.

Supports

Text

Voice

---

# FITNESS MODULE

GET

/api/fitness

Return women's fitness resources.

---

POST

/api/fitness/search

Search exercises.

---

# MENTAL WELLNESS

GET

/api/mental-wellness

---

POST

/api/mental-wellness/search

---

# MENSTRUAL WELLNESS

GET

/api/menstrual-wellness

---

POST

/api/menstrual-wellness/search

---

# CAREER

GET

/api/career

Return

Scholarships

Internships

Mentorships

Jobs

Competitions

---

POST

/api/career/search

Supports

Voice

Text

---

# INSPIRATION HUB

GET

/api/inspiration

Purpose

Return rotating inspirational content.

Unlike other modules,

this endpoint should not support search.

Content should rotate dynamically.

---

# SAVE FEATURE

## Save Resource

POST

/api/save

Request

{
    "user_id":1,
    "resource_id":100
}

---

## Remove Saved Resource

DELETE

/api/save/{resource_id}

---

## Get Saved Resources

GET

/api/save/{user_id}

---

# SHARE

Sharing should primarily be handled on the frontend using the browser's native sharing capabilities.

The backend does not require dedicated sharing APIs.

---

# FEEDBACK

POST

/api/feedback

Request

{
    "rating":5,
    "comment":"Amazing platform!"
}

---

GET

/api/feedback

Purpose

Return selected testimonials.

---

# COMMUNITY STATISTICS

GET

/api/statistics

Return

Total Users

Countries Reached

Average Rating

Saved Resources

Feedback Count

---

# TRANSLATION

POST

/api/translate

Purpose

Translate readable content.

Request

{
    "text":"",
    "language":"Spanish"
}

---

# VOICE SEARCH

POST

/api/voice-search

Purpose

Convert speech to text before processing the request.

---

# SEARCH

POST

/api/search

Purpose

Global search across all supported modules except Inspiration Hub.

Supports:

Text

Voice

---

# YOUTUBE RESOURCE LOOKUP

GET

/api/videos

Purpose

Return trusted YouTube videos related to selected content.

If unavailable,

return an empty list and a friendly message.

---

# BOOKMARKS

GET

/api/bookmarks/{user_id}

Return all saved resources.

---

# ABOUT PAGE

GET

/api/about

Return

Mission

Vision

Features

Version

Technology Stack

---

# HEALTH CHECK

GET

/api/healthcheck

Purpose

Verify backend availability.

Example

{
    "status":"running"
}

---

# STATUS CODES

200

Success

201

Created

400

Bad Request

401

Unauthorized

403

Forbidden

404

Not Found

500

Internal Server Error

---

# ERROR HANDLING

Every endpoint should:

Validate inputs

Handle exceptions

Return friendly error messages

Never expose stack traces.

---

# SECURITY

Never expose:

API Keys

Database credentials

Environment variables

Validate all user input.

Sanitize text.

Use environment variables.

---

# API DESIGN PRINCIPLES

Every endpoint should be:

Simple

Readable

RESTful

Predictable

Well documented

Secure

Scalable

Maintainable

The backend should be easy for future developers to understand and extend.