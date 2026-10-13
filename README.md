# Skill Leadpage Ebook — bìa mockup + nỗi đau → trang thu lead hoàn chỉnh

Skill cho **Claude Code**, bàn giao cho học viên từ **Gia Cát Duẩn — Quân sư của doanh nghiệp 1 người**.

Đưa 1 ảnh bìa ebook (mockup) + danh sách vấn đề của khách hàng
→ AI dựng **leadpage thu lead theo design đã chạy quảng cáo có chuyển đổi thật**
→ đưa lên Cloudflare Pages với tên miền riêng → lead chảy vào bảng Lark → thư tự gửi ebook cho khách.

Trang gồm: hero bìa ebook full-width + nút TẢI NGAY → headline gọi đúng đối tượng → card nỗi đau
→ ribbon quà tặng → form Tên/SĐT/Email có validate số điện thoại Việt Nam + chống bot → footer
thương hiệu **CỦA BẠN** → hiệu ứng động (nút đập nhịp, vệt sáng, khối hiện dần khi cuộn).

Thứ đáng giá nhất trong gói không phải mã nguồn, mà là **12 cái bẫy đã dính thật** — những lỗi máy
báo *thành công* trong khi thực tế đã hỏng. Lần dựng đầu mất gần một ngày vì mấy cái đó. Có sẵn
ghi chép này thì bạn làm trong **20 phút**.

## Yêu cầu

