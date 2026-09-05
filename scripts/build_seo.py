#!/usr/bin/env python3
"""Build local SEO artifacts. OUTPUT/site is publishable; OUTPUT/seo-audit.json is not.

This validates declared public facts, not their truth or operational release readiness.
Only explicitly listed public files are copied. Source files are never modified.
"""
import argparse
import html
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
from urllib.parse import urlsplit, urlunsplit, urljoin, unquote
from xml.etree import ElementTree as ET

VERSION = 1
DENIED = {'.git', '.omx', 'docs', 'scripts', 'tests', 'config', 'receipts', 'node_modules', 'sources', 'implementation'}
EXTENSIONS = {'.html', '.css', '.js', '.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.ico', '.mp4', '.webm', '.woff', '.woff2'}
EXCLUDED = {'404.html', 'request-quote/thank-you/index.html'}
EXPERIMENTS = {'preview-c', 'hero-lab'}


def base_path(value):
    if not isinstance(value, str) or (value and not value.startswith('/')) or any(c in value for c in ['..', '?', '#', '\\', '%', '//']):
        raise ValueError('base_path must be empty or a safe absolute URL path')
    return value.rstrip('/')


def origin(value):
    parsed = urlsplit(value)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.path not in ('', '/') or parsed.query or parsed.fragment:
        raise ValueError('origin must be an HTTPS origin without credentials, path, query or fragment')
    if any(c.isspace() for c in value):
        raise ValueError('origin contains whitespace')
    return value.rstrip('/')


def route(file):
    return '/' if file == 'index.html' else '/' + (file[:-10] if file.endswith('/index.html') else file)


def is_excluded(file):
    return file in EXCLUDED or any(p in EXPERIMENTS or p.startswith('preview-') for p in PurePosixPath(file).parts)


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.titles = self.h1s = 0; self.in_head = False
        self.descriptions = []; self.canonicals = []; self.robots = []; self.og = []
        self.links = []; self.ids = set(); self.schemas = []; self.script = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'head': self.in_head = True
        if tag == 'title' and self.in_head: self.titles += 1
        if tag == 'h1': self.h1s += 1
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'meta':
            key = a.get('name', '').lower()
            if key == 'description': self.descriptions.append(a.get('content', ''))
            if key == 'robots': self.robots.append(a.get('content', ''))
            if a.get('property') == 'og:url': self.og.append(a.get('content', ''))
            if a.get('property') in ('og:url', 'og:image') and a.get('content'): self.links.append(a['content'])
        if tag == 'link' and a.get('rel') == 'canonical': self.canonicals.append(a.get('href', ''))
        for key in ('href', 'src', 'poster'):
            if a.get(key): self.links.append(a[key])
        if a.get('srcset'):
            self.links.extend(x.strip().split()[0] for x in a['srcset'].split(',') if x.strip())
        if tag == 'script' and a.get('type') == 'application/ld+json': self.script = ''
    def handle_data(self, data):
        if self.script is not None: self.script += data
    def handle_endtag(self, tag):
        if tag == 'head': self.in_head = False
        if tag == 'script' and self.script is not None:
            self.schemas.append(self.script); self.script = None


def rewrite_url(value, cfg):
    u = urlsplit(value)
    target_origin = cfg['origin']; target_base = cfg['base_path']
    if u.scheme or u.netloc:
        matches = [item for item in cfg['source_sites'] if (u.scheme or 'https') + '://' + u.netloc == item['origin'] and (u.path == item['base_path'] or u.path.startswith(item['base_path'] + '/'))]
        if not matches: return value
        prefix = max(matches, key=lambda x: len(x['base_path']))['base_path']
        return target_origin + target_base + (u.path[len(prefix):] or '/') + ('?' + u.query if u.query else '') + ('#' + u.fragment if u.fragment else '')
    if value.startswith('/') and not value.startswith('//'):
        prefixes = sorted({x['base_path'] for x in cfg['source_sites']}, key=len, reverse=True)
        prefix = next((p for p in prefixes if u.path == p or u.path.startswith(p + '/')), None)
        if prefix is not None:
            return urlunsplit(('', '', target_base + (u.path[len(prefix):] or '/'), u.query, u.fragment))
    return value


