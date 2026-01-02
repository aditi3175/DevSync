# 🚀 DevSync – Uptime & API Monitoring Platform

DevSync is a full-stack uptime monitoring and alerting platform that helps you track the health of your websites and APIs in real time.  
It provides scheduled checks, detailed monitoring history, alert notifications, and a modern dashboard — all built from scratch.

---

## ✨ Features

### 🔍 Monitoring
Monitor websites & APIs using HTTP(S)
Custom check frequency & timeout
Manual **Run Check Now**
Enable / disable monitors anytime

### 📊 Dashboard
Real-time monitor status (UP / DOWN)
Response time tracking
Uptime percentage
Search & filter monitors
Clean, modern UI

### 📈 Monitor Details
Detailed monitor overview
Last 24 hours check history
Response time graph
Status breakdown (Success / Failure)
Export reports (CSV / JSON / HTML / PDF)

### 🔔 Alerts & Notifications
Email alerts on **monitor DOWN**
Email alerts on **monitor recovery (UP)**
User-level alert preferences
Global enable / disable alerts
Alert cooldown to prevent spam

### ⚙️ Settings
Manage notification preferences
Enable / disable specific alert types
Configure alert cooldown duration

---

## 🧠 Tech Stack

### Frontend
**React + Vite**
**Tailwind CSS**
React Router
Chart.js
Modern dark UI design

### Backend
**Node.js + Express**
**MongoDB (Cloud – Atlas)**
**Redis (Docker – Local)**
**BullMQ** (job queues)
Nodemailer (email alerts)

---

## 🧵 Workers

### ✅ Check Worker
Runs scheduled monitor checks
Stores response time & status
Detects status changes
Enqueues notification jobs

### 📬 Notification Worker
Processes notification jobs
Applies user preferences
Applies cooldown logic
Sends email alerts

Note: Workers are executed locally during development and demos.
Production deployment can be done using dedicated background worker services.

---

### ▶️ Running the Project

```bash
## Backend
cd devsync-backend
npm install
npm run dev

## Start Workers (separate terminals)
node src/workers/check.worker.js
node src/workers/notification.worker.js

## Frontend
cd devsync-frontend
npm install
npm run dev

---

## 🏗️ Architecture Overview

```bash
Frontend (React)
 ↓
Backend (Node + Express)
↓
MongoDB (Data Storage)
↓
BullMQ + Redis (Queues & Scheduling)
↓
Workers (Check Worker, Notification Worker)

---

## 🐳 Redis Setup (Local)

Redis is running locally using Docker:

```bash
docker run -d -p 6379:6379 redis
MongoDB is hosted on MongoDB Atlas.

