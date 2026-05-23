# My Cinema

Personal full-stack movie and series tracker built with React, Vite, Express, and MongoDB.

## Project Structure

```text
my-cinema/
├── frontend/   React + Vite client
├── backend/    Express + MongoDB API
└── README.md
```

## First Run

Install dependencies are already present in this workspace. To run both apps:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## MongoDB

Add your MongoDB connection string in `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mycinema
```

The backend starts even without MongoDB, but movie database routes need `MONGO_URI` to be connected.

## Initial Features

- Movie and series collection model
- Watchlist and watched status
- Personal rating and public rating fields
- Genres, actors, year, poster, and notes
- API routes for create, read, update, and delete
- React UI with search, filters, sorting, watchlist, watched page, and sample data fallback
