# Dung anh bia HERO cho leadpage tu mot anh bia sach:
#   .\render-bia-hero.ps1 -Nguon "D:\duong\dan\anh-bia-goc.png" -Ra "D:\du-an\bia\bia-hero.webp"
#
# LAM HAI VIEC:
#   1. NOI THEM mat nen o DAY anh (mac dinh 240px).
#      BAT BUOC: template leadpage dat nut "TAI NGAY" cach day anh 26px, cao 56px.
#      Khong noi thi nut DE LEN dong chu duoi cung cua bia (ten tac gia / tagline).
#   2. NEN sang WebP q92: anh 2.5 MB xuong con ~300 KB, mat thuong khong phan biet duoc.
#      Trang chay quang cao ma anh hero 2 MB la 3-4 giay cho tren 4G = tien ads do song.
#
# Tien dieu kien: Python + Pillow  (python -m pip install pillow)
#
# BAY: dung "2>$null" sau python/chrome trong PowerShell 5.1 se nem NativeCommandError
#      du lenh da chay xong. Dung try/catch neu can nuot loi.

param(
  [Parameter(Mandatory=$true)][string]$Nguon,
  [Parameter(Mandatory=$true)][string]$Ra,
  [int]$Them = 240,
  [int]$ChatLuong = 92
)

if (-not (Test-Path $Nguon)) { throw "Khong thay anh nguon: $Nguon" }
$thuMucRa = Split-Path -Parent $Ra
if ($thuMucRa -and -not (Test-Path $thuMucRa)) { New-Item -ItemType Directory -Force $thuMucRa | Out-Null }

"Nguon: {0}  ({1} KB)" -f $Nguon, [math]::Round((Get-Item $Nguon).Length/1KB,1)

$py = @"
from PIL import Image, ImageFilter
THEM = $Them
im = Image.open(r'$Nguon').convert('RGB')
w, h = im.size
print('   anh goc     : %dx%d' % (w, h))
if THEM > 0:
    # Noi day bang chinh day anh: lam mo that manh roi keo gian + toi dan
    # -> nhin nhu nen lui vao bong, khong ai thay duong ghep.
    dai = im.crop((0, h - 60, w, h)).filter(ImageFilter.GaussianBlur(18))
    noi = dai.resize((w, THEM), Image.LANCZOS)
    px = noi.load()
    for y in range(THEM):
        k = 1.0 - 0.55 * (y / max(1, THEM - 1))
        for x in range(w):
            r, g, b = px[x, y]
            px[x, y] = (int(r*k), int(g*k), int(b*k))
    ra = Image.new('RGB', (w, h + THEM))
    ra.paste(im, (0, 0)); ra.paste(noi, (0, h))
    vung = ra.crop((0, h - 12, w, h + 12)).filter(ImageFilter.GaussianBlur(6))
    ra.paste(vung, (0, h - 12))
else:
    ra = im
ra.save(r'$Ra', 'WEBP', quality=$ChatLuong, method=6)
print('   anh ket qua : %dx%d' % ra.size)
"@
python -c $py

if (Test-Path $Ra) {
  "WebP -> {0}  ({1} KB)" -f $Ra, [math]::Round((Get-Item $Ra).Length/1KB,1)
  ""
  "Buoc tiep: tro mockup_image trong config vao file .webp nay, dung lai trang, deploy."
} else {
  throw "Khong tao duoc WebP. Kiem tra Pillow: python -m pip install pillow"
}
