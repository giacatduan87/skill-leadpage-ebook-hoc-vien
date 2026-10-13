/**
 * KHUÔN MẪU — Cloudflare Pages Function nhận lead từ leadpage,
 * ghi vào Lark Base, rồi gửi ngay email kèm link ebook.
 *
 * ĐẶT FILE NÀY Ở:  <gốc dự án>/functions/api/lead.js
 * ⚠️ KHÔNG đặt trong `site/`. Wrangler tìm `functions/` ở GỐC dự án, cạnh `site/`.
 *    Đặt sai chỗ thì nó IM LẶNG bỏ qua: không báo lỗi, chỉ thiếu dòng
 *    "Compiled Worker successfully", và /api/lead trả về index.html thay vì JSON.
 *
 * ═══ TÌM CHỮ  ĐỔI:  ĐỂ THẤY MỌI CHỖ CẦN SỬA ═══
 *
 * VÌ SAO PHẢI CÓ FILE NÀY (đừng gỡ đi rồi trỏ form thẳng vào API Lark):
 *   1. Cùng tên miền với trang → trình duyệt KHÔNG gửi preflight CORS.
 *      Trỏ thẳng sang open.larksuite.com là dính CORS, mọi lead rơi vào .catch().
 *   2. app_secret nằm ở biến môi trường phía máy chủ. Nhét vào JavaScript của trang
 *      thì ai xem mã nguồn cũng lấy được toàn quyền Base.
 *   3. Khoá nhà gửi thư cũng vậy — lộ ra là người khác gửi thư dưới tên mình.
 *
 * THỨ TỰ XỬ LÝ (đừng đảo): ghi Lark TRƯỚC → gửi thư SAU.
 *   Ghi Lark hỏng thì trả lỗi để khách bấm lại; lúc đó chưa gửi thư nên bấm lại
 *   không sinh thư trùng. Gửi thư hỏng thì KHÔNG trả lỗi — lead đã nằm trong Base,
 *   mất thư còn cứu bằng tay được, chứ báo lỗi là khách điền lại → bản ghi trùng.
 *
 * BIẾN MÔI TRƯỜNG (đặt bằng: npx wrangler pages secret put <TÊN> --project-name <dự-án>)
 *   LARK_APP_SECRET  — BẮT BUỘC, bí mật.
 *   LARK_APP_ID      — tuỳ chọn, mặc định dùng hằng số dưới đây.
 *   LARK_BASE_TOKEN  — tuỳ chọn, ghi đè hằng số (tiện khi đổi Base mà khỏi sửa mã).
 *   LARK_TABLE_ID    — tuỳ chọn, ghi đè hằng số.
 *   RESEND_API_KEY   — khoá Resend (dùng cái này thì bỏ BREVO_API_KEY).
 *   BREVO_API_KEY    — khoá Brevo (chỉ dùng khi KHÔNG có RESEND_API_KEY).
 *   MAIL_FROM_EMAIL / MAIL_FROM_NAME / MAIL_REPLY_TO — tuỳ chọn, ghi đè hằng số.
 */

/* ══════════════════ ĐỔI: CẤU HÌNH LARK ══════════════════ */
// Lark quốc tế (tên miền *.larksuite.com) dùng open.larksuite.com.
// Feishu Trung Quốc thì đổi thành https://open.feishu.cn
const LARK_HOST = "https://open.larksuite.com";
const DEFAULT_APP_ID = "cli_xxxxxxxxxxxxxxxx";      // ĐỔI: App ID trong Lark Developer Console
// ⚠️ Đây phải là app_token THẬT, KHÔNG phải token trong link wiki.
//    Link Base copy từ Lark thường là .../wiki/<node_token>?table=tbl...
//    node_token KHÔNG dùng ghi được. Lấy app_token thật bằng:
//      lark-cli api GET /open-apis/bitable/v1/apps/<token-trong-link> --as bot
//    rồi lấy data.app.app_token.
//    Chỗ hiểm: API ĐỌC vẫn nhận node_token nên dò bảng thấy chạy ngon, chỉ API GHI mới chết.
const BASE_TOKEN_MAC_DINH = "xxxxxxxxxxxxxxxxxxxxxxxxxxx";  // ĐỔI
const TABLE_ID_MAC_DINH = "tblxxxxxxxxxxxxxx";              // ĐỔI

