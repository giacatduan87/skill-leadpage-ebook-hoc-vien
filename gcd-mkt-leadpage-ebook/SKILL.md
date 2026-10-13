---
name: gcd-mkt-leadpage-ebook
description: >
  Dựng TRỌN GÓI một phễu đầu nguồn tặng ebook: viết copy bám nỗi đau → dựng ảnh bìa hero →
  build leadpage tĩnh → đưa lên Cloudflare Pages với tên miền riêng → nối form vào Lark Base →
  tự động gửi email kèm link ebook cho khách vừa điền. Khác với skill chỉ tạo trang: skill này
  đi tới tận nơi lead nằm trong bảng và thư đã vào hộp thư khách, kèm 12 cái bẫy đã dính thật
  (secret bị wrangler.toml giết, CDN phục vụ ảnh cũ 4 tiếng, Ctrl+V chèn ký tự vô hình làm
  Lark báo sai khoá, form báo "Cảm ơn" trong khi lead bay mất...). Dùng khi người dùng muốn:
  làm leadpage tặng ebook, dựng trang thu lead có tên miền riêng, nối form vào Lark Base,
  tự động gửi ebook qua email, làm phễu lead magnet từ đầu tới cuối, hoặc sửa/deploy lại một
  leadpage đã dựng bằng skill này. Kích hoạt khi có từ: leadpage ebook, trang thu lead,
  lead magnet, làm phễu tặng ebook, deploy leadpage, Cloudflare Pages, nối form vào Lark Base,
  gửi ebook tự động, trang tải ebook, dựng landing page thu email, gắn tên miền cho leadpage.
---

# Skill: Leadpage tặng ebook — trọn gói từ chữ tới lead nằm trong bảng

Một dây chuyền đã chạy thật, đi hết chặng: **copy → bìa → trang → tên miền → lead vào Lark → thư tới tay khách.**

Phần lớn giá trị của skill này **không nằm ở mã**, mà nằm ở `references/BAY-DA-DINH.md` —
12 cái bẫy mà **hệ thống báo thành công trong khi thực tế đã hỏng**. Lần dựng đầu tiên mất
gần một ngày chỉ vì mấy cái đó. Lần sau: 20 phút.

---

## Triết lý gốc / Nguồn

- **Russell Brunson** (*DotCom Secrets*) — nguyên lý squeeze page: trang chỉ làm **một việc**
  là lấy thông tin liên hệ; không link thoát; mọi nút đều cuộn về form.
- **Hồ sơ khách hàng doanh nghiệp một người** do Gia Cát Duẩn nghiên cứu — cho ra
  5 luật viết chữ ở `references/cong-thuc-copy.md`: lời hứa hai vế, nỗi đau của người trả tiền,
  8 thứ khách thật sự mua, khuôn phủ định kép, ngôn ngữ bề mặt vs động cơ thật.
- **Thiết kế trang** nhân bản từ một leadpage đã chạy quảng cáo có chuyển đổi thật
  (bàn giao từ hệ AIOS của Hoàng Minh Hóa, skill gốc `hmh-mkt-leadpage-ebook`).
  `references/template.html` là **nguồn thiết kế duy nhất** — sửa file đó là **mọi trang sau**
  đổi theo.
- **Ràng buộc đạo đức:** nỗi đau dùng để giúp, không dùng để doạ. Xem mục cuối
  `cong-thuc-copy.md` — đây là lý do skill mặc định **tắt** đồng hồ đếm ngược giả và
  social proof bịa tên.

---

## Khi nào dùng / KHÔNG dùng

**Dùng khi** cần một phễu đầu nguồn hoàn chỉnh: tặng ebook/checklist/bản đồ để đổi lấy
thông tin liên hệ, có tên miền riêng, lead chảy vào bảng, thư tự gửi.

**KHÔNG dùng cho:**
- Trang bán hàng dài nhiều bước (salepage) — skill này chỉ thu lead, không bán
- Mới nghĩ ý tưởng mồi câu, chưa có ebook/quà tặng để làm trang
- Dựng ruột ebook thành PDF/sách lật
- Website nhiều trang cho doanh nghiệp dịch vụ

---

## Tiền điều kiện

