# -*- coding: utf-8 -*-
"""
Tach nen anh bia sach 3D -> PNG trong suot.

Dung khi can cuon sach ROI KHOI khung canh (dat len nen thuong hieu, lam anh quang cao,
thumbnail video). Khong can cho leadpage neu ban dung nguyen anh chup canh.

  python xoa-nen-bia.py <anh-vao.png> <anh-ra.png>

Tien dieu kien:
  python -m pip install rembg onnxruntime pillow scipy
  (lan chay dau tu tai mo hinh ~180 MB ve %USERPROFILE%\\.u2net)

═══ BAI HOC DA TRA GIA — dung sua nguoc lai ═══

1. KHONG bat alpha_matting. Cuon sach la khoi DAC, nhung alpha matting coi cac vung
   TOI BEN TRONG bia (long chu "0", goc toi cua bia) la nen -> anh bi THUNG LO.
   Nhin anh trong suot tren nen trang khong thay; dat len nen ca-ro moi lo ra.

2. PHAI lap kin lo (binary_fill_holes) sau khi lay mask. Day la buoc quyet dinh.

3. Chi giu khoi lien thong LON NHAT — bo cac dom nen con sot lai o goc.

4. LUON kiem tra bang cach dat len nen ca-ro tuong phan (script tu xuat file *-soi-vien.png).
   Nhin tren nen trang hay nen toi deu KHONG phat hien duoc lo thung.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from rembg import remove, new_session
from scipy import ndimage

if len(sys.argv) < 3:
    sys.exit("Dung: python xoa-nen-bia.py <anh-vao> <anh-ra.png>")
src, dst = sys.argv[1], sys.argv[2]

img = Image.open(src).convert("RGBA")
print(f"anh goc         : {img.width} x {img.height}")

# isnet-general-use cho vien sac net hon u2net voi vat the hinh hop
session = new_session("isnet-general-use")
out = remove(img, session=session, alpha_matting=False, post_process_mask=True)

a = np.array(out.getchannel("A"))
print(f"pixel duc (tho) : {(a > 127).mean() * 100:.1f}%")

dac = ndimage.binary_fill_holes(a > 127)          # <-- buoc quyet dinh
print(f"sau khi lap lo  : {dac.mean() * 100:.1f}%")

nhan, so = ndimage.label(dac)
if so > 1:
    dt = ndimage.sum(dac, nhan, range(1, so + 1))
    dac = nhan == (int(np.argmax(dt)) + 1)
    print(f"bo {so - 1} dom rac  : con {dac.mean() * 100:.1f}%")

# Lam min vien: blur nhe -> het rang cua ma khong an vao vien
alpha = Image.fromarray((dac * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
out.putalpha(alpha)

bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)
    print(f"sau khi cat     : {out.width} x {out.height}")
out.save(dst)
print(f"da luu          : {dst}")

# --- Anh soi vien: dat len nen ca-ro hong/trang de kiem tra ---
w, h = out.size
o = 16
nen = Image.new("RGBA", (w, h), (255, 255, 255, 255))
px = nen.load()
for y in range(h):
    for x in range(w):
        if ((x // o) + (y // o)) % 2 == 0:
            px[x, y] = (255, 60, 200, 255)
nen.alpha_composite(out)
soi = dst.rsplit(".", 1)[0] + "-soi-vien.png"
nen.convert("RGB").save(soi)
print(f"anh soi vien    : {soi}")
print("  -> MO FILE NAY LEN XEM. Thay o ca-ro hong xuyen qua cuon sach = con lo thung.")
