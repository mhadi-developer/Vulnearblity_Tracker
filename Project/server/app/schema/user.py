import re 
from datetime import datetime
from pydantic import BaseModel , ConfigDict , EmailStr,  Field, field_validator 
from typing import Optional, Literal



class UserCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    full_name:str = Field(min_length=5, max_length=200)
    user_name: str = Field(min_length=3, max_length=100)
    email: EmailStr = Field(min_length=5, max_length=100)
    password: str = Field(min_length=8, max_length=255)
    
    
    
class RoleResponse(BaseModel):
    id: int
    role_title: str

    model_config = ConfigDict(from_attributes=True)
    
class UserResponse(BaseModel):
    id: int
    full_name: str
    user_name: str
    email: str
    created_at: datetime
    role_id: int | None
    role: RoleResponse | None

    model_config = ConfigDict(from_attributes=True)


class UsersListResponse(BaseModel):
    message: str
    users: list[UserResponse]
    
class UserLoginRequest(BaseModel):
    model_config = ConfigDict(form_attribute=True)
    
    email: EmailStr = Field(min_length=5 , max_length=100)
    password:str = Field(min_length=6, max_length=255)
    


class UpdateRoleRequest(BaseModel):
    role_id: int
    
    




class FindingCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=120, description="Finding title between 5 and 120 characters")
    description: Optional[str] = Field(None, max_length=2000, description="Detailed description of the vulnerability")
    severity: str = Field(..., description="Severity level: critical, high, medium, or low")
    owner_id: int = Field(..., description="ID of the user assigned to own this finding")

class FindingResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    severity: str
    status: str
    review_status: str
    owner_id: int

    class Config:
        from_attributes = True # Enables conversion from SQLAlchemy models (Pydantic v2)
        
class StatusUpdateSchema(BaseModel):
    status: Literal["open", "in_progress", "resolved", "closed"]