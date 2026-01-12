from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..services.vinted_service import simulate_vinted_scrape

router = APIRouter(tags=["Vinted"])


@router.post(
    "/scrape/vinted",
    response_model=List[schemas.VintedProductResponse],
    summary="Simulate a Vinted scraping task",
)
def scrape_vinted(payload: schemas.ScrapeVintedRequest, db: Session = Depends(get_db)):
    if not payload.user_ids:
        raise HTTPException(status_code=400, detail="user_ids cannot be empty")

    records = simulate_vinted_scrape(
        db, user_ids=payload.user_ids, max_images=payload.max_images
    )
    return records


@router.get(
    "/vinted/users",
    response_model=List[schemas.VintedUserResponse],
)
def list_vinted_users(
    username: Optional[str] = Query(default=None),
    city: Optional[str] = Query(default=None),
    min_followers: Optional[int] = Query(default=None, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.VintedUser).options(joinedload(models.VintedUser.products))

    if username:
        query = query.filter(models.VintedUser.username.ilike(f"%{username}%"))
    if city:
        query = query.filter(models.VintedUser.city == city)
    if min_followers is not None:
        query = query.filter(models.VintedUser.followers_count >= min_followers)

    return query.all()


@router.get(
    "/vinted/users/{user_id}",
    response_model=schemas.VintedUserResponse,
)
def get_vinted_user(user_id: str, db: Session = Depends(get_db)):
    user = (
        db.query(models.VintedUser)
        .options(joinedload(models.VintedUser.products))
        .filter(models.VintedUser.user_id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get(
    "/vinted/products",
    response_model=List[schemas.VintedProductResponse],
)
def list_vinted_products(
    username: Optional[str] = Query(default=None),
    brand: Optional[str] = Query(default=None),
    size: Optional[str] = Query(default=None),
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.VintedProduct).options(joinedload(models.VintedProduct.owner))

    if username:
        query = query.join(models.VintedUser).filter(
            models.VintedUser.username.ilike(f"%{username}%")
        )
    if brand:
        query = query.filter(models.VintedProduct.brand.ilike(f"%{brand}%"))
    if size:
        query = query.filter(models.VintedProduct.size == size)
    if min_price is not None:
        query = query.filter(models.VintedProduct.price >= min_price)
    if max_price is not None:
        query = query.filter(models.VintedProduct.price <= max_price)

    return query.all()
