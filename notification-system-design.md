# Campus Notifications System Design Specification

## Stage 1: REST API Contract & Architecture Design

This stage establishes the API contract conventions, payload models, and transmission mechanics required to support a scalable, secure campus notification channel.

### 1. REST API Endpoints

All endpoints are protected routes requiring a valid bearer credential appended to the communication header metadata.

#### A. Fetch All Notifications
* **Method:** `GET`
* **Endpoint:** `/api/v1/notifications`
* **Description:** Retrieves historical and active alerts tailored to the authenticated student profile.
* **Headers:**
  * `Authorization`: `Bearer <access_token>`
  * `Accept`: `application/json`
* **Query Parameters (Optional):**
  * `type`: `placement` | `result` | `event`
  * `isRead`: `true` | `false`
* **Response (Status Code: 200 OK):**
```json
{
  "success": true,
  "count": 2,
  "notifications": [
    {
      "id": "notif_883a12",
      "type": "placement",
      "title": "Amazon Campus Drive",
      "message": "Registration closes tonight at 11:59 PM.",
      "isRead": false,
      "createdAt": "2026-06-23T12:00:00Z"
    },
    {
      "id": "notif_992b41",
      "type": "result",
      "title": "Mid-Sem Exams",
      "message": "CSE Department results have been published.",
      "isRead": true,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ]
}