// ĐỔI: tên cột trong bảng Lark của bạn. Chạy lệnh này để xem tên cột thật:
//   lark-cli api GET /open-apis/bitable/v1/apps/<app_token>/tables/<table_id>/fields --as bot
// ⚠️ ĐỪNG ghi vào cột kiểu CreatedTime (Lark tự điền), Lookup, Button, User — sẽ lỗi.
const COT = {
  ho_ten: "Họ và Tên",
  so_dien_thoai: "Số điện thoại",
  email: "Email",
  nguon: "SourceID",
};

/* ══════════════════ ĐỔI: CẤU HÌNH THƯ ══════════════════ */
const EBOOK_URL = "https://ebook.tenmiencuaban.com/";        // ĐỔI: nơi khách đọc/tải ebook
const TIEU_DE_THU = "Ebook “<TÊN EBOOK>” đã sẵn sàng rồi đây"; // ĐỔI
// Dòng xem trước hiện cạnh tiêu đề trong hộp thư. ĐỪNG lặp lại tiêu đề — lặp là phí chỗ.
const DONG_XEM_TRUOC = "Link đọc ebook ở bên trong, kèm 3 bước áp dụng ngay.";  // ĐỔI
// ⚠️ Địa chỉ gửi PHẢI thuộc tên miền đã xác thực ở nhà gửi thư, không thì bị từ chối.
const FROM_EMAIL_MAC_DINH = "ebook@tenmiencuaban.com";       // ĐỔI
const FROM_NAME_MAC_DINH = "<TÊN BẠN / THƯƠNG HIỆU>";        // ĐỔI
const REPLY_TO_MAC_DINH = "email-that-cua-ban@gmail.com";    // ĐỔI
// ĐỔI: chân thư — bắt buộc có để thư không bị coi là thư rác
const CHAN_THU_TRANG = "tenmiencuaban.com";
const CHAN_THU_DIA_CHI = "<Tên bạn> — <địa chỉ> · Hotline: <số điện thoại>";

/**
 * ĐỔI: NỘI DUNG THƯ — nguồn sự thật DUY NHẤT, chỉ sửa ở đây.
 * Bản HTML được sinh ra TỪ chuỗi này nên hai bản không bao giờ lệch nhau.
 * Quy ước: dòng nào chỉ chứa đúng một địa chỉ https:// sẽ thành NÚT bấm.
 * {customer_name} là chỗ thay tên khách.
 *
 * Xem thư mẫu đã chạy thật ở: references/thu-mau.md
 */
const MAU_THU = `Chào {customer_name},

Ebook “<TÊN EBOOK>” đã sẵn sàng rồi đây.

👉 Đọc ebook tại đây:
${EBOOK_URL}

<Một đoạn ngắn nói vì sao đừng áp dụng tất cả cùng lúc — cho khách một
việc duy nhất để làm ngay. Thư dạy được một điều nhỏ thì mở tỉ lệ đọc
thư sau cao hơn hẳn thư chỉ đưa link.>

① <Bước 1>
② <Bước 2>
③ <Bước 3>

👉 Mở ebook tại đây:
${EBOOK_URL}

Thân mến,

<TÊN BẠN>`;

/* ══════════════════ TỪ ĐÂY XUỐNG: KHÔNG CẦN SỬA ══════════════════ */

// Số điện thoại Việt Nam — giữ khớp với bản kiểm tra ở trình duyệt.
// Kiểm lại ở máy chủ vì dữ liệu từ trình duyệt không bao giờ đáng tin.
const PHONE_RE = /^(\+84|84|0)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-46-9])[0-9]{7}$/;

// Chặn dấu phẩy/chấm phẩy/ngoặc nhọn và mọi khoảng trắng (\s gồm cả \r \n).
// Không phải để bắt lỗi chính tả, mà để không ai nhét được người nhận thứ hai vào thư.
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>.]+(\.[^\s@,;<>.]+)+$/;

