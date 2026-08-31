"""Daily personalised digest generation for The Notice Board."""
from datetime import datetime, timezone, timedelta
from urllib.parse import quote

async def compute_digest_for_prefs(db, prefs: dict, all_opps: list) -> dict:
    """Rank & pick the best opportunities for one user based on their preferences."""
    device_id = prefs.get("device_id")
    cats = set(prefs.get("categories") or [])
    provs = set(prefs.get("provinces") or [])
    exp_levels = set(prefs.get("experience_levels") or [])
    remote_only = bool(prefs.get("remote_only"))
    today = datetime.now(timezone.utc).date()
    seven_days = today + timedelta(days=7)

    scored = []
    for o in all_opps:
        try:
            closing = datetime.fromisoformat(o["closing_date"]).date() if o.get("closing_date") else None
        except Exception:
            closing = None
        if closing and closing < today:
            continue  # skip expired
        score = 0
        reasons = []
        if cats and o.get("category") in cats: score += 40; reasons.append("Matches your category interests")
        elif not cats: score += 10
        if provs and o.get("province") in provs: score += 25; reasons.append("In your preferred province")
        elif not provs and not remote_only: score += 8
        if exp_levels and o.get("experience_level") in exp_levels: score += 15; reasons.append("Matches your experience level")
        if remote_only:
            if o.get("remote"): score += 30; reasons.append("Remote — matches your preference")
            else: continue
        if closing and closing <= seven_days: score += 20; reasons.append("Closing this week")
        if o.get("featured"): score += 10; reasons.append("Editorial pick")
        score += int(o.get("match_score") or 0) // 10
        scored.append((score, reasons, o))

    scored.sort(key=lambda t: (-t[0], t[2].get("closing_date") or ""))
    picks = [{"opportunity_id": o["id"], "title": o["title"], "organisation": o["organisation"],
              "category": o["category"], "closing_date": o.get("closing_date"),
              "match_score": o.get("match_score"), "reasons": rs[:2]}
             for score, rs, o in scored[:6]]

    return {
        "device_id": device_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "date": today.isoformat(),
        "picks": picks,
        "total_matches": len(scored),
    }


def digest_whatsapp_text(digest: dict, base_url: str) -> str:
    """Build a nicely-formatted WhatsApp message with the digest."""
    date_str = digest.get("date", "")
    lines = [
        f"*The Notice Board — Daily Digest*",
        f"_{date_str}_",
        "",
        f"Your top {len(digest['picks'])} opportunities for today:",
        "",
    ]
    for i, p in enumerate(digest["picks"], 1):
        cat = (p.get("category") or "").upper()
        closing = p.get("closing_date") or ""
        match = f" · {p['match_score']}% match" if p.get("match_score") else ""
        lines.append(f"*{i}. {p['title']}*")
        lines.append(f"{p['organisation']} · {cat}{match}")
        lines.append(f"Closes {closing}")
        lines.append(f"{base_url}/opportunity/{p['opportunity_id']}")
        lines.append("")
    lines.append("Get more: " + base_url)
    return "\n".join(lines)


def digest_whatsapp_link(digest: dict, base_url: str) -> str:
    text = digest_whatsapp_text(digest, base_url)
    return f"https://wa.me/?text={quote(text)}"
