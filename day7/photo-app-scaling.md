# SnapShare: Photo-App Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos and view feeds containing photos from people they follow.

The following assumptions are used:

* Registered users: 10 million.
* Daily active users: 10% of registered users.
* Each active user uploads one photo per day.
* Each active user views 50 feed pages per day.
* Average original photo size: 2 MB.
* Each photo has one thumbnail of 50 KB.
* One day has 86,400 seconds, and one year has 365 days.
* Peak feed traffic is five times the average feed traffic.
* Every uploaded photo is retained for one year, with no deletions or additional copies included in the storage estimate.

## 2. Traffic and Storage Calculations

### A. Daily Active Users (DAU)

Daily active users are 10% of the 10 million registered users.

DAU = 10,000,000 × 10%

DAU = 1,000,000 users per day.

Therefore, SnapShare has approximately **1 million daily active users**.

### B. Photo Uploads Per Second

Each active user uploads one photo per day.

Daily uploads = 1,000,000 × 1

Daily uploads = 1,000,000 photos.

Average uploads per second = 1,000,000 ÷ 86,400

Average uploads per second ≈ 11.57 photos.

Therefore, the system receives approximately **12 photo uploads per second on average**.

### C. Feed Views Per Second

Each active user views 50 feed pages per day.

Daily feed views = 1,000,000 × 50

Daily feed views = 50,000,000 feed pages.

Average feed views per second:

50,000,000 ÷ 86,400 ≈ 578.7 feed views per second.

Therefore, the average feed traffic is approximately **579 feed views per second**.

Peak feed views per second:

578.7 × 5 ≈ 2,893.5 feed views per second.

Therefore, the system should be designed to handle approximately **2,894 feed views per second at peak**.

### D. Photo Storage Per Year

Each original photo is 2 MB, and each thumbnail is 50 KB.

Assuming 1 MB = 1,000 KB:

50 KB = 0.05 MB.

Total storage per photo:

2 MB + 0.05 MB = 2.05 MB.

Original photo storage per year:

1,000,000 × 365 × 2 MB = 730,000,000 MB.

This is approximately 730 TB per year.

Thumbnail storage per year:

1,000,000 × 365 × 0.05 MB = 18,250,000 MB.

This is approximately 18.25 TB per year.

Total photo storage per year:

730 TB + 18.25 TB = 748.25 TB.

Therefore, SnapShare requires approximately **748.25 TB of new photo storage per year**, excluding metadata, backups, replication, and other overhead.

## 3. Is SnapShare Read-Heavy or Write-Heavy?

SnapShare is a read-heavy system because users view feed pages much more frequently than they upload photos.

The application receives approximately 579 feed views per second on average, compared with approximately 12 photo uploads per second. Feed views therefore occur about 50 times as frequently as uploads.

The architecture should prioritise fast feed delivery through caching, a content delivery network (CDN), and a database read replica. Photo uploads should also be handled efficiently using object storage and background processing so that creating thumbnails does not delay the user's upload experience.

## 4. Where Should Photos Be Stored?

Photo files should be stored in object storage rather than directly inside the relational database.

Storing large image files in a database would increase database storage requirements, backup sizes, and the amount of data that must be transferred during queries. It could also make database operations more expensive as the number of photos grows.

Object storage is designed to store large files independently and scale to very large amounts of data. The database should store photo metadata, such as the photo ID, owner ID, storage key, upload time, and thumbnail key. The actual image files should be kept in object storage and delivered to users through a CDN.

## 5. SnapShare Architecture Diagram

```text
                     +------------------+
                     |      Users       |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     |       CDN        |
                     | Photos/Thumbnails|
                     +--------+---------+
                              |
                     Cache miss or API
                              |
                              v
                     +------------------+
                     |  Load Balancer   |
                     +--------+---------+
                              |
                  +-----------+-----------+
                  |                       |
                  v                       v
          +---------------+       +---------------+
          | App Server 1  |       | App Server 2  |
          +-------+-------+       +-------+-------+
                  |                       |
                  +-----------+-----------+
                              |
                  +-----------+-----------+
                  |                       |
                  v                       v
          +---------------+       +---------------+
          | Redis Cache   |       | Database      |
          | Feed/Metadata |       | Primary       |
          +---------------+       +-------+-------+
                                          |
                                          v
                                  +---------------+
                                  | Read Replica  |
                                  +---------------+

Photo upload and thumbnail processing:

       Users
         |
         v
    App Servers
         |
         v
    +------------------+
    |  Object Storage  |
    | Original Photos  |
    +--------+---------+
             |
             | Successful upload
             v
    +------------------+
    | Message Queue    |
    +--------+---------+
             |
             v
    +------------------+
    | Thumbnail Worker |
    +--------+---------+
             |
             v
    +------------------+
    |  Object Storage  |
    |    Thumbnails    |
    +------------------+
```

