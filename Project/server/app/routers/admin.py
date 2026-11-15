from fastapi import APIRouter, Depends, status , HTTPException, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Annotated
from datetime import datetime, timedelta, timezone
import jwt


from ..database import get_db
from ..models.user import User
from ..schema.user import UserCreateResponse , UserResponse , UserLoginRequest, UsersListResponse
from ..config import Settings

router = APIRouter(
    prefix="/admin",
    tags=["Admin Routes"]
)


# ---------------------------------------------------

@router.get('/users', response_model=UsersListResponse)
async def get_all_users_for_admin( db:Annotated[AsyncSession, Depends(get_db)],status_code=status.HTTP_200_OK):
    results = await db.execute(select(User).options(selectinload(User.role)).order_by(User.id.asc()))
    users = results.scalars().all()
    
    return {
        "message":"all users fetched",
        "users":users
    }
    
    
    
# ---------------------------------------------------------------------



    
    
    
    