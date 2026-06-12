from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import engine, Base, get_db
import models
import schemas

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SignVerse AI Backend API", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Settings
SECRET_KEY = "super_secret_signverse_ai_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Seed default signs, badges
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    # 1. Seed signs if table is empty
    if db.query(models.Sign).count() == 0:
        print("Seeding Regional Signs database...")
        signs_data = []
        
        regions = {
            "ISL": "Indian Sign Language",
            "ASL": "American Sign Language",
            "BSL": "British Sign Language"
        }
        
        for reg_code, reg_name in regions.items():
            # Alphabets A-Z (26)
            for char in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
                signs_data.append(models.Sign(
                    name=char,
                    category="alphabets",
                    description=f"{reg_name} alphabet '{char}' representation.",
                    visual_guide=f"Follow visual instructions to construct the letter '{char}' using your hands in {reg_code} posture.",
                    difficulty="easy",
                    region=reg_code
                ))
                
            # Numbers 0-9 (10)
            for num in range(10):
                signs_data.append(models.Sign(
                    name=str(num),
                    category="numbers",
                    description=f"{reg_name} number '{num}' representation.",
                    visual_guide=f"Hold up corresponding finger positions to represent '{num}' in {reg_code}.",
                    difficulty="easy",
                    region=reg_code
                ))
                
            # Common phrases (14)
            phrases = [
                ("Hello", f"Greeting. Wave hand or salute gesture representing hello in {reg_code}.", "easy"),
                ("Thank You", f"Place dominant hand fingertips to chin then move forward in {reg_code}.", "easy"),
                ("Please", f"Place flat hand on chest and rotate in a circle in {reg_code}.", "easy"),
                ("Sorry", f"Make a fist and rotate it in a circle over your chest in {reg_code}.", "easy"),
                ("Yes", f"Make a fist and rock/nod it up and down in {reg_code}.", "easy"),
                ("No", f"Snap index, middle, and thumb fingers together in {reg_code}.", "easy"),
                ("Help", f"Place flat dominant hand under closed non-dominant hand and lift up in {reg_code}.", "medium"),
                ("Good Morning", f"Salute sign followed by index pointing upward in {reg_code}.", "medium"),
                ("Goodbye", f"Wave hand with open palm in {reg_code}.", "easy"),
                ("Excuse Me", f"Rub fingertips of one hand across open palm of other hand in {reg_code}.", "medium"),
                ("How Are You", f"Bring chest height hands out from body pointing to chest then out in {reg_code}.", "medium"),
                ("I Love You", f"Extend thumb, index, and pinky fingers in {reg_code}.", "easy"),
                ("Family", f"Touch thumbs and index fingers of both hands and draw circle in {reg_code}.", "hard"),
                ("Friend", f"Interlock your index fingers in an alternating hook pattern in {reg_code}.", "medium"),
            ]
            
            for name, guide, diff in phrases:
                signs_data.append(models.Sign(
                    name=name,
                    category="phrases",
                    description=f"Common daily conversation phrase '{name}' in {reg_name}.",
                    visual_guide=guide,
                    difficulty=diff,
                    region=reg_code
                ))
            
        db.add_all(signs_data)
        db.commit()
        
    # 2. Seed badges
    if db.query(models.Badge).count() == 0:
        badges = [
            models.Badge(name="First Steps", description="Completed your first ISL sign lesson!", icon="🌱"),
            models.Badge(name="Alphabet Master", description="Learned all 26 letters of the alphabet.", icon="🔤"),
            models.Badge(name="Counting Pro", description="Mastered numbers 0 to 9.", icon="🔢"),
            models.Badge(name="Conversationalist", description="Learned all common phrases.", icon="💬"),
            models.Badge(name="Super Streak", description="Maintained a 7-day learning streak.", icon="🔥"),
            models.Badge(name="Perfect Accuracy", description="Completed a lesson with 100% accuracy.", icon="🎯"),
        ]
        db.add_all(badges)
        db.commit()

