from fastapi import APIRouter, Depends, status , HTTPException, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Annotated
from datetime import datetime, timedelta, timezone
import jwt


from ..database import get_db
from ..models.user import User, UserRoles
from ..schema.user import UserCreateResponse , UserResponse , UpdateRoleRequest, UsersListResponse, RoleResponse
from ..config import Settings

router = APIRouter(
    prefix="/admin",
    tags=["Admin Routes"]
)


# ---------------------------------------------------

@router.get('/users', response_model=UsersListResponse)
async def get_all_users_for_admin( db:Annotated[AsyncSession, Depends(get_db)]):
    results = await db.execute(select(User).options(selectinload(User.role)).order_by(User.id.asc()))
    users = results.scalars().all()
    
    return {
        "message":"all users fetched",
        "users":users
    }
    
    
    
# ---------------------------------------------------------------------


@router.get("/roles", response_model=list[RoleResponse], status_code=status.HTTP_200_OK)
async def get_roles(db:Annotated[AsyncSession, Depends(get_db)]):
    results = await db.execute(select(UserRoles))
    roles = results.scalars().all()
    
    return roles
    
    
    
# -------------------------------------------------------------------

@router.patch("/users/{user_id}/role", status_code=status.HTTP_201_CREATED)
async def update_user_role(user_id:int , payload: UpdateRoleRequest,  db:Annotated[AsyncSession,Depends(get_db)]):
    user_results = await db.execute(select(User).where(User.id == user_id))
    user_found = user_results.scalars().first()
    
    if not user_found :
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="user does not exist"
        )
    role_res = await db.execute(select(UserRoles).where(UserRoles.id == payload.role_id))
    role = role_res.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    user_found.role_id = role.id
    await db.commit()
    return {"message":"User updated successfully" , "status":"updated"}
    