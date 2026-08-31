"""OG image generation + share HTML for opportunity previews."""
from pathlib import Path
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import hashlib, textwrap, html

FONT_DIR = Path(__file__).parent / "fonts"
FONT_SERIF = str(FONT_DIR / "PlayfairDisplay-Bold.ttf")
FONT_SANS = str(FONT_DIR / "PlusJakartaSans-Regular.ttf")

# Brand palette
BG = (250, 249, 246)          # warm off-white
INK = (13, 19, 31)            # ink
PRIMARY = (10, 37, 64)        # deep intelligent blue
MUTED = (74, 85, 104)
BORDER = (226, 232, 240)
ACCENT = (197, 155, 39)       # editorial gold
SUCCESS = (5, 122, 85)

ORG_PALETTE = [(10, 37, 64), (31, 58, 95), (15, 76, 129), (58, 80, 107), (35, 61, 77), (27, 73, 101), (38, 70, 83)]

W, H = 1200, 630


def _org_color(name: str):
    n = sum(ord(c) for c in (name or ""))
    return ORG_PALETTE[n % len(ORG_PALETTE)]


def _org_initials(name: str) -> str:
    parts = [p for p in (name or "").split() if p]
    return "".join(p[0].upper() for p in parts[:2]) or "??"


def _wrap(draw, text, font, max_width):
    words = text.split()
    lines, cur = [], []
    for w in words:
        test = " ".join(cur + [w])
        if draw.textlength(test, font=font) <= max_width:
            cur.append(w)
        else:
            if cur: lines.append(" ".join(cur))
            cur = [w]
    if cur: lines.append(" ".join(cur))
    return lines


def render_og(opp: dict) -> bytes:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Top accent bar
    d.rectangle((0, 0, W, 8), fill=PRIMARY)

    # Card
    pad = 56
    card = (pad, 40, W - pad, H - 60)
    d.rounded_rectangle(card, radius=18, fill=(255, 255, 255), outline=BORDER, width=1)

    # Overline
    overline = ImageFont.truetype(FONT_SANS, 20)
    d.text((pad + 40, 78), "THE NOTICE BOARD  ·  SA OPPORTUNITY NETWORK",
           fill=MUTED, font=overline, spacing=6)

    # Category chip
    chip_font = ImageFont.truetype(FONT_SANS, 20)
    cat_label = (opp.get("category") or "job").upper()
    ctw = d.textlength(cat_label, font=chip_font) + 28
    d.rounded_rectangle((pad + 40, 118, pad + 40 + ctw, 158), radius=10,
                        fill=(240, 249, 244) if opp.get("source_type") == "official" else (240, 245, 255),
                        outline=SUCCESS if opp.get("source_type") == "official" else PRIMARY, width=1)
    d.text((pad + 54, 128), cat_label, fill=SUCCESS if opp.get("source_type") == "official" else PRIMARY, font=chip_font)

    # Verified chip if applicable
    x_next = pad + 40 + ctw + 12
    if opp.get("source_type") == "official":
        vlabel = "OFFICIAL SOURCE"
        vw = d.textlength(vlabel, font=chip_font) + 28
        d.rounded_rectangle((x_next, 118, x_next + vw, 158), radius=10, fill=(240, 249, 244), outline=SUCCESS, width=1)
        d.text((x_next + 14, 128), vlabel, fill=SUCCESS, font=chip_font)

    # Title (Playfair serif)
    title_font = ImageFont.truetype(FONT_SERIF, 64)
    title = opp.get("title") or ""
    lines = _wrap(d, title, title_font, W - 2 * (pad + 40))[:3]
    y = 200
    for ln in lines:
        d.text((pad + 40, y), ln, fill=INK, font=title_font)
        y += 76

    # Org row: avatar + name + location
    y += 20
    org = opp.get("organisation") or ""
    initials = _org_initials(org)
    avatar_bg = _org_color(org)
    d.rounded_rectangle((pad + 40, y, pad + 40 + 68, y + 68), radius=12, fill=avatar_bg)
    initials_font = ImageFont.truetype(FONT_SERIF, 32)
    tw = d.textlength(initials, font=initials_font)
    d.text((pad + 40 + (68 - tw) / 2, y + 16), initials, fill=(255, 255, 255), font=initials_font)

    org_font = ImageFont.truetype(FONT_SANS, 28)
    d.text((pad + 40 + 90, y + 6), org[:40], fill=INK, font=org_font)
    loc_font = ImageFont.truetype(FONT_SANS, 22)
    loc = f"{opp.get('location', '')} · {opp.get('province', '')}"
    d.text((pad + 40 + 90, y + 40), loc, fill=MUTED, font=loc_font)

    # Bottom row: deadline chip + match
    by = H - 130
    deadline = opp.get("closing_date") or ""
    dl_font = ImageFont.truetype(FONT_SANS, 22)
    dl_text = f"Closes {deadline}"
    dtw = d.textlength(dl_text, font=dl_font) + 32
    d.rounded_rectangle((pad + 40, by, pad + 40 + dtw, by + 44), radius=10, fill=(255, 247, 237), outline=(251, 191, 36), width=1)
    d.text((pad + 56, by + 10), dl_text, fill=(146, 64, 14), font=dl_font)

    match_score = opp.get("match_score")
    if isinstance(match_score, int):
        mlabel = f"AI match {match_score}%"
        mw = d.textlength(mlabel, font=dl_font) + 32
        d.rounded_rectangle((pad + 40 + dtw + 12, by, pad + 40 + dtw + 12 + mw, by + 44), radius=10, fill=(236, 253, 245), outline=SUCCESS, width=1)
        d.text((pad + 56 + dtw + 12, by + 10), mlabel, fill=SUCCESS, font=dl_font)

    # URL badge bottom-right
    urlf = ImageFont.truetype(FONT_SANS, 22)
    url_txt = "thenoticeboard.co.za"
    utw = d.textlength(url_txt, font=urlf)
    d.text((W - pad - 40 - utw, by + 12), url_txt, fill=MUTED, font=urlf)

    buf = BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def render_share_html(opp: dict, base_url: str, spa_url: str) -> str:
    title = html.escape(opp.get("title") or "The Notice Board")
    org = html.escape(opp.get("organisation") or "")
    desc_source = opp.get("description") or ""
    desc = html.escape((desc_source[:180] + "…") if len(desc_source) > 180 else desc_source)
    og_image = f"{base_url}/api/og/{opp['id']}.png"
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>{title} — The Notice Board</title>
<meta name="description" content="{desc}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="The Notice Board"/>
<meta property="og:title" content="{title}"/>
<meta property="og:description" content="{org} · {desc}"/>
<meta property="og:image" content="{og_image}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="{spa_url}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{title}"/>
<meta name="twitter:description" content="{org} · {desc}"/>
<meta name="twitter:image" content="{og_image}"/>
<meta http-equiv="refresh" content="0; url={spa_url}"/>
<style>body{{font-family:system-ui,sans-serif;background:#FAF9F6;color:#0D131F;text-align:center;padding:40px}} a{{color:#0A2540}}</style>
</head>
<body>
<h1>{title}</h1>
<p>Redirecting to <a href="{spa_url}">The Notice Board</a>…</p>
<script>window.location.replace({spa_url!r});</script>
</body>
</html>"""
