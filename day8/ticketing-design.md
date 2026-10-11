# TicketHub: System Design Document

## 1. Requirements

### Functional Requirements

* Users can register, log in and manage their accounts.
* Users can browse events and search by event name, date or location.
* Users can view event details, ticket prices and available seats.
* Users can temporarily hold available seats while completing payment.
* Users can pay for their tickets and receive booking confirmation.
* Users can view their purchased tickets and order history.
* Users can cancel eligible bookings and receive refunds according to the event's policy.

### Non-Functional Requirements

**Performance:** Event pages should load within 300 milliseconds under normal conditions where practical. Seat availability and booking requests should respond quickly, even during a popular sale.

**Correctness:** A seat must never be sold to two different customers. Payment status and booking status must remain consistent.

**Fairness:** Users should be served through a fair waiting room or queue during high-demand sales. Rate limits and bot detection should reduce automated abuse.

**Availability:** The website should remain available during traffic spikes. If payment or booking services fail, the system must avoid confirming an uncompleted purchase.

**Security:** Passwords must be securely hashed, payments handled through a trusted payment provider, and users allowed to access only their own orders.

**Scalability:** The system should support two million registered users and scale when a popular concert attracts 200,000 potential buyers.

## 2. Traffic and Storage Estimates

### Normal Traffic

Given:

* Registered users: 2,000,000
* Daily visitors: 50,000
* Pages viewed per visitor: 10
* Tickets sold per day: 5,000

Daily page views:

50,000 × 10 = 500,000 page views per day.

Average page requests per second:

500,000 ÷ 86,400 ≈ 5.8 requests per second.

Average ticket sales per second:

5,000 ÷ 86,400 ≈ 0.058 tickets per second.

These are daily averages. Actual traffic may be higher during busy hours.

### Popular Concert Sale

Given:

* People trying to buy tickets: 200,000
* Available seats: 20,000
* Sale window: 10 minutes = 600 seconds

Average potential buyers arriving per second:

200,000 ÷ 600 ≈ 333 people per second.

Assuming each potential buyer generates three requests for browsing the event, viewing seats and beginning checkout:

200,000 × 3 ÷ 600 = 1,000 requests per second.

For planning, the system should be load-tested above this estimate. A five-times safety target would be approximately 5,000 requests per second.

Demand compared with supply:

200,000 ÷ 20,000 = 10 potential buyers per seat.

Only 10% of potential buyers could receive a seat if all 20,000 seats are sold to unique buyers and each buyer purchases one seat.

### Comparison

Normal traffic averages approximately 5.8 page requests per second, while the assumed popular-sale traffic averages 1,000 requests per second. This is about 173 times the normal average page-request rate. The sale also creates much greater contention over a limited number of seats, so correctness is as important as speed.

These estimates are planning assumptions, not measured peak values. Real traffic will be uneven, so monitoring and load testing are necessary.

## 3. API Design

The API uses REST conventions and JSON responses. Protected endpoints require authentication.

| Method and endpoint             | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| GET /events                     | Browse and search events                               |
| GET /events/{eventId}           | View event details                                     |
| GET /events/{eventId}/seats     | View available seats                                   |
| POST /events/{eventId}/holds    | Request a temporary hold on selected seats             |
| DELETE /holds/{holdId}          | Release a temporary seat hold                          |
| POST /orders                    | Create an order from valid held seats                  |
| POST /orders/{orderId}/payments | Initiate or confirm payment through a payment provider |
| GET /orders/{orderId}           | View an order's status                                 |
| GET /me/tickets                 | View the authenticated user's tickets                  |

The seat-hold endpoint must perform an atomic availability check. It should return a conflict response, such as HTTP 409, if a seat is already held or sold.

Payment and order-creation requests should support idempotency keys so that retries do not create duplicate orders or charges.

## 4. Data Model

The database is relational because bookings require transactions, relationships and strong integrity constraints.

### Users

* `user_id` — primary key
* `name` — user's name
* `email` — unique email address
* `password_hash` — securely hashed password
* `created_at` — account creation time

### Events

* `event_id` — primary key
* `event_name` — name of the concert or event
* `venue` — event location
* `event_date` — date and time of the event
* `status` — event status

### Seats

* `seat_id` — primary key
* `event_id` — foreign key referencing Events
* `seat_label` — seat identifier within the venue
* `price` — ticket price
* `status` — available, held or sold
* `hold_expires_at` — expiry time for a temporary hold

A unique constraint on `(event_id, seat_label)` prevents duplicate seat records for the same event.

### Orders

* `order_id` — primary key
* `user_id` — foreign key referencing Users
* `created_at` — order creation time
* `status` — pending, paid, failed or cancelled
* `total_amount` — order total
* `payment_reference` — payment provider reference, where available

### Order_Items

* `order_item_id` — primary key
* `order_id` — foreign key referencing Orders
* `seat_id` — foreign key referencing Seats
* `ticket_price` — price at purchase time

A unique constraint on `seat_id` in Order_Items prevents a seat from being assigned to multiple order items.

