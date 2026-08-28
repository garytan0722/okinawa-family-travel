#!/usr/bin/env python3
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf"
PAGE_W, PAGE_H = A4
INK = colors.HexColor("#123B4A")
SEA = colors.HexColor("#1D91A8")
ROAD = colors.HexColor("#E7773C")
IVORY = colors.HexColor("#FFF9EE")
FOAM = colors.HexColor("#DDF3EE")
PINK = colors.HexColor("#F4B7A6")
MUTED = colors.HexColor("#61757C")
FONT = "OkinawaUnicode"
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"

OUTPUT_NAMES = {
    "A": "okinawa-family-trip-A-balanced.pdf",
    "B": "okinawa-family-trip-B-active.pdf",
    "C": "okinawa-family-trip-C-relaxed.pdf",
}


def register_fonts():
    pdfmetrics.registerFont(TTFont(FONT, FONT_PATH))


def text_width(text, size):
    return pdfmetrics.stringWidth(str(text), FONT, size)


def wrap(text, size, width):
    text = str(text or "")
    lines, current = [], ""
    for char in text:
        candidate = current + char
        if char == "\n" or (current and text_width(candidate, size) > width):
            lines.append(current)
            current = "" if char == "\n" else char
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines or [""]


def draw_lines(pdf, text, x, y, size, width, color=INK, leading=None, max_lines=None):
    leading = leading or size * 1.45
    lines = wrap(text, size, width)
    if max_lines:
        lines = lines[:max_lines]
    pdf.setFillColor(color)
    pdf.setFont(FONT, size)
    for line in lines:
        pdf.drawString(x, y, line)
        y -= leading
    return y


def footer(pdf, variant_id, page_number):
    pdf.setStrokeColor(colors.Color(0.07, 0.23, 0.29, alpha=0.18))
    pdf.line(42, 31, PAGE_W - 42, 31)
    pdf.setFont(FONT, 7.5)
    pdf.setFillColor(MUTED)
    pdf.drawString(42, 18, f"沖繩遛小孩 · {variant_id}版 · 2026")
    pdf.drawRightString(PAGE_W - 42, 18, f"{page_number:02d}")


def page_header(pdf, label, title, variant_id, page_number):
    pdf.setFillColor(IVORY)
    pdf.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    pdf.setFillColor(ROAD)
    pdf.setFont(FONT, 8)
    pdf.drawString(42, PAGE_H - 42, label)
    pdf.setFillColor(INK)
    pdf.setFont(FONT, 22)
    pdf.drawString(42, PAGE_H - 72, title)
    footer(pdf, variant_id, page_number)


