// server.js
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
  } else {
    console.log('Connected to PostgreSQL successfully!');
  }
});

// --- Authentication & Registration Endpoints ---
app.post('/api/auth/register/student', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        await pool.query(
            'INSERT INTO "Users" ("Name", "Email", "Password", "Role") VALUES ($1, $2, $3, $4)',
            [name, email, password, 'Student']
        );
        res.status(201).json({ success: true, message: 'Registration successful. Please log in.' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }
        console.error(err.message);
        res.status(500).send('Server error.');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const result = await pool.query('SELECT "UserID", "Name", "Role", "Password" FROM "Users" WHERE "Email" = $1', [email]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (user.Role === role && user.Password === password) {
                res.json({ success: true, user });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- Public / General Endpoints ---
app.get('/', (req, res) => {
  res.send('Welcome to the Mess Management System API!');
});

app.get('/api/menu', async (req, res) => {
    const requestedDate = req.query.date;
    let dateToQuery;

    if (requestedDate) {
        dateToQuery = requestedDate;
    } else {
        dateToQuery = new Date().toISOString().slice(0, 10);
    }
    try {
        const result = await pool.query('SELECT * FROM "Menu" WHERE "Date" = $1 ORDER BY "MealType"', [dateToQuery]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.get('/api/attendance/today', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const queryText = `
          SELECT "MealType", COUNT("AttendanceID") AS "TotalAttendance"
          FROM "Attendance"
          WHERE "Date" = $1
          GROUP BY "MealType"
        `;
        const result = await pool.query(queryText, [today]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.get('/api/feedback/ratings', async (req, res) => {
    try {
        const queryText = `
          SELECT T2."DishName", AVG(T1."Rating") AS "AverageRating"
          FROM "Feedback" AS T1
          JOIN "Menu" AS T2 ON T1."MenuID" = T2."MenuID"
          GROUP BY T2."DishName"
          ORDER BY "AverageRating" DESC
        `;
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.get('/api/notifications', async (req, res) => {
    try {
        const queryText = `
            SELECT "Message", "Date" FROM "Notifications"
            ORDER BY "Date" DESC
            LIMIT 3;
        `;
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.get('/api/menu/ids', async (req, res) => {
    try {
        const result = await pool.query('SELECT "MenuID", "DishName", "Date" FROM "Menu" ORDER BY "Date" DESC, "MealType" ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- Student Endpoints ---
app.post('/api/attendance', async (req, res) => {
    const { userId, mealType } = req.body;
    try {
        const status = 'Present';
        await pool.query('INSERT INTO "Attendance" ("UserID", "Date", "MealType", "Status") VALUES ($1, CURRENT_DATE, $2, $3)', [userId, mealType, status]);
        res.status(201).json({ success: true, message: 'Attendance recorded.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.post('/api/feedback', async (req, res) => {
    const { userId, menuId, rating, comment } = req.body;
    try {
        await pool.query('INSERT INTO "Feedback" ("UserID", "MenuID", "Rating", "Comment") VALUES ($1, $2, $3, $4)', [userId, menuId, rating, comment]);
        res.status(201).json({ success: true, message: 'Feedback submitted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.post('/api/recipes/suggest', async (req, res) => {
    const { userId, dishName, description } = req.body;
    try {
        await pool.query('INSERT INTO "RecipeSuggestions" ("UserID", "DishName", "Description") VALUES ($1, $2, $3)', [userId, dishName, description]);
        res.status(201).json({ success: true, message: 'Recipe suggestion submitted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- Admin Endpoints ---
app.get('/api/admin/menu', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "Menu" ORDER BY "Date" DESC, "MealType" ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.post('/api/admin/menu/add', async (req, res) => {
    const { Date, MealType, DishName, DietaryType, Description } = req.body;
    try {
        await pool.query(
            'INSERT INTO "Menu" ("Date", "MealType", "DishName", "DietaryType", "Description") VALUES ($1, $2, $3, $4, $5)',
            [Date, MealType, DishName, DietaryType, Description]
        );
        res.status(201).json({ success: true, message: 'Menu item added.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.put('/api/admin/menu/update/:menuId', async (req, res) => {
    const { menuId } = req.params;
    const { Date, MealType, DishName, DietaryType, Description } = req.body;
    try {
        await pool.query(
            'UPDATE "Menu" SET "Date" = $1, "MealType" = $2, "DishName" = $3, "DietaryType" = $4, "Description" = $5 WHERE "MenuID" = $6',
            [Date, MealType, DishName, DietaryType, Description, menuId]
        );
        res.json({ success: true, message: 'Menu item updated.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.delete('/api/admin/menu/delete/:menuId', async (req, res) => {
    const { menuId } = req.params;
    try {
        await pool.query('DELETE FROM "Menu" WHERE "MenuID" = $1', [menuId]);
        res.json({ success: true, message: 'Menu item deleted.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.post('/api/admin/notifications', async (req, res) => {
    const { message, targetUserId } = req.body;
    try {
        await pool.query('INSERT INTO "Notifications" ("Message", "TargetUserID") VALUES ($1, $2)', [message, targetUserId]);
        res.status(201).json({ success: true, message: 'Notification added.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.get('/api/admin/attendance/report', async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const result = await pool.query('SELECT * FROM get_attendance_report($1, $2)', [startDate, endDate]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.put('/api/admin/recipes/update/status/:suggestionId', async (req, res) => {
    const { suggestionId } = req.params;
    const { status } = req.body;
    try {
        await pool.query('UPDATE "RecipeSuggestions" SET "Status" = $1 WHERE "SuggestionID" = $2', [status, suggestionId]);
        res.json({ success: true, message: `Suggestion status updated to ${status}.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.get('/api/admin/recipes/pending', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "RecipeSuggestions" ORDER BY "Date" DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});