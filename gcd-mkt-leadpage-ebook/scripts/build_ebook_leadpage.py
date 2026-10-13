#!/usr/bin/env python3
"""
build_ebook_leadpage.py — Bìa mockup + vấn đề → leadpage ebook Y HỆT 100% design chuẩn
(hero mockup + nút TẢI NGAY đè ảnh → headline đỏ → card nỗi đau sao đỏ → ribbon →
countdown 4 vòng tròn đỏ → form → footer đen → hiệu ứng động + toast góc trái).

Chỉ stdlib. Idempotent: chạy lại cùng --out là ghi đè sạch.

Dùng:
  python3 build_ebook_leadpage.py --config config.json --out <thư-mục-đích>

Config: xem references/config.example.json. Bắt buộc: slug, title, mockup_image,
audience_headline, pains (mảng chuỗi, cho phép <b>…</b>).
"""
import argparse
import hashlib
import html
import json
import shutil
import sys
from pathlib import Path

# Cửa sổ lệnh Windows mặc định cp1252 → in chữ tiếng Việt/ký tự "→" là sập. Ép UTF-8.
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

TEMPLATE = Path(__file__).resolve().parent.parent / "references" / "template.html"

STAR_SVG = ('<svg class="st" viewBox="0 0 24 24" width="22" height="22">'
            '<path fill="none" stroke="#e02020" stroke-width="1.6" d="M12 2.5l2.1 1.8 2.7-.5.9 2.6 '
            '2.6.9-.5 2.7 1.8 2.1-1.8 2.1.5 2.7-2.6.9-.9 2.6-2.7-.5-2.1 1.8-2.1-1.8-2.7.5-.9-2.6'
            '-2.6-.9.5-2.7L2.4 12l1.8-2.1-.5-2.7 2.6-.9.9-2.6 2.7.5z"/>'
            '<path fill="#e02020" d="M12 7.2l1.2 2.4 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z"/></svg>')

FOOTER_ICONS = {
    "address": '<svg viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z"/></svg>',
    "hotline": ('<svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 '
                '1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 '
                '1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>'),
    "email": ('<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 '
              '2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>'),
}

# Danh sách MẪU MÔ PHỎNG cho toast social proof — đổi qua "toast_names" trong config
DEFAULT_TOAST_NAMES = [
    ["Chị Thu Hằng", "Hà Nội"], ["Anh Minh Tuấn", "TP. HCM"], ["Chị Ngọc Lan", "Đà Nẵng"],
    ["Anh Quốc Bảo", "Cần Thơ"], ["Chị Mai Phương", "Hải Phòng"], ["Anh Đức Anh", "Nghệ An"],
    ["Chị Bích Ngọc", "Huế"], ["Anh Văn Nam", "Bình Dương"], ["Chị Thanh Thảo", "Đồng Nai"],
    ["Anh Hoàng Long", "Thanh Hóa"], ["Chị Kim Chi", "Quảng Ninh"], ["Anh Tiến Dũng", "Vũng Tàu"],
    ["Chị Hồng Nhung", "Nam Định"], ["Anh Gia Huy", "Đắk Lắk"],
]


def esc(v):
    return html.escape(str(v), quote=True)


