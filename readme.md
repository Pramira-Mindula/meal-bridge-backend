# MealBridge API Documentation

## 11. Final API Structure

The MealBridge backend follows a role-based REST API structure. Each role has access to the endpoints required for its responsibilities.

The main user roles are:

- DONOR
- RECIPIENT
- VOLUNTEER
- ADMIN

Authentication is required for all protected endpoints.

---

## 11.1 Authentication

Authentication endpoints are responsible for user registration, login, verification, token management, and password recovery.

```http
POST /api/auth/register
POST /api/auth/login

```

### Authentication Flow

```
Register
   |
   v
Verify Account
   |
   v
Login
   |
   v
Access Token
   |
   v
Protected API Endpoints
```

The authenticated user's identity is available to protected controllers through the authentication middleware.

---

## 11.2 Donor APIs

The Donor is responsible for managing their profile, creating food donations, viewing their donations, and responding to recipient food requests.

### Donor Profile

```http
GET    /api/donors/profile
PUT    /api/donors/profile
```

**Responsibilities**

- View donor profile
- Update donor name
- Update phone number
- Update address
- Update location

### Donation Management

```http
POST   /api/donations
GET    /api/donations
GET    /api/donations/my
GET    /api/donations/:id
PUT    /api/donations/:id
PUT    /api/donations/:id/cancel
```

**Responsibilities**

- Create a food donation
- Browse available donations
- View own donations
- View individual donation details
- Update an available donation
- Cancel an available donation

### Donation Lifecycle

```
AVAILABLE
    |
    v
CLAIMED
    |
    v
COMPLETED
```

A donation can also be cancelled before it is claimed:

```
AVAILABLE
    |
    v
CANCELLED
```

Expired donations are handled using the `EXPIRED` status.

### Food Request Management

Donors can view requests made against their donations and respond to those requests.

```http
GET    /api/food-requests/donor
GET    /api/food-requests/:id
PUT    /api/food-requests/:id/accept
PUT    /api/food-requests/:id/reject
```

**Responsibilities**

- View requests received for their donations
- View individual request details
- Accept a recipient's request
- Reject a recipient's request

When a donor accepts a request:

```
FoodRequest
    PENDING
       |
       v
    ACCEPTED

Donation
    AVAILABLE
       |
       v
    CLAIMED

Delivery
    created as PENDING
```

Any other pending requests for the same donation are automatically rejected because the donation has already been claimed.

---

## 11.3 Recipient APIs

The Recipient is responsible for managing their profile, browsing available food donations, creating food requests, and tracking their deliveries.

### Recipient Profile

```http
GET    /api/recipients/profile
PUT    /api/recipients/profile
```

**Responsibilities**

- View recipient profile
- Update recipient name
- Update phone number
- Update delivery address
- Update delivery location

### Browse Donations

Recipients can browse available food donations.

```http
GET    /api/donations
GET    /api/donations/:id
```

Only donations that are currently available and have not expired should be displayed as available food opportunities.

### Food Request Management

```http
POST   /api/food-requests
GET    /api/food-requests/my
GET    /api/food-requests/:id
PUT    /api/food-requests/:id/cancel
```

**Responsibilities**

- Create a request for an available donation
- View their own food requests
- View individual request details
- Cancel a pending request

### Food Request Lifecycle

```
PENDING
   |
   +---------> CANCELLED
   |
   +---------> REJECTED
   |
   v
ACCEPTED
   |
   v
COMPLETED
```

A recipient can only cancel a request while it is still `PENDING`.

Once the donor accepts the request, the request becomes part of the delivery process and cannot be cancelled through the normal pending-request cancellation endpoint.

### Delivery Tracking

Recipients can view the delivery associated with their accepted food request.

```http
GET    /api/deliveries/:id
```

This allows the recipient to see the current delivery status and volunteer information when assigned.

---

## 11.4 Volunteer APIs

The Volunteer is responsible for accepting available deliveries and progressing them through the delivery lifecycle.

### Volunteer Profile

```http
GET    /api/volunteers/profile
PUT    /api/volunteers/profile
```

**Responsibilities**

- View volunteer profile
- Update volunteer name
- Update phone number
- Update address
- Update location

### Delivery Management

