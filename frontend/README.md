# Movie Seat Booking System

Full-stack movie ticket booking application built with React, Node.js, Express, and MongoDB.

## Tech Stack

* React + Vite
* Node.js + Express
* MongoDB + Mongoose
* JWT Authentication

## Prerequisites

Install:

* Node.js
* npm
* MongoDB

## 1. Clone the Repository

```bash
git clone https://github.com/VidhiAggarwal9/seat-booking.git
cd seat-booking
```

## 2. Start MongoDB

Make sure MongoDB is running locally on:

```text
mongodb://127.0.0.1:27017
```

The application uses the database:

```text
seat_booking
```

## 3. Configure Backend

Open a terminal:

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/seat_booking
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

## 4. Start Backend

From the `backend` folder:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

## 5. Start Frontend

Open a **new terminal**:

```bash
cd seat-booking/frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Demo Login

```text
Email: demo@example.com
Password: demo123
```

A second demo account is available for testing age restrictions:

```text
Email: nemo@example.com
Password: demo123
```

## Notes

* MongoDB must be running before starting the backend.
* Keep the backend and frontend terminals running while using the application.
* `.env` and `node_modules` are excluded from Git.
* Demo movies, shows, and seats are seeded automatically when required.
