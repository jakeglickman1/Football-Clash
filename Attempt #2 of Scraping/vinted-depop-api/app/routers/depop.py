from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..services.depop_service import simulate_depop_scrape

router = APIRouter(tags=["Depop"])


@router.post(
    "/scrape/depop",
    response_model=List[schemas.DepopProductResponse],
    summary="Simulate a Depop scraping task",
)
def scrape_depop(payload: schemas.ScrapeDepopRequest, db: Session = Depends(get_db)):
    if not payload.usernames:
        raise HTTPException(status_code=400, detail="usernames cannot be empty")

    records = simulate_depop_scrape(
        db,
        usernames=payload.usernames,
        download_files=payload.download_files,
        include_sold=payload.include_sold,
        start_from_item=payload.start_from_item,
    )
    return records


@router.get(
    "/depop/users",
    response_model=List[schemas.DepopUserResponse],
)
def list_depop_users(
    username: Optional[str] = Query(default=None),
    verified: Optional[bool] = Query(default=None),
    min_followers: Optional[int] = Query(default=None, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.DepopUser).options(joinedload(models.DepopUser.products))

    if username:
        query = query.filter(models.DepopUser.username.ilike(f"%{username}%"))
    if verified is not None:
        query = query.filter(models.DepopUser.verified == verified)
    if min_followers is not None:
        query = query.filter(models.DepopUser.followers >= min_followers)

    return query.all()


@router.get(
    "/depop/users/{user_id}",
    response_model=schemas.DepopUserResponse,
)
def get_depop_user(user_id: str, db: Session = Depends(get_db)):
    user = (
        db.query(models.DepopUser)
        .options(joinedload(models.DepopUser.products))
        .filter(models.DepopUser.user_id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get(
    "/depop/products",
    response_model=List[schemas.DepopProductResponse],
)
def list_depop_products(
    username: Optional[str] = Query(default=None),
    brand: Optional[str] = Query(default=None),
    size: Optional[str] = Query(default=None),
    include_sold: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    query = db.query(models.DepopProduct).options(joinedload(models.DepopProduct.owner))

    if username:
        query = query.join(models.DepopUser).filter(
            models.DepopUser.username.ilike(f"%{username}%")
        )
    if brand:
        query = query.filter(models.DepopProduct.brand.ilike(f"%{brand}%"))
    if size:
        query = query.filter(models.DepopProduct.size == size)
    if not include_sold:
        query = query.filter(models.DepopProduct.sold.is_(False))

    return query.all()
