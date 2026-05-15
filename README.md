<div align="center">
  <h1>🌅 SunsetStudy</h1>
  <p><i>A beautifully crafted Study Management System designed around the Ebbinghaus Forgetting Curve. Study smarter, not longer! 🧠✨</i></p>

  <img width="1024" height="576" alt="SunsetStudy Dashboard" src="https://github.com/user-attachments/assets/19cd7780-e66b-472f-b505-591ab47cfd3c" style="border-radius: 8px; box-shadow: 0px 4px 15px rgba(0,0,0,0.1);" />
</div>

<br />

## Problem Description

Traditional study methods often lead to the **"Illusion of Competence"**—students read material once, feel they know it, but experience rapid forgetting soon after. Without a systematic approach to reviewing materials, students struggle to manage their time effectively, lose track of what needs to be reviewed, and inevitably resort to stressful, low-retention cramming before exams.

## Proposed Solution

**SunsetStudy** introduces a systematic, automated study planner built on the proven **Ebbinghaus Forgetting Curve**. Instead of relying on manual scheduling, the app intelligently calculates your next review dates using **Spaced Repetition**. By organizing learning into Subjects, Topics, Study Blocks, and Study Sessions, SunsetStudy ensures that you review information exactly when you're about to forget it—optimizing long-term memory retention.

---

## Features

- **Spaced Repetition Algorithm:** Automatically calculates and prompts topics that are "Due Today" based on your previous study sessions.
- **Subject & Topic Hierarchy:** Categorize learning into Academics, Hobbies, or Projects.
- **Time Management Calendar:** Visually manage Study Blocks and individual Sessions.
- **Progress Tracking:** Monitor the review stages of your topics from "Not Started" to "Done".
- **Secure Authentication:** JWT-based secure user registration and login.
- **Beautiful, Fun UI:** Sunset-themed aesthetics with highly engaging, modern, and accessible design.

---

## Technologies Used

### Frontend
- **React 19** with **Vite** (Blazing fast development)
- **TailwindCSS v4** (Modern utility-first styling)
- **Framer Motion** (Fluid micro-interactions and animations)
- **React Router DOM** (Client-side routing)
- **React Big Calendar** (Dynamic schedule visualization)
- **Axios** (API communication)

### Backend 
- **Node.js & Express.js** (Robust REST API architecture)
- **MongoDB & Mongoose** (NoSQL Database for flexible document models)
- **JSON Web Tokens (JWT)** (Stateless, secure authentication)
- **Bcrypt.js** (Password hashing)
- **Zod** (Strict schema validation)

---

## File & Folder Structure

```mermaid
graph TD
    Root["SunsetStudy (Root)"] --> Frontend["/frontend (React Client)"]
    Root --> Backend["/src (Express Server)"]
    Root --> RootFiles["Config Files"]

    %% Frontend Structure
    Frontend --> F_Src["/src"]
    F_Src --> F_Components["/components (Reusables)"]
    F_Src --> F_Pages["/pages (Route Views)"]
    F_Src --> F_Utils["/utils (Helpers)"]
    F_Src --> F_App["App.jsx & index.css"]

    %% Backend Structure
    Backend --> B_Config["/config"]
    Backend --> B_Middlewares["/middlewares (Auth, Error)"]
    Backend --> B_Modules["/modules (Domain Logic)"]
    
    B_Modules --> Mod_Users["/users"]
    B_Modules --> Mod_Subjects["/subjects"]
    B_Modules --> Mod_Topics["/topics"]
    B_Modules --> Mod_Blocks["/blocks"]
    B_Modules --> Mod_Sessions["/sessions"]
    
    Backend --> B_App["app.js"]
    Backend --> B_DB["db.js"]

    RootFiles --> Pkg["package.json"]
    RootFiles --> Env[".env"]
    RootFiles --> Index["index.js (Entry)"]

    classDef folder fill:#ff9f43,stroke:#e67e22,stroke-width:2px,color:#fff;
    classDef file fill:#54a0ff,stroke:#2e86de,stroke-width:2px,color:#fff;
    
    class Frontend,Backend,F_Src,F_Components,F_Pages,F_Utils,B_Config,B_Middlewares,B_Modules,Mod_Users,Mod_Subjects,Mod_Topics,Mod_Blocks,Mod_Sessions folder;
    class RootFiles,F_App,B_App,B_DB,Pkg,Env,Index file;
```

