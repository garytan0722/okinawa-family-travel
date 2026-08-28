#!/usr/bin/env python3
from pathlib import Path
import re

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
    assert re.search(r"10/02\s+09:00", text), f"{path.name}: missing fixed snorkeling time"
    assert "Pink Mermaid Okinawa 浮潛（固定）" in text, f"{path.name}: missing fixed snorkeling activity"
    assert "https://www.instagram.com/pinkmermaid_okinawa/" in text, f"{path.name}: missing snorkeling source"
    assert "班機時間" in text, f"{path.name}: missing flight summary"
    assert "班號未提供" in text, f"{path.name}: missing unknown-flight disclosure"
    assert "華航 CI120" in text, f"{path.name}: missing corrected September 24 flight"
    assert "星宇航空 JX871" in text, f"{path.name}: missing corrected October 4 flight"
    assert "抵達時間未提供" in text, f"{path.name}: missing unknown-arrival disclosure"
    assert "BR185" not in text and "20:20" not in text, f"{path.name}: contains superseded October 4 flight"
    assert "TPE → OKA" in text and "OKA → TPE T2" in text, f"{path.name}: missing confirmed routes"
    assert "0120-34-3732" in text, f"{path.name}: missing OTS daytime contact"
    assert "19:01–07:59" in text, f"{path.name}: missing OTS after-hours window"
    assert "事故・故障時の連絡先" in text, f"{path.name}: missing in-vehicle sticker guidance"
    assert "事故不分大小先撥 110" in text, f"{path.name}: police report must be mandatory"
    assert "傷病或火災再撥 119" in text, f"{path.name}: 119 must remain conditional"
    for required in ("部瀨名", "名護鳳梨園", "古宇利", "沖繩兒童王國", "琉球村", "萬座毛"):
        assert required in text, f"{path.name}: missing early-plan place {required}"
    if variant in ("A", "B"):
        assert "Neo Park Okinawa" in text, f"{path.name}: missing active-plan Neo Park"
        assert "東南植物樂園" in text, f"{path.name}: missing active-plan botanical garden"
    early_text = "\n".join((page.extract_text() or "") for page in reader.pages if re.search(r"2026-09-2[4-9]", page.extract_text() or ""))
    for forbidden in ("美麗海", "美國村", "BANTA", "港川", "普天滿", "Rycom", "首里城", "沖繩世界", "DMM", "瀨長島", "波上宮", "PARCO", "國際通"):
        assert forbidden not in early_text, f"{path.name}: early segment repeats late attraction {forbidden}"
    assert "成人藍洞" not in text, f"{path.name}: contains superseded October 2 plan"
    assert "那霸私人住宿" in text, f"{path.name}: missing generic accommodation label"
    assert "地址與入住資料請使用私人訂房訊息" in text, f"{path.name}: missing private navigation guidance"
    assert all(len((page.extract_text() or "").strip()) > 20 for page in reader.pages), f"{path.name}: blank page"
    print(f"verified {path.name}: {len(reader.pages)} pages, {path.stat().st_size} bytes")
