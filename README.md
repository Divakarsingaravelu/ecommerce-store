# E-Commerce Web Application

A full-stack online store with a product catalog, cart, checkout, user accounts with roles (admin and user), and order tracking.

**Stack:** Node.js + Express (API), PostgreSQL (database), React + Vite (frontend).

## Features

- Product catalog with search, category filter, and pagination
- Cart with quantity updates
- Checkout that runs in a database transaction: it checks stock, decrements it, creates the order, and clears the cart together
- Registration and login with bcrypt-hashed passwords and JWT sessions
- Role-based access: `user` can shop; `admin` can manage products and update order status
- Order history for customers; order management for admins
- Prices stored in cents and copied onto each order item at purchase time

## Project layout

```
ecommerce/
├── docker-compose.yml     # PostgreSQL for local development
├── server/                # Express API
│   └── src/
│       ├── index.js       # App setup and routes
│       ├── db.js          # Connection pool and schema setup
│       ├── schema.sql     # Tables
│       ├── seed.js        # Creates the admin account and sample products
│       ├── middleware/auth.js
│       └── routes/        # auth, products, cart, orders
└── client/                # React + Vite app
    └── src/
        ├── App.jsx        # Routes
        ├── auth.jsx       # Login state
        ├── api.js         # fetch wrapper
        ├── components/
        └── pages/         # Catalog, Cart, Checkout, Orders, Admin pages, ...
```

## Setup

You need Node.js 18 or newer and Docker (or a local PostgreSQL install).

**1. Start the database**

```bash
docker compose up -d
```

**2. Configure and start the API**

```bash
cd server
cp .env.example .env        # then edit JWT_SECRET and ADMIN_PASSWORD
npm install
npm run seed                # creates the admin account and sample products
npm run dev                 # API on http://localhost:4000
```

**3. Start the frontend**

In a second terminal:

```bash
cd client
npm install
npm run dev                 # app on http://localhost:5173
```

Open http://localhost:5173. Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` to reach the admin pages. Register a second account to test the customer side.

## API reference

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a customer account |
| POST | `/api/auth/login` | Public | Log in, returns a JWT |
| GET | `/api/auth/me` | Logged in | Current user |
| GET | `/api/products` | Public | List with `search`, `category`, `page`, `limit` |
| GET | `/api/products/categories` | Public | Distinct categories |
| GET | `/api/products/:id` | Public | One product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| GET | `/api/cart` | Logged in | View cart |
| POST | `/api/cart` | Logged in | Add `{ productId, quantity }` |
| PATCH | `/api/cart/:productId` | Logged in | Set quantity (0 removes) |
| DELETE | `/api/cart/:productId` | Logged in | Remove item |
| POST | `/api/orders` | Logged in | Checkout: cart becomes an order |
| GET | `/api/orders` | Logged in | Own orders |
| GET | `/api/orders/:id` | Owner or admin | One order |
| GET | `/api/orders/all` | Admin | All orders |
| PATCH | `/api/orders/:id/status` | Admin | Set `placed`, `shipped`, or `delivered` |

## Notes and next steps

- Payment is not implemented. Checkout only creates the order.
- The JWT is stored in `localStorage`. That's fine for learning, but a production app would use httpOnly cookies.
- The admin product list loads the first 50 products without paging.
- Ideas to extend it: image uploads, email confirmation, order cancellation that restores stock, and automated tests for the checkout transaction.