| Thứ cần có | Bắt buộc? | Ghi chú |
|---|---|---|
| [Claude Code](https://claude.com/claude-code) | ✅ | CLI hoặc app đều được |
| Python 3 + Pillow | ✅ | `python -m pip install pillow` |
| Node + npx | ✅ | để chạy `wrangler` đưa trang lên Cloudflare |
| Google Chrome | ✅ | chụp ảnh xem thử trước khi đưa lên mạng |
| Tài khoản Cloudflare | ✅ | miễn phí — nơi đặt trang |
| Ảnh bìa ebook (mockup) | ✅ | PNG/JPG/WebP, skill giữ nguyên 100% không chỉnh ảnh |
| Một tên miền | ⬜ | chưa có vẫn chạy, dùng `<tên>.pages.dev` |
| Lark + Base | ⬜ | nơi lead đổ về. Không có thì dùng Google Sheets |
| Resend / Brevo | ⬜ | để tự gửi ebook. Không có thì gửi tay |

Các dòng ⬜ làm sau cũng được — **trang vẫn dựng và xem được ngay** khi chưa có.

## Cài đặt (1 phút)

Tải repo về (nút **Code → Download ZIP**, hoặc `git clone`), rồi chép thư mục
`gcd-mkt-leadpage-ebook/` vào thư mục skill của Claude Code:

**Windows (PowerShell)**
```powershell
Copy-Item -Recurse ".\gcd-mkt-leadpage-ebook" "$env:USERPROFILE\.claude\skills\"
```

**macOS / Linux**
```bash
# Skill dùng chung mọi dự án:
cp -R gcd-mkt-leadpage-ebook ~/.claude/skills/

# Hoặc chỉ cho 1 dự án:
cp -R gcd-mkt-leadpage-ebook <dự-án-của-bạn>/.claude/skills/
```

Mở Claude Code, gõ `/gcd-mkt-leadpage-ebook` hoặc nói *"làm leadpage cho ebook này"* kèm ảnh bìa.

## Cách dùng

1. Đưa Claude **ảnh bìa ebook** (đường dẫn file) + nói rõ ebook về chủ đề gì.
2. Claude sẽ **HỎI bạn thông tin thương hiệu** (bắt buộc, không tự bịa):
   - Tên thương hiệu / tên bạn (hiện ở footer)
   - Địa chỉ · Hotline · Email (bỏ trống mục nào không muốn hiện)
   - Chữ trên nút đăng ký + chữ ribbon (có mặc định sẵn, đổi được theo giọng của bạn)
3. Claude hỏi **trang này nói với ai** rồi viết draft headline + nỗi đau theo 5 luật viết chữ
   → **bạn duyệt**.
4. Build → xem `preview.png` → **bạn duyệt** → đưa lên Cloudflare → gắn tên miền → nhận link live.
5. Nối form vào Lark Base + thư tự động → bắn 1 lead thử → **mở bảng nhìn tận mắt** lead đã vào.

## Đọc theo thứ tự này

1. **`references/BAY-DA-DINH.md`** ← **đọc trước tiên, kể cả khi đang vội.**
   12 cái bẫy + bảng nghiệm thu 10 mục phải qua hết trước khi tiêu tiền quảng cáo.
2. `SKILL.md` — bộ khung 9 bước Claude làm theo.
3. `references/cong-thuc-copy.md` — 5 luật viết chữ. **Đây mới là thứ quyết định tỉ lệ điền
   form**, không phải màu nút.
4. `references/SOP-trien-khai.md` — lệnh cụ thể, copy-paste chạy được.
5. `references/thu-mau.md` — lá thư tự động gửi ebook, kèm bộ khung 7 khối.

## Lưu ý quan trọng trước khi chạy quảng cáo

- **`form_endpoint` để trống thì lead KHÔNG được lưu** — trang vẫn hiện popup *"Cảm ơn anh/chị!"*
  mà không báo lỗi gì. Nối endpoint (Lark Base qua `scripts/lead.js`, Google Sheets Apps Script,
  CRM webhook…) và bắn thử 1 lead trước khi đổ traffic.
- **Đồng hồ đếm ngược và thông báo "chị A vừa đăng ký" mặc định TẮT.** Đồng hồ gốc về 0 là tự nạp
  lại, danh sách tên là tên mẫu — với khách là chủ doanh nghiệp, họ nhận ra rất nhanh và mất niềm
  tin. Muốn bật: `show_countdown: true`, `show_toast: true` trong config — nên gắn với **hạn chót
  có thật** và **tên khách thật đã xin phép**.
- Điền pixel (Facebook / GA4 / TikTok) vào config để đo chuyển đổi.
- **Đừng tạo file `wrangler.toml`** — có nó là Cloudflare bỏ qua mọi secret đặt trên dashboard
  (chi tiết ở `BAY-DA-DINH.md`).

## Cấu trúc

```
gcd-mkt-leadpage-ebook/
├── SKILL.md                         # Quy trình AI làm theo (hỏi → copy → build → duyệt → deploy → nối lead)
├── scripts/
│   ├── build_ebook_leadpage.py      # Compiler: config.json → site/index.html (chỉ thư viện chuẩn)
│   ├── lead.js                      # Pages Function: nhận lead → ghi Lark Base → gửi email (tìm chữ "ĐỔI:")
│   ├── render-bia-hero.ps1          # Ảnh bìa → nới đáy cho nút CTA → nén WebP
│   └── xoa-nen-bia.py               # Tách nền cuốn sách ra PNG trong suốt
└── references/
    ├── BAY-DA-DINH.md               # 12 bẫy + bảng nghiệm thu 10 mục — ĐỌC ĐẦU TIÊN
    ├── SOP-trien-khai.md            # Toàn bộ lệnh, copy-paste chạy được
    ├── cong-thuc-copy.md            # 5 luật viết chữ + ràng buộc đạo đức
    ├── bo-cau-hoi.md                # Bộ câu hỏi Claude hỏi bạn trước khi dựng
    ├── thu-mau.md                   # Thư tự động gửi ebook
    ├── template.html                # Design khóa cứng — sửa file này là mọi trang sau đổi theo
    └── config.example.json          # Mẫu config đủ mọi trường, kèm ghi chú
```

## Ghi công

Thiết kế trang nhân bản từ một leadpage đã chạy quảng cáo có chuyển đổi thật, gốc từ skill
`hmh-mkt-leadpage-ebook` trong hệ AIOS của Hoàng Minh Hóa.

Phần mở rộng — viết chữ theo hồ sơ khách hàng, dựng bìa, đưa lên Cloudflare, gắn tên miền, nối
Lark Base, gửi thư tự động và toàn bộ tập ghi chép bẫy — do **Gia Cát Duẩn** dựng và kiểm chứng thật.

---

Bàn giao từ **Gia Cát Duẩn** cho học viên. Dùng tự do cho dự án của bạn.
