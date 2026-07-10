# Product Catalog Management REST API

A production-ready **Product Catalog Management & Billing-Adjacent Inventory API** built with **Node.js, Express.js, MongoDB and Mongoose**. Includes complete CRUD, search, filtering, sorting, pagination, MongoDB aggregation analytics, JWT authentication, security hardening, Swagger docs, and a full vanilla-JS frontend dashboard.

---

## 1. Project Overview

This project implements a secure, scalable REST API for managing a store's product catalog — creating, reading, updating and deleting products, searching and filtering the catalog, and generating aggregated business analytics (total products, per-category breakdown, average/highest/lowest price, out-of-stock counts).

A lightweight, dependency-free frontend dashboard (HTML/CSS/Vanilla JS) is included in `client/`, styled in a Messenger-inspired white & sky-blue theme with Microsoft Fluent Design influences.

---

## 2. Features

- ✅ Full CRUD for products (Create, Read, Read All, Update, Delete)
- ✅ Case-insensitive search by product name, category or brand
- ✅ Filtering by category, availability status, and price range
- ✅ Sorting by name, price, newest, oldest
- ✅ Pagination (`page`, `limit`) with metadata (`total`, `totalPages`, `hasNextPage`, `hasPrevPage`)
- ✅ MongoDB aggregation analytics: total products, products per category, average/highest/lowest price, out-of-stock count
- ✅ Field-level validation with meaningful error messages (required fields, non-negative price/stock, unique SKU)
- ✅ Auto-generated unique SKU when not provided
- ✅ JWT authentication protecting Create/Update/Delete/Analytics routes
- ✅ Password hashing with bcrypt
- ✅ Centralized error handling with proper HTTP status codes (400, 401, 403, 404, 409, 500)
- ✅ Security middleware: Helmet, CORS, rate limiting, Mongo query sanitization
- ✅ Soft delete (products are flagged `isDeleted` instead of being removed)
- ✅ Swagger/OpenAPI documentation at `/api-docs`
- ✅ Morgan request logging + gzip compression
- ✅ Health check endpoint
- ✅ Postman collection with authentication examples
- ✅ Responsive vanilla-JS frontend dashboard (add/edit/delete/search/filter/paginate)

---

## 3. Technology Stack

| Layer          | Technology                              |
|----------------|------------------------------------------|
| Runtime        | Node.js (>=18)                          |
| Framework      | Express.js                              |
| Database       | MongoDB                                 |
| ODM            | Mongoose                                |
| Auth           | JSON Web Tokens (jsonwebtoken) + bcryptjs |
| Validation     | express-validator                       |
| Security       | Helmet, CORS, express-rate-limit, express-mongo-sanitize |
| Docs           | swagger-ui-express                      |
| Logging        | Morgan                                  |
| Frontend       | HTML5, CSS3, Vanilla JavaScript (no frameworks) |

---

## 4. Folder Structure

```
Product-Catalog-Management/
│
├── config/
│   └── db.js                  # MongoDB connection
│
├── controllers/
│   ├── authController.js      # register / login / me
│   └── productController.js   # CRUD + analytics
│
├── middleware/
│   ├── auth.js                # JWT protect + role restriction
│   ├── errorHandler.js        # centralized error handling + 404
│   ├── rateLimiter.js         # API + auth rate limiters
│   ├── validateRequest.js     # express-validator result handler
│   └── validators.js          # validation chains
│
├── models/
│   ├── Product.js
│   └── User.js
│
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   └── index.js
│
├── utils/
│   ├── apiFeatures.js         # search / filter / sort / paginate helper
│   ├── apiResponse.js         # standardized success response
│   ├── ApiError.js            # custom operational error class
│   ├── catchAsync.js          # async error wrapper
│   ├── generateSku.js         # unique SKU generator
│   └── swagger.js             # OpenAPI specification
│
├── client/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── postman/
│   └── Product-Catalog-Management.postman_collection.json
│
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

## 5. Installation Guide

### Prerequisites
- Node.js v18 or higher
- MongoDB running locally or a MongoDB Atlas connection string

### Steps

```bash
# 1. Extract the ZIP and move into the project folder
cd Product-Catalog-Management

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# then edit .env with your own values

# 4. Start MongoDB (if running locally)
mongod

# 5. Run the server
npm start
# or, for auto-reload during development:
npm run dev
```

The API will be available at `http://localhost:5000` and the dashboard at `http://localhost:5000/`.

---

## 6. Environment Variables

