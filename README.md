# COCODING

Programming learning platform application with features including course browsing, payments, and AI-assisted learning through Gemini API integration.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)

## ERD Schema
![erd_schema](https://github.com/user-attachments/assets/44236870-8c4b-42f5-92b4-3bd3894e3420)


## Features
- User authentication with JWT and Google OAuth
- Course catalog browsing and searching
- Payment integration with Midtrans
- AI-powered quiz generation with Google Gemini API
- Responsive frontend design

## Tech Stack
### Frontend
- React.js with Vite
- Redux Toolkit for state management
- Framer Motion for animations
- React Scroll Parallax for scroll effects

### Backend
- Express.js
- PostgreSQL with Sequelize ORM
- Google Generative AI (Gemini) integration
- Midtrans payment gateway
- JWT for authentication

## Project Structure
- `/client` - React frontend application
- `/server` - Express.js backend application

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- Google OAuth credentials
- Google Gemini API key
- Midtrans account

### Installation

Clone the repository:
```bash
git clone https://github.com/rezaahmadramadhan/cocoding.git
cd cocoding
```

#### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

#### Frontend Setup
```bash
cd client
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## API Documentation
Refer to [server/api_doc.md](server/api_doc.md) for detailed API documentation.
