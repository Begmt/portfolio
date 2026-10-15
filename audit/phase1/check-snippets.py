"""Проверка учебных сниппетов: подпись, тело, быстрый ответ без CRM."""
from pathlib import Path
from html import unescape
import re, os, ast, subprocess, urllib.request, urllib.error, hashlib, hmac, types, sys, json

root = Path(__file__).resolve().parents[2]
source = (root / 'index.html').read_text(encoding='utf-8')
snippets = {lang: unescape(re.search(rf'id="code-{lang}"[^>]*><code>(.*?)</code>', source, re.S).group(1)) for lang in ('js','py','php')}
ast.parse(snippets['py'])
secret = 'test-secret-not-a-real-contact'
body = b'{"event":"test"}'
signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
# Подменяется только Flask: проверяем именно функцию из HTML, без установки сервера.
class App:
    def __init__(self, *args): self.config = {}
    def post(self, route): return lambda function: function
request = types.SimpleNamespace(get_data=lambda: body, headers={})
sys.modules['flask'] = types.SimpleNamespace(Flask=App, request=request)
os.environ['WEBHOOK_SECRET'] = secret
namespace = {}
exec(compile(snippets['py'], '<html-python-snippet>', 'exec'), namespace)
for header, expected in [(signature,200),(signature.upper(),200),('bad',403),('не подпись',403),('',403)]:
    request.headers = {'X-Signature': header}
    assert namespace['handle_webhook']()[1] == expected

script = snippets['js'].replace(".listen(Number(process.env.PORT || 3000));", ".listen(0, '127.0.0.1', function () { console.log(this.address().port); });")
process = subprocess.Popen(['node','--input-type=module','-e',script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
try:
    port = int(process.stdout.readline())
    for payload, header, expected in [(body,signature,200),(body,'bad',403),(body,'',403),(b'x'*65537,signature,413)]:
        req = urllib.request.Request(f'http://127.0.0.1:{port}/webhook', data=payload, headers={'X-Signature':header})
        try:
            with urllib.request.urlopen(req,timeout=5) as response: status=response.status
        except urllib.error.HTTPError as error: status=error.code
        assert status==expected, (status,expected)
finally:
    process.terminate(); process.wait(timeout=5)
result={'javascript':'valid HMAC:200; invalid/missing:403; oversized:413','python':'syntax + valid/uppercase HMAC:200; invalid/missing/Unicode:403','php':'manual review only: PHP runtime unavailable'}
(root/'audit/phase1/snippets-results.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