# Current User Dependency
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# AUTH ENDPOINTS
@app.post("/api/auth/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user_username = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pass = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pass
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        (models.User.username == form_data.username_or_email) | 
        (models.User.email == form_data.username_or_email)
    ).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# DICTIONARY / LESSONS ENDPOINTS
@app.get("/api/dictionary", response_model=List[schemas.SignResponse])
def get_dictionary(category: Optional[str] = None, search: Optional[str] = None, region: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Sign)
    if category:
        query = query.filter(models.Sign.category == category)
    if search:
        query = query.filter(models.Sign.name.ilike(f"%{search}%"))
    if region:
        query = query.filter(models.Sign.region == region)
    return query.all()

@app.get("/api/dictionary/{sign_id}", response_model=schemas.SignResponse)
def get_sign(sign_id: int, db: Session = Depends(get_db)):
    sign = db.query(models.Sign).filter(models.Sign.id == sign_id).first()
    if not sign:
        raise HTTPException(status_code=404, detail="Sign not found")
    return sign

# PROGRESS ENDPOINTS
@app.post("/api/progress", response_model=schemas.ProgressResponse)
def save_progress(
    progress_in: schemas.ProgressCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sign = db.query(models.Sign).filter(
        models.Sign.name == progress_in.sign_name,
        models.Sign.region == progress_in.region
    ).first()
    if not sign:
        raise HTTPException(status_code=404, detail="Sign not found")
        
    # Check if this sign was already learned/completed by user
    existing_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.sign_id == sign.id
    ).first()
    
    xp_gain = 0
    if not existing_progress:
        # First time learning this sign
        xp_gain = 50 if sign.category == "phrases" else 20
        new_progress = models.UserProgress(
            user_id=current_user.id,
            sign_id=sign.id,
            accuracy_score=progress_in.accuracy_score,
            status=progress_in.status
        )
        db.add(new_progress)
    else:
        # Repracticing
        xp_gain = 10
        existing_progress.completed_at = datetime.datetime.utcnow()
        existing_progress.accuracy_score = max(existing_progress.accuracy_score, progress_in.accuracy_score)
        existing_progress.status = progress_in.status
        new_progress = existing_progress
        
    # Update user XP & Streak
    current_user.xp += xp_gain
    
    # Calculate streak updates
    today = datetime.datetime.utcnow().date()
    if current_user.last_active_date:
        last_active = current_user.last_active_date.date()
        if today == last_active + datetime.timedelta(days=1):
            current_user.streak += 1
        elif today > last_active + datetime.timedelta(days=1):
            current_user.streak = 1
    else:
        current_user.streak = 1
        
    current_user.last_active_date = datetime.datetime.utcnow()
    
    # Badge evaluations
    # 1. 🌱 First Steps
    first_steps_badge = db.query(models.Badge).filter(models.Badge.name == "First Steps").first()
    if first_steps_badge and first_steps_badge not in current_user.badges:
        current_user.badges.append(first_steps_badge)
        
    # 2. 🎯 Perfect Accuracy
    if progress_in.accuracy_score >= 1.0:
        perfect_badge = db.query(models.Badge).filter(models.Badge.name == "Perfect Accuracy").first()
        if perfect_badge and perfect_badge not in current_user.badges:
            current_user.badges.append(perfect_badge)
            
    # 3. 🔤 Alphabet Master
    if sign.category == "alphabets":
        learned_alphabets = db.query(models.UserProgress).join(models.Sign).filter(
            models.UserProgress.user_id == current_user.id,
            models.Sign.category == "alphabets"
        ).count()
        # Count current one if it's the first time
        if not existing_progress:
            learned_alphabets += 1
        if learned_alphabets >= 26:
            alpha_badge = db.query(models.Badge).filter(models.Badge.name == "Alphabet Master").first()
            if alpha_badge and alpha_badge not in current_user.badges:
                current_user.badges.append(alpha_badge)

    # 4. 🔢 Counting Pro
    if sign.category == "numbers":
        learned_nums = db.query(models.UserProgress).join(models.Sign).filter(
            models.UserProgress.user_id == current_user.id,
            models.Sign.category == "numbers"
        ).count()
        if not existing_progress:
            learned_nums += 1
        if learned_nums >= 10:
            num_badge = db.query(models.Badge).filter(models.Badge.name == "Counting Pro").first()
            if num_badge and num_badge not in current_user.badges:
                current_user.badges.append(num_badge)

    # 5. 🔥 Super Streak
    if current_user.streak >= 7:
        streak_badge = db.query(models.Badge).filter(models.Badge.name == "Super Streak").first()
        if streak_badge and streak_badge not in current_user.badges:
            current_user.badges.append(streak_badge)
            
    db.commit()
    db.refresh(new_progress)
    return new_progress

