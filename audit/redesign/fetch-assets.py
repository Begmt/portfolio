from pathlib import Path
import urllib.request, re
root=Path(__file__).resolve().parents[2]
fonts=root/'assets/fonts'
source=(fonts/'redesign-source.css').read_text(encoding='utf-8')
blocks=re.findall(r'/\* (.*?) \*/\s*(@font-face\s*\{.*?\})',source,re.S)
seen=set();css=[]
def download(url,path):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40) as response:path.write_bytes(response.read())
for subset,block in blocks:
    if subset not in ('cyrillic','latin'):continue
    url=re.search(r'url\((.*?)\)',block)[1]
    if url in seen:continue
    seen.add(url);family='manrope' if "'Manrope'" in block else 'geist-mono'
    name=f'{family}-{subset}.woff2';download(url,fonts/name)
    block=re.sub(r'font-weight: \d+;',f'font-weight: {"400 700" if family=="manrope" else "400 500"};',block).replace(url,name)
    css.append(block)
(fonts/'redesign-fonts.css').write_text('\n'.join(css),encoding='utf-8')
for family in ('manrope','geistmono'):
    download(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{family}/OFL.txt',fonts/f'{family}-OFL.txt')
icons=root/'assets/icons';icons.mkdir(exist_ok=True)
for icon in ('arrows-left-right','database','phone','code','arrow-up-right','circle-half'):
    download(f'https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/{icon}.svg',icons/f'{icon}.svg')
download('https://raw.githubusercontent.com/phosphor-icons/core/main/LICENSE',icons/'LICENSE.txt')
for repo in ('ai-design-skills','redesign-skill'):
    download(f'https://raw.githubusercontent.com/elayadesign/{repo}/main/LICENSE',root/f'audit/design-reference/{repo}-LICENSE.txt')
print('Local fonts, Phosphor icons and licenses saved')