def cover(pdf, trip, variant_id, variant, page_number):
    pdf.setFillColor(INK)
    pdf.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    pdf.setFillColor(colors.Color(1, 1, 1, alpha=0.07))
    pdf.circle(PAGE_W + 12, PAGE_H - 90, 176, stroke=0, fill=1)
    pdf.setFillColor(PINK)
    pdf.circle(PAGE_W - 96, PAGE_H - 104, 36, stroke=0, fill=1)
    pdf.setFillColor(ROAD)
    pdf.setFont(FONT, 9)
    pdf.drawString(48, PAGE_H - 74, "OKINAWA · FAMILY ROAD BOOK")
    pdf.setFillColor(IVORY)
    pdf.setFont(FONT, 42)
    pdf.drawString(48, PAGE_H - 160, "沖繩遛小孩")
    pdf.setFillColor(PINK)
    pdf.setFont(FONT, 25)
    pdf.drawString(48, PAGE_H - 205, "孩子的速度，海島的路。")
    pdf.setFillColor(colors.Color(1, 1, 1, alpha=0.74))
    pdf.setFont(FONT, 11)
    pdf.drawString(48, PAGE_H - 254, "2026.09.24 — 10.04  ·  親子自駕 11 天")

    pdf.setFillColor(variant["color"])
    pdf.roundRect(48, PAGE_H - 385, PAGE_W - 96, 86, 12, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont(FONT, 28)
    pdf.drawString(68, PAGE_H - 337, f"{variant_id}  {variant['name']}")
    pdf.setFont(FONT, 11)
    pdf.drawString(68, PAGE_H - 365, variant["tagline"])

    facts = [("9/24", "一家四口抵達"), ("9/30", "四大兩小會合／換車"), ("10/4", "還車與晚班機")]
    y = PAGE_H - 470
    for date, detail in facts:
        pdf.setFillColor(ROAD)
        pdf.setFont(FONT, 16)
        pdf.drawString(54, y, date)
        pdf.setFillColor(IVORY)
        pdf.setFont(FONT, 11)
        pdf.drawString(126, y + 1, detail)
        y -= 46
    pdf.setFillColor(colors.Color(1, 1, 1, alpha=0.6))
    pdf.setFont(FONT, 8)
    pdf.drawString(48, 38, "公開分享版未放入私人住宿的名稱、地址、門鎖與入住憑證。")
    pdf.showPage()


def logistics_page(pdf, trip, variant_id, page_number):
    page_header(pdf, "FIXED LOGISTICS", "不能移動的時間", variant_id, page_number)
    y = PAGE_H - 112
    for event in trip["fixedEvents"]:
        pdf.setFillColor(FOAM)
        pdf.roundRect(42, y - 49, PAGE_W - 84, 58, 9, stroke=0, fill=1)
        pdf.setFillColor(ROAD)
        pdf.setFont(FONT, 10)
        pdf.drawString(54, y - 11, f"{event['date'][5:].replace('-', '/')}  {event['time']}{'–' + event['end'] if event.get('end') else ''}")
        pdf.setFillColor(INK)
        pdf.setFont(FONT, 12)
        pdf.drawString(166, y - 11, event["title"])
        pdf.setFont(FONT, 8.5)
        pdf.setFillColor(MUTED)
        pdf.drawString(166, y - 31, event["place"])
        y -= 68
    pdf.setFillColor(INK)
    pdf.setFont(FONT, 10)
    pdf.drawString(42, 118, "住宿")
    pdf.setFillColor(MUTED)
    pdf.setFont(FONT, 8.5)
    pdf.drawString(42, 98, "9/24–9/29  沖繩嘉利吉海灘海洋溫泉度假村")
    pdf.drawString(42, 81, "9/30–10/4  那霸私人住宿（地址與入住資料請使用私人訂房訊息）")
    pdf.showPage()


def day_page(pdf, day, trip, variant_id, day_index, page_number):
    page_header(pdf, f"DAY {day_index:02d}  ·  {day['date']}", day["title"], variant_id, page_number)
    y = PAGE_H - 108
    pdf.setFillColor(SEA)
    pdf.setFont(FONT, 9)
    pdf.drawString(42, y, day["area"])
    pdf.setFillColor(MUTED)
    pdf.drawRightString(PAGE_W - 42, y, day["drive"])
    y -= 32

    for event in day["events"]:
        note_lines = wrap(event.get("note", ""), 8.2, PAGE_W - 196)[:2]
        card_h = 68 + max(0, len(note_lines) - 1) * 12
        pdf.setFillColor(colors.white)
        pdf.roundRect(88, y - card_h + 8, PAGE_W - 130, card_h, 11, stroke=0, fill=1)
        pdf.setStrokeColor(colors.Color(0.07, 0.23, 0.29, alpha=0.15))
        pdf.roundRect(88, y - card_h + 8, PAGE_W - 130, card_h, 11, stroke=1, fill=0)
        pdf.setFillColor(ROAD)
        pdf.circle(57, y - 9, 5, stroke=0, fill=1)
        pdf.setFont(FONT, 9.5)
        pdf.drawString(42, y - 31, event["time"])
        pdf.setFillColor(MUTED)
        pdf.setFont(FONT, 7)
        pdf.drawString(104, y - 9, event["type"].upper())
        pdf.setFillColor(INK)
        pdf.setFont(FONT, 12)
        pdf.drawString(104, y - 29, event["title"])
        pdf.setFillColor(SEA)
        pdf.setFont(FONT, 8.5)
        pdf.drawString(104, y - 45, event["place"])
        if note_lines:
            draw_lines(pdf, event.get("note", ""), 104, y - 59, 8.2, PAGE_W - 196, MUTED, 11.5, 2)
        pdf.setStrokeColor(colors.Color(0.91, 0.47, 0.24, alpha=0.45))
        pdf.line(57, y - 16, 57, y - card_h - 4)
        y -= card_h + 13

    rain_y = max(79, y - 5)
    pdf.setFillColor(FOAM)
    pdf.roundRect(42, rain_y - 52, PAGE_W - 84, 54, 10, stroke=0, fill=1)
    pdf.setFillColor(SEA)
    pdf.setFont(FONT, 8.5)
    pdf.drawString(54, rain_y - 16, "雨天／疲累備案")
    draw_lines(pdf, day["rainPlan"], 54, rain_y - 34, 8.3, PAGE_W - 108, INK, 11, 2)
    pdf.showPage()


def sources_pages(pdf, trip, variant_id, page_number):
    chunks = [trip["sources"][i:i + 8] for i in range(0, len(trip["sources"]), 8)]
    for index, chunk in enumerate(chunks):
        title = "官方資料與行前複核" if index == 0 else "官方資料（續）"
        page_header(pdf, "SOURCE LEDGER", title, variant_id, page_number + index)
        y = PAGE_H - 115
        if index == 0:
            pdf.setFillColor(MUTED)
            pdf.setFont(FONT, 9)
            pdf.drawString(42, y, f"請在 {trip['recheckBy']} 再確認營業時間、海況與臨時休館。")
            y -= 30
        for source in chunk:
            pdf.setFillColor(colors.white)
            pdf.roundRect(42, y - 57, PAGE_W - 84, 62, 9, stroke=0, fill=1)
            pdf.setFillColor(INK)
            pdf.setFont(FONT, 10)
            pdf.drawString(54, y - 17, source["label"])
            pdf.setFillColor(SEA)
            pdf.setFont(FONT, 7)
            url = source["url"]
            shown = url if len(url) < 74 else url[:71] + "…"
            pdf.drawString(54, y - 35, shown)
            pdf.setFillColor(MUTED)
            pdf.drawRightString(PAGE_W - 54, y - 50, f"查核 {source['checkedAt']}")
            y -= 76
        pdf.showPage()
    return len(chunks)


def generate(trip, variant_id):
    output = OUTPUT / OUTPUT_NAMES[variant_id]
    pdf = canvas.Canvas(str(output), pagesize=A4, pageCompression=1)
    pdf.setTitle(f"沖繩遛小孩｜{variant_id} {trip['variants'][variant_id]['name']}")
    page = 1
    cover(pdf, trip, variant_id, trip["variants"][variant_id], page)
    page += 1
    logistics_page(pdf, trip, variant_id, page)
    page += 1
    for index, day in enumerate(trip["days"][variant_id], start=1):
        day_page(pdf, day, trip, variant_id, index, page)
        page += 1
    page += sources_pages(pdf, trip, variant_id, page)
    pdf.save()
    return output


def main():
    register_fonts()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    trip = json.loads((ROOT / "content" / "trip.json").read_text(encoding="utf-8"))
    for variant_id in ("A", "B", "C"):
        path = generate(trip, variant_id)
        print(path)


if __name__ == "__main__":
    main()
