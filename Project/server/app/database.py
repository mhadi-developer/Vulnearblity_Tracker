from sqlalchemy.ext.asyncio import create_async_engine , async_sessionmaker , AsyncSession
from sqlalchemy.orm import DeclarativeBase
import os

DATABASE_URL = os.getenv("DATABASE_URL","postgresql+asyncpg://postgres:M.Hadi.23@localhost:5432/vulnearability_tracker")

engine = create_async_engine(DATABASE_URL, echo=True , future=True)


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass


async def get_db()-> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session 
            
            await session.commit()
            
        except Exception :
            
            await session.rollback()
            raise
        finally:
            
            await session.close()
            
        
            
            
        