from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict
    message: str
