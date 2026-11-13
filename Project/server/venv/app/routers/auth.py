from fastapi import APIRouter, Depends, status , HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Annotated


from ..database import get_db
from ..models.user import User
from ..schema.user import UserCreateResponse , UserResponse , UserLoginRequest
from ..utils.security import hash_password

router = APIRouter(prefix="/auth", tags=["Authentication Routes"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data:UserCreateResponse, db:Annotated[AsyncSession, Depends(get_db), ]):
    #Check user already exist
    results = await db.execute(select(User).where(User.email == user_data.email))
    user_already_exist = results.scalars().first()
    
    if user_already_exist:
        raise HTTPException(status_code= status.HTTP_400_BAD_REQUEST, detail="User email already exist")
    
    result = await db.execute(
        select(User).where(User.user_name == user_data.user_name)
    )
    existing_username = result.scalar_one_or_none()

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )

    hashed_user_password = hash_password(user_data.password)    
    new_user = User(
        full_name= user_data.full_name,
        user_name= user_data.user_name,
        email=user_data.email,
        password = hashed_user_password,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
     
     
    return new_user