/**
 * Làm sạch secret trước khi dùng.
 * Dán vào cửa sổ cmd bằng Ctrl+V thì Windows chèn ký tự điều khiển 0x16 (SYN) vào đầu
 * chuỗi — mắt thường không thấy, Lark trả "10014 app secret invalid" và không ai hiểu
 * vì sao. Dấu hiệu: độ dài 33 thay vì 32. Lọc mọi ký tự điều khiển + khoảng trắng thừa.
 */
const sachSecret = (s) =>
  Array.from(String(s || "")).filter(c => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127).join("").trim();

// tenant_access_token sống 2 tiếng. Giữ trong bộ nhớ isolate để đỡ gọi lại mỗi lead.
let tokenCache = { value: null, expiresAt: 0 };

async function tenantToken(appId, appSecret) {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expiresAt) return tokenCache.value;
  const r = await fetch(`${LARK_HOST}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const j = await r.json();
  if (j.code !== 0 || !j.tenant_access_token) {
    throw new Error(`lay tenant_access_token that bai: code=${j.code} msg=${j.msg}`);
  }
  tokenCache = { value: j.tenant_access_token, expiresAt: now + (j.expire - 300) * 1000 };
  return tokenCache.value;
}

function utmTu(urlStr) {
  const out = {};
  try {
    const p = new URL(urlStr).searchParams;
    for (const k of ["utm_source", "utm_medium", "utm_content", "utm_term"]) {
      const v = p.get(k);
      if (v) out[k] = v.slice(0, 200);
    }
  } catch (_) { /* url hỏng thì bỏ qua, không được để chết cả lead */ }
  return out;
}

/* ─────────── PHẦN THƯ ─────────── */

/**
 * Tên khách để chào trong thư.
 * Khách gõ toàn thường ("nguyen van an") hoặc toàn hoa thì chuẩn lại hoa đầu mỗi từ —
 * thư chào "Chào nguyen van an," trông như thư rác. Tên đã có hoa lẫn thường
 * (kể cả "TS. Nguyễn An") thì TÔN TRỌNG nguyên bản.
 */
function tenDep(hoTen) {
  const t = String(hoTen || "").replace(/\s+/g, " ").trim();
  if (!t) return "bạn";
  const thap = t.toLocaleLowerCase("vi");
  const cao = t.toLocaleUpperCase("vi");
  if (t !== thap && t !== cao) return t;
  return thap.split(" ").map(w => (w ? w[0].toLocaleUpperCase("vi") + w.slice(1) : w)).join(" ");
}

// Tên khách đi vào HTML → phải chặn thẻ, kẻo một cái tên chứa "<script>" là thư bị méo.
const escHtml = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Dựng thân thư HTML từ bản chữ trơn. Dòng chỉ có một https:// → nút bấm to. */
function thanhHtml(text) {
  const P = "margin:0 0 18px;font-size:16px;line-height:1.7;color:#222";
  const linkify = (s) => s.replace(/(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#C7170C;text-decoration:underline">$1</a>');
  const out = [];
  for (const doan of text.split(/\n\s*\n/)) {
    let cho = [];
    const xa = () => { if (cho.length) { out.push(`<p style="${P}">${cho.join("<br>")}</p>`); cho = []; } };
    for (const dong of doan.split("\n")) {
      const d = dong.trim();
      if (/^https?:\/\/\S+$/.test(d)) {
        xa();
        out.push(
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 26px">` +
          `<tr><td align="center" bgcolor="#C7170C" style="border-radius:8px">` +
          `<a href="${escHtml(d)}" style="display:inline-block;padding:15px 30px;font-family:Arial,Helvetica,sans-serif;` +
          `font-size:17px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px">` +
          `ĐỌC EBOOK NGAY</a></td></tr></table>`
        );
      } else {
        cho.push(linkify(escHtml(d)));
      }
    }
    xa();
  }
  return out.join("\n");
}

