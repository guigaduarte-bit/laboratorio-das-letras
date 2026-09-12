"""Empacota o export Next existente em um HTML independente para revisão privada."""
from pathlib import Path
import base64
import mimetypes
import re
import sys

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
destination = Path(sys.argv[1]).resolve()
html = (dist / 'index.html').read_text()
scripts = re.findall(r'<script[^>]*src="([^"]+)"[^>]*></script>', html)
style_paths = re.findall(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*/?>', html)

def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

styles = []
for resource in style_paths:
    path = dist / resource.lstrip('/')
    css = path.read_text()
    def inline_font(match):
        url = match[1].strip('"\'')
        if url.startswith('data:') or url.startswith('http'): return match[0]
        file = dist / url.lstrip('/') if url.startswith('/') else (path.parent / url).resolve()
        return 'url("' + data_uri(file) + '")'
    styles.append(re.sub(r'url\(([^)]+)\)', inline_font, css))

assets = {'/assets/' + str(p.relative_to(dist/'assets')): data_uri(p)
          for p in (dist/'assets').rglob('*') if p.is_file() and p.suffix == '.mp3'}

def inline_script(path):
    code = path.read_text()
    for url, data in assets.items(): code = code.replace(url, data)
    # Inline scripts must not contain an HTML closing-script token.
    return '<script>' + code.replace('</script', '<\\/script') + '</script>'

# Lazy chunks are registered before the runtime so no dynamic script requests are needed.
original_files = {dist / s.lstrip('/') for s in scripts}
extras = [p for p in sorted((dist/'_next/static/chunks').rglob('*.js')) if p not in original_files]
blocks = [inline_script(p) for p in extras]
blocks.extend(inline_script(dist / src.lstrip('/')) for src in scripts)
html = re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>', '', html)
html = re.sub(r'<link[^>]+>', '', html)
html = html.replace('</head>', '<style>' + '\n'.join(styles) + '</style></head>')
html = html.replace('</body>', '\n'.join(blocks) + '</body>')
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(html)
print(f'Preview independente: {destination.name} ({destination.stat().st_size:,} bytes)')
