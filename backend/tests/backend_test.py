"""Backend tests for The Notice Board — Feb 2026 iteration (OG/share previews + daily digest)."""
import os
import re
import time
import uuid
from urllib.parse import unquote

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

backend_env = dotenv_values("/app/backend/.env")
CRON_SECRET = (backend_env.get("WEBHOOK_CRON_SECRET") or "").strip('"')


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    return s


@pytest.fixture(scope="session")
def opp_ids(api):
    r = api.get(f"{BASE_URL}/api/opportunities", timeout=30)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    items = data["items"] if isinstance(data, dict) and "items" in data else data
    assert isinstance(items, list) and len(items) > 0
    return [i["id"] for i in items]


# ---------------- Module: core / regression ----------------
class TestCoreRegression:
    def test_opportunities_list(self, api):
        r = api.get(f"{BASE_URL}/api/opportunities", timeout=30)
        assert r.status_code == 200
        data = r.json()
        items = data["items"] if isinstance(data, dict) and "items" in data else data
        assert len(items) >= 1
        assert "_id" not in items[0]
        for k in ("id", "title", "organisation", "category"):
            assert k in items[0]

    def test_opportunity_detail(self, api, opp_ids):
        r = api.get(f"{BASE_URL}/api/opportunities/{opp_ids[0]}", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == opp_ids[0]

    def test_opportunity_detail_404(self, api):
        r = api.get(f"{BASE_URL}/api/opportunities/nonexistent-id", timeout=30)
        assert r.status_code == 404

    def test_search(self, api):
        r = api.get(f"{BASE_URL}/api/opportunities", params={"q": "learnership"}, timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_stats(self, api):
        r = api.get(f"{BASE_URL}/api/opportunities/stats", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), dict)


# ---------------- Module: og.py — OG image ----------------
class TestOgImage:
    def test_og_png_ok(self, api, opp_ids):
        r = api.get(f"{BASE_URL}/api/og/{opp_ids[0]}.png", timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert r.headers.get("content-type") == "image/png"
        assert len(r.content) > 5 * 1024, f"png too small: {len(r.content)}"
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_og_all_opps_render(self, api, opp_ids):
        failures = []
        for oid in opp_ids[:12]:
            r = api.get(f"{BASE_URL}/api/og/{oid}.png", timeout=60)
            if r.status_code != 200 or len(r.content) < 5000:
                failures.append((oid, r.status_code, len(r.content)))
        assert not failures, f"OG render failures: {failures}"

    def test_og_404(self, api):
        r = api.get(f"{BASE_URL}/api/og/nonexistent-id.png", timeout=30)
        assert r.status_code == 404

    # NOTE: the preview ingress overrides Cache-Control with `no-store` for all responses,
    # so the app-set `public, max-age=3600` header cannot be asserted through the public URL.
    # Not an app bug — no assertion here.


# ---------------- Module: og.py — share HTML ----------------
class TestSharePage:
    def test_share_html_ok(self, api, opp_ids):
        oid = opp_ids[0]
        r = api.get(f"{BASE_URL}/api/share/{oid}", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert "text/html" in r.headers.get("content-type", "")
        body = r.text
        for prop in ("og:title", "og:description", "og:image", "og:url", "twitter:card"):
            assert f'property="{prop}"' in body or f'name="{prop}"' in body, f"missing {prop}"
        assert "window.location.replace" in body or "http-equiv=\"refresh\"" in body
        m = re.search(r'property="og:image" content="([^"]+)"', body)
        assert m, "og:image content not found"
        img_url = m.group(1)
        assert img_url.endswith(f"/api/og/{oid}.png")
        assert img_url.startswith("https://"), f"og:image must be https for crawlers, got {img_url}"
        m2 = re.search(r'property="og:url" content="([^"]+)"', body)
        assert m2 and f"/opportunity/{oid}" in m2.group(1)
        assert BASE_URL in img_url, f"og:image must use public host, got {img_url}"

    def test_share_og_image_resolvable(self, api, opp_ids):
        r = api.get(f"{BASE_URL}/api/share/{opp_ids[1]}", timeout=30)
        img_url = re.search(r'property="og:image" content="([^"]+)"', r.text).group(1)
        ir = requests.get(img_url, timeout=60)
        assert ir.status_code == 200 and ir.headers.get("content-type") == "image/png"

    def test_share_404(self, api):
        r = api.get(f"{BASE_URL}/api/share/nonexistent-id", timeout=30)
        assert r.status_code == 404


# ---------------- Module: digest.py — GET /api/digest ----------------
class TestDigest:
    def test_digest_on_demand_no_prefs(self, api):
        device = f"TEST_{uuid.uuid4().hex[:12]}"
        r = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert "_id" not in d
        assert d["device_id"] == device
        assert isinstance(d["picks"], list) and 0 < len(d["picks"]) <= 6
        p = d["picks"][0]
        for k in ("opportunity_id", "title", "organisation", "category", "reasons"):
            assert k in p
        assert d["whatsapp_link"].startswith("https://wa.me/?text=")
        assert "*The Notice Board — Daily Digest*" in d["whatsapp_text"]
        assert "*The Notice Board — Daily Digest*" in unquote(d["whatsapp_link"])
        assert isinstance(d["total_matches"], int)

    def test_digest_is_today(self, api):
        import datetime as _dt
        device = f"TEST_{uuid.uuid4().hex[:12]}"
        d = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60).json()
        assert d["date"] == _dt.datetime.now(_dt.timezone.utc).date().isoformat(), d["date"]

    def test_digest_stale_not_returned(self, api):
        """A digest row from a previous date must NOT be returned; a fresh today digest is made."""
        import asyncio
        from motor.motor_asyncio import AsyncIOMotorClient
        env = dotenv_values("/app/backend/.env")
        device = f"TEST_{uuid.uuid4().hex[:12]}"

        async def insert_stale():
            c = AsyncIOMotorClient(env["MONGO_URL"])
            await c[env["DB_NAME"]].digests.insert_one({
                "id": "TEST_stale", "device_id": device, "date": "2020-01-01",
                "picks": [], "total_matches": 0, "generated_at": "2020-01-01T00:00:00+00:00",
            })
            c.close()

        asyncio.get_event_loop().run_until_complete(insert_stale()) if False else asyncio.run(insert_stale())
        d = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60).json()
        assert d["id"] != "TEST_stale", "stale digest returned"
        assert d["date"] != "2020-01-01"

    def test_digest_persisted_and_stable(self, api):
        device = f"TEST_{uuid.uuid4().hex[:12]}"
        r1 = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60).json()
        r2 = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60).json()
        assert r1["id"] == r2["id"], "digest should be persisted and re-read, not regenerated"

    def test_digest_respects_preferences(self, api):
        device = f"TEST_{uuid.uuid4().hex[:12]}"
        # After the mock-data wipe the feed only holds real scraped items; pick a category that exists.
        all_opps = api.get(f"{BASE_URL}/api/opportunities?limit=300", timeout=30).json()
        cats = {o["category"] for o in all_opps}
        pref_cat = "bursary" if "bursary" in cats else (sorted(cats)[0] if cats else None)
        if not pref_cat:
            pytest.skip("no opportunities in feed to build a digest from")
        pr = api.post(f"{BASE_URL}/api/preferences", json={
            "device_id": device, "categories": [pref_cat], "provinces": ["Gauteng"],
            "experience_levels": [], "remote_only": False, "frequency": "daily",
        }, timeout=30)
        assert pr.status_code in (200, 201), f"{pr.status_code} {pr.text[:300]}"
        r = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert len(d["picks"]) > 0
        top = d["picks"][0]
        assert top["category"] == pref_cat, f"top pick should match preferred category, got {top}"
        assert any("category" in x.lower() for x in top["reasons"])

    def test_digest_excludes_expired(self, api):
        device = f"TEST_{uuid.uuid4().hex[:12]}"
        d = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60).json()
        today = d["date"]
        for p in d["picks"]:
            if p.get("closing_date"):
                assert p["closing_date"] >= today, f"expired pick included: {p}"


