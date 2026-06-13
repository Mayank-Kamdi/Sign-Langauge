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
    region: str = "ISL"

class SignResponse(SignBase):
    id: int

    class Config:
        from_attributes = True

# Progress Schemas
class ProgressCreate(BaseModel):
    sign_name: str
    accuracy_score: float
    status: str = "learned"  # 'learned' or 'practiced'
    region: str = "ISL"

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

# Research Schemas
class LandmarkCoord(BaseModel):
    x: float
    y: float
    z: float

class DatasetSampleCreate(BaseModel):
    sign_name: str
    user_id: Optional[str] = "researcher_1"
    handedness: str
    landmarks: List[LandmarkCoord]
    session_number: Optional[int] = 1

class DatasetSampleResponse(BaseModel):
    id: int
    sign_name: str
    user_id: Optional[str]
    timestamp: datetime.datetime
    handedness: str
    landmarks: str  # Raw serialized string
    session_number: int

    class Config:
        from_attributes = True

class ExperimentCreate(BaseModel):
    name: str
    dataset_version: str
    model_used: str
    accuracy: float
    notes: Optional[str] = None

class ExperimentResponse(BaseModel):
    id: int
    name: str
    date: datetime.datetime
    dataset_version: str
    model_used: str
    accuracy: float
    notes: Optional[str]

    class Config:
        from_attributes = True

class TrainRequest(BaseModel):
    model_name: str  # 'Random Forest', 'SVM', 'KNN', 'MLP'
    train_split: float
    val_split: float
    test_split: float
    features: str  # 'Raw Landmarks', 'Finger Angles', 'Joint Distances', 'Combined Features'

class EpochMetric(BaseModel):
    epoch: int
    accuracy: float
    val_accuracy: float
    loss: float
    val_loss: float

class ClassMetric(BaseModel):
    class_name: str
    precision: float
    recall: float
    f1_score: float
    support: int

class TrainResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    training_time_ms: int
    epochs_data: List[EpochMetric]
    confusion_matrix: List[List[int]]
    classes: List[str]
    per_class_metrics: List[ClassMetric]
    roc_curve: List[List[float]]  # List of [fpr, tpr]

