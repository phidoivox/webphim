---
name: api-design-restful
description: Use when designing, creating, or modifying RESTful API routes, endpoints, responses, or API error handling
---

# RESTful API Design Standards

## Overview
Enforces consistent API endpoints, HTTP status codes, structured JSON responses, and pagination metadata.

## Standard JSON Response Format
```json
{
  "success": true,
  "message": "Operation description",
  "data": {},
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150
  }
}
```

## Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

## HTTP Status Codes
* `200 OK`: Successful GET / PUT / PATCH
* `201 Created`: Successful POST creating a resource
* `204 No Content`: Successful DELETE
* `400 Bad Request`: General client error
* `401 Unauthorized`: Missing or invalid authentication token
* `403 Forbidden`: Authenticated user lacks permission
* `404 Not Found`: Resource does not exist
* `422 Unprocessable Entity`: Validation failure
* `500 Internal Server Error`: Unhandled server exception
