# Holiday Rentals Booking Engine - cPanel Deployment & Database Guide

This document provides step-by-step instructions on how to deploy this application to a cPanel-based hosting environment, how database synchronization works, and your owner portal credentials.

---

## 🔑 1. Owner Portal Credentials
To access the administrator/owner dashboard of the application:
* **Login URL:** `/` (and navigate to the **Owner Portal** tab in the main header)
* **Email:** `web.digikee@gmail.com`
* **Password:** `web@1234`

---

## 🗄️ 2. How the MySQL Database Works & Updates

The database system is fully dynamic. It supports both standard JSON-file storage and real MySQL databases through a highly resilient adapter located in `/src/db/jsonDb.ts`.

### How Setup Works Automatically:
1. **Connection & Schema Creation:** On startup, if `MYSQL_HOST` is detected in the environment variables, the system attempts to connect to the MySQL database. It automatically executes a series of `CREATE TABLE IF NOT EXISTS` queries for all required tables:
   * `owners`
   * `properties`
   * `rooms`
   * `guests`
   * `coupons`
   * `bookings`
   * `payments`
   * `availability_overrides`
   * `sync_channels`
   * `email_logs`
2. **Automatic Seeding:** If the connection is successful but the database is empty (specifically, if no properties are found), the application **automatically reads your local `/db.json` file and seeds all tables with the starter data**. You do not need to import a `.sql` file manually!

### How to Update or Reset Your Database:
* **To Sync New Changes from `db.json`:** If you make changes in the local JSON data and want to push them to MySQL, simply **DROP** the tables inside your `booking_engine` database (via phpMyAdmin in cPanel), and then restart your Node application. The engine will detect that the database is empty, recreate all tables, and re-seed them instantly with the fresh data from `db.json`.
* **To Make Incremental Updates:** You can edit the rows directly using phpMyAdmin under cPanel or execute `INSERT` / `UPDATE` queries manually inside the SQL tab.

---

## 🚀 3. Step-by-Step cPanel Deployment Guide

Most modern cPanel hosting providers support running Node.js applications using Phusion Passenger. Look for **"Setup Node.js App"** under the **Software** section in your cPanel.

### Step 1: Compile the Production Build Locally
Before uploading files to your server, prepare the production-ready code:
1. Open a terminal in the root of your project directory.
2. Run the build script:
   ```bash
   npm run build
   ```
   This will:
   * Compile the React/Vite frontend into a highly optimized `/dist` folder.
   * Bundle your Express backend `server.ts` into a single, optimized file at `/dist/server.cjs` using `esbuild`.

### Step 2: Package Your Application Files
Create a ZIP archive of your project directory. 
* **Include these files and folders:**
  * `/dist/` (Contains the frontend static build and the compiled `server.cjs` file)
  * `/db.json` (Used for initial database seeding on your MySQL database)
  * `/app.cjs` (A lightweight script that serves as cPanel's Phusion Passenger application entry point)
  * `/package.json`
  * `/package-lock.json`
* **Do NOT include:**
  * `node_modules/` (This folder is extremely heavy and will be installed natively on the server)
  * `.git/` or other development cache folders

### Step 3: Create the Node.js Application in cPanel
1. Log in to your cPanel dashboard.
2. Find the **Software** section and click on **Setup Node.js App**.
3. Click the **Create Application** button.
4. Fill in the configuration details:
   * **Node.js version:** Select a modern LTS version (e.g., `18.x` or `20.x`).
   * **Application mode:** Select `Production`.
   * **Application root:** Enter the directory path where your files will live (e.g., `booking-engine`).
   * **Application URL:** Select your desired domain or subdomain and URL path.
   * **Application startup file:** Enter `app.cjs`.
5. Click **Create** to launch the environment.

### Step 4: Upload and Extract Your ZIP File
1. Go back to cPanel home, find the **Files** section, and open **File Manager**.
2. Navigate to your newly created application root directory (e.g., `/home/username/booking-engine/`).
3. Click the **Upload** button and select the ZIP file you created in **Step 2**.
4. Once uploaded, right-click the ZIP file inside File Manager and select **Extract**.

### Step 5: Configure Environment Variables
You can add environment variables inside the cPanel **Setup Node.js App** page under the **Environment variables** section, or you can create a `.env` file inside your application root folder in the File Manager.

Add the following keys (updating with your actual server configuration):

```env
# Application Settings
NODE_ENV=production
PORT=3000

# MySQL Database Connection (Use your cPanel MySQL Database credentials)
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=your_cpanel_db_username
MYSQL_PASSWORD=your_cpanel_db_password
MYSQL_DATABASE=your_cpanel_db_name

# Mail Configuration (SMTP details for real email confirmations)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com

# Razorpay Payment Gateway Keys (If active)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Step 6: Install Production Dependencies
1. Go back to cPanel's **Setup Node.js App** interface.
2. Scroll down to the **npm log** section and click the **Run npm install** button. cPanel will read your `package.json` and download all required packages into `node_modules` directly on the server.
3. Once the installation is finished, scroll back to the top and click the **Restart** button.

🎉 **Your booking engine is now live and fully connected to your MySQL database on cPanel!**
