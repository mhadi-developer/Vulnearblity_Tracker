from typing import Annotated
from fastapi import APIRouter, Depends, status
from ..models.user import User
from ..routers.auth import get_current_user
from ..database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload



router = APIRouter(prefix="/user", tags=["User Routes"])


@router.get('/get/me')
async def get_login_user(current_user:Annotated[User, Depends(get_current_user)]):
    return current_user


# ----------------------------------------------------------------------------------------------- 
@router.get('/get/developers' , status_code = status.HTTP_200_OK)
async def get_all_users(current_user:Annotated[User, Depends(get_current_user)] , db:Annotated[AsyncSession, Depends(get_db)]):
    results = await db.execute(select(User).options(selectinload(User.role)).where(User.role_id == 3))
    users= results.scalars().all()
    
    return  {"message":"developers fetched fetched" , "developers":users}