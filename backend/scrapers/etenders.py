"""eTenders (www.etenders.gov.za) scraper — headless Chromium via Playwright.

The site is a JS-rendered DataTable that fetches from an anti-forgery-protected
endpoint. We render the page in a headless browser, wait for the table, and
extract rows directly from the DOM.
"""
from __future__ import annotations
import asyncio, re, logging
from datetime import datetime
from typing import List, Dict, Any
from urllib.parse import urljoin

from . import BaseScraper, register

logger = logging.getLogger(__name__)

TENDERS_URL = "https://www.etenders.gov.za/Home/opportunities?id=1"


def _parse_date(raw: str) -> str:
    if not raw: return ""
    raw = raw.strip()
    # Handle "DD Month YYYY HH:MM" or "DD/MM/YYYY" or "YYYY-MM-DD"
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d %B %Y", "%d %b %Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            first = raw.split()[0] if fmt == "%d/%m/%Y" or fmt == "%Y-%m-%d" else raw[:len("00 September 0000")]
            return datetime.strptime(first.strip(), fmt).date().isoformat()
        except Exception: pass
    # Try to strip trailing time e.g. "15/09/2026 11:00"
    m = re.match(r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})", raw)
    if m:
        d, mth, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try: return datetime(y, mth, d).date().isoformat()
        except Exception: pass
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", raw)
    if m: return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return ""


def _province_from(text: str) -> str:
    if not text: return "Nationwide"
    t = text.lower()
    for p in ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Free State", "Mpumalanga", "Limpopo", "North West", "Northern Cape"]:
        if p.lower() in t: return p
    if "national" in t: return "Nationwide"
    return "Nationwide"


class ETenders(BaseScraper):
    key = "etenders"
    name = "National Treasury eTenders Portal"
    description = "Official South African government tender portal — all currently advertised open tenders."
    homepage = TENDERS_URL
    category = "tender"
    live = True

    async def fetch(self) -> List[Dict[str, Any]]:
        # Import here so a missing playwright install doesn't crash module import
        from playwright.async_api import async_playwright, TimeoutError as PWTimeout

        opportunities: List[Dict[str, Any]] = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=[
                "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
            ])
            ctx = await browser.new_context(user_agent="Mozilla/5.0 (compatible; NoticeBoardBot/1.0; +https://thenoticeboard.co.za)")
            page = await ctx.new_page()
            try:
                await page.goto(TENDERS_URL, wait_until="domcontentloaded", timeout=45000)
                # Wait for datatable to populate — table rows appear after XHR resolves
                await page.wait_for_selector("#tendeList tbody tr td", timeout=45000)
                # Set page length to max (100) so we get more per pass
                try:
                    await page.select_option("select[name='tendeList_length']", "100", timeout=5000)
                    await page.wait_for_timeout(1500)
                except Exception: pass

                # Iterate through pages up to 5 times (500 rows max)
                for _ in range(5):
                    rows = await page.query_selector_all("#tendeList tbody tr")
                    for row in rows:
                        cells = await row.query_selector_all("td")
                        if len(cells) < 4: continue
                        # Expand row to reveal reference number & organ of state
                        try:
                            texts = [ (await c.inner_text()).strip() for c in cells ]
                        except Exception:
                            continue
                        # Layout columns from the DataTable (currently-advertised view):
                        # [0] expand, [1] Category, [2] Description, [3] eSubmission, [4] Advertised, [5] Closing
                        # Fall back to last-two cells as dates in case column order differs.
                        category = texts[1] if len(texts) > 1 else ""
                        description = texts[2] if len(texts) > 2 else ""
                        # Grab last two cells as the two dates (advertised, closing)
                        date_cells = [t for t in texts[3:] if re.search(r"\d{1,2}[/\-]\d{1,2}[/\-]\d{4}|\d{4}[/\-]\d{1,2}[/\-]\d{1,2}", t)]
                        advertised = date_cells[0] if len(date_cells) >= 2 else ""
                        closing = date_cells[-1] if date_cells else ""

                        # Description is often multi-line: "Tender no: ABC-123\nDescription text\nOrgan of State: X\nProvince: Y"
                        ref_match = re.search(r"(?:Tender|Bid|Reference|RFQ|RFP)\s*(?:No\.?|Number)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9/\-\_\.]{2,})", description, re.I)
                        ref = ref_match.group(1) if ref_match else ""
                        org_match = re.search(r"Organ\s*of\s*State\s*[:\-]\s*(.+)", description)
                        org = org_match.group(1).strip() if org_match else ""
                        prov_match = re.search(r"Province\s*[:\-]\s*(.+)", description)
                        prov_text = prov_match.group(1).strip() if prov_match else category
                        # Title is the first non-empty line of description, up to reasonable length
                        first_lines = [ln.strip() for ln in description.splitlines() if ln.strip()]
                        title = next((ln for ln in first_lines if not re.match(r"^(Tender|Bid|Reference|Organ|Province|Closing|Advertised)", ln, re.I)), description[:120])

                        if not title or not description: continue

                        opportunities.append({
                            "title": title[:180],
                            "organisation": org or "South African Government",
                            "category": "tender",
                            "reference_number": ref or None,
                            "description": description,
                            "closing_date": _parse_date(closing),
                            "posted_date": _parse_date(advertised),
                            "province": _province_from(prov_text or description),
                            "location": prov_text or "South Africa",
                            "source_url": TENDERS_URL,
                            "source_type": "official",
                            "tags": [category] if category else [],
                            "industry": category or "Government",
                            "employment_type": "Contract",
                            "experience_level": "Business",
                        })

                    # Try to click 'Next' pagination
                    next_btn = await page.query_selector("li.paginate_button.next:not(.disabled) a")
                    if not next_btn:
                        break
                    await next_btn.click()
                    await page.wait_for_timeout(1500)
            finally:
                await ctx.close()
                await browser.close()

        # Dedup within batch
        seen = set()
        unique = []
        for o in opportunities:
            key = (o.get("reference_number") or "") + "|" + o.get("title", "")[:80]
            if key in seen: continue
            seen.add(key); unique.append(o)
        return unique


register(ETenders())