def js_asset_reference(value, cfg, include_target=False):
    """Recognize deployment asset paths, never generic JS control/route strings."""
    u = urlsplit(value)
    if u.scheme in ('http', 'https') or u.netloc:
        return True
    prefixes = {item['base_path'] for item in cfg['source_sites'] if item['base_path']}
    if include_target: prefixes.add(cfg['base_path'])
    return any(u.path.startswith(prefix + '/' + folder + '/') for prefix in prefixes for folder in ('media', 'css', 'js'))


def transform(text, cfg, file=None, profile=None, is_js=False):
    # Rewrite URL-valued attributes and quoted standalone URLs, not arbitrary prose.
    def quoted(m):
        value = m.group(2) if is_js else html.unescape(m.group(2))
        if not (value.startswith('/') or value.startswith('https://') or value.startswith('http://')): return m.group(0)
        if is_js and not js_asset_reference(value, cfg): return m.group(0)
        if any(c.isspace() for c in value): return m.group(0)
        value = rewrite_url(value, cfg)
        return m.group(1) + (html.escape(value, quote=True) if file else value) + m.group(1)
    # JSON-LD needs JSON escaping, not HTML entity escaping.
    def schema(m):
        data = json.loads(m.group(2))
        def walk(obj):
            if isinstance(obj, dict): return {k: walk(v) for k,v in obj.items()}
            if isinstance(obj, list): return [walk(v) for v in obj]
            if isinstance(obj, str): return rewrite_url(obj, cfg)
            return obj
        return m.group(1) + json.dumps(walk(data), ensure_ascii=False).replace('</', '<\\/') + m.group(3)
    srcsets = []
    def hold_srcset(m):
        candidates = []
        for raw in html.unescape(m.group(3)).split(','):
            candidate = re.fullmatch(r'\s*(\S+?)(?:\s+((?:[1-9]\d*w)|(?:\d*\.?\d+x)))?\s*', raw)
            if not candidate or candidate.group(1).startswith('data:'):
                raise ValueError('Unsupported or malformed srcset candidate')
            url, descriptor = candidate.groups()
            candidates.append(rewrite_url(url, cfg) + (' ' + descriptor if descriptor else ''))
        srcsets.append(m.group(1) + m.group(2) + html.escape(', '.join(candidates), quote=True) + m.group(2))
        return 'SEO_SRCSET_PLACEHOLDER_' + str(len(srcsets)-1) + '__END__'
    schemas = []
    def hold(m):
        schemas.append(schema(m)); return 'SEO_SCHEMA_PLACEHOLDER_' + str(len(schemas)-1) + '__END__'
    if file:
        text = re.sub(r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script>)', hold, text, flags=re.S|re.I)
    if file:
        text = re.sub(r'(\bsrcset\s*=\s*)([\"\'])(.*?)\2', hold_srcset, text, flags=re.S|re.I)
    text = re.sub(r'(["\'])([^"\'\n]*?)\1', quoted, text)
    if not file and not is_js:
        text = re.sub(r'url\((/[^\s)\"\']+)\)', lambda m: 'url(' + rewrite_url(m.group(1), cfg) + ')', text)
    for i, value in enumerate(srcsets): text = text.replace('SEO_SRCSET_PLACEHOLDER_' + str(i) + '__END__', value)
    for i,s in enumerate(schemas): text = text.replace('SEO_SCHEMA_PLACEHOLDER_' + str(i) + '__END__', s)
    if file:
        parsed = Document(); parsed.feed(text)
        canonical = cfg['origin'] + cfg['base_path'] + route(file)
        additions = ''
        if not parsed.canonicals: additions += '<link rel="canonical" href="' + canonical + '">\n'
        if not parsed.og: additions += '<meta property="og:url" content="' + canonical + '">\n'
        text = re.sub(r'</head>', additions + '</head>', text, count=1, flags=re.I)
        text = re.sub(r'<meta\b(?=[^>]*\bname=["\']robots["\'])[^>]*>', '', text, flags=re.I)
        directive = 'noindex, follow' if profile == 'preview' or is_excluded(file) else 'index, follow'
        text = re.sub(r'</head>', '<meta name="robots" content="' + directive + '">\n</head>', text, count=1, flags=re.I)
    return text


