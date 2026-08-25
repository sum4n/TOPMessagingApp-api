# Messaging App API

This is a back-end REST API for a full-stack messaging application. It handles authentication, user profiles and messaging between users. It is built with Express and PostgreSQL using Prisma.

**[Link to Frontend App](https://topmessage.netlify.app/)**

**[Link to Frontend Repository Here](https://github.com/sum4n/messaging-app-ui)**

---

## Features

- **JWT Authentication:** Secure user signup and login using Passport-JWT and bcryptjs for password hashing.
- **Prisma ORM:** Relational database management with PostgreSQL. Handles migrations and schema updates smoothly.
- **Input Validation:** Route middleware using express-validator to catch and reject bad payloads before hitting the database.
- **Automated Tests:** Integration tests written with Jest and Supertest to verify authentication and message flows.
- **CORS:** `CORS` rules to restrict resource sharing.

---

## Technology Stack

- **Runtime Environment:** Node.js
- **Web Framework:** Express 5 (`express`)
- **Database & ORM:** PostgreSQL (`pg`) with Prisma ORM (`@prisma/client`)
- **Authentication:** Passport-JWT (`passport`, `passport-jwt`) & `jsonwebtoken`
- **Data Security:** `bcryptjs`
- **Testing Engine:** `Jest` & `Supertest`

---

## API Endpoints

Protected routes require a valid token passed in the header: `Authorization: Bearer <token>`.

### Auth

- `POST /users/sign-up` - Create a new user profile (`email`, `password`)
- `POST /users/log-in` - Validate credentials and return a JWT

### Users & Profiles (protected)

- `GET /users/profile` - Fetch current user's profile details
- `PUT /users/profile` - Update or add the user's name (`name`)
- `GET /users/chats` - Fetch chat-partners list sorted by the latest interaction timestamp

### Messages (protected)

- `GET /messages/:otherUserId` - Pull the complete message history between two users
- `POST /messages/:receiverId` - Send a new message to a specific user

---

## Local Development Setup

Ensure you have **Node.js (v18+)** installed and a **PostgreSQL** instance running locally or hosted (e.g., Supabase, Neon) before booting.

### 1. Clone & Install

```bash
git clone https://github.com/sum4n/messaging-app-api.git
cd messaging-app-api
npm install
npx prisma generate
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/my_database?schema=public"
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/my_test_database?schema=public"
SECRET_KEY="your_custom_jwt_signing_key_string"
originURL=http://localhost:port
```

### 3. Synchronize Database & Boot

```bash
# Push schema changes to your PostgreSQL instance
npx prisma db push

# Start development server with hot-reloading
npm run dev
```

### 4. Running the Test Suite

Ensure your `.env` file contains `TEST_DATABASE_URL` pointing to your dedicated testing database.

To push the schema to the test database without overriding the main `DATABASE_URL`, use a temporary `.env.test` file:

Create a `.env.test` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/my_test_database?schema=public"
```

To execute the automated API endpoint and integration tests:

```bash
# Push schema structure to your dedicated testing database
dotenv -e .env.test npx prisma db push
## .env.test can be deleted after pushing

npm run test
```

### 5. Running the App in Production Mode

```bash
npm run start
```

---

## What I Learned

- **Test Driven Development:** Wrote integration tests with Jest/Supertest before implementing features.

- **Stateless Auth with JWT:** Implemented Passport-JWT strategy and learned how to protect routes.

- **Error Handling:** Created a custom AppError class and used Express error middleware to return consistent JSON error responses.

- **Raw SQL for Complex Queries:** Used CTEs and LEFT JOINs to build conversation lists that Prisma could not express.

---

## Acknowledgments

- Built as a capstone project during [The Odin Project](https://theodinproject.com) Full-Stack JavaScript curriculum.
