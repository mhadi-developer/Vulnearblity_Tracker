from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, user



@asynccontextmanager
async def lifespan(app:FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    
    await engine.dispose()
    
    
app = FastAPI(
    title="VulnearAbility Tracker API",
    version="1.0.0",
    lifespan = lifespan
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]



app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
    
)


app.include_router(auth.router, prefix="/api/v1", tags=["Authentication Routes"])
app.include_router(user.router, prefix="/api/v1", tags=["User Routes"])

    
@app.get("/")
async def read_root():
    return {"message": "Welcome to Async Vulnerability Tracker API"}