function soanThu(hoTen) {
  const ten = tenDep(hoTen);
  const text = MAU_THU.split("{customer_name}").join(ten);
  const html = `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escHtml(TIEU_DE_THU)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escHtml(DONG_XEM_TRUOC)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5">
<tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
         style="width:100%;max-width:600px;background:#ffffff;border-radius:12px">
    <tr><td style="padding:32px 28px 8px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif">
${thanhHtml(text)}
    </td></tr>
    <tr><td style="padding:8px 28px 30px">
      <hr style="border:0;border-top:1px solid #e6e6e8;margin:0 0 14px">
      <p style="margin:0;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8a8a8f">
        Bạn nhận được thư này vì đã để lại thông tin tại
        <a href="https://${escHtml(CHAN_THU_TRANG)}/" style="color:#8a8a8f">${escHtml(CHAN_THU_TRANG)}</a>
        để nhận ebook.<br>${escHtml(CHAN_THU_DIA_CHI)}
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
  return { text, html };
}

/**
 * Gửi thư. Có RESEND_API_KEY thì dùng Resend, không thì BREVO_API_KEY.
 * Không có cái nào → bỏ qua nhưng GÀO ở log; im lặng là kiểu lỗi mất khách mà không ai biết.
 * KHÔNG bao giờ ném lỗi ra ngoài: trả { ok, ly_do } để phía gọi tự quyết.
 */
async function guiThuEbook(env, email, hoTen) {
  const resendKey = sachSecret(env.RESEND_API_KEY);
  const brevoKey = sachSecret(env.BREVO_API_KEY);
  if (!resendKey && !brevoKey) {
    console.error("THIEU RESEND_API_KEY/BREVO_API_KEY — khach khong nhan duoc ebook:", email);
    return { ok: false, ly_do: "chua-cau-hinh-nha-gui-thu" };
  }

  const fromEmail = String(env.MAIL_FROM_EMAIL || FROM_EMAIL_MAC_DINH).trim();
  const fromName = String(env.MAIL_FROM_NAME || FROM_NAME_MAC_DINH).trim();
  const replyTo = String(env.MAIL_REPLY_TO || REPLY_TO_MAC_DINH).trim();
  const { text, html } = soanThu(hoTen);

  const goi = resendKey
    ? {
        url: "https://api.resend.com/emails",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: { from: `${fromName} <${fromEmail}>`, to: [email], reply_to: replyTo,
                subject: TIEU_DE_THU, html, text },
      }
    : {
        url: "https://api.brevo.com/v3/smtp/email",
        headers: { "api-key": brevoKey, "Content-Type": "application/json", accept: "application/json" },
        body: { sender: { name: fromName, email: fromEmail }, to: [{ email, name: tenDep(hoTen) }],
                replyTo: { email: replyTo }, subject: TIEU_DE_THU, htmlContent: html, textContent: text },
      };

  // Thử tối đa 2 lần: quá tải (429) hay nhà gửi thư sập tạm (5xx) thì đợi một nhịp rồi gửi lại.
  // Lỗi 4xx khác (khoá sai, tên miền chưa xác thực, email không tồn tại) thì gửi lại vô ích.
  for (let lan = 1; lan <= 2; lan++) {
    let r, body;
    try {
      r = await fetch(goi.url, { method: "POST", headers: goi.headers, body: JSON.stringify(goi.body) });
      body = await r.text();
    } catch (e) {
      if (lan === 1) { await new Promise(s => setTimeout(s, 700)); continue; }
      console.error("Goi nha gui thu that bai:", e.message, "| khach:", email);
      return { ok: false, ly_do: "khong-goi-duoc-nha-gui-thu" };
    }
    if (r.ok) return { ok: true };
    const dangLai = r.status === 429 || r.status >= 500;
    // In cả thân phản hồi vì đây là chỗ DUY NHẤT nói rõ "tên miền chưa xác thực" hay "khoá sai".
    console.error(`Nha gui thu tu choi (lan ${lan}): HTTP ${r.status} ${body.slice(0, 300)} | khach: ${email}`);
    if (dangLai && lan === 1) { await new Promise(s => setTimeout(s, 700)); continue; }
    return { ok: false, ly_do: `nha-gui-thu-tu-choi-${r.status}` };
  }
  return { ok: false, ly_do: "khong-ro" };
}

/* ─────────── NHẬN LEAD ─────────── */

export async function onRequestPost({ request, env }) {
  const ok = (b) => new Response(JSON.stringify(b), {
    status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
  const fail = (s, m) => new Response(JSON.stringify({ ok: false, error: m }), {
    status: s, headers: { "Content-Type": "application/json; charset=utf-8" } });

  let d;
  try { d = await request.json(); } catch (_) { return fail(400, "body khong phai JSON"); }

  // Bẫy bot: trường ẩn "website" có chữ nghĩa là bot điền. Trả 200 để nó không thử lại.
  if (d.website) return ok({ ok: true });

  const hoTen = String(d.full_name || "").trim().slice(0, 200);
  const sdt = String(d.phone_number || "").replace(/[\s.\-()]/g, "");
  const email = String(d.email || "").trim().slice(0, 200);

  if (!hoTen) return fail(400, "thieu ho ten");
  if (!PHONE_RE.test(sdt)) return fail(400, "so dien thoai khong hop le");
  // Email BẮT BUỘC vì ebook giao bằng thư. Không có email = khách ra về tay trắng.
  // (Bỏ dòng này nếu bạn giao ebook bằng cách chuyển thẳng sang trang tải.)
  if (!EMAIL_RE.test(email)) return fail(400, "email khong hop le");

  const appSecret = sachSecret(env.LARK_APP_SECRET);
  if (!appSecret) {
    console.error("THIEU LARK_APP_SECRET — lead khong duoc luu!");
    return fail(500, "server chua cau hinh");
  }
  const appId = env.LARK_APP_ID || DEFAULT_APP_ID;
  const baseToken = env.LARK_BASE_TOKEN || BASE_TOKEN_MAC_DINH;
  const tableId = env.LARK_TABLE_ID || TABLE_ID_MAC_DINH;

  const fields = {
    [COT.ho_ten]: hoTen,
    [COT.so_dien_thoai]: sdt,
    [COT.email]: email,
    [COT.nguon]: String(d.page || "").slice(0, 100),
    utm_source: "leadpage",
    ...utmTu(d.url || ""),
  };

  let recordId;
  try {
    const token = await tenantToken(appId, appSecret);
    const ghi = (t) => fetch(
      `${LARK_HOST}/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records`,
      { method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ fields }) }
    ).then(r => r.json());

    let j = await ghi(token);
    if (j.code === 99991663 || j.code === 99991661) {
      tokenCache = { value: null, expiresAt: 0 };          // token chết sớm → thử lại đúng 1 lần
      j = await ghi(await tenantToken(appId, appSecret));
      if (j.code !== 0) throw new Error(`Lark tu choi lan 2: code=${j.code} msg=${j.msg}`);
    } else if (j.code !== 0) {
      throw new Error(`Lark tu choi: code=${j.code} msg=${j.msg}`);
    }
    recordId = j.data?.record?.record_id;
  } catch (e) {
    console.error("Ghi lead that bai:", e.message, "| du lieu:", JSON.stringify(fields));
    // Không trả lý do thật ra ngoài — chỉ ghi log.
    // Xem log: npx wrangler pages deployment tail <deployment-id> --project-name <dự-án>
    return fail(502, "khong luu duoc, vui long thu lai");
  }

  // Lead đã an toàn trong Base. Từ đây mọi sự cố CHỈ ghi log, KHÔNG trả lỗi.
  const thu = await guiThuEbook(env, email, hoTen);
  if (thu.ok) console.log("Da gui ebook cho:", email, "| record:", recordId);

  return ok({ ok: true, record_id: recordId, da_gui_email: thu.ok, ly_do_email: thu.ly_do });
}

/** GET để tự kiểm tra: endpoint sống chưa, secret có chưa — KHÔNG lộ giá trị secret. */
export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    ok: true,
    endpoint: "/api/lead",
    nhan: "POST",
    da_co_secret: Boolean(env.LARK_APP_SECRET),
    base: env.LARK_BASE_TOKEN || BASE_TOKEN_MAC_DINH,
    table: env.LARK_TABLE_ID || TABLE_ID_MAC_DINH,
    nha_gui_thu: env.RESEND_API_KEY ? "resend" : (env.BREVO_API_KEY ? "brevo" : "CHUA CAU HINH"),
    gui_tu: `${env.MAIL_FROM_NAME || FROM_NAME_MAC_DINH} <${env.MAIL_FROM_EMAIL || FROM_EMAIL_MAC_DINH}>`,
  }, null, 2), { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