The diagram shows the main components and their roles. In a production implementation, photo delivery through the CDN would use object storage as its origin, and the load balancer would route application requests to healthy app servers. The database primary handles writes, while the read replica serves suitable read queries.

## 6. What Each Component Does

**1. Users:** Users upload photos, follow other users, and browse their photo feeds.

**2. CDN (Content Delivery Network):** The CDN serves photos and thumbnails from geographically distributed locations to reduce latency and the load on the origin storage.

**3. Load Balancer:** The load balancer distributes incoming application requests across healthy app servers to prevent one server from becoming overloaded.

**4. App Servers:** App servers handle authentication, validate uploads, manage feed requests, and coordinate operations between the cache, database, object storage, and queue.

**5. Redis Cache:** Redis stores frequently requested data, such as feed results and metadata, to reduce repeated database queries and improve response times.

**6. Database Primary:** The primary database stores structured information such as users, follows, photo metadata, and feed-related records, and processes writes.

**7. Database Read Replica:** The read replica handles suitable read queries to reduce the workload on the primary database and improve read scalability.

**8. Object Storage:** Object storage holds the original photos and generated thumbnails without placing large image files inside the database.

**9. Message Queue:** The queue stores thumbnail-generation jobs so that photo processing can happen asynchronously without making users wait for the entire task to finish.

**10. Thumbnail Worker:** The worker retrieves queued jobs, creates smaller versions of uploaded photos, stores the thumbnails in object storage, and updates the associated metadata when necessary.

## 7. Step-by-Step Photo Upload Flow

1. A user selects a photo and requests permission to upload it through the application.

2. The app server authenticates the user and validates the request, including file type and size.

3. The app server provides a secure, time-limited upload URL for object storage so the user can upload the photo directly without sending the entire file through the app server.

4. The original photo is uploaded to object storage, and the application confirms that the upload succeeded.

5. The application records the photo's metadata in the primary database, including the owner, storage key, and upload time.

6. A thumbnail-generation job is added to the message queue. The application should handle failures carefully so a successful upload is not permanently left without a processing job.

7. A thumbnail worker retrieves the job and generates a smaller image from the original photo.

8. The worker saves the thumbnail in object storage and updates the photo metadata to indicate that the thumbnail is ready.

9. The application makes the photo available in the user's feed. The CDN can then cache and serve the original photo or thumbnail when requested.

This asynchronous process allows users to upload photos without waiting for thumbnail generation to finish.

## 8. Scaling Trade-Offs

### Trade-Off 1: Caching Versus Data Freshness

Caching feed results in Redis improves performance and reduces database load. However, cached feeds may not immediately reflect new uploads, deleted photos, or changes in follow relationships. Cache invalidation or updates are needed to maintain acceptable freshness.

### Trade-Off 2: Database Read Replicas Versus Consistency

A read replica reduces the workload on the primary database and supports more feed-related reads. However, replication can lag behind the primary, meaning a newly uploaded photo might not appear immediately when a feed is read from the replica. Critical reads may need to go to the primary database.

### Trade-Off 3: Direct Object Storage Uploads Versus Complexity

Uploading directly to object storage reduces the workload and bandwidth requirements of the app servers. However, it introduces additional steps for secure upload URLs, upload verification, failed uploads, and metadata consistency. The application must handle these cases correctly.

### Trade-Off 4: Asynchronous Thumbnails Versus Immediate Availability

Using a queue and worker allows thumbnail generation to scale independently and keeps upload requests fast. However, thumbnails may not be available immediately, and the system needs retries and monitoring for failed jobs.

## 9. Conclusion

SnapShare should use a horizontally scalable application architecture because it has 10 million registered users and approximately one million daily active users. Since the application is read-heavy, caching, a CDN, and database read replicas are important for efficient feed delivery. Original photos and thumbnails should be stored in object storage, while the database stores structured metadata. A message queue and thumbnail worker separate image processing from the upload request, improving responsiveness and allowing background processing to scale independently.
