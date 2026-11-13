import re 
from datetime import datetime
from pydantic import BaseModel , ConfigDict , EmailStr,  Field, field_validator 



class UserCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    full_name:str = Field(min_length=5, max_length=200)
    user_name: str = Field(min_length=3, max_length=100)
    email: EmailStr = Field(min_length=5, max_length=100)
    password: str = Field(min_length=8, max_length=255)
    
    
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    full_name:str
    user_name: str
    email: EmailStr
    created_at: datetime
    
    
class UserLoginRequest(BaseModel):
    model_config = ConfigDict(form_attribute=True)
    
    email: EmailStr = Field(min_length=5 , max_length=100)
    password:str = Field(min_length=6, max_length=255)
    