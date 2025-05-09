# 🎫 Ticketing System Backend

This is the backend API for the **Bolt Ticketing System** — a customer support and team management platform. Built using **Node.js**, **Express**, and **MongoDB**, it provides endpoints for authentication, team collaboration, ticket creation, assignment, and status tracking.

---

## 🚀 Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT for Authentication
- bcrypt for Password Hashing
- dotenv for Environment Variables
- CORS, Helmet, and Morgan for Security and Logging

---

## 📁 Project Structure

ticketing-backend/
├── controllers/ # Route Handlers
├── models/ # Mongoose Schemas
├── routes/ # API Routes
├── middleware/ # Auth & Role Middlewares
├── utils/ # Utility Functions
├── config/ # DB connection & App config
├── .env # Environment Variables
└── server.js # App Entry Point

yaml
Copy
Edit

---

## ⚙️ Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/lllMISHRAlll/Ticketing-App-Backend.git
cd ticketing-backend
Install dependencies

bash
Copy
Edit
npm install
Configure environment variables

Create a .env file in the root:

env
Copy
Edit
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
Run the server

bash
Copy
Edit
# For development
npm run dev

# For production
npm start
🔐 Authentication
Register: POST /api/auth/register

Login: POST /api/auth/login

Logout: POST /api/auth/logout

👥 Team Management
Add to Team: POST /api/team/add/:userId

Get Team Members: GET /api/team/members

🎟️ Ticket Management
Create Ticket: POST /api/tickets/create

Get Tickets: GET /api/tickets

Assign Ticket: PUT /api/tickets/:id/assign

Update Status: PUT /api/tickets/:id/status

🛡️ Middleware
protect: Ensures the user is logged in (JWT validation).

adminOnly: Ensures only admin users can access the route.

teamMember: Ensures the user is in the same team as the ticket.

🧪 Testing (Optional)
Use Postman or Thunder Client to test the endpoints. Sample .json collection can be shared.
```
