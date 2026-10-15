"""Локальные ресурсы; запускается при подготовке, сайт не требует Python."""
from pathlib import Path
import re, urllib.request
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
fonts = root / 'assets' / 'fonts'
source = (fonts / 'source.css').read_text(encoding='utf-8')
blocks = re.findall(r'/\* (.*?) \*/\s*(@font-face\s*\{.*?\})', source, re.S)
output, seen = [], set()
for subset, block in blocks:
    if subset not in ('cyrillic', 'latin'):
        continue
    url = re.search(r'url\((.*?)\)', block).group(1)
    if url in seen:
        continue
    seen.add(url)
    family = 'inter' if "'Inter'" in block else 'jetbrains-mono'
    filename = f'{family}-{subset}.woff2'
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=45) as response:
        (fonts / filename).write_bytes(response.read())
    block = block.replace(url, filename)
    block = re.sub(r'font-weight: \d+;', f'font-weight: {"400 800" if family == "inter" else "400 500"};', block)
    output.append(f'/* {family}: {subset} */\n{block}')
(fonts / 'fonts.css').write_text('\n'.join(output), encoding='utf-8')
for name, url in [
    ('Inter-OFL.txt','https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt'),
    ('JetBrainsMono-OFL.txt','https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/OFL.txt')
]:
    with urllib.request.urlopen(url, timeout=45) as response:
        (fonts / name).write_bytes(response.read())

# Социальная карточка — локальный графический макет без фото и вымышленных данных.
image = Image.new('RGB', (1200, 630), '#0b0f19')
draw = ImageDraw.Draw(image)
regular = 'C:/Windows/Fonts/arial.ttf'
bold = 'C:/Windows/Fonts/arialbd.ttf'
draw.rounded_rectangle((48,48,1152,582), radius=28, fill='#111a29', outline='#334358', width=2)
draw.text((96,96), '<SA/>  CRM · API · WEBHOOKS', font=ImageFont.truetype(regular,26), fill='#73d9e4')
draw.text((96,200), 'Автоматизация', font=ImageFont.truetype(bold,74), fill='#edf3fc')
draw.text((96,290), 'вашего бизнеса', font=ImageFont.truetype(bold,74), fill='#73d9e4')
draw.text((96,445), 'Битрикс24  /  amoCRM  /  МойСклад', font=ImageFont.truetype(regular,30), fill='#a8b8cc')
image.save(root / 'social-card.png', optimize=True)
print('Saved local fonts, licenses and social-card.png')
