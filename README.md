# BoardQuest: AI-Gamified Board Review System

## Project Description/Purpose

BoardQuest is an adaptive, gamified web and mobile application designed specifically for 4th-year Medical Technology students preparing for the Medical Technologist Licensure Examination (MTLE).

The system utilizes an AI Paraphrasing Engine to dynamically rewrite standard recall questions into higher-order, logic-based scenarios. By breaking down massive review syllabi into manageable "Daily Missions" and adaptive battle simulations, BoardQuest sustains student motivation while providing real-time "Board Readiness" analytics to help faculty pinpoint and resolve cohort learning gaps before the actual exam.

## Setup Instructions

Follow these steps to install and run the BoardQuest environment locally.

**Dependencies:**

* **Node.js** (v18+) & **npm** (Frontend & Backend)
* **Express.js** (Backend)
* **MongoDB** (Database)
* **Git**

**Configuration & Installation Steps:**

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/boardquest.git
cd boardquest

```


2. **Setup the Backend (Laravel):**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

```


*In your backend `.env` file, configure your MongoDB connection string.*
3. **Setup the Frontend (React):**
```bash
cd ../frontend
npm install
cp .env.local.example .env.local

```


*In your frontend `.env.local` file, add your AI API key and backend URL (e.g., `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api`).*
4. **Run the Application:**
* **Start the Backend:** `php artisan serve` (runs on port 8000)
* **Start the Frontend:** `npm run dev` (runs on port 3000)



## File Structure Explanation

| Directory / File | Description |
| --- | --- |
| `frontend/src/app/` | Contains the main React pages, routing logic, and student/faculty dashboard views. |
| `frontend/src/components/` | Houses reusable UI components (buttons, diagnostic radar charts, Quest Arena modules). |
| `backend/app/Http/` | Contains the MonggoDB backend controllers and API routing logic. |
| `backend/database/` | Houses the Prisma/MongoDB schema definitions and database seeding scripts. |
| `public/images/` | Stores static assets, school logos, and gamification badges. |
| `README.md` | The core documentation file for the repository. |

## Contact Information

For technical support, repository access, or documentation inquiries, please reach out to the core development team:

* **Ethan Gabriel T. Rolloque** (Lead Developer) – ethan.rolloque@email.com
* **Berndt Dennis F. Canaya** (Co-Developer) – berndt.canaya@email.com

## License

**Proprietary License**

© 2026 BoardQuest Development Team. All rights reserved.

This project and its source code are proprietary and confidential. Unauthorized copying, distribution, modification, or use of this repository or its contents, via any medium, is strictly prohibited without explicit written permission from the authors.
