# 12 CÁI BẪY ĐÃ DÍNH THẬT — đọc trước khi mất một buổi

Toàn bộ ghi chép từ lần dựng đầu tiên (2026-08-09, máy Windows 10, PowerShell 5.1).
**Điểm chung của gần hết những bẫy này: hệ thống báo THÀNH CÔNG trong khi thực tế đã hỏng.**
Đó là loại lỗi đắt nhất, vì không có thông báo nào để mà đi tìm.

---

## Nhóm A — Bẫy làm MẤT LEAD trong im lặng

### 1. `form_endpoint` để trống → lead bay mất, popup vẫn cảm ơn
Template gốc: endpoint rỗng thì chỉ `console.warn` rồi **vẫn hiện popup "Cảm ơn anh/chị!"**.
Khách vui vẻ ra về, bạn tưởng chưa ai đăng ký.
**Chốt:** trước khi đổ traffic, luôn bắn thử một lead thật rồi **mở bảng ra nhìn tận mắt**.

### 2. `fetch().then(done)` — máy chủ trả 500 mà khách vẫn thấy "Cảm ơn"
`fetch` **chỉ** reject khi lỗi mạng. HTTP 4xx/5xx vẫn đi vào `.then()`.
Template gốc thiếu kiểm tra này → server chết mà giao diện báo thành công.
**Đã vá** trong `references/template.html`:
```js
.then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return done(); })
```
Nếu bạn tự viết form ở chỗ khác, **nhớ mang theo dòng này.**

### 3. `toast_names: []` KHÔNG tắt được toast
Mã gốc `cfg.get("toast_names") or DEFAULT_TOAST_NAMES` coi mảng rỗng là falsy →
**lặng lẽ nạp lại 14 tên bịa**. Đã vá: khai báo `[]` giờ tắt hẳn, và có thêm cờ `show_toast`.

---

## Nhóm B — Bẫy Cloudflare Pages

### 4. `wrangler pages domain` KHÔNG TỒN TẠI (bản 4.x)
Tài liệu cũ trên mạng vẫn hướng dẫn lệnh này. Nhóm `pages` chỉ có
`dev / functions / project / deployment / deploy / secret / download`.
**Gắn tên miền phải gọi API:**
```
POST https://api.cloudflare.com/client/v4/accounts/{acct}/pages/projects/{project}/domains
body: {"name":"ten.mien.cua.ban"}
```

### 5. Token của `wrangler login` KHÔNG có quyền sửa DNS
Nó có `zone (read)` nên liệt kê zone được, nhưng `GET /zones/{id}/dns_records` trả **403**.
Hệ quả: thêm tên miền **qua API** thì Cloudflare **không tự tạo CNAME** (qua bảng điều khiển thì có).
→ **Phải nhờ người dùng bấm tay đúng 1 bản ghi:**

| Ô | Điền |
|---|---|
| Type | `CNAME` |
| Name | chỉ phần con, **KHÔNG gõ đủ FQDN** (gõ đủ sẽ bị nối đuôi 2 lần) |
| Target | `<project>.pages.dev` |
| Proxy | **Proxied — đám mây CAM.** Để xám là Pages không nhận, SSL không cấp |

### 6. `functions/` đặt sai chỗ → wrangler IM LẶNG bỏ qua
Phải nằm ở **GỐC dự án, cạnh `site/`** — không phải trong `site/`.
Đặt sai: không lỗi, không cảnh báo, chỉ **thiếu dòng `✨ Compiled Worker successfully`**,
và `/api/lead` trả về `index.html` thay vì JSON.
```
du-an/
├── site/           <- file tĩnh (index.html, assets/)
└── functions/      <- Pages Functions, NGANG HÀNG với site/
    └── api/lead.js
```
Deploy: `npx wrangler pages deploy site --cwd "<gốc dự án>" --project-name <tên> --branch main --commit-dirty=true`

### 7. ⛔ `wrangler.toml` GIẾT mọi secret — bẫy tốn thời gian nhất
Pages project có `wrangler.toml` thì Cloudflare **bỏ qua sạch mọi biến/secret đặt phía dashboard**,
kể cả secret đặt bằng `wrangler pages secret put`. **Không một lời cảnh báo.**

Triệu chứng đánh lừa hoàn toàn:
- `wrangler pages secret list` → hiện rõ `LARK_APP_SECRET: Value Encrypted` ✔
- API dự án → `deployment_configs.production.env_vars` có biến ✔
- Bản deploy → đúng `env=production`, đúng branch `main` ✔
- **Mà `env.LARK_APP_SECRET` vẫn `undefined`** ✘

**Chữa:** xoá `wrangler.toml` → deploy lại → nhận secret ngay.

### 8. Tên file ảnh cố định → CDN phục vụ ảnh CŨ suốt 4 tiếng
Ảnh trong `assets/` có `cache-control: max-age=14400`. Tên không đổi thì đổi ảnh xong
deploy vẫn ra ảnh cũ — dễ tưởng build hỏng, mà khách cũng thấy ảnh cũ.
**Đã vá:** `build_ebook_leadpage.py` đặt tên theo mã băm nội dung (`hero-8a7aa620.webp`)
và tự dọn ảnh cũ. Đổi ảnh = đổi tên file = CDN buộc tải mới.
*Dò nhanh khi nghi cache: thêm `?v=123` vào URL rồi so dung lượng.*