| Cần | Kiểm tra |
|---|---|
| Python 3 + Pillow | `python -m pip install pillow` |
| Node + npx | `npx --yes wrangler@latest --version` |
| Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe` |
| Tài khoản Cloudflare | tên miền **đã trỏ nameserver về Cloudflare** thì gắn tên miền con chỉ mất vài phút |
| Lark app + Base | app dạng internal, bot **ghi được** vào bảng đích |
| Nhà gửi thư | Resend hoặc Brevo, **tên miền gửi đã xác thực** |
| *(tuỳ chọn)* tách nền bìa | `python -m pip install rembg onnxruntime scipy` |

---

## Quy trình thực thi

> **Chi tiết từng lệnh: `references/SOP-trien-khai.md`.** Dưới đây là bộ khung.

1. **HỎI NGƯỜI DÙNG thông tin thương hiệu** — BẮT BUỘC, không bịa, không dùng dữ liệu mẫu:
   tên thương hiệu · địa chỉ · hotline · email. Script dừng nếu `brand_name` rỗng.
2. **Xác định ĐÚNG đối tượng trước khi viết chữ.** Câu hỏi bắt buộc: *người đọc trang này
   có nhân viên không?* Sai chỗ này là card nỗi đau đầu tiên gọi nhầm người, hỏng cả trang.
3. **Viết copy** theo `references/cong-thuc-copy.md` → **đưa người dùng duyệt** rồi mới build.
4. **Dựng ảnh bìa hero:** tạo ảnh bằng công cụ sinh ảnh (đẹp hơn hẳn tự ghép chữ bằng mã),
   rồi `scripts/render-bia-hero.ps1` để nới đáy + nén WebP.
5. **Build + chụp ảnh xem thử** bằng `scripts/build_ebook_leadpage.py` và Chrome headless.
6. **CỔNG DUYỆT** — người dùng xem ảnh và gật đầu. Chưa duyệt thì **chưa deploy**.
7. **Deploy Cloudflare Pages + gắn tên miền con** (bước 6–10 của SOP).
8. **Nối Lark Base:** đổi token wiki sang `app_token` thật → **thử ghi bằng bot TRƯỚC khi
   viết mã** → sửa `scripts/lead.js` → nạp secret → deploy lại.
9. **Nghiệm thu đủ 10 mục** ở cuối `references/BAY-DA-DINH.md`. Chưa qua hết thì
   **chưa được chạy quảng cáo**.

---

## Tham chiếu

**`scripts/`**
| File | Việc |
|---|---|
| `build_ebook_leadpage.py` | config JSON → `site/index.html`. Chỉ thư viện chuẩn. Đã vá: đọc được file có BOM, cờ bật/tắt khan hiếm, tên ảnh mang mã băm chống cache |
| `render-bia-hero.ps1` | ảnh bìa → nới đáy cho nút CTA → nén WebP |
| `xoa-nen-bia.py` | tách nền cuốn sách ra PNG trong suốt (ảnh quảng cáo, thumbnail) |
| `lead.js` | Pages Function: nhận lead → ghi Lark Base → gửi email. **Tìm chữ `ĐỔI:`** để thấy mọi chỗ cần sửa |

**`references/`**
| File | Nội dung |
|---|---|
| **`BAY-DA-DINH.md`** | **Đọc đầu tiên.** 12 bẫy + bảng nghiệm thu 10 mục |
| `SOP-trien-khai.md` | Toàn bộ lệnh, copy-paste chạy được |
| `cong-thuc-copy.md` | 5 luật viết chữ + ràng buộc đạo đức + giới hạn template |
| `template.html` | Thiết kế khoá cứng — **sửa là mọi trang sau đổi theo** |
| `config.example.json` | Mọi trường, kèm ghi chú ngay trong file |

---

## Lưu ý / gotcha — bản rút gọn

Bốn cái nguy hiểm nhất (đầy đủ 12 cái ở `BAY-DA-DINH.md`):

1. **`wrangler.toml` giết mọi secret.** Có file đó thì Cloudflare bỏ qua sạch biến/secret
   đặt phía dashboard — mà `secret list` vẫn khoe "Value Encrypted". **Đừng tạo file này.**
2. **`functions/` phải nằm cạnh `site/`, không nằm trong.** Sai chỗ thì wrangler im lặng
   bỏ qua, `/api/lead` trả về HTML. Dấu hiệu duy nhất: **thiếu dòng `Compiled Worker successfully`**.
3. **Ctrl+V trong cửa sổ cmd chèn ký tự vô hình `0x16`** vào đầu secret → Lark báo
   `10014 app secret invalid` dù người dùng dán đúng. Bảo họ dán bằng **chuột phải**;
   mã đã có `sachSecret()` lọc sẵn.
4. **Mã 200 không chứng minh trang chạy đúng.** Trang có JavaScript có thể trả 200 kèm đúng
   `<title>` mà ruột là trang báo lỗi. **Nghiệm thu phải chụp ảnh bằng Chrome headless.**

Và cái đắt nhất về mặt kinh doanh: **`form_endpoint` để trống thì lead bay mất mà popup
vẫn hiện "Cảm ơn anh/chị"**. Không có thông báo lỗi nào. Luôn bắn một lead thử rồi
**mở bảng nhìn tận mắt** trước khi tiêu đồng tiền quảng cáo đầu tiên.

---

## Output

Mỗi chiến dịch = **một thư mục** `leadpage-<slug>/` gồm:
`config-ebook.json` · `bia/` · `ebook/` · `site/` (đem deploy) · `functions/` · `preview.png`
· URL live.

Xong thì ghi lại cấu hình dùng lại được (ID tài khoản, token Base, tên project) vào memory
hoặc ghi chú dự án — chiến dịch sau khỏi phải dò lại.
