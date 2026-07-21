# Complete cPanel Deployment Guide
## Holiday Rentals Booking Engine

This guide is customized specifically for your project structure. Based on your screenshots, you have successfully compiled the production build (`npm run build` succeeded and you have the `dist` folder and the `app.cjs` file in your directory).

Below is the step-by-step procedure to deploy this live on your cPanel hosting.

---

### 📋 Prerequisites & File List
Before logging into cPanel, make sure you know which files are needed. You **do not** need to upload your source code (`src` folder) or `node_modules` (which is heavy and will be installed on the server).

**Files/Folders you MUST upload:**
1. `dist/` (This folder contains the compiled React frontend assets and the bundled `server.cjs` backend)
2. `app.cjs` (The entry point Passenger script)
3. `package.json` (Describes dependencies)
4. `db.json` (Used for initial database structure & data seeding)

---

### 🚶‍♂️ Step-by-Step Deployment Steps

#### Step 1: Create a ZIP Archive of the Required Files
On your local computer (Windows):
1. Select the following items:
   - `dist` (folder)
   - `app` (the `app.cjs` file)
   - `package` (the `package.json` file)
   - `db` (the `db.json` file)
2. Right-click the selected files -> **Send to** -> **Compressed (zipped) folder**.
3. Name it something simple, like `deploy.zip`.

---

#### Step 2: Create a MySQL Database on cPanel
Your application has a smart database driver (`src/db/jsonDb.ts`). If you provide MySQL credentials, it will **automatically create all necessary tables and seed them with initial data from your `db.json` file** on its first run!
1. Log in to your **cPanel**.
2. Search for **MySQL Database Wizard** and click on it.
3. **Step 1 (Create Database):** Enter a database name (e.g., `booking_db`) and click **Next Step**.
4. **Step 2 (Create User):** Enter a database username (e.g., `booking_user`) and a secure password. Click **Create User**.
5. **Step 3 (Add User to Database):** Tick the **ALL PRIVILEGES** checkbox and click **Make Changes**.
6. **Save these details:** Write down the **Database Name**, **Username**, and **Password**. You will need them for Step 5.

---

#### Step 3: Set up the Node.js Application in cPanel
1. In cPanel, search for **Setup Node.js App** (under the *Software* section) and click it.
2. Click **Create Application**.
3. Fill in the following fields:
   - **Node.js version:** Select `18.x` or `20.x` (LTS is recommended).
   - **Application mode:** Select `Production`.
   - **Application root:** Enter a directory name where your files will be placed (e.g., `booking-engine`).
   - **Application URL:** Select the domain or subdomain you want to host it on (e.g., `booking.yourdomain.com`).
   - **Application startup file:** Enter `app.cjs` (this matches the startup file we created).
4. Click **Create** (at the top-right).
5. Once created, cPanel will show the application as running. Click the **STOP APP** button for now so we can upload our files.

---

#### Step 4: Upload and Extract Your ZIP Archive
1. Go back to the cPanel Home page and open **File Manager**.
2. Locate the folder matching your **Application root** (e.g., `public_html` or a custom folder named `booking-engine` in your home directory).
3. Open that folder. You will see some auto-generated files (like a default `app.js` or `tmp` folder). You can delete any default files *except* the `tmp` folder.
4. Click **Upload** in the top navigation bar.
5. Select and upload your `deploy.zip` archive.
6. Once uploaded, return to the File Manager, right-click `deploy.zip`, and click **Extract**.
7. Confirm that your directory now contains:
   - `dist/` (folder)
   - `app.cjs`
   - `package.json`
   - `db.json`

---

#### Step 5: Add Environment Variables
You need to tell the application to use your newly created MySQL database.
1. In the **Setup Node.js App** screen under cPanel, scroll down to the **Environment variables** section.
2. Click **Add Variable** and add the following key-value pairs:
   - Name: `NODE_ENV` | Value: `production`
   - Name: `MYSQL_HOST` | Value: `127.0.0.1` *(or localhost)*
   - Name: `MYSQL_PORT` | Value: `3306`
   - Name: `MYSQL_DATABASE` | Value: `[your_full_cpanel_db_name]` (e.g., `myusername_booking_db`)
   - Name: `MYSQL_USER` | Value: `[your_full_cpanel_db_user]` (e.g., `myusername_booking_user`)
   - Name: `MYSQL_PASSWORD` | Value: `[your_database_password]`

*Note: You can also optionally add SMTP credentials if you want the email confirmation feature to send real emails:*
   - Name: `SMTP_HOST` | Value: `mail.yourdomain.com`
   - Name: `SMTP_PORT` | Value: `465` or `587`
   - Name: `SMTP_USER` | Value: `bookings@yourdomain.com`
   - Name: `SMTP_PASS` | Value: `[smtp_password]`

---

#### Step 6: Install Dependencies and Start the App
1. On the **Setup Node.js App** page, scroll down to the **npm log** section.
2. Click the **Run npm install** button. (cPanel will look at your uploaded `package.json` and download all dependencies on the server automatically. This might take 1–2 minutes).
3. Once the package installation is complete, scroll to the top of the page and click **START APP** (or **Restart**).

---

### 🎉 Congratulations, It's Live!
Open your browser and navigate to your website URL. 
- On the first load, the backend will connect to your empty MySQL database, automatically run all the database schema creation SQL queries, and seed your tables with the data from `db.json`.
- To access your **Owner Portal/Admin Dashboard**, click on the "Owner Portal" tab on the page. Use these default admin credentials:
  - **Email:** `web.digikee@gmail.com`
  - **Password:** `web@1234`
