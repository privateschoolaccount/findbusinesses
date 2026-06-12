from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class SearchCreate(BaseModel):
    query: str = Field(description='Business search query, e.g. "pizza" or "dentist"')
    location: str = Field(description='Location to search in, e.g. "New York, NY"')
    radius: int = Field(default=5000, description='Search radius in meters', ge=1)
    type: Optional[str] = Field(default=None, description='Optional business type/category filter')


class SearchResponse(BaseModel):
    id: str = Field(description='Unique search ID')
    query: str = Field(description='The search query')
    location: str = Field(description='The search location')
    radius: int = Field(default=5000, description='Search radius in meters')
    type: Optional[str] = Field(default=None, description='Optional business type filter')
    status: str = Field(default='pending', description='Search status: pending, processing, completed, failed')
    total_found: int = Field(default=0, description='Total businesses found')
    with_website: int = Field(default=0, description='Businesses with a website')
    without_website: int = Field(default=0, description='Businesses without a website')
    pending_verification: int = Field(default=0, description='Businesses pending website verification')
    error: Optional[str] = Field(default=None, description='Error message if search failed')
    created_at: str = Field(default='', description='ISO 8601 timestamp of creation')
    completed_at: Optional[str] = Field(default=None, description='ISO 8601 timestamp of completion')

    class Config:
        from_attributes = True


class SearchListResponse(BaseModel):
    rows: list[SearchResponse]
    total: int
    page: int
    limit: int


class ResultResponse(BaseModel):
    id: str = Field(description='Unique result ID')
    search_id: str = Field(description='Parent search ID')
    name: str = Field(description='Business name')
    address: Optional[str] = Field(default=None, description='Business address')
    phone: Optional[str] = Field(default=None, description='Business phone number')
    place_id: Optional[str] = Field(default=None, description='Google Maps place ID')
    website: Optional[str] = Field(default=None, description='Official website URL if found')
    network_site: Optional[str] = Field(default=None, description='Third-party site URL (e.g. Facebook, Yelp) if no official website')
    website_verified: bool = Field(default=False, description='Whether the website status has been manually verified')
    website_confirmed: bool = Field(default=False, description='Whether a website was confirmed to exist')
    status: str = Field(default='pending_verification', description='Verification status: has_website, no_website, pending_verification')
    verification_method: str = Field(default='google_maps', description='Method used: google_maps or google_search')
    rating: Optional[float] = Field(default=None, description='Google Maps rating (1.0-5.0)')
    total_ratings: Optional[int] = Field(default=None, description='Total number of ratings on Google Maps')
    categories: Optional[list[str]] = Field(default=None, description='Business categories')
    lat: Optional[float] = Field(default=None, description='Latitude')
    lng: Optional[float] = Field(default=None, description='Longitude')
    notes: Optional[str] = Field(default=None, description='Manual notes')
    created_at: str = Field(default='', description='ISO 8601 timestamp of creation')


class ResultListResponse(BaseModel):
    rows: list[ResultResponse]
    total: int
    page: int
    limit: int


class StatsResponse(BaseModel):
    total_searches: int
    completed_searches: int
    total_results: int
    without_website: int
    with_website: int
    pending_verification: int
    verified_count: int


class CollectionCreate(BaseModel):
    name: Optional[str] = Field(default=None, description='Collection name')
    location: Optional[str] = Field(default=None, description='Target location')
    tags: Optional[list[str]] = Field(default=None, description='Business categories / tags')


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, description='Collection name')
    location: Optional[str] = Field(default=None, description='Target location')
    tags: Optional[list[str]] = Field(default=None, description='Business categories / tags')
    status: Optional[str] = Field(default=None, description='Status: saved or researching')


class CollectionResponse(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    tags: Optional[list[str]] = None
    status: str = 'saved'
    totalLeads: int = 0
    noWebsite: int = 0
    newLeads: int = 0
    created_at: str = ''
    updated_at: str = ''


class AddBusinessesRequest(BaseModel):
    resultIds: list[str] = Field(description='Array of result IDs to add')


class ErrorResponse(BaseModel):
    error: str


class ResultUpdate(BaseModel):
    verified: Optional[bool] = Field(default=None, description='Mark website as verified (true) or unverified (false)')
    notes: Optional[str] = Field(default=None, description='Manual notes about this result')