def load_config(path, profile):
    cfg = json.loads(path.read_text())
    if cfg.get('schema_version') != VERSION: raise ValueError('schema_version must be 1')
    cfg['origin'] = origin(cfg['origin']); cfg['base_path'] = base_path(cfg.get('base_path', ''))
    for item in cfg['source_sites']:
        item['origin'] = origin(item['origin']); item['base_path'] = base_path(item.get('base_path', ''))
    if not cfg['source_sites']: raise ValueError('source_sites cannot be empty')
    if profile == 'production-candidate':
        for key in ('origin_approval_ref', 'public_facts_approval_ref'):
            if not isinstance(cfg.get(key), str) or not cfg[key].strip() or cfg[key].startswith('REQUIRED'):
                raise ValueError(key + ' is required for a production-candidate')
    source = (path.parent / cfg['source_root']).resolve()
    files = cfg['public_files']
    if not isinstance(files, list) or not files or len(files) != len(set(files)): raise ValueError('public_files must be a nonempty unique list')
    for name in files:
        p = PurePosixPath(name)
        if p.is_absolute() or '..' in p.parts or '\\' in name or str(p) != name or any(x in DENIED or x.startswith('.') for x in p.parts if x != '.nojekyll'):
            raise ValueError('Unsafe public path: ' + name)
        if name != '.nojekyll' and p.suffix.lower() not in EXTENSIONS: raise ValueError('Unsupported public file: ' + name)
        if any(x in EXPERIMENTS or x.startswith('preview-') for x in p.parts): raise ValueError('Experiment cannot be published: ' + name)
        if p.suffix != '.html' and name != '.nojekyll' and p.parts[0] not in ('css','js','media'):
            raise ValueError('Asset outside public asset roots: ' + name)
        if not (source/name).is_file(): raise ValueError('Missing public file: ' + name)
        if any((source/Path(*p.parts[:i])).is_symlink() for i in range(1,len(p.parts)+1)):
            raise ValueError('Symlinks are forbidden: ' + name)
    if 'index.html' not in files or '404.html' not in files: raise ValueError('index.html and 404.html are required')
    return cfg, source


def audit(site, cfg, profile):
    errors = []; warnings = []; docs = {}
    def error(file, message): errors.append(file + ': ' + message)
    for file in cfg['public_files']:
        if not file.endswith('.html'): continue
        text = (site/file).read_text(); doc = Document(); doc.feed(text); docs[file] = doc
        expected = cfg['origin'] + cfg['base_path'] + route(file)
        for label, valid in [('title',doc.titles == 1),('h1',doc.h1s == 1),('description',len(doc.descriptions)==1 and bool(doc.descriptions[0].strip())),('canonical',doc.canonicals == [expected]),('og:url',doc.og == [expected])]:
            if not valid: error(file, 'requires one valid ' + label)
        noindex = profile == 'preview' or is_excluded(file)
        if len(doc.robots)!=1 or ('noindex' in doc.robots[0]) != noindex: error(file, 'incorrect indexation')
        for raw in doc.schemas:
            try:
                data = json.loads(raw)
                def schema_links(obj):
                    if isinstance(obj, dict):
                        for key, value in obj.items():
                            if key != '@id': schema_links(value)
                    elif isinstance(obj, list):
                        for value in obj: schema_links(value)
                    elif isinstance(obj, str) and obj.startswith(('https://', 'http://')):
                        doc.links.append(obj.split('#')[0])
                schema_links(data)
            except ValueError: error(file, 'invalid JSON-LD')
        visible = re.sub(r'<!--.*?-->', '', text, flags=re.S)
        for legacy in cfg.get('forbidden_url_fragments', []):
            if legacy in visible: error(file, 'legacy URL fragment remains: ' + legacy)
        for rule in cfg.get('price_checks', []):
            if file not in rule['pages']: continue
            found = re.findall(rule['pattern'], html.unescape(re.sub('<[^>]+>', ' ', visible)))
            values = [list(v) if isinstance(v, tuple) else [v] for v in found]
            if not values or any(v != [str(n) for n in rule['expected']] for v in values): error(file, 'price inconsistency: ' + rule['name'])
    # Include stylesheet URLs and statically declared script assets. Dynamic URLs
    # and network endpoints remain an explicit live integration verification.
    for file in cfg['public_files']:
        if not file.endswith(('.css', '.js')): continue
        content = (site/file).read_text()
        doc = Document()
        if file.endswith('.css'):
            css_urls = re.findall(r"url\(\s*(?:\"([^\"]*)\"|'([^']*)'|([^)]*))\s*\)", content)
            doc.links = [next(x for x in parts if x).strip() for parts in css_urls if any(parts)]
            doc.links = [x for x in doc.links if not x.startswith(('data:', '#'))]
        else:
            doc.links = [m.group(2) for m in re.finditer(r'([\"\'])((?:/|https?://)[^\"\'\s]+)\1', content) if js_asset_reference(m.group(2), cfg, include_target=True)]
        docs[file] = doc
    for file, doc in docs.items():
        for link in doc.links:
            u = urlsplit(urljoin(cfg['origin']+cfg['base_path']+route(file), link))
            full_origin = u.scheme + '://' + u.netloc
            target_scope = full_origin == cfg['origin'] and (u.path == cfg['base_path'] or u.path.startswith(cfg['base_path'] + '/'))
            if not target_scope and any(full_origin == item['origin'] and (u.path == item['base_path'] or u.path.startswith(item['base_path'] + '/')) for item in cfg['source_sites']):
                error(file, 'residual source-site URL: ' + link)
            if u.scheme not in ('http','https') or u.netloc != urlsplit(cfg['origin']).netloc: continue
            prefix = cfg['base_path']
            if not (u.path == prefix or u.path.startswith(prefix+'/')):
                error(file, 'local URL outside deployment base: ' + link); continue
            path = unquote(u.path[len(prefix):]).lstrip('/')
            if '..' in PurePosixPath(path).parts: error(file,'unsafe target: '+link); continue
            target = path + 'index.html' if not path or path.endswith('/') else path
            if target not in cfg['public_files']: error(file, 'missing local target: ' + link)
            elif u.fragment and target in docs and unquote(u.fragment) not in docs[target].ids: error(file, 'missing fragment: ' + link)
    warnings.extend(['Local artifact only; SEO validity does not establish release readiness or business operations.', 'Business fact approval references are declarations; their authenticity is not independently verified.', 'Live HTTPS, redirects, HTTP 404 status, indexing and performance require deployment verification.'])
    if not cfg.get('price_checks'): warnings.append('No approved numeric price checks configured; price consistency not certified.')
    return errors, warnings


