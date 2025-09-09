from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.auth import LoginResponse, Token
from app.database import get_supabase
from app.core.config import settings

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    supabase = get_supabase()
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return response.data[0]

@router.post("/register", response_model=LoginResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    supabase = get_supabase()
    
    # Check if user already exists
    existing_user = supabase.table("users").select("id").eq("email", user_data.email).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["password_hash"] = hashed_password
    user_dict["role"] = "user"
    user_dict["status"] = "active"
    
    result = supabase.table("users").insert(user_dict).execute()
    
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create user")
    
    user = result.data[0]
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user).dict(),
        message="Registration successful"
    )

@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin):
    """Authenticate user and return token"""
    supabase = get_supabase()
    
    # Get user from database
    response = supabase.table("users").select("*").eq("email", user_credentials.email).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    user = response.data[0]
    
    # Check password
    if not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Check if user is active
    if user["status"] != "active":
        raise HTTPException(status_code=400, detail="Account is inactive")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user).dict(),
        message="Login successful"
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**current_user)

@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    return {"message": "Logout successful"}
