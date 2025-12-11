# 🌐 WHOIS Lookup Tool

A full-stack application for performing IP and Domain WHOIS lookups. The frontend is built with **Next.js/React**, and the backend is a RESTful API powered by **Express.js**.

---

## 🚀 Key Features

* **Client IP Detection:** Automatically identifies the user's current IP address.
* **WHOIS Lookup:** Retrieves registration and contact details for both IPs and domains.
* **CSRF Protection:** Secure communication between frontend and backend using `csurf` and `express-session`.
* **CORS Configuration:** Properly handles cross-origin requests for local development and production.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js (React) | Application framework for the user interface. |
| **Backend** | Express.js | Node.js framework for the RESTful API. |
| **Database/Other** | `node-whois`, `csurf`, `cors` | Core utilities for WHOIS, security, and networking. |

---

## ⚙️ Installation and Setup

### 1. Prerequisites

* Node.js (v18+)
* npm or yarn

### 2. Backend Setup (`/backend`)

1.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
2.  **Configure environment:**
    Create a `.env` file in the backend root directory with your configuration.

    > **Example `.env` (Backend):**
    > ```env
    > PORT=3001
    > CORS_DEV_FRONTEND_URL_AND_PORT=http://localhost:3000
    > SESSION_SECRET="A_VERY_STRONG_RANDOM_SECRET" 
    > # Generate a long, random string for production
    > ```
3.  **Run the server:**
    ```bash
    node server.mjs
    ```
    The API will be running on `http://localhost:3001`.

### 3. Frontend Setup (`/frontend`)

1.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    ```
2.  **Configure environment:**
    Set the API URL in a `.env.local` file in the frontend root directory.

    > **Example `.env.local` (Frontend):**
    > ```env
    > NEXT_PUBLIC_API_URL=http://localhost:3001
    > ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.