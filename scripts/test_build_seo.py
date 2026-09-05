import json
from pathlib import Path
import tempfile
import shutil
import subprocess
import unittest
import build_seo


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name); self.source = self.root/'source'; self.source.mkdir()
        self.cfg = {'schema_version':1,'source_root':'source','origin':'https://new.example','base_path':'','source_sites':[{'origin':'https://old.example','base_path':'/old'}], 'public_files':['index.html','404.html','service/index.html','media/a.svg','css/site.css'], 'origin_approval_ref':'owner/facts-2026-09-04','public_facts_approval_ref':'owner/facts-2026-09-04'}
        for file in self.cfg['public_files']:
            path=self.source/file; path.parent.mkdir(parents=True,exist_ok=True)
            if file.endswith('.html'):
                path.write_text('<html><head><title>Service</title><meta name="description" content="Real service"><link rel="canonical" href="https://old.example/old'+build_seo.route(file)+'"><script type="application/ld+json">{"@context":"https://schema.org","url":"https://old.example/old/","sameAs":"https://external.example/a?x=1&y=2"}</script></head><body><h1 id="main">Service</h1><svg><title>Accessible icon</title></svg><a href="/old/service/#main">Details</a><img src="/old/media/a.svg"><a href="https://external.example/old/page">External</a><a href="tel:+15555555555">Call</a></body></html>')
            else: path.write_text('svg' if file.endswith('svg') else 'body{color:red}')
        self.path=self.root/'config.json'
    def run_build(self,profile='production-candidate',output=None):
        self.path.write_text(json.dumps(self.cfg)); return build_seo.build(profile,self.path,output or self.root/'output')
    def test_root_candidate(self):
        before=(self.source/'index.html').read_bytes(); result=self.run_build()
        self.assertTrue(result['seo_valid'],result['errors']); self.assertEqual(before,(self.source/'index.html').read_bytes())
        page=(self.root/'output/site/index.html').read_text()
        self.assertIn('https://new.example/',page); self.assertIn('https://external.example/old/page',page)
        self.assertIn('https://external.example/a?x=1&y=2',page)
        self.assertNotIn('404.html',(self.root/'output/site/sitemap.xml').read_text())
        self.assertFalse((self.root/'output/site/seo-audit.json').exists())
    def test_subpath(self):
        self.cfg['base_path']='/business'; result=self.run_build(); self.assertTrue(result['seo_valid'],result)
        self.assertIn('href="/business/service/#main"',(self.root/'output/site/index.html').read_text())
    def test_preview_noindex_crawlable(self):
        self.cfg['origin_approval_ref']=''; self.cfg['public_facts_approval_ref']=''
        result=self.run_build('preview'); self.assertTrue(result['seo_valid'],result)
        self.assertIn('noindex, follow',(self.root/'output/site/index.html').read_text())
        self.assertNotIn('Disallow: /',(self.root/'output/site/robots.txt').read_text())
        self.assertNotIn('<loc>',(self.root/'output/site/sitemap.xml').read_text())
    def test_approval_required(self):
        del self.cfg['public_facts_approval_ref']
        with self.assertRaisesRegex(ValueError,'approval'): self.run_build()
        self.assertFalse((self.root/'output').exists())
    def test_bad_origins(self):
        for value in ['http://new.example','https://u:p@new.example','https://new.example/path','https://new.example?secret=x']:
            self.cfg['origin']=value
            with self.assertRaises(ValueError): self.run_build()
    def test_overlap(self):
        with self.assertRaisesRegex(ValueError,'overlap'): self.run_build(output=self.source/'build')
        with self.assertRaisesRegex(ValueError,'overlap'): self.run_build(output=self.root)
    def test_existing_output(self):
        dest=self.root/'output'; dest.mkdir(); (dest/'keep').write_text('kept')
        with self.assertRaisesRegex(ValueError,'already exists'): self.run_build()
        self.assertEqual('kept',(dest/'keep').read_text())
    def test_allowlist(self):
        (self.source/'private.json').write_text('{"secret":"secret"}')
        self.run_build(); self.assertFalse((self.root/'output/site/private.json').exists())
    def test_forbidden_paths(self):
        for name in ['docs/x.html','../x.html','/x.html','config/x.js','preview-c/index.html','media/../../a.svg']:
            self.cfg['public_files'].append(name)
            with self.assertRaises(ValueError): self.run_build()
            self.cfg['public_files'].pop()
    def test_external_symlink(self):
        path=self.source/'media/a.svg'; path.unlink(); path.symlink_to(self.path)
        with self.assertRaisesRegex(ValueError,'Symlinks'): self.run_build()
    def test_parent_symlink(self):
        (self.source/'media/a.svg').unlink(); (self.source/'media').rmdir()
        elsewhere=self.root/'outside'; elsewhere.mkdir(); (elsewhere/'a.svg').write_text('x'); (self.source/'media').symlink_to(elsewhere,target_is_directory=True)
        with self.assertRaisesRegex(ValueError,'Symlinks'): self.run_build()
    def test_missing_and_bad_fragment(self):
        p=self.source/'index.html'; p.write_text(p.read_text().replace('/old/service/#main','/old/service/#missing'))
        result=self.run_build(); self.assertFalse(result['seo_valid']); self.assertTrue(any('fragment' in x for x in result['errors']))
    def test_malformed_schema_and_duplicate_title(self):
        p=self.source/'index.html'; p.write_text(p.read_text().replace('<title>Service</title>','<title>Service</title><title>Duplicate</title>').replace('{"@context"','{"bad" "@context"'))
        result=self.run_build(); self.assertFalse(result['seo_valid']); self.assertTrue(any('title' in x for x in result['errors']))
    def test_prices(self):
        self.cfg['price_checks']=[{'name':'jet','pages':['index.html'],'pattern':r'\$(\d+)\s*–\s*\$(\d+)','expected':[450,800]}]
        p=self.source/'index.html'; p.write_text(p.read_text().replace('</body>','$350–$600</body>'))
        result=self.run_build(); self.assertTrue(any('price inconsistency' in x for x in result['errors']))
    def test_missing_asset(self):
        self.cfg['public_files'].remove('media/a.svg'); result=self.run_build()
        self.assertTrue(any('missing local target' in x for x in result['errors']))

    def test_css_and_script_assets(self):
        self.cfg['base_path']='/business'
        (self.source/'css/site.css').write_text('a{background:url(/old/media/a.svg)}')
        self.cfg['public_files'].append('js/site.js'); (self.source/'js').mkdir()
        (self.source/'js/site.js').write_text('const image="/old/media/a.svg";')
        result=self.run_build(); self.assertTrue(result['seo_valid'],result)
        self.assertIn('url(/business/media/a.svg)',(self.root/'output/site/css/site.css').read_text())
    def test_srcset(self):
        p=self.source/'index.html'; p.write_text(p.read_text().replace('<img src=', '<img srcset="/old/media/a.svg 400w, /old/media/a.svg 800w" src='))
        self.cfg['base_path']='/business'; result=self.run_build(); self.assertTrue(result['seo_valid'],result)
        self.assertIn('/business/media/a.svg 800w',(self.root/'output/site/index.html').read_text())
    def test_absolute_fractional_and_relative_srcset(self):
        self.cfg['base_path']='/business'
        p=self.source/'index.html'
        srcset='https://old.example/old/media/a.svg 1.5x, //old.example/old/media/a.svg 2x, /old/media/a.svg 3x, media/a.svg 4x, https://external.example/image.svg 5x'
        p.write_text(p.read_text().replace('<img src=', '<img srcset="' + srcset + '" src='))
        result=self.run_build(); self.assertTrue(result['seo_valid'],result)
        page=(self.root/'output/site/index.html').read_text()
        self.assertIn('https://new.example/business/media/a.svg 1.5x',page)
        self.assertIn('https://new.example/business/media/a.svg 2x',page)
        self.assertIn('/business/media/a.svg 3x',page)
        self.assertIn('media/a.svg 4x',page)
        self.assertIn('https://external.example/image.svg 5x',page)
        self.assertNotIn('old.example/old/media',page)
    def test_descriptorless_srcset(self):
        p=self.source/'index.html'
        p.write_text(p.read_text().replace('<img src=', '<img srcset="https://old.example/old/media/a.svg" src='))
        result=self.run_build(); self.assertTrue(result['seo_valid'],result)
        self.assertIn('srcset="https://new.example/media/a.svg"',(self.root/'output/site/index.html').read_text())
    def test_residual_source_sites_without_forbidden_fragments(self):
        self.run_build(); site=self.root/'output/site'; page=site/'index.html'
        for url in ['https://old.example/old/media/a.svg', '//old.example/old/media/a.svg']:
            page.write_text(page.read_text().replace('</body>', '<img srcset="' + url + ' 1.5x"></body>'))
        errors,_=build_seo.audit(site,self.cfg,'production-candidate')
        self.assertEqual(2,len([x for x in errors if 'residual source-site URL' in x]),errors)
    def test_srcset_same_origin_new_subpath_not_double_rewritten(self):
        self.cfg['source_sites']=[{'origin':'https://new.example','base_path':''},{'origin':'https://old.example','base_path':'/old'}]
        self.cfg['base_path']='/business'
        p=self.source/'index.html'; p.write_text(p.read_text().replace('<img src=', '<img srcset="https://old.example/old/media/a.svg 1.5x" src='))
        result=self.run_build(); self.assertTrue(result['seo_valid'],result)
        self.assertNotIn('/business/business/',(self.root/'output/site/index.html').read_text())
    def test_eleven_distinct_responsive_images(self):
        p=self.source/'index.html'
        images=''.join('<img srcset="https://old.example/old/media/a.svg?v=' + str(i) + ' 1.5x">' for i in range(11))
        p.write_text(p.read_text().replace('</body>',images+'</body>'))
        result=self.run_build(); self.assertTrue(result['seo_valid'],result)
        page=(self.root/'output/site/index.html').read_text()
        self.assertNotIn('SEO_SRCSET_PLACEHOLDER_',page)
        for i in range(11):
            self.assertIn('srcset="https://new.example/media/a.svg?v=' + str(i) + ' 1.5x"',page)
        doc=build_seo.Document(); doc.feed(page)
        self.assertEqual(11,len([link for link in doc.links if '/media/a.svg?v=' in link]))
    def test_eleven_distinct_jsonld_blocks(self):
        p=self.source/'index.html'
        blocks=''.join('<script type="application/ld+json">' + json.dumps({'@context':'https://schema.org','@type':'WebPage','name':'Page '+str(i),'url':'https://old.example/old/?v='+str(i)}) + '</script>' for i in range(11))
        p.write_text(p.read_text().replace('</head>',blocks+'</head>'))
        result=self.run_build(); self.assertTrue(result['seo_valid'],result)
        page=(self.root/'output/site/index.html').read_text()
        self.assertNotIn('SEO_SCHEMA_PLACEHOLDER_',page)
        doc=build_seo.Document(); doc.feed(page)
        self.assertEqual(12,len(doc.schemas))
        for i,raw in enumerate(doc.schemas[1:]):
            data=json.loads(raw)
            self.assertEqual('Page '+str(i),data['name'])
            self.assertEqual('https://new.example/?v='+str(i),data['url'])
    def test_generated_analytics_runtime_root_and_subpath(self):
        node=shutil.which('node')
        if not node: self.skipTest('Node is required for actual generated analytics runtime verification')
        real_js=Path(__file__).resolve().parent.parent/'js/analytics-events.js'
        self.assertTrue(real_js.is_file())
        (self.source/'js').mkdir(); (self.source/'js/analytics-events.js').write_text(real_js.read_text())
        self.cfg['public_files'].append('js/analytics-events.js')
        # Include an empty legacy base, which previously rewrote every slash.
        self.cfg['source_sites'].append({'origin':'https://legacy.example','base_path':''})
        harness=r"""
const assert = require('node:assert/strict');
const api = require(process.argv[1]);
const base = process.argv[2];
const handlers = {}; const sent = [];
const doc = { addEventListener(name, fn) { handlers[name] = fn; }, querySelector() { return null; } };
const win = { document:doc, PROJET_ANALYTICS:{ enabled:true, consent:'granted', measurementId:'G-TEST1234', allowedOrigin:'https://new.example', basePath:base }, location:{ origin:'https://new.example', pathname:base+'hydro-jetting/', href:'https://new.example'+base+'hydro-jetting/' }, gtag(...args) { sent.push(args); } };
api.init(win);
const link = { getAttribute() { return base+'camera-inspection/'; }, closest() { return null; } };
handlers.click({ target:{ closest() { return link; } } });
assert.equal(sent.length,1);
assert.equal(sent[0][1],'service_click');
assert.equal(sent[0][2].service,'camera-inspection');
assert.equal(sent[0][2].page_location,'https://new.example'+base+'hydro-jetting/');
win.location.pathname=base;
assert.equal(api.createTracker(win)('call_click',{surface:'content'}),true);
assert.equal(sent[1][2].page_location,'https://new.example'+base);
"""
        for i,base in enumerate(['','/business']):
            self.cfg['base_path']=base
            output=self.root/('runtime-'+str(i)); result=self.run_build(output=output)
            self.assertTrue(result['seo_valid'],result)
            generated=output/'site/js/analytics-events.js'
            self.assertEqual(real_js.read_text(),generated.read_text())
            run=subprocess.run([node,'-e',harness,str(generated),base+'/'],capture_output=True,text=True)
            self.assertEqual(0,run.returncode,run.stderr)
    def test_js_control_constants_preserved_assets_migrated(self):
        cfg=dict(self.cfg,base_path='/business',source_sites=self.cfg['source_sites']+[{'origin':'https://legacy.example','base_path':''}])
        original="const route='/service/'; const root='/'; const parts=route.split('/'); const image='/old/media/a.svg';"
        changed=build_seo.transform(original,cfg,is_js=True)
        self.assertIn("const route='/service/'; const root='/'; const parts=route.split('/');",changed)
        self.assertIn("image='/business/media/a.svg'",changed)
    def test_thankyou_excluded(self):
        name='request-quote/thank-you/index.html'; self.cfg['public_files'].append(name)
        p=self.source/name; p.parent.mkdir(parents=True); p.write_text((self.source/'index.html').read_text().replace('https://old.example/old/"','https://old.example/old/request-quote/thank-you/"'))
        result=self.run_build(); self.assertTrue(result['seo_valid'],result)
        self.assertIn('noindex',(self.root/'output/site'/name).read_text())
        self.assertNotIn('thank-you',(self.root/'output/site/sitemap.xml').read_text())
    def test_legacy_fragment(self):
        self.cfg['forbidden_url_fragments']=['/retired.php']
        p=self.source/'index.html'; p.write_text(p.read_text().replace('</body>','<a href="https://other.example/retired.php">Legacy</a></body>'))
        result=self.run_build(); self.assertTrue(any('legacy URL' in x for x in result['errors']))
    def test_unsafe_base(self):
        for base in ['/../secret','/%2e%2e','//double','relative','/path?x=1']:
            self.cfg['base_path']=base
            with self.assertRaises(ValueError): self.run_build()
    def test_malformed_config(self):
        self.path.write_text('{broken')
        with self.assertRaises(ValueError): build_seo.build('preview',self.path,self.root/'out')

if __name__=='__main__': unittest.main()
