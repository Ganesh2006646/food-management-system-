# 🍽️ Food Management System

A full-stack **Mess / Food Management System** built with **Node.js**, **Express**, and **PostgreSQL**. It provides role-based dashboards for students and administrators to manage daily mess operations including menus, attendance, feedback, and recipe suggestions.

---

## ✨ Features

### 🔐 Authentication
- Student self-registration and login
- Role-based access control (Student / Admin)
- Secure session management via `localStorage`

### 👨‍🎓 Student Dashboard
- **View Menus** — Today's, tomorrow's, and day-after-tomorrow's mess menus
- **Meal Check-in** — Manual attendance marking for meals
- **Give Feedback** — Rate dishes (1–5) and leave comments
- **Suggest Recipes** — Propose new dishes for the mess menu
- **Notifications** — View latest announcements from admins

### 🛡️ Admin Dashboard
- **Menu Management** — Full CRUD (Create, Read, Update, Delete) for menu items
- **Attendance Reports** — View attendance trends with interactive **Chart.js** graphs
- **Recipe Suggestions** — Review and approve/reject student recipe proposals
- **Notifications** — Broadcast announcements to all students

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Node.js, Express 5                  |
| Database   | PostgreSQL (via `pg` driver)        |
| Frontend   | HTML5, Bootstrap 5, Vanilla JS      |
| Charts     | Chart.js                            |
| Styling    | Tailwind CSS (build), Bootstrap CDN |
| Config     | dotenv                              |

---

## 📁 Project Structure

```
food-management-system/
├── server.js              # Express server & all API routes
├── package.json           # Dependencies & scripts
├── .env                   # Environment variables (DB config)
├── public/
│   ├── login.html         # Login page
│   ├── register.html      # Student registration page
│   ├── student.html       # Student dashboard
│   ├── admin.html         # Admin dashboard
│   ├── js/
│   │   └── logic.js       # Client-side application logic
│   └── css/               # Stylesheets
└── README.md
```

---

## 🗄️ Database Schema

The system uses the following PostgreSQL tables:

| Table                | Description                              |
|----------------------|------------------------------------------|
| `Users`              | Stores user accounts (Name, Email, Password, Role) |
| `Menu`               | Daily menu items (Date, MealType, DishName, DietaryType, Description) |
| `Attendance`         | Meal attendance records per user         |
| `Feedback`           | Student ratings and comments on dishes   |
| `RecipeSuggestions`   | Student-proposed recipes with approval status |
| `Notifications`      | Admin announcements for students         |

### Stored Procedures
- `get_attendance_report(start_date, end_date)` — Generates attendance summary reports

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (v14+)

### 1. Clone the Repository
```bash
git clone https://github.com/Ganesh2006646/food-management-system-.git
cd food-management-system-
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file in the root directory:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=mess_management_db
DB_PASSWORD=your_password
DB_PORT=5432
```

### 4. Set Up the Database
Create the PostgreSQL database and tables:
```sql
CREATE DATABASE mess_management_db;

-- Then connect to the database and create tables:
CREATE TABLE "Users" (
    "UserID" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(100) UNIQUE NOT NULL,
    "Password" VARCHAR(100) NOT NULL,
    "Role" VARCHAR(20) NOT NULL CHECK ("Role" IN ('Student', 'Admin'))
);

CREATE TABLE "Menu" (
    "MenuID" SERIAL PRIMARY KEY,
    "Date" DATE NOT NULL,
    "MealType" VARCHAR(20) NOT NULL,
    "DishName" VARCHAR(100) NOT NULL,
    "DietaryType" VARCHAR(30),
    "Description" TEXT
);

CREATE TABLE "Attendance" (
    "AttendanceID" SERIAL PRIMARY KEY,
    "UserID" INT REFERENCES "Users"("UserID"),
    "Date" DATE NOT NULL,
    "MealType" VARCHAR(20) NOT NULL,
    "Status" VARCHAR(20) NOT NULL
);

CREATE TABLE "Feedback" (
    "FeedbackID" SERIAL PRIMARY KEY,
    "UserID" INT REFERENCES "Users"("UserID"),
    "MenuID" INT REFERENCES "Menu"("MenuID"),
    "Rating" INT CHECK ("Rating" BETWEEN 1 AND 5),
    "Comment" TEXT
);

CREATE TABLE "RecipeSuggestions" (
    "SuggestionID" SERIAL PRIMARY KEY,
    "UserID" INT REFERENCES "Users"("UserID"),
    "DishName" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "Status" VARCHAR(20) DEFAULT 'Pending',
    "Date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notifications" (
    "NotificationID" SERIAL PRIMARY KEY,
    "Message" TEXT NOT NULL,
    "TargetUserID" INT REFERENCES "Users"("UserID"),
    "Date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Run the Application
```bash
npm start
```
The server will start at `http://localhost:3000`. Open `http://localhost:3000/login.html` to begin.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint                      | Description            |
|--------|-------------------------------|------------------------|
| POST   | `/api/auth/register/student`  | Register a new student |
| POST   | `/api/auth/login`             | Login (Student/Admin)  |

### Public / Student
| Method | Endpoint                | Description                      |
|--------|-------------------------|----------------------------------|
| GET    | `/api/menu`             | Get menu by date (`?date=YYYY-MM-DD`) |
| GET    | `/api/menu/ids`         | Get all menu item IDs            |
| GET    | `/api/attendance/today` | Get today's attendance summary   |
| GET    | `/api/feedback/ratings` | Get average dish ratings         |
| GET    | `/api/notifications`    | Get latest notifications         |
| POST   | `/api/attendance`       | Record meal attendance           |
| POST   | `/api/feedback`         | Submit dish feedback             |
| POST   | `/api/recipes/suggest`  | Suggest a new recipe             |

### Admin
| Method | Endpoint                                     | Description                    |
|--------|----------------------------------------------|--------------------------------|
| GET    | `/api/admin/menu`                            | Get all menu items             |
| POST   | `/api/admin/menu/add`                        | Add a menu item                |
| PUT    | `/api/admin/menu/update/:menuId`             | Update a menu item             |
| DELETE | `/api/admin/menu/delete/:menuId`             | Delete a menu item             |
| POST   | `/api/admin/notifications`                   | Send a notification            |
| GET    | `/api/admin/attendance/report`               | Get attendance report          |
| GET    | `/api/admin/recipes/pending`                 | Get all recipe suggestions     |
| PUT    | `/api/admin/recipes/update/status/:id`       | Update suggestion status       |

---

## 📄 License

This project is licensed under the **ISC License**.
