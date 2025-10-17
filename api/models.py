"""
models.py — Database Models for 5G Energy Optimization API
==========================================================

This module defines the SQLAlchemy ORM models used by the authentication
and user management system.

Overview:
---------
- Defines the `User` model for authentication.
- Uses UUID-based primary keys for scalability and uniqueness.
- Automatically timestamps user creation with `created_at`.
"""

import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    """
    Represents an authenticated user within the system.

    Attributes:
    ------------
    - id (UUID): Unique identifier for each user.
    - username (str): Unique username of the user.
    - hashed_password (str): Securely hashed password.
    - created_at (datetime): Timestamp of when the user was created.
    """

    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