```http
GET    /api/deliveries/available
GET    /api/deliveries/my
GET    /api/deliveries/:id

PUT    /api/deliveries/:id/accept
PUT    /api/deliveries/:id/pickup
PUT    /api/deliveries/:id/transit
PUT    /api/deliveries/:id/delivered
```

**Responsibilities**

- View deliveries waiting for a volunteer
- View their accepted deliveries
- View delivery details
- Accept a delivery
- Mark food as picked up
- Mark delivery as in transit
- Mark delivery as delivered

---

## 11.5 API Access Summary

| Resource             | Donor         | Recipient    | Volunteer |
| -------------------- | ------------- | ------------ | --------- |
| Donor Profile        | Own           | -            | -         |
| Recipient Profile    | -             | Own          | -         |
| Volunteer Profile    | -             | -            | Own       |
| Browse Donations     | Yes           | Yes          | -         |
| Create Donation      | Yes           | -            | -         |
| Manage Own Donations | Yes           | -            | -         |
| Food Requests        | Own Donations | Own Requests | -         |
| Available Deliveries | -             | -            | Yes       |
| Manage Deliveries    | -             | View Own     | Own       |
| Delivery Tracking    | -             | View Related | Own       |

All authorization decisions must be enforced by the backend rather than relying on the frontend to hide unauthorized functionality.

---

## 12. Important Business-State Flow

The MealBridge backend follows a controlled state-based workflow.

The purpose of this state flow is to make sure that a donation, food request, and delivery remain synchronized throughout the entire food-sharing process.

### 12.1 Step 1 — Donor Creates Food Donation

The donor creates a new food donation.

```http
POST /api/donations
```

The newly created donation starts with:

```
Donation
status = AVAILABLE
```

At this point, the donation can be viewed by recipients.

```
Donor
  |
  | creates donation
  v
Donation
  |
  v
AVAILABLE
```

### 12.2 Step 2 — Recipient Creates Food Request

The recipient selects an available donation and submits a food request.

```http
POST /api/food-requests
```

The resulting state is:

```
FoodRequest
status = PENDING

Donation
status = AVAILABLE
```

The donation remains available because the donor has not yet accepted the request.

```
Recipient
    |
    | creates request
    v
FoodRequest
    |
    v
PENDING

Donation
    |
    v
AVAILABLE
```

### 12.3 Step 3 — Donor Accepts Food Request

The donor reviews requests received for their donation.

```http
PUT /api/food-requests/:id/accept
```

When the donor accepts the request, three business operations occur:

```
FoodRequest
PENDING
   |
   v
ACCEPTED

Donation
AVAILABLE
   |
   v
CLAIMED

Delivery
created
   |
   v
PENDING
```

Therefore, the complete state becomes:

```
FoodRequest
    ACCEPTED

Donation
    CLAIMED

Delivery
    PENDING
    volunteer = null
```

The backend also rejects any other pending requests associated with the same donation.

```
Request A
    ACCEPTED

Request B
    REJECTED

Request C
    REJECTED
```

This prevents multiple recipients from claiming the same donation.

### 12.4 Step 4 — Volunteer Accepts Delivery

Volunteers can view deliveries that are waiting for assignment.

```http
GET /api/deliveries/available
```

A volunteer accepts a delivery using:

```http
PUT /api/deliveries/:id/accept
```

The delivery changes to:

```
Delivery
PENDING
   |
   v
ACCEPTED
```

The volunteer is assigned to the delivery:

```
volunteer = volunteerId
acceptedAt = current time
```

The backend uses an atomic update condition similar to:

```
status = PENDING
AND
volunteer = null
```

This is important because multiple volunteers may attempt to accept the same delivery at almost the same time.

The intended behavior is:

```
Volunteer A ─────┐
                 |
                 v
            Delivery
                 ^
                 |
Volunteer B ─────┘
```

Only one volunteer can successfully transition the delivery from `PENDING` to `ACCEPTED`.

Once the delivery has been accepted:

```
Delivery
status = ACCEPTED
volunteer = volunteerId
```

Other volunteers can no longer accept the same delivery.

### 12.5 Step 5 — Volunteer Picks Up Food

After accepting the delivery, the volunteer collects the food from the donor.

```http
PUT /api/deliveries/:id/pickup
```