### Relationships

* One user can have many orders.
* One event can have many seats.
* One order can contain many order items.
* Each order item refers to one seat.
* Seats belong to events, and orders belong to users.

The Orders and Order_Items tables separate an order from its individual tickets, allowing one order to contain multiple seats.

## 5. Preventing Double-Booking

The database is the final authority on seat ownership. A cached seat map or waiting room alone cannot guarantee that a seat is sold only once.

When a user selects a seat, the application starts a database transaction and attempts an atomic conditional update. The update succeeds only if the seat is available, or if an existing hold has expired. It changes the seat to held and records the hold expiry time.

Conceptually:

`UPDATE Seats SET status = 'held', hold_expires_at = ... WHERE seat_id = ... AND status = 'available';`

The application checks the number of affected rows. If zero rows were updated, the seat was no longer available and the hold fails. Concurrent requests cannot both successfully change the same available seat through this conditional update.

The transaction commits the hold only when the necessary changes succeed. When payment is confirmed, the order and seat status are updated safely. A unique constraint on `Order_Items.seat_id` provides an additional database-level safeguard against assigning the same seat to two orders.

Temporary holds expire after a short period, releasing unpaid seats. Expiry processing must also use safe conditional database updates so that it cannot release a seat that has already been sold.

Payment processing should be idempotent. If a payment provider responds slowly or a request is retried, TicketHub must verify the payment status before confirming an order. A failed payment must not produce a confirmed ticket.

## 6. Architecture

### Architecture Diagram

```text
                    Customers
                        |
                 CDN / Web Frontend
                        |
               Waiting Room / Queue
                        |
                  Load Balancer
                        |
                Application Servers
                 /       |       \
             Redis    Primary DB   Payment Provider
              Cache       |
                         Read Replica
                           

        Application Servers
                 |
             Message Queue
                 |
          Background Workers
```

### Component Responsibilities

**CDN / Web Frontend:** Delivers static files, images and frontend assets close to users. It reduces load on the application servers.

**Waiting Room / Queue:** Controls the rate at which users enter the purchase flow during the popular sale. A fair queue helps prevent the application and database from being overwhelmed.

**Load Balancer:** Distributes requests among healthy application servers.

**Application Servers:** Handle authentication, event browsing, seat holds, orders and business rules. Multiple stateless servers can be added as traffic grows.

**Redis Cache:** Stores frequently requested event details and other suitable read data. Seat availability displayed in the cache is only informational; the database makes the final booking decision.

**Primary Database:** Stores users, events, seats and orders. It enforces transactions, foreign keys, unique constraints and conditional seat updates.

**Read Replica:** Handles suitable read queries, such as event browsing and order history, reducing read pressure on the primary database. Recent booking decisions must not rely on potentially stale replica data.

**Payment Provider:** Processes payments securely and sends verified payment results to TicketHub.

**Message Queue and Background Workers:** Process tasks such as email confirmations, ticket generation and expired-hold cleanup without blocking normal web requests.

### How the System Survives the Big Sale

1. The CDN serves static content without sending every request to the application.
2. The waiting room limits how many customers enter the purchase flow at once.
3. The load balancer distributes requests across multiple application servers.
4. Redis serves suitable cached reads, reducing unnecessary database queries.
5. Read replicas handle browsing traffic where slightly stale data is acceptable.
6. Seat holds and purchases go through the primary database's atomic operations and constraints.
7. Queues and workers process non-critical tasks asynchronously.
8. Monitoring, rate limiting and load testing help identify bottlenecks and protect the service.

The system should also use database connection pooling, backups, health checks and alerts. If the database cannot confirm a booking, TicketHub must not claim that the seat is sold to the customer.

## 7. Trade-Offs

### Trade-Off 1: Cache Speed vs Data Freshness

Caching improves browsing speed and reduces database load. However, cached seat information can become outdated when another customer holds or purchases a seat. TicketHub therefore caches event details but always checks seat availability in the primary database when placing a hold.

### Trade-Off 2: Read Replicas vs Consistency

Read replicas allow the system to serve more browsing requests. However, replication lag may cause a customer to see old availability or order information. Booking decisions and final payment confirmation must use authoritative primary-database state rather than trusting a replica.

### Trade-Off 3: Fairness vs Speed of Access

A waiting room protects the service during a popular sale and can improve fairness. However, it introduces waiting time and additional complexity. TicketHub should explain queue status clearly, use a transparent admission policy and prevent users from bypassing the queue.

### Trade-Off 4: Temporary Holds vs Seat Utilization

Temporary holds give customers time to pay, but abandoned holds can keep seats unavailable. Short hold durations improve seat availability but may inconvenience customers with slow payment processing. TicketHub must balance the hold period with payment reliability and safe expiry handling.

## Conclusion

TicketHub uses a scalable application architecture, caching, a waiting room, read replicas and background workers to handle traffic spikes. Most importantly, it relies on atomic database updates, transactions and unique constraints to prevent double-booking. Performance improvements must never weaken the correctness of seat allocation or payment confirmation.
