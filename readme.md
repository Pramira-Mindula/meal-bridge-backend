# Food Recipient Component

## 📌 Overview

The **Food Recipient Component** is a part of the Community Food-Sharing & Surplus Application. It allows people who need food to find available food donations, view donation details, reserve or request food, and track the status of their requests.

The component is designed to make the food collection process simple, accessible, and efficient for food recipients.

## 🎯 Objectives

* Allow recipients to view available food donations.
* Search and filter food based on their requirements.
* View important food details such as quantity, expiry date, and location.
* Request or reserve available food.
* Track food request and collection status.
* Receive notifications about request updates.
* Provide a simple and user-friendly interface.

## ✨ Main Features

### 1. Available Food

Recipients can browse food donations currently available from donors.

### 2. Food Details

Each food donation displays:

* Food name
* Food description
* Quantity
* Expiry date
* Pickup location
* Donor information
* Food image
* Availability status

### 3. Search & Filter

Recipients can search and filter available food according to:

* Food category
* Location
* Availability
* Quantity

### 4. Food Request

Recipients can request or reserve available food through the application.

### 5. Request Tracking

Recipients can track the status of their requests:

`Available → Reserved → Accepted → In Transit → Collected → Delivered`

Other possible statuses include:

`Expired / Cancelled`

### 6. Notifications

Recipients can receive updates about:

* Request acceptance
* Reservation confirmation
* Pickup information
* Delivery updates
* Food expiry
* Request cancellation

### 7. User-Friendly Interface

The component focuses on:

* Simple navigation
* Clear buttons and labels
* Responsive design
* Accessible icons
* Mobile-friendly layouts
* English, Sinhala, and Tamil localization support

## 🛠️ Technologies Used

* **React.js** – Frontend development
* **JavaScript** – Application logic
* **HTML5** – Structure
* **CSS3** – Styling
* **Vite** – Development/build tool
* **Git & GitHub** – Version control

## 📂 Component Structure

```text
src/
├── components/
│   └── FoodRecipient/
│       ├── FoodRecipient.jsx
│       ├── FoodCard.jsx
│       ├── FoodDetails.jsx
│       ├── FoodRequest.jsx
│       ├── RequestStatus.jsx
│       └── FoodRecipient.css
│
├── pages/
│   └── FoodRecipientPage.jsx
│
└── assets/
    └── images/
```

> Update the file names above if your actual project structure is different.

## 🚀 Installation & Setup

Clone the project:

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd meal-Bridge
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will then be available through the local development URL shown in the terminal.

## 🔄 Recipient User Flow

```text
Login
  ↓
Food Recipient Dashboard
  ↓
View Available Food
  ↓
Search / Filter Food
  ↓
View Food Details
  ↓
Request / Reserve Food
  ↓
Track Request
  ↓
Collect / Receive Food
  ↓
Complete Request
```

## 🔐 User Permissions

Food recipients can:

* View available food donations
* Search and filter donations
* View food details
* Submit food requests
* Reserve available food
* Track their requests
* View notifications
* Manage their recipient profile

Recipients cannot:

* Create food donations
* Approve their own requests
* Modify donor information
* Manage other users

## 🧪 Testing

The component should be tested for:

* Food listing display
* Search functionality
* Filter functionality
* Food details navigation
* Request submission
* Reservation functionality
* Request status updates
* Notification display
* Responsive UI
* Form validation
* Error handling

## 🌱 Project Contribution

This component supports **SDG 2 – Zero Hunger** by helping people in need access surplus food donated by restaurants, supermarkets, households, and other food donors.

It also contributes to:

* **SDG 12 – Responsible Consumption and Production**
* **SDG 17 – Partnerships for the Goals**

## 👩‍💻 Developer

**Food Recipient Component**
Community Food Connect
SLIIT – Software Engineering Project

## 📄 License

This project is developed for academic purposes as part of the SLIIT Software Engineering project.
