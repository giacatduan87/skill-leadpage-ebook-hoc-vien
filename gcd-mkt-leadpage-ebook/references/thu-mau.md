# Thư mẫu đã chạy thật — học CẤU TRÚC, đừng chép nguyên văn

Đây là lá thư tự động gửi cho khách vừa điền form, dùng trong chiến dịch
*"100 việc bạn có thể giao cho AI"*. Chép nguyên si sang ngành khác thì nó thành thư rác.
**Thứ đáng học là bộ khung 7 khối bên dưới.**

---

## Vì sao thư này không chỉ đưa link rồi thôi

Thư "đây là link của bạn, chúc vui vẻ" được mở đúng một lần. Thư **dạy được một điều nhỏ**
khiến khách nhớ tên người gửi, và mở tỉ lệ đọc **thư thứ hai** cao hơn hẳn.

Đó là khác biệt giữa một cái máy phát file và bước đầu của một mối quan hệ.

---

## Bộ khung 7 khối

| # | Khối | Việc nó làm |
|---|---|---|
| 1 | Chào tên riêng + **link ngay đầu thư** | Người vội chỉ cần cái này. Đừng bắt họ đọc hết mới thấy link |
| 2 | *"Nhưng có một điều muốn nhắn trước khi mở…"* | Câu bản lề — giữ chân người chưa vội |
| 3 | **Vẽ lại một ngày của họ** | Cụ thể tới mức họ giật mình: "sao biết rõ thế" |
| 4 | **Lật câu hỏi** | Từ *"làm sao làm nhiều hơn"* sang *"việc nào không cần tự làm"* |
| 5 | **Một hình ảnh ẩn dụ** | Con thuyền / mái chèo. Dễ nhớ hơn mọi lập luận |
| 6 | **① ② ③ — ba bước, chốt lại còn MỘT** | Cho một việc duy nhất. Bảo làm 10 việc = không làm việc nào |
| 7 | **Nhắc lại link + lời chúc gắn với lời hứa** | Người đọc hết cũng phải thấy link lần nữa |

---

## Bản đầy đủ (chiến dịch AI cho chủ doanh nghiệp)

```
Chào {customer_name},

Ebook "100 việc bạn có thể giao cho AI" đã sẵn sàng rồi đây.

👉 Đọc ebook tại đây:
https://ebook.tenmien.com/

Nhưng có một điều mình muốn nhắn {customer_name} trước khi mở ebook:

Đừng cố giao cả 100 việc cho AI ngay.

Hãy thử nhìn lại một ngày làm việc của mình.

Có thể sáng vừa mở mắt đã thấy tin nhắn nhân sự.
Đến công ty là duyệt nội dung, kiểm tra báo cáo, trả lời khách hàng,
xử lý những việc "chỉ có mình mới quyết được".

Tối về rồi, đầu vẫn còn chạy:

"Mai còn việc gì chưa xử lý nhỉ?"

Nhiều chủ doanh nghiệp tìm đến AI vì muốn làm được nhiều việc hơn.

Nhưng có lẽ câu hỏi đáng giá hơn lại là:

"Có những việc nào mình không cần tự làm nữa?"

Hãy tưởng tượng doanh nghiệp giống như một con thuyền.

Nếu người chủ vừa phải cầm lái, vừa chèo, vừa kéo buồm, vừa liên tục
chạy xuống khoang xử lý từng chuyện nhỏ…

thì dù con thuyền có đi nhanh đến đâu, người cầm lái cũng sẽ rất mệt.

AI không nhất thiết giúp {customer_name} chèo nhanh hơn.

AI có thể giúp mình bỏ bớt những mái chèo không cần tự cầm.

Vì vậy, khi đọc danh sách 100 việc, hãy làm một việc rất đơn giản:

① Chọn 3 việc đang lặp lại nhiều nhất mỗi tuần.
② Tìm xem việc nào AI có thể hỗ trợ ngay.
③ Chọn đúng 1 việc và thử giao cho AI trước.

Chỉ một việc thôi.

Bởi mục tiêu cuối cùng không phải là trở thành người biết thật nhiều công cụ AI.

Mà là từng bước tiến tới trạng thái:

Ít việc hơn.
Nhưng kiểm soát tốt hơn.

👉 Mở ebook tại đây:
https://ebook.tenmien.com/

Chúc {customer_name} tìm được việc đầu tiên mình có thể đặt xuống.

Thân mến,

Gia Cát Duẩn
```

---

## Chi tiết kỹ thuật đã tính sẵn trong `lead.js`

- **`{customer_name}`** — thay tên khách. Hàm `tenDep()` chuẩn hoa đầu từ khi khách gõ
  `"nguyen van an"` hoặc `"NGUYEN VAN AN"`; tên đã có hoa lẫn thường (kể cả `"TS. Nguyễn An"`)
  thì giữ nguyên. Thư chào *"Chào nguyen van an,"* trông y như thư rác.
- **Dòng chỉ chứa một địa chỉ `https://`** tự thành **nút bấm đỏ to** trong bản HTML —
  khách trên điện thoại bấm được bằng ngón tay.
- **Một chuỗi, hai bản.** Bản HTML sinh ra TỪ bản chữ trơn nên không bao giờ lệch nhau.
  Sửa nội dung chỉ sửa `MAU_THU`.
- **Dòng xem trước** (`DONG_XEM_TRUOC`) hiện cạnh tiêu đề trong hộp thư.
  **Đừng lặp lại tiêu đề** — lặp là phí mất một dòng bán hàng miễn phí.
- **Chân thư bắt buộc**: vì sao khách nhận được thư + tên + địa chỉ thật.
  Thiếu là rơi vào hộp thư rác.

---

## Thứ tự xử lý — đừng đảo

**Ghi Lark TRƯỚC → gửi thư SAU.**

- Ghi Lark hỏng → trả lỗi để khách bấm lại. Lúc đó **chưa gửi thư** nên bấm lại không sinh thư trùng.
- Gửi thư hỏng → **KHÔNG** trả lỗi. Lead đã nằm trong bảng, mất thư còn cứu bằng tay được;
  báo lỗi là khách điền lại và sinh bản ghi trùng.

Đảo thứ tự thì mỗi lần khách bấm lại là một lá thư nữa bay đi.
