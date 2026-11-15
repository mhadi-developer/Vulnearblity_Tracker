from typing import Annotated
from fastapi import APIRouter, Depends
from ..models.user import User
from ..routers.auth import get_current_user


router = APIRouter(prefix="/user", tags=["User Routes"])


@router.get('/get/me')
async def get_login_user(current_user:Annotated[User, Depends(get_current_user)]):
    return current_user