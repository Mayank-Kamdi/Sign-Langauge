from pydantic import BaseModel, EmailStr
from typing import List, Optional
import datetime

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    xp: int
    streak: int
    last_active_date: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    badges: List[BadgeResponse] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Sign/Lesson Schemas
class SignBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    visual_guide: Optional[str] = None
    difficulty: str

class SignResponse(SignBase):
    id: int

    class Config:
        from_attributes = True

# Progress Schemas
class ProgressCreate(BaseModel):
    sign_name: str
    accuracy_score: float
    status: str = "learned"  # 'learned' or 'practiced'

class ProgressResponse(BaseModel):
    id: int
    sign: SignResponse
    completed_at: datetime.datetime
    accuracy_score: float
    status: str

    class Config:
        from_attributes = True

class DashboardResponse(BaseModel):
    xp: int
    streak: int
    accuracy_rate: float
    completion_rate: float
    total_signs_learned: int
    weak_areas: List[str]
    recent_progress: List[ProgressResponse]
    unlocked_badges: List[BadgeResponse]