---

## Architecture Diagrams

### Entity-Relationship Diagram (Database)

```mermaid
erDiagram
    USER ||--o{ SUBJECT : creates
    USER ||--o{ TOPIC : tracks
    USER ||--o{ BLOCK : schedules
    USER ||--o{ SESSION : logs
    
    SUBJECT ||--o{ TOPIC : contains
    BLOCK ||--o{ SESSION : contains
    TOPIC ||--o{ SESSION : reviewed_in

    USER {
        ObjectId id PK
        String name
        String email
        String password
    }
    
    SUBJECT {
        ObjectId id PK
        ObjectId userObjectId FK
        String name
        String type "academic/hobby/project"
        String color
    }
    
    TOPIC {
        ObjectId id PK
        ObjectId subjectObjectId FK
        String name
        Number reviewStage
        Date nextReviewDate
        Date lastStudiedAt
    }
    
    SESSION {
        ObjectId id PK
        ObjectId topicObjectId FK
        Date startTime
        Date endTime
        String status
    }
```

### Spaced Repetition Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Server
    participant Database

    User->>Frontend: Logs in & views Dashboard
    Frontend->>Server: GET /topics/due-today
    Server->>Database: Query topics where nextReviewDate <= now
    Database-->>Server: Return Due Topics
    Server-->>Frontend: Display Topics to User
    User->>Frontend: Completes Study Session for a Topic
    Frontend->>Server: POST /sessions & PATCH /topics/:id
    Server->>Server: Calculate new nextReviewDate (reviewStage++)
    Server->>Database: Update Topic data
    Database-->>Server: Success
    Server-->>Frontend: Update UI
```

---

## API Endpoints

### Users
- `POST /users/register` - Register a new account.
- `POST /users/login` - Authenticate user & get JWT.
  ```json
  // Request Body Example
  {
    "email": "student@example.com",
    "password": "securepassword123"
  }
  ```

### Subjects
- `GET /subjects` - Fetch all subjects for the authenticated user.
- `POST /subjects` - Create a new subject.
  ```json
  // Request Body Example
  {
    "name": "Data Structures",
    "type": "academic",
    "description": "CS201 Core Module",
    "color": "#FF5733"
  }
  ```

### Topics
- `GET /topics/due-today` - **Core Feature:** Fetches all topics scheduled for review today based on the spaced repetition algorithm.
- `POST /topics` - Add a new topic under a subject.

### Study Sessions & Blocks
- `POST /blocks` - Create a new time-block in the calendar.
- `POST /sessions` - Log a completed study session (Triggers spaced repetition interval update).

---

## Setup Instructions

Follow these steps to set up the project locally on your machine:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Naveen-nm27/SunsetStudy.git
   ```

2. **Navigate to the project directory**
   ```bash
   cd SunsetStudy
   ```

3. **Install Backend Dependencies**
   ```bash
   npm install
   ```

4. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your connection strings:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   ```

---

## How to Run the Project

You will need two terminal windows to run both the client and the server simultaneously.

**Terminal 1: Start the Backend Server**
```bash
# From the root directory
npm start
```
*Note: This starts the Node server on `http://localhost:3000` using nodemon for hot-reloading.*

**Terminal 2: Start the Frontend Vite Server**
```bash
# From the root directory, navigate to frontend
cd frontend
npm run dev
```
*Note: This will start the React app on `http://localhost:5173` (or similar).*

---
<div align="center">
  <img width="400" src="https://user-images.githubusercontent.com/74038190/235224431-e8c8c12e-6826-47f1-89fb-2ddad83b3abf.gif" alt="Happy Studying" />
  <p><b>Happy Studying! 🌅📚</b></p>
</div>