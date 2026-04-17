from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import routes

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GigSure API",
    description="AI-Powered Parametric Income Insurance for Gig Workers",
    version="1.0.0"
)

# CORS — allow React frontend (Updated to allow any local port like 5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(routes.router)

@app.get("/")
def root():
    return {
        "message": "GigSure API is running!",
        "version": "1.0.0",
        "status": "active"
    }