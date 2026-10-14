# Meal Bridge - Food Donor Component

This repository contains the backend implementation for the **Food Donor Component** of the Meal Bridge application. 

## 👨‍💻 Component Owner
**Member 1:** Thilu (Food Donor)

## 📝 Overview
The Food Donor Component is responsible for handling all operations related to food donors in the system. It allows donors to register, authenticate, and manage their food donation listings.

## ✨ Features
* **Donor Authentication:** Register and login functionality for food donors.
* **Donation Management:** 
  * Add new food donation posts.
  * View a history of past donations.
  * Update details of an active donation.
  * Delete or cancel a donation.
* **Mockups:** UI Mockups can be found in the associated HTML files (e.g., `food-donation-app-mockups-all.html`).

## 🛠️ Tech Stack
* **Backend Framework:** Node.js with Express.js
* **Database:** MongoDB (using Mongoose models)
* **API:** RESTful API design

## 🚀 Getting Started

### Prerequisites
* Node.js installed on your machine
* MongoDB instance running locally or via MongoDB Atlas

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   ```
2. Navigate to the backend directory:
   ```bash
   cd meal-bridge-backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the development server, run:
```bash
npm start
```
*(You may need to add a start script to your `package.json` if you haven't already, e.g., `"start": "node app.js"`)*

## 📡 API Endpoints (Upcoming)
* `POST /api/donors/register` - Register a new donor
* `POST /api/donors/login` - Authenticate a donor
* `POST /api/donations` - Create a new donation
* `GET /api/donations/donor/:id` - Get all donations by a specific donor

---
*This README is intended to serve as a starting point. Please update the API endpoints and any configuration details as development progresses.*
