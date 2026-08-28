#!/usr/bin/env python3
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDFS = {
    "A": ROOT / "output/pdf/okinawa-family-trip-A-balanced.pdf",
    "B": ROOT / "output/pdf/okinawa-family-trip-B-active.pdf",
    "C": ROOT / "output/pdf/okinawa-family-trip-C-relaxed.pdf",
}
for variant, path in PDFS.items():
    reader = PdfReader(path)
    assert len(reader.pages) >= 14, f"{path.name}: expected at least 14 pages"
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    assert f"{variant}版" in text, f"{path.name}: missing variant footer"
    for date in ("2026-09-24", "2026-09-30", "2026-10-03", "2026-10-04"):
        assert date in text, f"{path.name}: missing {date}"
    assert "那霸私人住宿" in text, f"{path.name}: missing generic accommodation label"
    assert "地址與入住資料請使用私人訂房訊息" in text, f"{path.name}: missing private navigation guidance"
    assert all(len((page.extract_text() or "").strip()) > 20 for page in reader.pages), f"{path.name}: blank page"
    print(f"verified {path.name}: {len(reader.pages)} pages, {path.stat().st_size} bytes")
