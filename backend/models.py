from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.orm import relationship
import datetime
from database import Base

# Association table for User-Badge relationships
user_badges = Table(
    'user_badges',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE")),
    Column('badge_id', Integer, ForeignKey('badges.id', ondelete="CASCADE"))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    xp = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    last_active_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", secondary=user_badges, back_populates="users")

class Sign(Base):
    __tablename__ = "signs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)  # e.g., 'A', 'B', 'Hello', '1'
    category = Column(String, nullable=False)  # 'alphabets', 'numbers', 'phrases'
    description = Column(String)
    visual_guide = Column(String)  # description or hints on how to perform it
    difficulty = Column(String, default="easy")  # 'easy', 'medium', 'hard'
    region = Column(String, default="ISL", nullable=False)  # 'ISL', 'ASL', 'BSL'
    is_static = Column(Boolean, default=True)
    hand_image_url = Column(String, nullable=True)
    gesture_steps = Column(String, nullable=True)  # JSON-serialized list of steps
    reference_video_url = Column(String, nullable=True)

    progress = relationship("UserProgress", back_populates="sign", cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sign_id = Column(Integer, ForeignKey("signs.id", ondelete="CASCADE"), nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)
    accuracy_score = Column(Float, default=1.0)
    status = Column(String, default="learned")  # 'learned', 'practiced'

    user = relationship("User", back_populates="progress")
    sign = relationship("Sign", back_populates="progress")

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False)
    icon = Column(String, nullable=False)  # SVG emoji or icon identifier

    users = relationship("User", secondary=user_badges, back_populates="badges")

class DatasetSample(Base):
    __tablename__ = "dataset_samples"

    id = Column(Integer, primary_key=True, index=True)
    sign_name = Column(String, index=True, nullable=False)
    user_id = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    handedness = Column(String, nullable=False)
    landmarks = Column(String, nullable=False)  # JSON-serialized list of 21 landmark coords
    session_number = Column(Integer, default=1)

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    dataset_version = Column(String, nullable=False)
    model_used = Column(String, nullable=False)
    accuracy = Column(Float, nullable=False)
    notes = Column(String, nullable=True)

