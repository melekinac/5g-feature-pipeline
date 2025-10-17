"""
auth.py — Authentication and Authorization Module
=================================================

This module implements user registration, authentication, and identity retrieval
for the FastAPI application. It uses JWT for access tokens and bcrypt for password
hashing. Designed to be lightweight, stateless, and easily extendable.

Main Endpoints:
---------------
- POST /auth/register → Register a new user and return a JWT.
- POST /auth/token → Authenticate user credentials and issue a JWT.
- GET /auth/me → Decode JWT and return user identity.

Dependencies:
-------------
- SQLAlchemy ORM for user persistence
- Passlib for password hashing
- JOSE for JWT creation/verification
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

from .database import SessionLocal, engine
from .models import Base, User


# -------------------------------------------------
# Database Initialization
# -------------------------------------------------
# Automatically create tables defined in models.py.

Base.metadata.create_all(bind=engine)

# -------------------------------------------------
# JWT & Security Settings
# -------------------------------------------------
SECRET_KEY = "supersecret" # Move this to environment variable in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# -------------------------------------------------
# Router Configuration
# -------------------------------------------------
router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# -------------------------------------------------
# Database Dependency
# -------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------------------------------
# JWT Utility
# -------------------------------------------------
def create_access_token(data: dict, expires_delta=None):
    """
    Generate a JSON Web Token (JWT) for the given payload.

    Args:
        data (dict): Data to encode inside the JWT payload.
        expires_delta (timedelta, optional): Custom token expiration period.

    Returns:
        str: Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# -------------------------------------------------
# Request Models
# -------------------------------------------------
class UserIn(BaseModel):
    username: str
    password: str


# -------------------------------------------------
#  User Registration
# -------------------------------------------------
@router.post("/register")
def register(u: UserIn, db: Session = Depends(get_db)):
    """
    Create a new user record and automatically issue a JWT access token.

    Validates username uniqueness and password length before saving.

    Args:
        u (UserIn): Input schema with username and password.
        db (Session): SQLAlchemy database session.

    Raises:
        HTTPException: If the username already exists or password is too long.

    Returns:
        dict: A message with the created token and user details.
    """
    existing = db.query(User).filter(User.username == u.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kullanıcı zaten var")

    if len(u.password) > 72:
        raise HTTPException(status_code=400, detail="Parola en fazla 72 karakter olabilir.")

    hashed = pwd_context.hash(u.password[:72])

    user = User(username=u.username, hashed_password=hashed)
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
# User Login
# -------------------------------------------------
@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticate user credentials and return a valid JWT access token.

    Args:
        form_data (OAuth2PasswordRequestForm): Form containing username & password.
        db (Session): SQLAlchemy database session.

    Raises:
        HTTPException: If username or password is invalid.

    Returns:
        dict: JWT token and token type.
    """
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
    """
    Decode a JWT token and return the current user's identity.

    Args:
        token (str): Bearer token from Authorization header.
        db (Session): SQLAlchemy database session.

    Raises:
        HTTPException: If token is invalid or user not found.

    Returns:
        dict: The authenticated user's username.
    """
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