def build(cfg_path: Path, out_dir: Path) -> Path:
    # utf-8-sig: nuốt luôn BOM do PowerShell Windows sinh ra khi ghi config.json
    cfg = json.loads(cfg_path.read_text(encoding="utf-8-sig"))
    for k in ("slug", "title", "mockup_image", "audience_headline", "pains"):
        if not cfg.get(k):
            sys.exit(f"Lỗi: config thiếu trường bắt buộc '{k}'.")
    if not str(cfg.get("brand_name", "")).strip():
        sys.exit("Lỗi: config thiếu 'brand_name' — HỎI người dùng tên thương hiệu/tên của họ "
                 "(hiện ở footer) rồi điền vào config. Không dùng tên mẫu.")
    tpl = TEMPLATE.read_text(encoding="utf-8")

    out_dir.mkdir(parents=True, exist_ok=True)
    assets = out_dir / "assets"
    assets.mkdir(exist_ok=True)

    # --- Ảnh mockup: GIỮ NGUYÊN 100%, chỉ copy ---
    # Tên file mang MÃ BĂM nội dung (hero-<8 ký tự>.png). Đổi ảnh là đổi tên file,
    # nên CDN buộc phải tải bản mới. Trước đây tên cố định "hero-0" khiến Cloudflare
    # phục vụ ảnh CŨ tới 4 tiếng sau khi deploy (cache-control max-age=14400) —
    # đã cắn thật 2 lần ngày 2026-08-09: deploy xong mở trang vẫn thấy ảnh cũ,
    # tưởng build hỏng trong khi máy chủ đã có ảnh đúng.
    src = Path(cfg["mockup_image"]).expanduser()
    if not src.exists():
        sys.exit(f"Lỗi: không thấy ảnh mockup: {src}")
    du_lieu = src.read_bytes()
    ma_bam = hashlib.sha1(du_lieu).hexdigest()[:8]
    for cu in assets.glob("hero-*"):          # dọn ảnh hero của lần dựng trước
        cu.unlink()
    hero_dest = assets / (f"hero-{ma_bam}" + src.suffix.lower())
    shutil.copy(src, hero_dest)
    hero_rel = f"assets/{hero_dest.name}"

    # --- Favicon: có thì copy, không thì dùng luôn ảnh mockup ---
    fav_rel = hero_rel
    fav = str(cfg.get("favicon", "")).strip()
    if fav:
        fp = Path(fav).expanduser()
        if fp.exists():
            fav_dest = assets / ("favicon" + fp.suffix.lower())
            shutil.copy(fp, fav_dest)
            fav_rel = f"assets/{fav_dest.name}"

    # --- Card nỗi đau (pains là HTML nhẹ: cho phép <b>) ---
    pain_items = "\n".join(
        f'    <div class="pain">\n      {STAR_SVG}\n      <p>{p}</p>\n    </div>'
        for p in cfg["pains"]
    )

    # --- Footer: chỉ render dòng có dữ liệu ---
    rows = []
    contact = cfg.get("contact", {})
    for key, label in (("address", ""), ("hotline", "Hotline: "), ("email", "Email: ")):
        val = str(contact.get(key, "")).strip()
        if val:
            rows.append(f'    <div class="contact">\n      {FOOTER_ICONS[key]}\n'
                        f'      <p>{label}{esc(val)}</p>\n    </div>')
    footer_rows = "\n".join(rows)

    # --- Tracking head: FB Pixel (nhiều id) + GA4 + TikTok ---
    head = []
    fb_ids = [x.strip() for x in str(cfg.get("fb_pixel", "")).split(",") if x.strip()]
    if fb_ids:
        inits = "".join(f"fbq('init','{i}');" for i in fb_ids)
        head.append(
            "<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?"
            "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;"
            "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;"
            "t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,"
            "document,'script','https://connect.facebook.net/en_US/fbevents.js');"
            f"{inits}fbq('track','PageView');</script>"
        )
    ga = str(cfg.get("ga4", "")).strip()
    if ga:
        head.append(
            f'<script async src="https://www.googletagmanager.com/gtag/js?id={ga}"></script>'
            "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}"
            f"gtag('js',new Date());gtag('config','{ga}');</script>"
        )
    tt = str(cfg.get("tiktok_pixel", "")).strip()
    if tt:
        head.append(
            "<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];"
            "ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];"
            "ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};"
            "for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);"
            "ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js';"
            "ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,"
            "ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement('script');"
            "o.type='text/javascript',o.async=!0,o.src=i+'?sdkid='+e+'&lib='+t;"
            "var a=document.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};"
            f"ttq.load('{tt}');ttq.page();}}(window,document,'ttq');</script>"
        )

    # --- Cờ bật/tắt khối khan hiếm. Mặc định True = giữ nguyên design gốc ---
    # toast_names KHÔNG khai báo  → dùng 14 tên mẫu mô phỏng (như cũ)
    # toast_names khai báo là []  → TẮT hẳn toast (trước đây âm thầm nạp lại tên mẫu)
    raw_names = cfg.get("toast_names")
    names = DEFAULT_TOAST_NAMES if raw_names is None else raw_names
    show_cd = bool(cfg.get("show_countdown", True))
    show_toast = bool(cfg.get("show_toast", True)) and bool(names)

    opt_css = []
    if not show_cd:
        opt_css.append(".cd{display:none}")
    if not show_toast:
        opt_css.append(".toast{display:none !important}")

    popup = cfg.get("popup", {})
    slots = {
        "TITLE": esc(cfg["title"]),
        "DESCRIPTION": esc(cfg.get("description", cfg["title"])),
        "OG_IMAGE": esc(cfg.get("og_image", hero_rel)),
        "FAVICON": esc(fav_rel),
        "TRACKING_HEAD": "\n".join(head),
        "HERO_IMG": esc(hero_rel),
        "FLOAT_CTA": esc(cfg.get("float_cta", "TẢI NGAY")),
        "AUDIENCE_HEADLINE": cfg["audience_headline"],
        "PAIN_ITEMS": pain_items,
        "HELPER_TEXT": esc(cfg.get("helper_text", "EBOOK NÀY SẼ GIÚP BẠN")),
        "RIBBON_TEXT": esc(cfg.get("ribbon_text", "QUÀ TẶNG ĐẶC BIỆT")),
        "GIFT_TEXT": esc(cfg.get("gift_text", "TÔI TẶNG BẠN EBOOK")),
        "COUNTDOWN_MINUTES": str(int(cfg.get("countdown_minutes", 720))),
        "PH_NAME": esc(cfg.get("placeholders", {}).get("name", "Họ và tên")),
        "PH_PHONE": esc(cfg.get("placeholders", {}).get("phone", "Số điện thoại")),
        "PH_EMAIL": esc(cfg.get("placeholders", {}).get("email", "Email")),
        "BUTTON_TEXT": esc(cfg.get("button_text", "NHẬN EBOOK MIỄN PHÍ")),
        "BRAND_NAME": esc(cfg["brand_name"]),
        "FOOTER_ROWS": footer_rows,
        "CTA1_TEXT": esc(cfg.get("cta_bar", {}).get("button1", "TẢI EBOOK")),
        "CTA2_TEXT": esc(cfg.get("cta_bar", {}).get("button2", "TẢI NGAY")),
        "POPUP_TITLE": esc(popup.get("title", "Cảm ơn anh/chị!")),
        "POPUP_MESSAGE": esc(popup.get("message",
            "Thông tin đã được ghi nhận. Vui lòng để ý Zalo/điện thoại và email — ebook sẽ được gửi tới anh/chị trong ít phút.")),
        "POPUP_BUTTON": esc(popup.get("button", "Đóng")),
        "FORM_ENDPOINT": esc(cfg.get("form_endpoint", "")),
        "SUCCESS_REDIRECT": esc(cfg.get("success_redirect", "")),
        "PAGE_SLUG": esc(cfg["slug"]),
        "CONVERSION_VALUE": str(int(cfg.get("conversion_value", 10000))),
        "TOAST_NAMES_JSON": json.dumps(names or [], ensure_ascii=False),
        "TOAST_VERB": cfg.get("toast_verb", "vừa đăng ký nhận ebook"),
        "OPT_CSS": "\n".join(opt_css),
        "SHOW_COUNTDOWN": "true" if show_cd else "false",
        "SHOW_TOAST": "true" if show_toast else "false",
    }
    for k, v in slots.items():
        tpl = tpl.replace("{{" + k + "}}", v)

    if "{{" in tpl:
        leftover = sorted({tpl[i:tpl.index("}}", i) + 2] for i in
                           [j for j in range(len(tpl)) if tpl.startswith("{{", j)]})
        sys.exit(f"Lỗi: còn slot chưa thay: {leftover}")

    out = out_dir / "index.html"
    out.write_text(tpl, encoding="utf-8")
    print(f"OK → {out}")
    print(f"   Ảnh mockup (giữ nguyên 100%): {hero_dest}")
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    build(Path(a.config), Path(a.out))
