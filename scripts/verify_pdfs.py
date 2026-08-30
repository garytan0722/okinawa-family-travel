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
    assert "青潛 BEST DIVE OKINAWA 青洞浮潛（固定）" in text, f"{path.name}: missing fixed snorkeling activity"
    assert "09:00 活動／08:00 集合" in text, f"{path.name}: missing snorkeling meeting time"
    assert "青潛免費停車場《裝備區》" in text, f"{path.name}: missing snorkeling meeting place"
    assert "206 066 043*58" in text, f"{path.name}: missing snorkeling map code"
    assert "08:20 後到場" in text, f"{path.name}: missing snorkeling late-arrival warning"
    assert "https://www.bestdiveokinawa.com/meeting-point/" in text, f"{path.name}: missing snorkeling source"
    assert "Pink Mermaid" not in text, f"{path.name}: contains superseded snorkeling operator"
    assert "門票與活動費" in text, f"{path.name}: missing ticket ledger"
    assert "部瀨名海中公園" in text and "成人 ¥2,100" in text, f"{path.name}: missing Busena ticket price"
    assert "DMM Kariyushi水族館" in text and "成人 ¥2,800～¥3,200" in text, f"{path.name}: missing DMM ticket range"
    assert "やんばる森のおもちゃ美術館" in text and "成人（中學生以上）¥1,400" in text, f"{path.name}: missing toy museum plan or price"
    assert "釣って見つけるぼうけんの国 沖縄" in text and "成人（中學生以上）¥2,670" in text, f"{path.name}: missing adventure park plan or price"
    assert "AEON 名護購物、親子晚餐與補給" in text, f"{path.name}: missing AEON Nago dining stop"
    assert "順路親子餐廳" in text, f"{path.name}: missing route-aware dining guide"
    assert "和風亭 大湾シティ店" in text and "大阪王将 大湾シティ店" in text, f"{path.name}: missing Owan City restaurant choices"
    assert "不繞路理由" in text, f"{path.name}: missing dining route rationale"
    assert "今歸仁" not in text and "今帰仁" not in text, f"{path.name}: contains replaced Nakijin stop"
    assert "班機時間" in text, f"{path.name}: missing flight summary"
    assert "班號未提供" not in text, f"{path.name}: contains removed October 3 flight placeholder"
    assert "華航 CI120" in text, f"{path.name}: missing corrected September 24 flight"
    assert "星宇航空 JX871" in text, f"{path.name}: missing corrected October 4 flight"
    assert "譚家" in text and "曾蘿情侶" in text, f"{path.name}: missing corrected group labels"
    assert "曾羅佳" not in text, f"{path.name}: contains superseded traveler-label typo"
    assert "10/03 15:50" not in text, f"{path.name}: contains removed October 3 departure"
    assert "送一家四口到" not in text and "機場分流" not in text, f"{path.name}: contains stale October 3 split"
    assert "六人" in text, f"{path.name}: October 3 must keep the six travelers together"
    assert "抵達時間未提供" in text, f"{path.name}: missing unknown-arrival disclosure"
    assert "BR185" not in text and "20:20" not in text, f"{path.name}: contains superseded October 4 flight"
    assert "TPE → OKA" in text and "OKA → TPE T2" in text, f"{path.name}: missing confirmed routes"
    assert "0120-34-3732" in text, f"{path.name}: missing OTS daytime contact"
    assert "19:01–07:59" in text, f"{path.name}: missing OTS after-hours window"
    assert "事故・故障時の連絡先" in text, f"{path.name}: missing in-vehicle sticker guidance"
    assert "事故不分大小先撥 110" in text, f"{path.name}: police report must be mandatory"
    assert "傷病或火災再撥 119" in text, f"{path.name}: 119 must remain conditional"
    for required in ("部瀨名", "名護鳳梨園", "古宇利", "やんばる森のおもちゃ美術館", "釣って見つけるぼうけんの国", "琉球村", "萬座毛"):
        assert required in text, f"{path.name}: missing early-plan place {required}"
    if variant in ("A", "B"):
        assert "Neo Park Okinawa" in text, f"{path.name}: missing active-plan Neo Park"
        assert "沖繩兒童王國" in text, f"{path.name}: missing active-plan children zoo"
    early_text = "\n".join((page.extract_text() or "") for page in reader.pages if re.search(r"2026-09-2[4-9]", page.extract_text() or ""))
    for forbidden in ("美麗海", "美國村", "BANTA", "港川", "普天滿", "Rycom", "首里城", "沖繩世界", "DMM", "瀨長島", "波上宮", "PARCO", "國際通"):
        assert forbidden not in early_text, f"{path.name}: early segment repeats late attraction {forbidden}"
    assert "成人藍洞" not in text, f"{path.name}: contains superseded October 2 plan"
    assert "那霸私人住宿" in text, f"{path.name}: missing generic accommodation label"
    assert "地址與入住資料請使用私人訂房訊息" in text, f"{path.name}: missing private navigation guidance"
    assert all(len((page.extract_text() or "").strip()) > 20 for page in reader.pages), f"{path.name}: blank page"
    print(f"verified {path.name}: {len(reader.pages)} pages, {path.stat().st_size} bytes")
