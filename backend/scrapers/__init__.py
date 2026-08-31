"""Base class + registry for opportunity scrapers.

Every scraper implements .fetch() -> list[dict] of Opportunity-compatible dicts.
Sources are registered here; the scheduled runner iterates all enabled sources,
records health per run, and stores results in Mongo (dedup by (source, reference_number|url)).
"""
from __future__ import annotations
import asyncio, logging, uuid, hashlib
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class ScraperError(Exception):
    pass


class BaseScraper(ABC):
    key: str = ""              # unique short key e.g. "etenders"
    name: str = ""             # display name
    description: str = ""
    homepage: str = ""
    category: str = "tender"   # default opportunity category
    verified: bool = True      # scraper only publishes if source_type is official
    live: bool = True          # False = placeholder (Coming Soon)

    @abstractmethod
    async def fetch(self) -> List[Dict[str, Any]]:
        ...

    def _dedup_id(self, ref: Optional[str], url: Optional[str], title: str) -> str:
        # Dedup priority: reference_number > title (URL shared across rows can't be a key)
        seed = (ref or title or url or "").strip().lower()
        h = hashlib.sha1(f"{self.key}|{seed}".encode("utf-8")).hexdigest()[:16]
        return f"{self.key}-{h}"

    def _stamp(self, o: Dict[str, Any]) -> Dict[str, Any]:
        """Normalise every scraped opportunity to the app's Opportunity schema."""
        now_iso = datetime.now(timezone.utc).isoformat()
        o.setdefault("id", self._dedup_id(o.get("reference_number"), o.get("source_url"), o.get("title", "")))
        o.setdefault("category", self.category)
        o.setdefault("source_type", "official")
        o.setdefault("verification_status", "verified")
        o.setdefault("verified_date", now_iso[:10])
        o.setdefault("featured", False)
        o.setdefault("tags", [])
        o.setdefault("requirements", [])
        o.setdefault("responsibilities", [])
        o.setdefault("benefits", [])
        o.setdefault("province", o.get("province") or "Nationwide")
        o.setdefault("location", o.get("location") or o.get("province") or "Nationwide")
        o.setdefault("remote", False)
        o.setdefault("posted_date", o.get("posted_date") or "")
        o.setdefault("closing_date", o.get("closing_date") or "")
        o.setdefault("description", o.get("description") or o.get("title", ""))
        o.setdefault("source_scraper", self.key)
        o["updated_at"] = now_iso
        o.setdefault("created_at", now_iso)
        return o


# -------- Registry --------
REGISTRY: List[BaseScraper] = []

def register(s: BaseScraper):
    REGISTRY.append(s)
    return s


# Import scrapers to auto-register (side-effect imports)
from . import etenders  # noqa: E402,F401
from . import placeholders  # noqa: E402,F401


async def run_all(db) -> Dict[str, Any]:
    """Run every enabled scraper concurrently; upsert results; record health."""
    results = {}
    async def _run_one(s: BaseScraper):
        started = datetime.now(timezone.utc)
        try:
            if not s.live:
                results[s.key] = {"status": "pending", "count": 0, "message": "Scraper not yet built — coming soon.", "ran_at": started.isoformat()}
                return
            items = await asyncio.wait_for(s.fetch(), timeout=180)
            count = 0
            for raw in items:
                doc = s._stamp(raw)
                await db.opportunities.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
                count += 1
            elapsed = (datetime.now(timezone.utc) - started).total_seconds()
            results[s.key] = {"status": "ok", "count": count, "elapsed_s": round(elapsed, 1), "ran_at": started.isoformat()}
        except Exception as e:
            logger.exception(f"[scraper:{s.key}] failed")
            results[s.key] = {"status": "failed", "error": str(e)[:200], "count": 0, "ran_at": started.isoformat()}
        finally:
            # Clear stale error on success by using $unset when status is ok
            update = {"$set": {"key": s.key, **results.get(s.key, {})}}
            if results.get(s.key, {}).get("status") == "ok":
                update["$unset"] = {"error": ""}
            await db.source_health.update_one({"key": s.key}, update, upsert=True)

    await asyncio.gather(*[_run_one(s) for s in REGISTRY])
    return results
