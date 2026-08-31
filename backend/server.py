from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, BackgroundTasks, Header
from fastapi.responses import Response, HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone

from og import render_og, render_share_html
from digest import compute_digest_for_prefs, digest_whatsapp_text, digest_whatsapp_link
from scrapers import REGISTRY as SCRAPER_REGISTRY, run_all as run_scrapers

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


class SubmissionCreate(BaseModel):
    title: str
    organisation: str
    category: str = "job"
    location: Optional[str] = None
    province: str = "Nationwide"
    remote: bool = False
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary: Optional[str] = None
    closing_date: Optional[str] = None
    description: str
    application_url: Optional[str] = None
    source_url: Optional[str] = None
    reference_number: Optional[str] = None
    submitter_name: Optional[str] = None
    submitter_email: Optional[str] = None


class Submission(SubmissionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "pending"  # pending|approved|rejected
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reviewed_at: Optional[str] = None
    reviewer_note: Optional[str] = None


class AdminReviewAction(BaseModel):
    note: Optional[str] = None


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
    """Deprecated: The Notice Board now only serves scraped verified opportunities. Use /api/admin/scrape-now instead."""
    return {"deprecated": True, "message": "Mock data has been removed. Use POST /api/admin/scrape-now (with Bearer WEBHOOK_CRON_SECRET) to run scrapers."}


app.include_router(api_router)


# -------- OG Image + Share Page (under /api for ingress routing) --------
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")


def _public_base(request: Request) -> str:
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    return f"{scheme}://{host}"


@app.get("/api/og/{opp_id}.png")
async def og_image(opp_id: str):
    doc = await db.opportunities.find_one({"id": opp_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    png = render_og(doc)
    return Response(content=png, media_type="image/png", headers={"Cache-Control": "public, max-age=3600"})


@app.get("/api/share/{opp_id}", response_class=HTMLResponse)
async def share_page(opp_id: str, request: Request):
    doc = await db.opportunities.find_one({"id": opp_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    base = _public_base(request)
    frontend_base = FRONTEND_URL or base
    spa_url = f"{frontend_base}/opportunity/{opp_id}"
    html_body = render_share_html(doc, base, spa_url)
    return HTMLResponse(html_body)


# -------- Digest routes --------
@app.get("/api/digest/{device_id}")
async def get_digest(device_id: str, request: Request):
    today = datetime.now(timezone.utc).date().isoformat()
    doc = await db.digests.find_one({"device_id": device_id, "date": today}, {"_id": 0}, sort=[("generated_at", -1)])
    if not doc:
        prefs = await db.preferences.find_one({"device_id": device_id}, {"_id": 0}) or {"device_id": device_id}
        opps = await db.opportunities.find({}, {"_id": 0}).to_list(500)
        digest = await compute_digest_for_prefs(db, prefs, opps)
        digest["id"] = str(uuid.uuid4())
        await db.digests.insert_one(digest.copy())
        doc = digest
    frontend_base = FRONTEND_URL or _public_base(request)
    doc["whatsapp_link"] = digest_whatsapp_link(doc, frontend_base)
    doc["whatsapp_text"] = digest_whatsapp_text(doc, frontend_base)
    return doc


async def _run_digest_job(run_id: str):
    """Compute digest for every user with saved preferences. Idempotent per day per device."""
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        opps = await db.opportunities.find({}, {"_id": 0}).to_list(500)
        prefs_cursor = db.preferences.find({}, {"_id": 0})
        count = 0
        async for prefs in prefs_cursor:
            existing = await db.digests.find_one({"device_id": prefs["device_id"], "date": today})
            if existing:
                continue
            digest = await compute_digest_for_prefs(db, prefs, opps)
            digest["id"] = str(uuid.uuid4())
            digest["run_id"] = run_id
            await db.digests.insert_one(digest)
            count += 1
        logger.info(f"[digest] run={run_id} generated={count}")
    except Exception as e:
        logger.exception(f"[digest] run={run_id} failed: {e}")


@app.post("/api/cron/digest")
async def cron_digest(request: Request, background: BackgroundTasks,
                      authorization: Optional[str] = Header(None),
                      x_webhook_id: Optional[str] = Header(None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    expected = os.environ.get("WEBHOOK_CRON_SECRET", "")
    provided = ""
    if authorization and authorization.lower().startswith("bearer "):
        provided = authorization.split(" ", 1)[1].strip()
    if not expected or not secrets.compare_digest(expected, provided):
        raise HTTPException(401, "Unauthorized")
    run_id = x_webhook_id or str(uuid.uuid4())
    background.add_task(_run_digest_job, run_id)
    return {"ok": True, "run_id": run_id}


# -------- Sources health + Scrape cron --------
@app.get("/api/sources")
async def list_sources():
    """Public list of all opportunity sources + their latest scrape health."""
    healths = {h["key"]: h async for h in db.source_health.find({}, {"_id": 0})}
    out = []
    for s in SCRAPER_REGISTRY:
        h = healths.get(s.key, {})
        out.append({
            "key": s.key, "name": s.name, "description": s.description,
            "homepage": s.homepage, "category": s.category,
            "live": s.live,
            "last_status": h.get("status", "never-run" if s.live else "pending"),
            "last_count": h.get("count", 0),
            "last_ran_at": h.get("ran_at"),
            "last_error": h.get("error"),
        })
    # Sort: live+ok first, live+failed next, pending last
    order = {"ok": 0, "failed": 1, "never-run": 2, "pending": 3}
    out.sort(key=lambda x: (order.get(x["last_status"], 9), x["name"]))
    return out


async def _run_scrape_job(run_id: str):
    try:
        results = await run_scrapers(db)
        logger.info(f"[scrape] run={run_id} results={results}")
    except Exception as e:
        logger.exception(f"[scrape] run={run_id} failed: {e}")


@app.post("/api/cron/scrape")
async def cron_scrape(request: Request, background: BackgroundTasks,
                      authorization: Optional[str] = Header(None),
                      x_webhook_id: Optional[str] = Header(None)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    expected = os.environ.get("WEBHOOK_CRON_SECRET", "")
    provided = ""
    if authorization and authorization.lower().startswith("bearer "):
        provided = authorization.split(" ", 1)[1].strip()
    if not expected or not secrets.compare_digest(expected, provided):
        raise HTTPException(401, "Unauthorized")
    run_id = x_webhook_id or str(uuid.uuid4())
    background.add_task(_run_scrape_job, run_id)
    return {"ok": True, "run_id": run_id}


@app.post("/api/admin/scrape-now")
async def admin_scrape_now(background: BackgroundTasks,
                           authorization: Optional[str] = Header(None)):
    """Manual trigger of the scrape pipeline. Requires WEBHOOK_CRON_SECRET."""
    expected = os.environ.get("WEBHOOK_CRON_SECRET", "")
    provided = ""
    if authorization and authorization.lower().startswith("bearer "):
        provided = authorization.split(" ", 1)[1].strip()
    if not expected or not secrets.compare_digest(expected, provided):
        raise HTTPException(401, "Unauthorized")
    run_id = str(uuid.uuid4())
    background.add_task(_run_scrape_job, run_id)
    return {"ok": True, "run_id": run_id, "message": "Scrape started; poll /api/sources for status"}


# -------- Admin approval flow for user submissions --------
def _require_admin(authorization: Optional[str]) -> None:
    expected = os.environ.get("ADMIN_SECRET", "")
    provided = ""
    if authorization and authorization.lower().startswith("bearer "):
        provided = authorization.split(" ", 1)[1].strip()
    if not expected or not secrets.compare_digest(expected, provided):
        raise HTTPException(401, "Unauthorized")


@app.post("/api/submissions", response_model=Submission)
async def create_submission(payload: SubmissionCreate):
    """Public endpoint: anyone can submit an opportunity for admin review.
    Nothing is auto-published — every submission stays in 'pending' until an admin approves."""
    sub = Submission(**payload.model_dump())
    await db.submissions.insert_one(sub.model_dump())
    logger.info(f"[submission] new pending id={sub.id} title={sub.title[:60]!r}")
    return sub


@app.post("/api/admin/verify")
async def admin_verify(authorization: Optional[str] = Header(None)):
    """Verify admin credentials — used by the admin UI to gate access."""
    _require_admin(authorization)
    return {"ok": True}


@app.get("/api/admin/submissions")
async def list_submissions(status: str = "pending", authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    docs = await db.submissions.find({"status": status}, {"_id": 0}).sort("submitted_at", -1).to_list(500)
    return docs


@app.post("/api/admin/submissions/{sub_id}/approve")
async def approve_submission(sub_id: str, body: AdminReviewAction = None, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    sub = await db.submissions.find_one({"id": sub_id}, {"_id": 0})
    if not sub:
        raise HTTPException(404, "Submission not found")
    if sub.get("status") != "pending":
        raise HTTPException(400, f"Submission already {sub.get('status')}")

    now_iso = datetime.now(timezone.utc).isoformat()
    # Convert to opportunity, mark as community-verified (reviewed by admin) with clear provenance
    opp = {
        "id": str(uuid.uuid4()),
        "title": sub["title"], "organisation": sub["organisation"],
        "category": sub.get("category") or "job",
        "location": sub.get("location") or sub.get("province") or "Nationwide",
        "province": sub.get("province") or "Nationwide",
        "remote": bool(sub.get("remote")),
        "employment_type": sub.get("employment_type"),
        "experience_level": sub.get("experience_level"),
        "salary": sub.get("salary"),
        "closing_date": sub.get("closing_date") or "",
        "posted_date": now_iso[:10],
        "description": sub.get("description") or "",
        "requirements": [], "responsibilities": [], "benefits": [],
        "application_url": sub.get("application_url"),
        "source_url": sub.get("source_url"),
        "source_type": "community",
        "verification_status": "admin-reviewed",
        "verified_date": now_iso[:10],
        "featured": False,
        "tags": [], "reference_number": sub.get("reference_number"),
        "industry": None,
        "match_score": None,
        "created_at": now_iso, "updated_at": now_iso,
        "source_scraper": "community-submission",
        "submission_id": sub_id,
    }
    await db.opportunities.insert_one(opp)
    await db.submissions.update_one(
        {"id": sub_id},
        {"$set": {"status": "approved", "reviewed_at": now_iso,
                  "reviewer_note": (body.note if body else None), "opportunity_id": opp["id"]}},
    )
    logger.info(f"[submission] approved id={sub_id} -> opp={opp['id']}")
    return {"ok": True, "opportunity_id": opp["id"]}


@app.post("/api/admin/submissions/{sub_id}/reject")
async def reject_submission(sub_id: str, body: AdminReviewAction = None, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    sub = await db.submissions.find_one({"id": sub_id}, {"_id": 0})
    if not sub:
        raise HTTPException(404, "Submission not found")
    if sub.get("status") != "pending":
        raise HTTPException(400, f"Submission already {sub.get('status')}")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.submissions.update_one(
        {"id": sub_id},
        {"$set": {"status": "rejected", "reviewed_at": now_iso,
                  "reviewer_note": (body.note if body else None)}},
    )
    return {"ok": True}


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
    # WIPE mock data: this app now shows ONLY scraped, verified opportunities.
    # If any legacy demo IDs (opp-001..opp-012) remain from earlier iterations, remove them.
    try:
        result = await db.opportunities.delete_many({"id": {"$regex": "^opp-0"}})
        if result.deleted_count:
            logger.info(f"[startup] purged {result.deleted_count} legacy demo opportunities")
    except Exception as e:
        logger.warning(f"[startup] purge skipped: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