# ---------------- Module: cron /api/cron/digest ----------------
class TestCronDigest:
    def test_cron_no_auth_401(self, api):
        r = api.post(f"{BASE_URL}/api/cron/digest", timeout=30)
        assert r.status_code == 401

    def test_cron_bad_secret_401(self, api):
        r = api.post(f"{BASE_URL}/api/cron/digest",
                     headers={"Authorization": "Bearer wrong-secret"}, timeout=30)
        assert r.status_code == 401

    def test_cron_authorised_and_idempotent(self, api):
        assert CRON_SECRET, "WEBHOOK_CRON_SECRET not found in /app/backend/.env"
        device = f"TEST_{uuid.uuid4().hex[:12]}"
        api.post(f"{BASE_URL}/api/preferences", json={
            "device_id": device, "categories": ["job"], "provinces": [],
            "experience_levels": [], "remote_only": False, "frequency": "daily",
        }, timeout=30)

        h = {"Authorization": f"Bearer {CRON_SECRET}"}
        t0 = time.time()
        r = api.post(f"{BASE_URL}/api/cron/digest", headers=h, timeout=30)
        elapsed = time.time() - t0
        assert 200 <= r.status_code < 300, f"{r.status_code} {r.text[:300]}"
        assert elapsed < 10, f"cron should ack quickly, took {elapsed:.1f}s"
        assert r.json().get("ok") is True
        time.sleep(6)

        first = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60).json()
        assert first["picks"], "cron run produced no picks for device with prefs"
        first_id = first["id"]

        # second run same day -> idempotent
        r2 = api.post(f"{BASE_URL}/api/cron/digest", headers=h, timeout=30)
        assert 200 <= r2.status_code < 300
        time.sleep(6)
        second = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60).json()
        assert second["id"] == first_id, "duplicate digest created for same device+date"

    def test_cron_no_duplicate_rows_in_mongo(self, api):
        """Verify row count in MongoDB does not increase on a second cron run the same day."""
        import asyncio
        from motor.motor_asyncio import AsyncIOMotorClient
        env = dotenv_values("/app/backend/.env")
        h = {"Authorization": f"Bearer {CRON_SECRET}"}

        async def count():
            c = AsyncIOMotorClient(env["MONGO_URL"])
            import datetime as _dt
            today = _dt.datetime.now(_dt.timezone.utc).date().isoformat()
            n = await c[env["DB_NAME"]].digests.count_documents({"date": today})
            c.close()
            return n

        device = f"TEST_{uuid.uuid4().hex[:12]}"
        api.post(f"{BASE_URL}/api/preferences", json={
            "device_id": device, "categories": ["job"], "provinces": [],
            "experience_levels": [], "remote_only": False, "frequency": "daily",
        }, timeout=30)
        assert 200 <= api.post(f"{BASE_URL}/api/cron/digest", headers=h, timeout=30).status_code < 300
        time.sleep(6)
        before = asyncio.run(count())
        assert 200 <= api.post(f"{BASE_URL}/api/cron/digest", headers=h, timeout=30).status_code < 300
        time.sleep(6)
        after = asyncio.run(count())
        assert after == before, f"cron duplicated digest rows: {before} -> {after}"