### 9. `wrangler pages dev` tự lấy `compatibility_date` = HÔM NAY
Mới hơn `workerd` đi kèm → in `✨ Compiled Worker successfully` rồi **runtime chết ngay**:
*"requires compatibility date 2026-08-09, but the newest date supported is 2026-08-08"*.
Rất dễ tưởng mã sai vì thấy chữ "Compiled successfully" ở trên.
**Chữa:** `--compatibility-date=<hôm qua>`.
Dọn tiến trình: `kill` npx không giết node con → `Get-NetTCPConnection -LocalPort 8788` rồi `Stop-Process`.

---

## Nhóm C — Bẫy Windows / PowerShell (cắn cả người lẫn AI)

### 10. Ctrl+V trong cửa sổ cmd chèn ký tự vô hình `0x16`
Dán app_secret bằng **Ctrl+V** → Windows chèn ký tự điều khiển SYN vào đầu chuỗi.
Lark trả `10014 app secret invalid`. Người dùng thề đã dán đúng — **và đúng thật**.
**Dấu hiệu:** độ dài 33 thay vì 32.
**Cách dò:** tạm thêm endpoint in `length` + 3 ký tự đầu (đừng bao giờ in cả secret).
**Cách chữa:** lọc ký tự điều khiển ngay trong mã (`sachSecret()` trong `lead.js`) —
đừng bắt người dùng dán lại lần thứ ba. Và bảo họ dán bằng **chuột phải**, không Ctrl+V.

### 11. PowerShell nuốt dấu nháy kép khi truyền JSON cho lệnh ngoài
`lark-cli ... --json '{"a":"b"}'` → tới nơi thành `{a:b}` → *"invalid character 'H'"*.
**Chữa:** ghi JSON ra file rồi `--json "@./duong/dan/tuong-doi.json"`.
⚠️ lark-cli **chỉ nhận đường dẫn tương đối** trong thư mục hiện tại.

### 12. Ba cái bẫy mã hoá khác trên máy chạy CP1252
- **`Get-Content` đọc file UTF-8 thành `MIá»…N PHÃ`.** Dùng `[IO.File]::ReadAllText($p,[Text.Encoding]::UTF8)`.
- **Chuỗi tiếng Việt trong file `.ps1` không có BOM cũng vỡ.** Đừng truyền tham số tiếng Việt
  vào script `.ps1`; sửa thẳng trong file HTML/JSON bằng trình soạn thảo UTF-8.
- **`Out-File`/`Set-Content` ghi kèm BOM** → Python đọc JSON chết ở ký tự đầu.
  Đã vá bằng `encoding="utf-8-sig"` trong `build_ebook_leadpage.py`.
  Muốn ghi không BOM: `[IO.File]::WriteAllText($p,$s,(New-Object Text.UTF8Encoding($false)))`.

**Cộng thêm:** đừng bao giờ dùng `2>$null` sau `chrome.exe`/`python`/`node` trong PowerShell 5.1 —
nó bọc từng dòng stderr thành ErrorRecord rồi ném `NativeCommandError` **dù lệnh đã chạy xong**.
Nuốt lỗi bằng `try { ... } catch { }`.

---

## Nhóm D — Đạo đức & chuyển đổi

### 13. Đồng hồ đếm ngược trong template KHÔNG BAO GIỜ hết hạn
```js
if (t <= 0) { end = Date.now() + DUR; localStorage.setItem(KEY, end); t = DUR; }
```
Hết giờ là tự nạp lại 12 tiếng mới. Toast góc trái cũng là **14 tên bịa** kèm mốc
"X phút trước" do `Math.random()` sinh.

Với ebook **miễn phí**, câu hỏi "hết hạn thì mất gì?" không có câu trả lời. Và tệp
chủ doanh nghiệp chính là người đi thuê chạy ads — họ nhận ra trò này nhanh hơn người thường.
Mất niềm tin ở giây thứ 3 thì mọi câu chữ phía dưới thành vô nghĩa.

**Khuyến nghị:** `show_countdown: false`, `show_toast: false`.
Muốn giữ sức đẩy thì gắn đồng hồ vào **hạn chót có thật** và thay toast bằng **tên khách
thật đã xin phép**.

---

## Bảng nghiệm thu — chạy hết trước khi tiêu tiền quảng cáo

| # | Kiểm tra | Đạt khi |
|---|---|---|
| 1 | `curl -sI https://<tên-miền>/` | HTTP **200** |
| 2 | Ảnh hero trong `assets/` | HTTP **200**, đúng dung lượng bản mới |
| 3 | `http://` (không có s) | **301** về `https://` |
| 4 | `GET /api/lead?v=123` | JSON, `da_co_secret: true` |
| 5 | **POST một lead thật** | `{"ok":true,"record_id":"rec..."}` |
| 6 | **Mở bảng nhìn tận mắt** | Bản ghi có mặt → **xoá đi sau khi xem** |
| 7 | POST số điện thoại sai | **400**, không sinh bản ghi |
| 8 | POST có trường `website` (bẫy bot) | **200** nhưng **không** sinh bản ghi |
| 9 | Mở trang bằng trình duyệt, chụp ảnh | Bìa đúng bản mới, nút không đè chữ |
| 10 | Kiểm tra hộp thư khách | Nhận được thư, link ebook bấm được |

> ⚠️ **Mã trạng thái 200 không chứng minh trang chạy đúng.** Trang có JavaScript
> (nhúng sách lật, iframe) có thể trả 200 kèm đúng `<title>` mà nội dung bên trong là
> trang báo lỗi. **Nghiệm thu loại này phải chụp ảnh bằng Chrome headless**, đừng tin `curl`.
