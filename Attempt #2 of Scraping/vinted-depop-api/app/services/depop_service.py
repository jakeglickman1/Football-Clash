from datetime import datetime, timedelta
import logging
from typing import Iterable, List, Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from ..models import DepopProduct, DepopUser

logger = logging.getLogger(__name__)

SAMPLE_DEPOP_USERS = [
    {
        "user_id": "dep_001",
        "username": "studioflux",
        "bio": "Curated streetwear and archival denim.",
        "first_name": "Mei",
        "last_name": "Chen",
        "followers": 3400,
        "items_sold": 980,
        "verified": True,
        "reviews_rating": 4.95,
    },
    {
        "user_id": "dep_002",
        "username": "midnightmemo",
        "bio": "Minimalist silhouettes + handmade jewelry.",
        "first_name": "Luca",
        "followers": 1850,
        "items_sold": 302,
        "verified": False,
        "reviews_rating": 4.7,
    },
]

SAMPLE_DEPOP_PRODUCTS = [
    {
        "id": "dep_prod_001",
        "user_id": "dep_001",
        "sold": False,
        "gender": "unisex",
        "category": "Outerwear",
        "size": "L",
        "state": "Like new",
        "brand": "Arc'teryx",
        "colors": "Black",
        "price": 210.0,
        "images": [
            "https://images.unsplash.com/photo-1521579971123-1192931a1452?auto=format&fit=crop&w=600&q=80"
        ],
        "description": "Veilance composite shell with zero flaws.",
        "title": "Veilance shell jacket",
        "address": "Brooklyn, NY",
        "discountedPriceAmount": 0.0,
        "dateUpdated": datetime.utcnow() - timedelta(days=2),
    },
    {
        "id": "dep_prod_002",
        "user_id": "dep_002",
        "sold": True,
        "gender": "women",
        "category": "Dresses",
        "size": "S",
        "state": "Great",
        "brand": "Reformation",
        "colors": "Emerald",
        "price": 120.0,
        "images": [
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80"
        ],
        "description": "Silk midi dress with open back.",
        "title": "Emerald silk midi",
        "address": "Austin, TX",
        "discountedPriceAmount": 15.0,
        "dateUpdated": datetime.utcnow() - timedelta(days=5),
    },
]


def seed_depop_data(db: Session) -> None:
    if db.query(DepopUser).first():
        return

    for payload in SAMPLE_DEPOP_USERS:
        db.add(DepopUser(**payload))
    db.flush()

    for payload in SAMPLE_DEPOP_PRODUCTS:
        db.add(DepopProduct(**payload))

    db.commit()


def simulate_depop_scrape(
    db: Session,
    usernames: Iterable[str],
    download_files: bool = False,
    include_sold: bool = False,
    start_from_item: Optional[str] = None,
) -> List[DepopProduct]:
    created: List[DepopProduct] = []
    for idx, username in enumerate(usernames):
        if not username:
            continue
        user = (
            db.query(DepopUser)
            .filter(DepopUser.username == username)
            .first()
        )
        if not user:
            user = DepopUser(
                user_id=f"dep_{uuid4().hex[:8]}",
                username=username,
                first_name=username[:1].upper(),
                followers=0,
                items_sold=0,
                verified=False,
            )
            db.add(user)
            db.flush()

        product = DepopProduct(
            id=f"dep_stub_{uuid4().hex[:8]}",
            user_id=user.user_id,
            sold=False if not include_sold else (idx % 2 == 0),
            gender="unisex",
            category="Accessories",
            size="OS",
            state="Great",
            brand="Encore Demo",
            colors="Assorted",
            price=48.0 + idx * 5,
            images=[
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
            ],
            description="Educational placeholder listing.",
            title=f"Demo drop {idx + 1}",
            address="Remote",
            discountedPriceAmount=0.0,
            dateUpdated=datetime.utcnow(),
        )
        db.add(product)
        created.append(product)

    db.commit()

    if start_from_item:
        logger.info(
            "start_from_item flag received (%s) — no-op in educational stub",
            start_from_item,
        )

    if download_files:
        logger.info(
            "download_files flag is informational only — no assets fetched in stub"
        )

    return created
