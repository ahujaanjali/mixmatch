from typing import Optional
from enum import Enum
from pydantic import BaseModel


class CategoryType(str, Enum):
    HEADWEAR = "headwear"
    TOP = "tops"
    OUTERWEAR = "outerwear"
    BOTTOM = "bottoms"
    SHOES = "shoes"
    ACCESSORY = "accessories"
    JEWELRY = "jewelry"


class PatternType(str, Enum):
    SOLID = "solid"
    STRIPED = "striped"
    PLAID = "plaid"
    FLORAL = "floral"
    GRAPHIC = "graphic"
    POLKA_DOT = "polka_dot"
    ANIMAL_PRINT = "animal_print"
    GEOMETRIC = "geometric"
    CAMO = "camo"
    ABSTRACT = "abstract"
    OTHER = "other"


class ClothingItemAnalysis(BaseModel):
    name: Optional[str] = None
    category: CategoryType
    subcategory: str
    color: str
    pattern: PatternType
    
    brand: Optional[str] = None
    size: Optional[str] = None
    
class ImageUrlRequest(BaseModel):
    image_url: str