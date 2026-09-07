"""Pydantic request bodies for the Kaarigar API."""
from typing import List, Optional

from pydantic import BaseModel, Field


class CartItem(BaseModel):
    listing_id: str
    qty: int = 1


class CreateOrder(BaseModel):
    buyer_name: str = "Guest Buyer"
    buyer_phone: Optional[str] = ""
    buyer_city: Optional[str] = ""
    items: List[CartItem] = Field(default_factory=list)


class VerifyPayment(BaseModel):
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None


class CreateArtisan(BaseModel):
    name: str
    phone: Optional[str] = ""
    password: Optional[str] = ""
    village: Optional[str] = ""
    craft_type: Optional[str] = ""
    story: Optional[str] = ""
    verified: bool = False

class CreateBuyer(BaseModel):
    name: str
    phone: str
    city: Optional[str] = ""
    password: str

class LoginRequest(BaseModel):
    phone: str
    password: str


class CreateListing(BaseModel):
    artisan_id: str
    title: str
    description: Optional[str] = ""
    description_local: Optional[str] = ""
    category: Optional[str] = "Handicraft"
    price: float = 0
    quantity: int = 1
    image_url: Optional[str] = ""
    authenticity_score: Optional[int] = None
