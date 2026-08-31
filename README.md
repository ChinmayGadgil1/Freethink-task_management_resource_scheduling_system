# Freethink - Task Management & Resource Scheduling System

A comprehensive web application designed to streamline project management, task allocation, and resource scheduling. This system features an interactive Gantt chart for visual planning, role-based access control, and robust scheduling capabilities.

## Key Features

- **Interactive Gantt Chart**: Visualize project timelines and schedules using DHTMLX Gantt with customizable views (Hour, Day, Week, Month).
- **Resource Management**: Efficiently allocate tasks to team members based on their availability and workload.
- **Role-Based Access**: Support for different roles like Project Manager and Resource with tailored views and permissions.
- **Authentication**: Secure user authentication including sign up, login, and password reset functionalities.
- **Dynamic Scheduling**: Manage holidays, non-working days, and segment tasks automatically across working hours.

## Tech Stack

### Frontend
- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **UI Component Library**: [Quasar Framework](https://quasar.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/) (with persisted state)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **Gantt Chart**: [DHTMLX Gantt](https://dhtmlx.com/docs/products/dhtmlxGantt/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MySQL](https://www.mysql.com/) (using `mysql2`)
- **Authentication**: JWT & `bcryptjs`
- **Validation**: [Zod](https://zod.dev/)

## Prerequisites

- Node.js (v22 or higher recommended)
- MySQL Server running locally or remotely

## Getting Started

### 1. Database & Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Ensure you have a `.env` file in the `backend` directory configured with your database and JWT credentials, for example:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=freethink_db
JWT_SECRET=your_jwt_secret
```

Initialize and seed the database:
```bash
npm run db:init
npm run db:seed
```

Start the backend development server:
```bash
npm run dev
```
The backend server will typically run on `http://localhost:3000`.

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```
The application will be accessible in your browser (usually at `http://localhost:9000`).

## Project Structure

- `/backend`: Express application, REST APIs, database models, and controllers.
- `/frontend`: Vue 3 SPA built with Quasar, containing pages, components (including the Gantt integration), and Pinia stores.

## License

This project is proprietary and confidential.
