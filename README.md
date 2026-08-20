
# BoardQuest | Gamified AI-Assisted Board Review System

> An intelligent, AI-driven licensure examination preparation platform engineered for Medical Technology students.

---

## 📋 Overview & Purpose

**BoardQuest** is a specialized review platform designed specifically for 4th-year Medical Technology (MedTech) students preparing for the Medical Technologist Licensure Examination (MTLE). 

By combining spaced repetition algorithms, situational clinical scenarios, and adaptive mock examinations with personalized generative AI feedback, BoardQuest transforms traditional board exam preparation into a structured, high-yield learning experience.

### Core Disciplines Covered
- **Clinical Chemistry**
- **Hematology**
- **Microbiology**
- **Immunohematology (Blood Banking)**
- **Clinical Microscopy**
- **Histopathology & Medical Technology Laws**

### Key Functional Modules
- 📊 **Executive Dashboard:** Real-time analytical visualization of subject mastery, experience points (XP), learning streaks, and peer rankings.
- 🎯 **Adaptive Learning Quests:** Practice modules incorporating spaced repetition and AI-generated clinical situational cases.
- ⏱️ **Mock Exam Engine:** High-stakes, timed exam simulations replicating authentic licensure testing environments.
- 🤖 **AI Pedagogical Tutor:** Real-time diagnostic explanations and step-by-step reasoning tailored to student response patterns.

---

## 🛠️ Setup & Local Installation

Follow the steps below to configure and run the BoardQuest platform locally.

### System Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **Git**: Version control CLI

### Quick Start Guide

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Itsan12345/BoardQuesters.git
   cd studio
   ```

2. **Install Project Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and supply your database connection string and AI service credentials:
   ```env
   DATABASE_URL="your-database-connection-string"
   GEMINI_API_KEY="your-api-key"
   ```

4. **Initialize Database & Start Development Server**
   ```bash
   npx prisma generate
   npm run dev
   ```

5. **Access Application**
   Open your web browser and navigate to `http://localhost:9002`.

---

## 📁 Repository Architecture

The codebase follows a modular Next.js App Router architecture. Below is an overview of the primary directories and configuration files:

| Directory / File | Description |
| :--- | :--- |
| `src/app/` | Core application routes, page layouts, server actions, and API endpoints. |
| `src/components/` | Modular, reusable UI components built with Tailwind CSS and Radix UI. |
| `src/ai/` | Genkit & Google Gemini AI orchestration scripts and prompt definitions. |
| `public/` | Static media assets, icons, and public visual resources. |
| `prisma/` | Relational database schema definitions, ORM configurations, and migrations. |
| `.env` | Local environment configuration and credential store *(git-ignored)*. |
| `package.json` | Project manifest defining dependencies, build pipelines, and system scripts. |

---

## ✉️ Contact Information

For inquiries, technical support, or administrative questions regarding this Capstone system:

- **Project Team:** BoardQuest Engineering & Capstone Team
- **Primary Email:** `ethangabrielrolloque@gmail.com`
- **GitHub Repository:** [BoardQuest Capstone Repository](https://github.com/Itsan12345/BoardQuesters)

---

## 📜 License

**Proprietary License**  
Copyright © 2026 BoardQuest Team. All Rights Reserved.

This software and its associated documentation are proprietary materials developed strictly for Capstone project evaluation. Unauthorized copying, modification, distribution, or commercial deployment of this repository is strictly prohibited.

