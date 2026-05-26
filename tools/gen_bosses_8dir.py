#!/usr/bin/env python3
"""Generate 8-direction sprite sheets for the 14 painted bosses.

Uses the existing _idle.png (the painted Nano Banana / Pixflux portrait)
as a reference image so the 8 rotations keep the same identity and color
palette. Output: <slug>_8dir.png — a horizontal 8-frame atlas at
256×256 per frame (max size for the 8-rotation endpoint).

Workflow per boss:
  1. Load public/sprites/bosses/<slug>_idle.png
  2. Downscale to 256×256, preserve RGBA alpha (the chroma-keyed bg
     stays transparent so the result composites onto battlefield)
  3. POST to pixellab MCP create_8_direction_object with that ref +
     view=side
  4. Poll get_object every 30s until status=completed (typical 2-4 min)
  5. Download the 8 rotation PNGs from the returned URLs
  6. Stitch into a 256x2048 strip (south, south-east, east, north-east,
     north, north-west, west, south-west) — same convention PixelLab
     uses for create_character

Resumable: skips bosses that already have <slug>_8dir.png saved.
"""
import base64
import io
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Install Pillow:  pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

BOSS_DIR = Path(__file__).parent.parent / "public" / "sprites" / "bosses"
OUT_DIR = BOSS_DIR  # write 8-dir sheets alongside the existing _idle.png

MCP_URL = "https://api.pixellab.ai/mcp"

# Same boss-list order as gen_bosses.py
BOSSES = [
    "bonewake_dragon", "plague_hydra", "rot_phoenix", "bone_cerberus",
    "wraith_kraken", "necro_sphinx", "crimson_centaur",
    "lich_king", "bone_titan", "plague_doctor", "ash_empress",
    "soul_reaper", "voidlord", "worm_god",
]


def _post(key: str, payload: dict) -> dict:
    req = urllib.request.Request(
        MCP_URL,
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        },
        method="POST",
    )
    raw = urllib.request.urlopen(req, timeout=120).read().decode()
    for line in raw.splitlines():
        if line.startswith("data: "):
            return json.loads(line[6:])
    return json.loads(raw)


def mcp_call(key: str, tool: str, args: dict) -> dict:
    # MCP server is stateless per HTTP request — re-init each time.
    _post(key, {
        "jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2025-06-18", "capabilities": {},
                   "clientInfo": {"name": "boss-8dir-gen", "version": "1"}},
    })
    return _post(key, {
        "jsonrpc": "2.0", "id": 2, "method": "tools/call",
        "params": {"name": tool, "arguments": args},
    })


def load_ref_b64(slug: str) -> str:
    src = BOSS_DIR / f"{slug}_idle.png"
    if not src.exists():
        raise FileNotFoundError(f"missing {src}")
    img = Image.open(src).convert("RGBA")
    # Downscale to 128x128. 256x256 silently never finished on T1 — jobs
    # would queue, sit at 95% pending forever, and never progress. The
    # text-only path completed fine at 64x64, suggesting T1 has a soft
    # cap on reference-driven 8-dir size somewhere around 128.
    img = img.resize((128, 128), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def extract_text(result: dict) -> str:
    """MCP tool responses arrive as {result: {content: [{type: text, text: '...'}]}}."""
    r = result.get("result") or {}
    content = r.get("content") or []
    parts = []
    for c in content:
        if isinstance(c, dict) and c.get("type") == "text":
            parts.append(c.get("text", ""))
    return "\n".join(parts)


def find_object_id(text: str) -> str:
    """create_8_direction_object returns an object_id in its text response."""
    # Look for "object_id: <uuid>" or "Object ID: <uuid>" patterns
    import re
    for m in re.finditer(r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", text):
        return m.group(1)
    raise ValueError(f"no object_id found in: {text[:300]}")


def submit_one(key: str, slug: str) -> str:
    ref = load_ref_b64(slug)
    args = {
        "description": f"{slug.replace('_', ' ')} dark fantasy boss, identical to reference",
        "reference_image_base64": ref,
        "view": "side",
    }
    print(f"  [{slug}] submitting 8-direction job...", flush=True)
    out = mcp_call(key, "create_8_direction_object", args)
    text = extract_text(out)
    oid = find_object_id(text)
    print(f"  [{slug}] queued, object_id={oid}", flush=True)
    return oid


def poll_until_done(key: str, slug: str, object_id: str, timeout_s: int = 600) -> dict:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        time.sleep(30)
        out = mcp_call(key, "get_object", {"object_id": object_id, "include_preview": False})
        text = extract_text(out)
        low = text.lower()
        if "completed" in low or "status: completed" in low or '"status":"completed"' in low:
            print(f"  [{slug}] completed", flush=True)
            return out
        if "failed" in low and "status" in low:
            print(f"  [{slug}] FAILED: {text[:200]}", flush=True)
            return out
        print(f"  [{slug}] still processing...", flush=True)
    raise TimeoutError(f"poll timeout for {slug} / {object_id}")


def extract_image_urls(out: dict) -> list:
    """Pluck rotation image URLs from a completed get_object response."""
    text = extract_text(out)
    import re
    urls = re.findall(r"https?://[^\s)\"']+\.png", text)
    # Dedupe preserving order
    seen = set()
    uniq = []
    for u in urls:
        if u not in seen:
            uniq.append(u); seen.add(u)
    return uniq


def stitch_strip(slug: str, urls: list) -> Path:
    if len(urls) < 8:
        print(f"  [{slug}] WARN: only got {len(urls)} URLs, padding with first", flush=True)
        while len(urls) < 8:
            urls.append(urls[0])
    frames = []
    for u in urls[:8]:
        with urllib.request.urlopen(u, timeout=60) as resp:
            frames.append(Image.open(io.BytesIO(resp.read())).convert("RGBA"))
    # Each frame ~256x256 — paste horizontally
    w, h = frames[0].size
    strip = Image.new("RGBA", (w * 8, h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        if f.size != (w, h):
            f = f.resize((w, h), Image.LANCZOS)
        strip.paste(f, (i * w, 0))
    out = OUT_DIR / f"{slug}_8dir.png"
    strip.save(out)
    print(f"  [{slug}] saved {out.name} ({w*8}x{h})", flush=True)
    return out


def main() -> int:
    key = os.environ.get("PIXELLAB_API_KEY") or os.environ.get("PIXELLAB_KEY")
    if not key:
        print("set PIXELLAB_API_KEY", file=sys.stderr)
        return 1
    print(f"generating 8-direction sheets for {len(BOSSES)} bosses")
    for slug in BOSSES:
        target = OUT_DIR / f"{slug}_8dir.png"
        if target.exists():
            print(f"  [{slug}] already exists — skip", flush=True)
            continue
        for attempt in range(3):
            try:
                oid = submit_one(key, slug)
                out = poll_until_done(key, slug, oid)
                urls = extract_image_urls(out)
                if not urls:
                    print(f"  [{slug}] no image URLs in completed response", flush=True)
                    break
                stitch_strip(slug, urls)
                break
            except (urllib.error.URLError, OSError, ConnectionError, TimeoutError, ValueError) as e:
                msg = str(e)
                if any(c in msg for c in ("401", "403", "422")):
                    print(f"  [{slug}] FATAL: {msg[:160]}", flush=True)
                    raise
                wait = 30 * (attempt + 1)
                print(f"  [{slug}] err {msg[:100]} — sleep {wait}s then retry", flush=True)
                time.sleep(wait)
        time.sleep(3)
    print("done")
    return 0


if __name__ == "__main__":
    sys.exit(main())