The delivery changes from:

```
ACCEPTED
    |
    v
PICKED_UP
```

The pickup timestamp is recorded:

```
pickedUpAt = current time
```

The complete delivery state becomes:

```
Delivery
status = PICKED_UP
volunteer = volunteerId
pickedUpAt = current time
```

### 12.6 Step 6 — Volunteer Starts Delivery

After collecting the food, the volunteer starts travelling to the recipient.

```http
PUT /api/deliveries/:id/transit
```

The delivery changes from:

```
PICKED_UP
    |
    v
IN_TRANSIT
```

The delivery is now actively being transported to the recipient.

```
Delivery
status = IN_TRANSIT
```

### 12.7 Step 7 — Volunteer Completes Delivery

When the food has been delivered to the recipient:

```http
PUT /api/deliveries/:id/delivered
```

The delivery changes to:

```
Delivery
IN_TRANSIT
    |
    v
DELIVERED
```

The backend then synchronizes the related records.

**Delivery**

```
Delivery
status = DELIVERED
deliveredAt = current time
```

**Food Request**

```
FoodRequest
status = COMPLETED
completedAt = current time
```

**Donation**

```
Donation
status = COMPLETED
```

The final synchronized state is therefore:

```
Donation
    |
    +--> COMPLETED

FoodRequest
    |
    +--> COMPLETED

Delivery
    |
    +--> DELIVERED
```

This synchronization is important because the three records represent different parts of the same business transaction.

### 12.8 Complete MealBridge Business Flow

The complete process can be summarized as:

```
DONOR
  |
  | Create Donation
  v
DONATION
  |
  | AVAILABLE
  v
RECIPIENT
  |
  | Create Food Request
  v
FOOD REQUEST
  |
  | PENDING
  v
DONOR
  |
  | Accept Request
  v
+-----------------------+
| Donation   = CLAIMED  |
| Request    = ACCEPTED |
| Delivery   = PENDING  |
+-----------------------+
              |
              v
        VOLUNTEER
              |
              | Accept
              v
        Delivery
          ACCEPTED
              |
              | Pickup
              v
        Delivery
        PICKED_UP
              |
              | Start Delivery
              v
        Delivery
        IN_TRANSIT
              |
              | Deliver
              v
+-------------------------+
| Delivery    = DELIVERED |
| Request     = COMPLETED |
| Donation    = COMPLETED |
+-------------------------+
```

### 12.9 Final State Transition Reference

**Donation**

```
AVAILABLE
    |
    +------------------> CANCELLED
    |
    v
CLAIMED
    |
    v
COMPLETED
```

Expired donations can transition to:

```
AVAILABLE
    |
    v
EXPIRED
```

**Food Request**

```
PENDING
    |
    +------------------> CANCELLED
    |
    +------------------> REJECTED
    |
    v
ACCEPTED
    |
    v
COMPLETED
```

**Delivery**

```
PENDING
    |
    v
ACCEPTED
    |
    v
PICKED_UP
    |
    v
IN_TRANSIT
    |
    v
DELIVERED
```

The backend should enforce these state transitions so that invalid operations cannot be performed.

For example:

```
PENDING -> DELIVERED
```

is not allowed.

The correct sequence is:

```
PENDING
   ->
ACCEPTED
   ->
PICKED_UP
   ->
IN_TRANSIT
   ->
DELIVERED
```

Similarly, a recipient cannot cancel an already accepted request using the pending-request cancellation endpoint.

### 12.10 Database Consistency

The three main business entities are connected as follows:

```
Donation
    |
    | 1
    |
    | *
FoodRequest
    |
    | 1
    |
    | 1
Delivery
```

The important relationship is:

```
Donation
    |
    +-- FoodRequest
            |
            +-- Delivery
```

Once the donor accepts a request, a delivery is created for that accepted request.

Once the delivery is completed, the backend updates the related food request and donation.

This prevents an inconsistent state such as:

```
Delivery     = DELIVERED
FoodRequest  = ACCEPTED
Donation     = CLAIMED
```

Instead, the final state must be:

```
Delivery     = DELIVERED
FoodRequest  = COMPLETED
Donation     = COMPLETED
```

This keeps the MealBridge backend business flow consistent from donation creation until successful food delivery.