| Variable                | Description                                       | Example                                   |
|--------------------------|----------------------------------------------------|--------------------------------------------|
| `PORT`                  | Port the server listens on                        | `5000`                                    |
| `NODE_ENV`              | Environment mode                                  | `development` / `production`              |
| `API_VERSION`           | API version prefix                                | `v1`                                      |
| `MONGO_URI`             | MongoDB connection string                         | `mongodb://127.0.0.1:27017/product_catalog_db` |
| `JWT_SECRET`            | Secret used to sign JWTs (never commit this)      | a long random string                      |
| `JWT_EXPIRES_IN`        | JWT expiry duration                               | `7d`                                      |
| `ADMIN_EMAIL`           | Reference admin email for local setup             | `admin@example.com`                       |
| `ADMIN_PASSWORD`        | Reference admin password for local setup          | `ChangeMe123!`                            |
| `RATE_LIMIT_WINDOW_MS`  | Rate limiter window in milliseconds               | `900000`                                  |
| `RATE_LIMIT_MAX`        | Max requests per window per IP                    | `200`                                     |
| `CLIENT_ORIGIN`         | Allowed CORS origin for the frontend               | `http://localhost:5500`                   |

---

## 7. How To Run

1. `npm install`
2. Configure `.env` (see above)
3. `npm start` (production) or `npm run dev` (development, with nodemon)
4. Open `http://localhost:5000/api-docs` for interactive Swagger documentation
5. Open `http://localhost:5000/` for the frontend dashboard
6. Import `postman/Product-Catalog-Management.postman_collection.json` into Postman for ready-made requests

---

## 8. API Endpoints

Base URL: `/api/v1`

### Auth
| Method | Endpoint          | Access  | Description               |
|--------|-------------------|---------|----------------------------|
| POST   | `/auth/register`  | Public  | Register a new user        |
| POST   | `/auth/login`     | Public  | Log in and receive a JWT   |
| GET    | `/auth/me`        | Private | Get the current user       |

### Products
| Method | Endpoint                     | Access  | Description                                      |
|--------|-------------------------------|---------|---------------------------------------------------|
| GET    | `/products`                  | Public  | List products (search, filter, sort, paginate)     |
| GET    | `/products/:id`               | Public  | Get a single product                              |
| POST   | `/products`                  | Private | Create a product                                  |
| PUT    | `/products/:id`               | Private | Update a product                                  |
| DELETE | `/products/:id`               | Private | Soft-delete a product                             |
| GET    | `/products/analytics/summary` | Private | Aggregated analytics (totals, per-category, price stats) |

### Query Parameters for `GET /products`
| Param       | Description                                   | Example              |
|-------------|-------------------------------------------------|-----------------------|
| `page`      | Page number                                    | `1`                   |
| `limit`     | Items per page (max 100)                       | `10`                   |
| `search`    | Case-insensitive search by name, category or brand | `mouse`                |
| `category`  | Filter by exact category (case-insensitive)    | `Electronics`          |
| `status`    | `Available` or `Out Of Stock`                  | `Available`            |
| `minPrice`  | Minimum price                                  | `100`                  |
| `maxPrice`  | Maximum price                                  | `5000`                 |
| `sort`      | `name`, `price`, `-price`, `newest`, `oldest`  | `newest`               |

### System
| Method | Endpoint     | Access | Description         |
|--------|--------------|--------|----------------------|
| GET    | `/health`    | Public | Health check         |

Interactive documentation for every endpoint is also available via Swagger UI at **`/api-docs`**.

---

## 9. Authentication

This API uses **JWT Bearer authentication**.

1. Register: `POST /api/v1/auth/register` with `{ name, email, password, role }`
2. Login: `POST /api/v1/auth/login` with `{ email, password }` → returns a `token`
3. Send the token on protected requests:
   ```
   Authorization: Bearer <token>
   ```

Protected routes: creating, updating, and deleting products, plus the analytics summary endpoint.

---

## 10. Postman Usage

1. Open Postman → **Import** → select `postman/Product-Catalog-Management.postman_collection.json`
2. Set the `baseUrl` collection variable if your server runs on a different host/port
3. Run **Auth → Register**, then **Auth → Login** — the login request automatically stores the returned JWT in the `token` collection variable
4. All protected requests automatically use `{{token}}` in their `Authorization` header
5. Run **Products → Create Product** — its response automatically stores the new product's ID in `{{productId}}` for use in Get/Update/Delete requests

---

## 11. Future Improvements

- Add refresh tokens and token blacklisting on logout
- Add image upload support (e.g. via Cloudinary/S3) instead of raw image URLs
- Add role-based product ownership and multi-tenant catalogs
- Add automated test suite (Jest + Supertest)
- Add CI/CD pipeline (GitHub Actions) with lint + test gates
- Add Redis caching for high-traffic read endpoints
- Add bulk import/export (CSV) for products

---

## 12. Author

**Author:** Joita Ghoshal


---

*Built as a complete, internship-submission-ready backend project demonstrating REST API design, MongoDB aggregation, authentication, and clean architecture.*
