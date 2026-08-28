from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="The Notice Board API")
api_router = APIRouter(prefix="/api")


# -------- Models --------
class Opportunity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    organisation: str
    category: str  # job|learnership|internship|apprenticeship|bursary|skills|tender|rfq|business|government
    subcategory: Optional[str] = None
    location: str
    province: str
    remote: bool = False
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary: Optional[str] = None
    closing_date: str  # ISO date
    posted_date: str
    description: str
    requirements: List[str] = []
    responsibilities: List[str] = []
    benefits: List[str] = []
    application_instructions: Optional[str] = None
    application_url: Optional[str] = None
    source_url: Optional[str] = None
    source_type: str = "verified"  # official|verified|community|unverified
    verification_status: str = "verified"
    verified_date: Optional[str] = None
    featured: bool = False
    tags: List[str] = []
    reference_number: Optional[str] = None
    briefing_date: Optional[str] = None
    industry: Optional[str] = None
    match_score: Optional[int] = None  # AI stub 0-100
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SavedItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    opportunity_id: str
    folder: str = "interested"  # interested|applied|researching|shortlisted
    note: Optional[str] = None
    saved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReportRequest(BaseModel):
    opportunity_id: Optional[str] = None
    reason: str
    details: Optional[str] = None
    reporter_contact: Optional[str] = None


class AlertPreferences(BaseModel):
    device_id: str
    categories: List[str] = []
    provinces: List[str] = []
    experience_levels: List[str] = []
    remote_only: bool = False
    frequency: str = "daily"  # instant|daily|weekly
    channel: List[str] = ["email"]  # email|whatsapp
    contact: Optional[str] = None


# -------- Routes --------
@api_router.get("/")
async def root():
    return {"message": "The Notice Board API", "version": "1.0"}


@api_router.get("/opportunities", response_model=List[Opportunity])
async def list_opportunities(
    q: Optional[str] = None,
    category: Optional[str] = None,
    province: Optional[str] = None,
    remote: Optional[bool] = None,
    featured: Optional[bool] = None,
    experience_level: Optional[str] = None,
    limit: int = Query(100, le=500),
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if province and province != "all":
        query["province"] = province
    if remote is not None:
        query["remote"] = remote
    if featured is not None:
        query["featured"] = featured
    if experience_level:
        query["experience_level"] = experience_level
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"organisation": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.opportunities.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return docs


@api_router.get("/opportunities/stats")
async def opportunity_stats():
    total = await db.opportunities.count_documents({})
    now_iso = datetime.now(timezone.utc).isoformat()
    closing_week_count = await db.opportunities.count_documents({
        "closing_date": {"$gte": now_iso[:10]}
    })
    by_cat_cursor = db.opportunities.aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ])
    by_cat = {d["_id"]: d["count"] async for d in by_cat_cursor}
    provinces_cursor = db.opportunities.distinct("province")
    provinces = await provinces_cursor
    return {
        "total": total,
        "closing_this_week": closing_week_count,
        "by_category": by_cat,
        "provinces_covered": len(provinces),
    }


@api_router.get("/opportunities/{opp_id}", response_model=Opportunity)
async def get_opportunity(opp_id: str):
    doc = await db.opportunities.find_one({"id": opp_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Opportunity not found")
    return doc


@api_router.post("/saved", response_model=SavedItem)
async def save_opportunity(item: SavedItem):
    doc = item.model_dump()
    await db.saved.update_one(
        {"device_id": item.device_id, "opportunity_id": item.opportunity_id},
        {"$set": doc},
        upsert=True,
    )
    return item


@api_router.get("/saved/{device_id}", response_model=List[SavedItem])
async def list_saved(device_id: str):
    docs = await db.saved.find({"device_id": device_id}, {"_id": 0}).to_list(500)
    return docs


@api_router.delete("/saved/{device_id}/{opp_id}")
async def unsave(device_id: str, opp_id: str):
    await db.saved.delete_one({"device_id": device_id, "opportunity_id": opp_id})
    return {"ok": True}


@api_router.post("/report")
async def report_opportunity(req: ReportRequest):
    doc = req.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.reports.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api_router.post("/preferences", response_model=AlertPreferences)
async def upsert_prefs(prefs: AlertPreferences):
    await db.preferences.update_one(
        {"device_id": prefs.device_id},
        {"$set": prefs.model_dump()},
        upsert=True,
    )
    return prefs


@api_router.get("/preferences/{device_id}")
async def get_prefs(device_id: str):
    doc = await db.preferences.find_one({"device_id": device_id}, {"_id": 0})
    return doc or {}


@api_router.post("/seed")
async def seed():
    """Seed the database with rich mock opportunities (idempotent)."""
    from seed_data import OPPORTUNITIES
    count = 0
    for opp in OPPORTUNITIES:
        result = await db.opportunities.update_one(
            {"id": opp["id"]}, {"$set": opp}, upsert=True
        )
        if result.upserted_id or result.modified_count:
            count += 1
    return {"seeded": count, "total": len(OPPORTUNITIES)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    # Auto-seed on first startup
    try:
        count = await db.opportunities.count_documents({})
        if count == 0:
            from seed_data import OPPORTUNITIES
            for opp in OPPORTUNITIES:
                await db.opportunities.update_one({"id": opp["id"]}, {"$set": opp}, upsert=True)
            logger.info(f"Auto-seeded {len(OPPORTUNITIES)} opportunities")
    except Exception as e:
        logger.warning(f"Auto-seed skipped: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
