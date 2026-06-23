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

## Stage 2: Database Schema & Scaling Strategy

This stage outlines the persistent storage layout designed to process, index, and query massive volumes of student notification data without bottlenecking transaction throughput.

### 1. Database Engine Recommendation

We select **PostgreSQL** (a Relational Database Management System - RDBMS) as our primary persistent data store for the following structural reasons:
* **Strong ACID Compliance:** Ensures that when an admin sends a notification, it is either successfully delivered to everyone or rolled back completely—preventing partial or corrupt database states.
* **Complex Data Join Capabilities:** Relational databases allow us to cleanly join the `notifications` records with distinct `students` and `depots/departments` tables without duplicating raw user profiles across millions of rows.
* **Support for Advanced Indexing:** PostgreSQL natively provides optimized B-Tree and composite indexing models that allow for lightning-fast reading paths when searching through millions of old notices.

---

### 2. Database Schema Design

Below is the optimized SQL Schema structure mapping out the primary tracking properties:

```sql
-- Core Table tracking generated campus notifications
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    notification_type VARCHAR(20) NOT NULL, -- 'placement', 'result', 'event'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

---

## Stage 3: Database Query Optimization

This section addresses performance vulnerabilities when executing status-specific lookups against large datasets (5,000,000+ records).

### 1. Performance Diagnostics: Why the Current Query is Slow
The target query is structured as follows:
```sql
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC;

## Stage 4: High-Performance Cache Blueprint

To prevent high application traffic from degrading core database availability on every dashboard page load, an active caching layer is positioned between the client requests and the database using **Redis**.

### 1. Strategy Comparison & Trade-off Matrix

| Cache Strategy | Core Pros | Core Cons | Practical Use-case |
| :--- | :--- | :--- | :--- |
| **Cache-Aside** (Lazy Loading) | Memory optimized; data is only cached upon direct user demand. Safe against system crashes. | Cache-miss penalty on the first request; requires careful data eviction logic. | Ideal for erratic dashboard requests and personalized notification feeds. |
| **Write-Through** (Pre-Caching) | Extremely fast read paths; data is guaranteed to be warm and ready in RAM. | High memory footprint; saves unnecessary records for inactive or dormant users. | Ideal for static structural configurations or premium system assets. |

### 2. Architectural Recommendation & Flow
We implement the **Cache-Aside strategy with strategic invalidation** to manage student dashboards:

1. **Check Cache:** When a student requests their notification feed, the backend system interrogates the high-speed Redis cluster first.
2. **Cache Hit:** If the data exists in Redis, the data is instantly sent back to the user in sub-milliseconds. The database is never touched.
3. **Cache Miss:** If the data is not in Redis, the backend executes our optimized Stage 3 database query, returns the data to the user, and immediately saves a copy inside Redis with a Time-To-Live (TTL) of 1 hour.
4. **Data Invalidation:** The moment an administrator creates a new notification, the system writes to the database and immediately purges (deletes) that student's old cache entry in Redis to prevent displaying stale information.

## Stage 5: System Redesign for Bulk Operations

This section evaluates the structural vulnerabilities of synchronous loops during high-volume data distributions and designs an asynchronous message-broker alternative.

### 1. Architectural Vulnerabilities of the Provided Synchronous Pseudocode
The initial implementation utilizes a blocking `for` loop to iterate sequentially through 50,000 student records:

```python
function notify_all(student_ids, message):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)