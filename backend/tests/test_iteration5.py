"""Backend tests — Iteration 5: scraping architecture, /api/sources, public submissions + admin approval."""
import os
import uuid

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
ADMIN_SECRET = (backend_env.get("ADMIN_SECRET") or "").strip('"')


@pytest.fixture(scope="module")
def api():
    return requests.Session()


def admin_h(secret=None):
    return {"Authorization": f"Bearer {secret or ADMIN_SECRET}"}


# ---------------- Module: /api/sources ----------------
class TestSources:
    def test_sources_list(self, api):
        r = api.get(f"{BASE_URL}/api/sources", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 15, f"expected >=15 sources, got {len(data)}"
        by_key = {s["key"]: s for s in data}
        assert "etenders" in by_key
        assert by_key["etenders"]["live"] is True
        assert by_key["etenders"]["homepage"].startswith("http")
        for k in ["dpsa", "sayouth", "nsfas", "saica", "pnet", "mining"]:
            assert k in by_key, f"missing placeholder source {k}"
            assert by_key[k]["live"] is False
            assert by_key[k]["last_status"] == "pending"
        # schema
        for s in data:
            for field in ["key", "name", "description", "homepage", "category", "live", "last_status", "last_count"]:
                assert field in s, f"{s.get('key')} missing {field}"

    def test_live_count(self, api):
        data = api.get(f"{BASE_URL}/api/sources", timeout=30).json()
        live = [s for s in data if s["live"]]
        assert len(live) >= 1
        assert live[0]["last_count"] >= 1, "eTenders scraper reported 0 items"


# ---------------- Module: opportunities (real scraped data) ----------------
class TestOpportunities:
    def test_legacy_demo_data_gone(self, api):
        for legacy in ["opp-001", "opp-006", "opp-012"]:
            r = api.get(f"{BASE_URL}/api/opportunities/{legacy}", timeout=30)
            assert r.status_code == 404, f"{legacy} still present: {r.status_code}"

    def test_only_scraped_or_community_items(self, api):
        r = api.get(f"{BASE_URL}/api/opportunities?limit=200", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0, "no opportunities returned"
        assert not any(i["id"].startswith("opp-0") for i in items)
        etenders = [i for i in items if i["id"].startswith("etenders-")]
        assert len(etenders) >= 1, "no etenders- prefixed items"
        for i in etenders:
            assert i["source_type"] == "official"
            assert i["category"] == "tender"
            assert i["title"]
            assert i["source_url"]

    def test_source_scraper_field_exposed(self, api):
        """source_scraper must be visible to clients (spec requires source_scraper='etenders')."""
        items = api.get(f"{BASE_URL}/api/opportunities?limit=200", timeout=30).json()
        et = [i for i in items if i["id"].startswith("etenders-")][0]
        assert "source_scraper" in et, "source_scraper stripped by response model"
        assert et["source_scraper"] == "etenders"

    def test_category_filter(self, api):
        r = api.get(f"{BASE_URL}/api/opportunities?category=tender&limit=200", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert len(items) > 0
        assert all(i["category"] == "tender" for i in items)
        r2 = api.get(f"{BASE_URL}/api/opportunities?category=bursary", timeout=30)
        assert r2.status_code == 200
        assert all(i["category"] == "bursary" for i in r2.json())

    def test_stats(self, api):
        r = api.get(f"{BASE_URL}/api/opportunities/stats", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["total"] > 0
        assert isinstance(d["by_category"], dict)

    def test_detail_and_share(self, api):
        items = api.get(f"{BASE_URL}/api/opportunities?limit=5", timeout=30).json()
        oid = items[0]["id"]
        assert api.get(f"{BASE_URL}/api/opportunities/{oid}", timeout=30).status_code == 200
        rs = api.get(f"{BASE_URL}/api/share/{oid}", timeout=60)
        assert rs.status_code == 200 and "og:title" in rs.text
        rp = api.get(f"{BASE_URL}/api/og/{oid}.png", timeout=60)
        assert rp.status_code == 200 and rp.headers["content-type"] == "image/png"


# ---------------- Module: scrape triggers auth ----------------
class TestScrapeAuth:
    def test_scrape_now_unauthorized(self, api):
        assert api.post(f"{BASE_URL}/api/admin/scrape-now", timeout=30).status_code == 401
        assert api.post(f"{BASE_URL}/api/admin/scrape-now", headers={"Authorization": "Bearer wrong"}, timeout=30).status_code == 401

    def test_scrape_now_authorized(self, api):
        r = api.post(f"{BASE_URL}/api/admin/scrape-now", headers={"Authorization": f"Bearer {CRON_SECRET}"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["ok"] is True and d.get("run_id")

    def test_cron_scrape_auth(self, api):
        assert api.post(f"{BASE_URL}/api/cron/scrape", timeout=30).status_code == 401
        r = api.post(f"{BASE_URL}/api/cron/scrape", headers={"Authorization": f"Bearer {CRON_SECRET}"}, timeout=30)
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_secrets_not_leaked(self, api):
        r = api.post(f"{BASE_URL}/api/admin/scrape-now", headers={"Authorization": "Bearer wrong"}, timeout=30)
        assert CRON_SECRET not in r.text and ADMIN_SECRET not in r.text


# ---------------- Module: public submissions + admin approval ----------------
class TestSubmissionFlow:
    def _payload(self, title):
        return {
            "title": title, "organisation": "TEST_Org Pty Ltd", "category": "job",
            "location": "Sandton", "province": "Gauteng", "remote": True,
            "employment_type": "Full-time", "experience_level": "Entry",
            "salary": "R20 000", "closing_date": "2026-12-31",
            "description": "TEST submission description for admin review.",
            "application_url": "https://example.com/apply",
            "source_url": "https://example.com/job",
            "reference_number": "TEST-REF-1",
            "submitter_name": "QA Bot", "submitter_email": "qa@example.test",
        }

    def test_public_submission_no_auth(self, api):
        p = self._payload(f"TEST_Public Submission {uuid.uuid4().hex[:6]}")
        r = api.post(f"{BASE_URL}/api/submissions", json=p, timeout=30)
        assert r.status_code == 200, r.text[:400]
        d = r.json()
        assert d["status"] == "pending"
        assert d["id"] and d["submitted_at"]
        for k, v in p.items():
            assert d[k] == v, f"field {k} mismatch: {d.get(k)} != {v}"
        assert d["reviewed_at"] is None

    def test_submission_validation(self, api):
        r = api.post(f"{BASE_URL}/api/submissions", json={"title": "x"}, timeout=30)
        assert r.status_code == 422

    def test_admin_verify(self, api):
        assert api.post(f"{BASE_URL}/api/admin/verify", timeout=30).status_code == 401
        assert api.post(f"{BASE_URL}/api/admin/verify", headers=admin_h("nope"), timeout=30).status_code == 401
        r = api.post(f"{BASE_URL}/api/admin/verify", headers=admin_h(), timeout=30)
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_admin_list_submissions(self, api):
        assert api.get(f"{BASE_URL}/api/admin/submissions", timeout=30).status_code == 401
        p = self._payload(f"TEST_Listing {uuid.uuid4().hex[:6]}")
        sid = api.post(f"{BASE_URL}/api/submissions", json=p, timeout=30).json()["id"]
        r = api.get(f"{BASE_URL}/api/admin/submissions", headers=admin_h(), timeout=30)
        assert r.status_code == 200
        pend = r.json()
        assert isinstance(pend, list)
        assert sid in [s["id"] for s in pend]
        assert all(s["status"] == "pending" for s in pend)
        ra = api.get(f"{BASE_URL}/api/admin/submissions?status=approved", headers=admin_h(), timeout=30)
        assert ra.status_code == 200
        assert all(s["status"] == "approved" for s in ra.json())

    def test_approve_creates_opportunity(self, api):
        title = f"TEST_Approve {uuid.uuid4().hex[:6]}"
        sid = api.post(f"{BASE_URL}/api/submissions", json=self._payload(title), timeout=30).json()["id"]
        r = api.post(f"{BASE_URL}/api/admin/submissions/{sid}/approve", json={"note": "looks good"},
                     headers=admin_h(), timeout=30)
        assert r.status_code == 200, r.text[:300]
        oid = r.json()["opportunity_id"]
        # new opportunity exists with right provenance
        g = api.get(f"{BASE_URL}/api/opportunities/{oid}", timeout=30)
        assert g.status_code == 200
        opp = g.json()
        assert opp["title"] == title
        assert opp["source_type"] == "community"
        assert opp["verification_status"] == "admin-reviewed"
        # NOTE: source_scraper is persisted in Mongo but stripped by the Opportunity response_model
        # (known API gap, tested in test_community_source_scraper_exposed)
        # submission moved to approved
        appr = api.get(f"{BASE_URL}/api/admin/submissions?status=approved", headers=admin_h(), timeout=30).json()
        rec = [s for s in appr if s["id"] == sid]
        assert rec, "submission not in approved list"
        assert rec[0]["reviewed_at"] and rec[0]["opportunity_id"] == oid
        # no longer pending
        pend = api.get(f"{BASE_URL}/api/admin/submissions", headers=admin_h(), timeout=30).json()
        assert sid not in [s["id"] for s in pend]
        # double approve -> 400
        assert api.post(f"{BASE_URL}/api/admin/submissions/{sid}/approve", headers=admin_h(), timeout=30).status_code == 400

    def test_approve_requires_admin(self, api):
        sid = api.post(f"{BASE_URL}/api/submissions", json=self._payload(f"TEST_NoAuth {uuid.uuid4().hex[:6]}"), timeout=30).json()["id"]
        assert api.post(f"{BASE_URL}/api/admin/submissions/{sid}/approve", timeout=30).status_code == 401
        assert api.post(f"{BASE_URL}/api/admin/submissions/{sid}/reject", headers=admin_h("bad"), timeout=30).status_code == 401
        # still pending
        pend = api.get(f"{BASE_URL}/api/admin/submissions", headers=admin_h(), timeout=30).json()
        assert sid in [s["id"] for s in pend]
        api.post(f"{BASE_URL}/api/admin/submissions/{sid}/reject", headers=admin_h(), timeout=30)

    def test_reject_does_not_publish(self, api):
        title = f"TEST_Reject {uuid.uuid4().hex[:6]}"
        sid = api.post(f"{BASE_URL}/api/submissions", json=self._payload(title), timeout=30).json()["id"]
        r = api.post(f"{BASE_URL}/api/admin/submissions/{sid}/reject", json={"note": "spam"}, headers=admin_h(), timeout=30)
        assert r.status_code == 200 and r.json()["ok"] is True
        rej = api.get(f"{BASE_URL}/api/admin/submissions?status=rejected", headers=admin_h(), timeout=30).json()
        rec = [s for s in rej if s["id"] == sid]
        assert rec and rec[0]["status"] == "rejected" and rec[0]["reviewed_at"]
        # not published
        opps = api.get(f"{BASE_URL}/api/opportunities?q={title}&limit=200", timeout=30).json()
        assert not any(o["title"] == title for o in opps), "rejected submission was published"
        assert api.post(f"{BASE_URL}/api/admin/submissions/{sid}/reject", headers=admin_h(), timeout=30).status_code == 400

    def test_community_source_scraper_exposed(self, api):
        """KNOWN FAIL: approved-community opportunities should expose source_scraper='community-submission'."""
        title = f"TEST_Prov {uuid.uuid4().hex[:6]}"
        sid = api.post(f"{BASE_URL}/api/submissions", json=self._payload(title), timeout=30).json()["id"]
        oid = api.post(f"{BASE_URL}/api/admin/submissions/{sid}/approve", headers=admin_h(), timeout=30).json()["opportunity_id"]
        opp = api.get(f"{BASE_URL}/api/opportunities/{oid}", timeout=30).json()
        assert opp.get("source_scraper") == "community-submission", f"source_scraper missing: {opp.get('source_scraper')}"

    def test_unknown_id(self, api):
        assert api.post(f"{BASE_URL}/api/admin/submissions/nope-{uuid.uuid4().hex}/approve", headers=admin_h(), timeout=30).status_code == 404
        assert api.post(f"{BASE_URL}/api/admin/submissions/nope-{uuid.uuid4().hex}/reject", headers=admin_h(), timeout=30).status_code == 404


# ---------------- Module: regression (saved, prefs, digest) ----------------
class TestRegression:
    def test_saved_and_prefs_and_digest(self, api):
        device = f"TEST-dev-{uuid.uuid4().hex[:8]}"
        oid = api.get(f"{BASE_URL}/api/opportunities?limit=1", timeout=30).json()[0]["id"]
        rs = api.post(f"{BASE_URL}/api/saved", json={"device_id": device, "opportunity_id": oid, "folder": "interested"}, timeout=30)
        assert rs.status_code == 200
        lst = api.get(f"{BASE_URL}/api/saved/{device}", timeout=30).json()
        assert any(s["opportunity_id"] == oid for s in lst)
        rp = api.post(f"{BASE_URL}/api/preferences", json={"device_id": device, "categories": ["tender"], "provinces": ["Gauteng"], "frequency": "daily", "channel": ["whatsapp"]}, timeout=30)
        assert rp.status_code == 200
        assert api.get(f"{BASE_URL}/api/preferences/{device}", timeout=30).json()["categories"] == ["tender"]
        rd = api.get(f"{BASE_URL}/api/digest/{device}", timeout=60)
        assert rd.status_code == 200
        d = rd.json()
        assert "whatsapp_link" in d and "whatsapp_text" in d
        assert api.delete(f"{BASE_URL}/api/saved/{device}/{oid}", timeout=30).status_code == 200