# DASHBOARD ENDPOINT
@app.get("/api/dashboard", response_model=schemas.DashboardResponse)
def get_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_signs = db.query(models.Sign).count()
    progress_list = db.query(models.UserProgress).filter(models.UserProgress.user_id == current_user.id).all()
    
    total_learned = len(progress_list)
    completion_rate = (total_learned / total_signs) * 100 if total_signs > 0 else 0
    
    avg_accuracy = sum(p.accuracy_score for p in progress_list) / total_learned if total_learned > 0 else 0
    
    # Identify weak areas (accuracy < 80%)
    weak_areas = []
    for p in progress_list:
        if p.accuracy_score < 0.8:
            sign = db.query(models.Sign).filter(models.Sign.id == p.sign_id).first()
            if sign and sign.name not in weak_areas:
                weak_areas.append(sign.name)
                
    recent_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id
    ).order_by(models.UserProgress.completed_at.desc()).limit(5).all()
    
    return schemas.DashboardResponse(
        xp=current_user.xp,
        streak=current_user.streak,
        accuracy_rate=avg_accuracy * 100,
        completion_rate=completion_rate,
        total_signs_learned=total_learned,
        weak_areas=weak_areas[:5],
        recent_progress=recent_progress,
        unlocked_badges=current_user.badges
    )

# CONVERSATION MODE SCENARIOS
@app.get("/api/conversation/scenarios")
def get_scenarios():
    return [
        {
            "id": "school",
            "title": "At School",
            "icon": "🎒",
            "description": "Practice communicating in a school classroom scenario.",
            "steps": [
                {"question": "How do you greet your teacher in sign language?", "answer": "Hello", "hint": "Perform the salute salutation gesture near your forehead."},
                {"question": "How do you ask for assistance?", "answer": "Help", "hint": "Use your dominant hand to lift your other fist."},
                {"question": "How do you say goodbye to your classmates?", "answer": "Goodbye", "hint": "Wave your open hand sideways."}
            ]
        },
        {
            "id": "emergency",
            "title": "Emergency Situation",
            "icon": "🚨",
            "description": "Key phrases needed during urgent help requests.",
            "steps": [
                {"question": "What is the first gesture to request emergency support?", "answer": "Help", "hint": "Place flat dominant hand under closed non-dominant hand and lift up."},
                {"question": "How do you express regret or apologize during the incident?", "answer": "Sorry", "hint": "Make a fist and rotate it over your chest."},
                {"question": "How do you confirm understanding or say yes to help?", "answer": "Yes", "hint": "Nod your fist up and down."}
            ]
        },
        {
            "id": "social",
            "title": "Making Friends",
            "icon": "🤝",
            "description": "Introduce yourself and express feelings.",
            "steps": [
                {"question": "How do you introduce yourself to a new friend?", "answer": "Hello", "hint": "Raise hand to temple and wave."},
                {"question": "How do you show appreciation for their reply?", "answer": "Thank You", "hint": "Touch chin and move hand down towards them."},
                {"question": "How do you tell them 'I love you' in sign?", "answer": "I Love You", "hint": "Extend pinky, index finger, and thumb."}
            ]
        }
    ]
