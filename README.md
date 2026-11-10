# Integrain

Integrain is organized as a small MVC application with a separate frontend and backend.

## Project structure

```text
backend/
  controllers/   Request handling
  models/        Product and demo user data
  routes/        API endpoints
  server.js      Express app and static frontend hosting
frontend/
  public/
    css/         Shared styles plus separate admin.css and staff.css
    js/
      admin/     Admin portal controller
      staff/     Staff view loader and portal controller
      appController.js  Shared navigation, login, and settings
  views/         Main page plus separate admin and staff portal views
    admin/       dashboard.html, employees.html, attendance.html, products.html,
                 applicants.html, salary.html, reports.html
    staff/       staff.html
```

## Run locally

```sh
cd backend
npm install
npm start
```

Open http://localhost:3000. The demo login accepts `admin@junbebot.com` or `staff@junbebot.com` with any non-empty password.
