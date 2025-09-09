from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    university: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    university: Optional[str] = None
    phone: Optional[str] = None

class UserInDB(UserBase):
    id: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

class User(UserInDB):
    pass

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    university: Optional[str]
    phone: Optional[str]
    role: UserRole
    status: UserStatus
    created_at: datetime
