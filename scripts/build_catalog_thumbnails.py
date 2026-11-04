#!/usr/bin/env python3
"""Generate small, immutable public catalog WebP previews from the existing image sitemap.

Never writes to Supabase or modifies the original photos.
The JS manifest maps original public Storage URLs to same-origin, responsive WebP files.
Only publicly indexed categories from image-sitemap.xml are processed.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen
import json
import xml.etree.ElementTree as ET
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "assets" / "catalog-thumbnails"
MAP = ROOT / "catalog-thumbnails.js"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "im": "http://www.google.com/schemas/sitemap-image/1.1"}
SLUGS = ("kovchezi", "urni", "ventsi-i-tsvetya", "krastove", "ritualni-prinadlezhosti")
# Keep this aligned with the public sitemap but do not include obituary previews.
ALLOWED = {"kovchezi", "urni", "ventsi-i-tsvetya", "krastove", "ritualni-prinadlezhnosti"}
HOST_PREFIX = "https://beflewauiyexpmvcxjat.supabase.co/storage/v1/object/public/product-images/"
WIDTHS = (480, 960)

def images_in_sitemap():
    root = ET.parse(ROOT / "image-sitemap.xml").getroot()
    items = []
    for page in root.findall("sm:url", NS):
        loc = page.findtext("sm:loc", "", NS)
        parts = loc.rstrip("/").split("/")
        slug = parts[-1]
        if slug not in ALLOWED:
            continue
        for image in page.findall("im:image/im:loc", NS):
            if image.text and image.text.startswith(HOST_PREFIX):
                items.append(image.text)
    items = list(dict.fromkeys(items))
    if len(items) < 40:
        raise RuntimeError("Unexpectedly few images in the sitemap; refusing partial build")
    return items

def fetch_one(url):
    digest = sha256(url.encode("utf-8")).hexdigest()[:18]
    request = Request(url, headers={"User-Agent": "DenINosht-Static-Image-Builder/1.0"})
    last_error = None
    for attempt in range(3):
        try:
            with urlopen(request, timeout=35) as result:
                data = result.read(15 * 1024 * 1024 + 1)
            if len(data) > 15 * 1024 * 1024:
                raise ValueError("Image exceeds maximum size")
            break
        except Exception as error:
            last_error = error
    else:
        raise RuntimeError(f"Cannot download {url}: {last_error}")
    with Image.open(BytesIO(data)) as original:
        original = ImageOps.exif_transpose(original)
        if getattr(original, "is_animated", False):
            original.seek(0)
        base = original.convert("RGBA" if "A" in original.getbands() or "transparency" in original.info else "RGB")
    sizes = {}
    output_bytes = 0
    for width in WIDTHS:
        target = base.copy()
        target.thumbnail((width, width), Image.Resampling.LANCZOS)
        name = f"{digest}-{width}.webp"
        filename = OUTPUT / name
        target.save(filename, "WEBP", quality=78, method=6, exact=True)
        size = filename.stat().st_size
        if size == 0:
            raise RuntimeError(f"Zero-size transformed image: {name}")
        output_bytes += size
        sizes[str(width)] = "/assets/catalog-thumbnails/" + name
    return (url, sizes, len(data), output_bytes)

def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    urls = images_in_sitemap()
    mapping = {}
    original_total = optimized_total = 0
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(fetch_one, url): url for url in urls}
        for future in as_completed(futures):
            url, sizes, original_size, optimized_size = future.result()
            mapping[url] = {"small": sizes["480"], "large": sizes["960"]}
            original_total += original_size
            optimized_total += optimized_size
    ordered = {k: mapping[k] for k in urls}
    MAP.write_text("/* Generated responsive images; real originals are untouched. */\nwindow.DENINOSHT_CATALOG_IMAGES = " + json.dumps(ordered, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    expected = {Path(x["small"]).name for x in ordered.values()} | {Path(x["large"]).name for x in ordered.values()}
    for old in OUTPUT.glob("*.webp"):
        if old.name not in expected:
            old.unlink()
    print(json.dumps({"images": len(urls), "variant_files": len(expected), "original_bytes": original_total, "preview_bytes": optimized_total, "ratio": round(optimized_total / original_total, 4)}, indent=2))
    assert len(ordered) == len(urls)
    assert len(list(OUTPUT.glob("*.webp"))) == len(expected)

if __name__ == "__main__":
    main()
