from fastapi import APIRouter, Depends, status , HTTPException, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Annotated
from datetime import datetime, timedelta, timezone
import jwt


from ..database import get_db
from ..models.user import User
from ..schema.user import UserCreateResponse , UserResponse , UserLoginRequest
from ..utils.security import hash_password, verify_password
from ..config import Settings

router = APIRouter(prefix="/auth", tags=["Authentication Routes"])

settings = Settings()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode.update({"exp":expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.algoritham)
    
    


# *************************************************************************

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




# ************************************************


@router.post('/login', status_code=status.HTTP_200_OK)
async def login_user(user_data:UserLoginRequest , db:Annotated[AsyncSession, Depends(get_db)], response:Response):
    result = await db.execute(select(User).options(selectinload(User.role)).where(User.email == user_data.email))
    user_found_by_email = result.scalars().first()
    
    if not (user_found_by_email or verify_password(user_data.password, user_found_by_email.password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    token_payload={"sub":str(user_found_by_email.id), "email":user_found_by_email.email , "username":user_found_by_email.user_name, "fullname":user_found_by_email.full_name,"role":user_found_by_email.role.role_title if user_found_by_email.role else None, "role_id":user_found_by_email.role.id if user_found_by_email.role else None, "created_at":str(user_found_by_email.created_at)}
    access_token = create_access_token(token_payload)
    
    response.set_cookie(
        key="NEXUS_STORE_AUTH_TOKEN",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 
    )
    
    return {
        "message":"User loggedIn sucessfully"
    }
    
    
# **************************************************************
@router.post('/logout', status_code=status.HTTP_200_OK)
async def logout_user(response:Response):
     response.delete_cookie(key="NEXUS_STORE_AUTH_TOKEN")
     return {"message":"user logout successfully"}
        
        
        
        



# Route Validator for secure Routes --------------------
async def get_current_user( db:Annotated[AsyncSession, Depends(get_db)],NEXUS_STORE_AUTH_TOKEN: Annotated[str | None, Cookie()] = None  )-> User:
    if not NEXUS_STORE_AUTH_TOKEN:
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail="No authentication token credentials Provided"
        )
    
    
    try:
        payload = jwt.decode(NEXUS_STORE_AUTH_TOKEN, settings.jwt_secret_key, algorithms=settings.algoritham)
        user_id = int(payload.get("sub"))
        if not user_id:
            raise HTTPException(
                status_code = status.HTTP_401_UNAUTHORIZED,
                detail="User id not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError as e:
     print(f"👉 DETAILED JWT DECODE ERROR: {e}")  # 👈 Add this print statement
     raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token is invalid or expired",
    )
        
        
    result = await db.execute(select(User).options(selectinload(User.role)).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
    )
        
        
    response_user = {
        "id" :user.id,
        "email" : user.email,
        "created_at" : user.created_at,
        "full_name" :  user.full_name,
        "user_name" :  user.user_name,
        "role": user.role.role_title if user.role else  None,
        "role_id": user.role.id if user.role else None
    }
        
    return response_user
    
    