from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class VintedProductBase(BaseModel):
    id: str
    user_id: str
    url: str
    favourite: bool = False
    gender: Optional[str]
    category: Optional[str]
    size: Optional[str]
    state: Optional[str]
    brand: Optional[str]
    colors: Optional[str]
    price: Optional[float]
    images: List[str] = Field(default_factory=list)
    description: Optional[str]
    title: Optional[str]
    platform: Optional[str] = "vinted"

    class Config:
        orm_mode = True


class VintedUserBase(BaseModel):
    user_id: str
    username: str
    gender: Optional[str]
    given_item_count: int = 0
    taken_item_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    positive_feedback_count: int = 0
    negative_feedback_count: int = 0
    feedback_reputation: Optional[float]
    avatar: Optional[str]
    created_at: Optional[datetime]
    last_logged_on_ts: Optional[datetime]
    city_id: Optional[str]
    city: Optional[str]
    country_title: Optional[str]
    verification_email: bool = False
    verification_facebook: bool = False
    verification_google: bool = False
    verification_phone: bool = False

    class Config:
        orm_mode = True


class VintedUserResponse(VintedUserBase):
    products: List[VintedProductBase] = []


class VintedProductResponse(VintedProductBase):
    owner: Optional[VintedUserBase]


class DepopProductBase(BaseModel):
    id: str
    user_id: str
    sold: bool = False
    gender: Optional[str]
    category: Optional[str]
    size: Optional[str]
    state: Optional[str]
    brand: Optional[str]
    colors: Optional[str]
    price: Optional[float]
    images: List[str] = Field(default_factory=list)
    description: Optional[str]
    title: Optional[str]
    platform: Optional[str]
    address: Optional[str]
    discountedPriceAmount: Optional[float]
    dateUpdated: Optional[datetime]

    class Config:
        orm_mode = True


class DepopUserBase(BaseModel):
    user_id: str
    username: str
    bio: Optional[str]
    first_name: Optional[str]
    followers: int = 0
    following: int = 0
    initials: Optional[str]
    items_sold: int = 0
    last_name: Optional[str]
    last_seen: Optional[datetime]
    avatar: Optional[str]
    reviews_rating: Optional[float]
    reviews_total: int = 0
    verified: bool = False
    website: Optional[str]

    class Config:
        orm_mode = True


class DepopUserResponse(DepopUserBase):
    products: List[DepopProductBase] = []


class DepopProductResponse(DepopProductBase):
    owner: Optional[DepopUserBase]


class ScrapeVintedRequest(BaseModel):
    user_ids: List[str]
    max_images: int = 10


class ScrapeDepopRequest(BaseModel):
    usernames: List[str]
    download_files: bool = False
    include_sold: bool = False
    start_from_item: Optional[str]