def build(profile, config_path, output):
    cfg, source = load_config(config_path.resolve(), profile)
    output = output.resolve()
    if output == source or source in output.parents or output in source.parents:
        raise ValueError('Source/output overlap is forbidden; choose an output outside the source tree')
    if output.exists(): raise ValueError('Output already exists; choose a fresh output directory (nothing is overwritten)')
    output.mkdir(parents=True); site = output/'site'; site.mkdir()
    errors = []
    for file in cfg['public_files']:
        dest = site/file; dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.suffix in ('.html','.css','.js'):
            try: dest.write_text(transform((source/file).read_text(),cfg,file if dest.suffix=='.html' else None,profile,is_js=dest.suffix=='.js'))
            except (ValueError, TypeError) as exc:
                errors.append(file + ': ' + str(exc)); shutil.copyfile(source/file,dest)
        else: shutil.copyfile(source/file,dest)
    found,warnings = audit(site,cfg,profile); errors.extend(found)
    root = ET.Element('urlset', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
    if profile != 'preview':
        for file in sorted(cfg['public_files']):
            if file.endswith('.html') and not is_excluded(file): ET.SubElement(ET.SubElement(root,'url'),'loc').text = cfg['origin']+cfg['base_path']+route(file)
    ET.ElementTree(root).write(site/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    (site/'robots.txt').write_text('User-agent: *\nAllow: /\n' + ('Sitemap: '+cfg['origin']+cfg['base_path']+'/sitemap.xml\n' if profile != 'preview' else '# Preview: crawlable so page-level noindex can be honored.\n'))
    report = {'schema_version':VERSION,'profile':profile,'seo_valid':not errors,'errors':errors,'warnings':warnings,'artifact_directory':'site','release_ready':'not_assessed','business_operational':'not_assessed'}
    (output/'seo-audit.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile',choices=['preview','production-candidate'],required=True)
    parser.add_argument('--config',type=Path,required=True); parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args()
    try:
        report=build(args.profile,args.config,args.output); print(json.dumps(report,indent=2)); return 0 if report['seo_valid'] else 1
    except (ValueError,KeyError,TypeError,OSError) as exc:
        print(json.dumps({'schema_version':VERSION,'profile':args.profile,'seo_valid':False,'errors':[str(exc)],'warnings':[]})); return 2

if __name__ == '__main__': sys.exit(main())
