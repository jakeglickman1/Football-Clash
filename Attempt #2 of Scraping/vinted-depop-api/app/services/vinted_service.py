from datetime import datetime
from typing import Iterable, List
from uuid import uuid4

from sqlalchemy.orm import Session

from ..models import VintedProduct, VintedUser

SAMPLE_VINTED_USERS = [
    {
        "user_id": "vin_001",
        "username": "northloop",
        "gender": "female",
        "followers_count": 1280,
        "following_count": 320,
        "feedback_reputation": 4.9,
        "city": "Portland",
        "country_title": "United States",
        "verification_email": True,
        "verification_phone": True,
        "created_at": datetime(2022, 5, 1),
    },
    {
        "user_id": "vin_002",
        "username": "streetthreadz",
        "gender": "male",
        "followers_count": 866,
        "following_count": 127,
        "feedback_reputation": 4.7,
        "city": "Toronto",
        "country_title": "Canada",
        "verification_email": True,
        "verification_google": True,
        "created_at": datetime(2021, 10, 12),
    },
]

SAMPLE_VINTED_PRODUCTS = [
    {
        "id": "vin_prod_001",
        "user_id": "vin_001",
        "url": "https://www.vinted.com/items/vin_prod_001",
        "favourite": True,
        "gender": "women",
        "category": "Sneakers",
        "size": "W8",
        "state": "Very good",
        "brand": "New Balance",
        "colors": "Cream",
        "price": 95.0,
        "images": [
            "https://images.unsplash.com/photo-1528701800489-20be3c2e0e2c?auto=format&fit=crop&w=600&q=80"
        ],
        "description": "Limited 990v5 drop sourced from showroom.",
        "title": "New Balance 990v5",
    },
    {
        "id": "vin_prod_002",
        "user_id": "vin_002",
        "url": "https://www.vinted.com/items/vin_prod_002",
        "gender": "men",
        "category": "Outerwear",
        "size": "L",
        "state": "Good",
        "brand": "Patagonia",
        "colors": "Navy",
        "price": 120.0,
        "images": [
            "https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=600&q=80"
        ],
        "description": "Retro Synchilla in excellent condition.",
        "title": "Vintage Patagonia fleece",
    },
]


IMAGE_POOL = [
    "https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1484519332611-516457305ff6?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=600&q=80",
]


def seed_vinted_data(db: Session) -> None:
    """Insert baseline users/products once."""
    if db.query(VintedUser).first():
        return

    for payload in SAMPLE_VINTED_USERS:
        db.add(VintedUser(**payload))
    db.flush()

    for payload in SAMPLE_VINTED_PRODUCTS:
        db.add(VintedProduct(**payload))

    db.commit()


def simulate_vinted_scrape(
    db: Session, user_ids: Iterable[str], max_images: int = 10
) -> List[VintedProduct]:
    """Store placeholder data for requested users."""
    created: List[VintedProduct] = []
    for idx, external_id in enumerate(user_ids):
        if not external_id:
            continue
        user = db.query(VintedUser).filter(VintedUser.user_id == external_id).first()
        if not user:
            user = VintedUser(
                user_id=external_id,
                username=f"reseller_{external_id.lower()}",
                city="Remote",
                country_title="Unknown",
                verification_email=True,
                created_at=datetime.utcnow(),
            )
            db.add(user)
            db.flush()

        product = VintedProduct(
            id=f"vin_stub_{external_id}_{uuid4().hex[:6]}",
            user_id=user.user_id,
            url=f"https://example.com/vinted/{external_id}/{idx}",
            favourite=False,
            gender="unisex",
            category="Apparel",
            size="M",
            state="Great",
            brand="Encore Demo",
            colors="Multi",
            price=64.0 + idx,
            images=IMAGE_POOL[: max(1, min(len(IMAGE_POOL), max_images))],
            description="Placeholder record generated for educational scraping stub.",
            title=f"Sample find #{idx + 1}",
        )
        db.add(product)
        created.append(product)

    db.commit()
    return created
