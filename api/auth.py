"""
auth.py — Authentication and Authorization Module
=================================================

Handles registration, authentication, and JWT-based identity verification.
Integrates seamlessly with SQLAlchemy configuration in api/database.py.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

from .database import SessionLocal, engine, Base
from .models import User

# -------------------------------------------------
# Initialize Database
# -------------------------------------------------
Base.metadata.create_all(bind=engine)

# -------------------------------------------------
# JWT Configuration
# -------------------------------------------------
SECRET_KEY = "supersecret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# -------------------------------------------------
# FastAPI Router
# -------------------------------------------------
router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# -------------------------------------------------
# Database Dependency
# -------------------------------------------------
def get_db():
    """Provide a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------
# JWT Utility
# -------------------------------------------------
def create_access_token(data: dict, expires_delta=None):
    """Generate a JWT token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# -------------------------------------------------
# Pydantic Model
# -------------------------------------------------
class UserIn(BaseModel):
    username: str
    password: str

# -------------------------------------------------
# Root Auth Endpoint (for testing / landing)
# -------------------------------------------------
@router.get("/")
def auth_root():
    """Simple route to confirm /auth works."""
    return {
        "message": "Authentication endpoints available:",
        "register": "/auth/register",
        "login": "/auth/token",
        "current_user": "/auth/me",
    }

# -------------------------------------------------
# Register Endpoint
# -------------------------------------------------
@router.post("/register")
def register(u: UserIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == u.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kullanıcı zaten var")

    if len(u.password) > 72:
        raise HTTPException(status_code=400, detail="Parola en fazla 72 karakter olabilir")

    hashed_pw = pwd_context.hash(u.password[:72])
    user = User(username=u.username, hashed_password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username})
    return {
        "msg": "Kullanıcı oluşturuldu ve giriş yapıldı",
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
    }

# -------------------------------------------------
# Login Endpoint
# -------------------------------------------------
@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya parola yanlış")

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

# -------------------------------------------------
# Get Current User
# -------------------------------------------------
@router.get("/me")
def me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Geçersiz token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token çözülemedi")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    return {"username": user.username}
