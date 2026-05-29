# PRPilot

PRPilot: AI Pull Request Review Assistant.

PRPilot is an AI-powered Pull Request Review Assistant that helps developers summarize changes, detect risky code, and generate structured review suggestions before human review.

This repository is created for the Qiniu Cloud x XEngineer 72-hour challenge.

## Repository Structure

```text
prpilot/
├── backend/
├── frontend/
├── examples/
│   └── demo-app/
├── README.md
└── .gitignore
```

## Applications

- `frontend/`: Vite, React, and TypeScript web application.
- `backend/`: Spring Boot backend service for PR analysis APIs and rule-based review logic.
- `examples/demo-app/`: Controlled demo app used to construct reviewable PR scenarios.

## Frontend Development

Install dependencies:

```bash
cd frontend
npm install
```

Start the local development server:

```bash
cd frontend
npm run dev
```

Create a production build:

```bash
cd frontend
npm run build
```

## Backend Development

The backend scaffold uses Java 17 and Spring Boot.

Start the backend service:

```bash
cd backend
mvn spring-boot:run
```

Run backend tests:

```bash
cd backend
mvn test
```
