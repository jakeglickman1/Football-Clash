from datetime import datetime
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class VintedUser(Base):
    __tablename__ = "vinted_users"

    user_id = Column(String, primary_key=True, index=True)
    username = Column(String, nullable=False, unique=True)
    gender = Column(String)
    given_item_count = Column(Integer, default=0)
    taken_item_count = Column(Integer, default=0)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    positive_feedback_count = Column(Integer, default=0)
    negative_feedback_count = Column(Integer, default=0)
    feedback_reputation = Column(Float, default=0.0)
    avatar = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_logged_on_ts = Column(DateTime)
    city_id = Column(String)
    city = Column(String)
    country_title = Column(String)
    verification_email = Column(Boolean, default=False)
    verification_facebook = Column(Boolean, default=False)
    verification_google = Column(Boolean, default=False)
    verification_phone = Column(Boolean, default=False)

    products = relationship(
        "VintedProduct",
        back_populates="owner",
        cascade="all, delete-orphan",
    )


class VintedProduct(Base):
    __tablename__ = "vinted_products"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("vinted_users.user_id"), nullable=False)
    url = Column(String, nullable=False)
    favourite = Column(Boolean, default=False)
    gender = Column(String)
    category = Column(String)
    size = Column(String)
    state = Column(String)
    brand = Column(String)
    colors = Column(String)
    price = Column(Float)
    images = Column(JSON, default=list)
    description = Column(Text)
    title = Column(String)
    platform = Column(String, default="vinted")

    owner = relationship("VintedUser", back_populates="products")


class DepopUser(Base):
    __tablename__ = "depop_users"

    user_id = Column(String, primary_key=True, index=True)
    username = Column(String, nullable=False, unique=True)
    bio = Column(Text)
    first_name = Column(String)
    followers = Column(Integer, default=0)
    following = Column(Integer, default=0)
    initials = Column(String)
    items_sold = Column(Integer, default=0)
    last_name = Column(String)
    last_seen = Column(DateTime)
    avatar = Column(String)
    reviews_rating = Column(Float)
    reviews_total = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    website = Column(String)

    products = relationship(
        "DepopProduct",
        back_populates="owner",
        cascade="all, delete-orphan",
    )


class DepopProduct(Base):
    __tablename__ = "depop_products"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("depop_users.user_id"), nullable=False)
    sold = Column(Boolean, default=False)
    gender = Column(String)
    category = Column(String)
    size = Column(String)
    state = Column(String)
    brand = Column(String)
    colors = Column(String)
    price = Column(Float)
    images = Column(JSON, default=list)
    description = Column(Text)
    title = Column(String)
    platform = Column(String, default="depop")
    address = Column(String)
    discountedPriceAmount = Column(Float)
    dateUpdated = Column(DateTime, default=datetime.utcnow)

    owner = relationship("DepopUser", back_populates="products")
