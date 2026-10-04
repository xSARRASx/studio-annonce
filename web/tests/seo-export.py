"""Check the generated public SEO surface, not source-code snapshots.
Run from web/: python3 tests/seo-export.py [out-directory]
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out').resolve()
ORIGIN = 'https://studioannonce.fr'
errors = []

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.tags = []
        self.title = ''
        self.in_title = False
        self.jsonld = []
        self.ld = None
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == 'title': self.in_title = True
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.ld = ''

    def handle_data(self, text):
        if self.in_title: self.title += text
        if self.ld is not None: self.ld += text

    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script' and self.ld is not None:
            self.jsonld.append(json.loads(self.ld))
            self.ld = None

    def attrs(self, tag):
        return [attrs for name, attrs in self.tags if name == tag]

    def meta(self, name):
        return [a.get('content', '') for a in self.attrs('meta') if a.get('name', a.get('property')) == name]


def check(condition, message):
    if not condition: errors.append(message)


def file_for(url):
    path = unquote(urlparse(url).path).lstrip('/')
    candidate = ROOT / path
    return candidate / 'index.html' if not Path(path).suffix else candidate

sitemap = ET.parse(ROOT / 'sitemap.xml')
urls = [node.text for node in sitemap.findall('./{*}url/{*}loc')]
check(len(urls) == len(set(urls)), 'Duplicate sitemap URLs')
pages = {}
incoming = {url: set() for url in urls}
for url in urls:
    check(url.startswith(ORIGIN + '/'), f'Unexpected origin: {url}')
    check(not any(urlparse(url).path.startswith(prefix) for prefix in ['/app/', '/connexion/', '/demo/', '/mobile']), f'Private/demo URL in sitemap: {url}')
    target = file_for(url)
    check(target.is_file(), f'Missing exported page: {url}')
    if not target.is_file(): continue
    page = pages[url] = Page(target)
    check(bool(page.title.strip()), f'Missing title: {url}')
    check(len(page.meta('description')) == 1 and bool(page.meta('description')[0]), f'Description missing/duplicated: {url}')
    check(len(page.attrs('h1')) == 1, f'Expected one H1: {url}')
    check([a.get('href') for a in page.attrs('link') if a.get('rel') == 'canonical'] == [url], f'Canonical mismatch: {url}')
    check(not any('noindex' in r for r in page.meta('robots')), f'Noindex in sitemap: {url}')
    check(page.attrs('html')[0].get('lang') == 'fr', f'Language mismatch: {url}')
    for image in page.attrs('img'):
        check('alt' in image, f'Missing alt attribute: {url}')
    for asset in [a.get('src') for a in page.attrs('img')] + page.meta('og:image'):
        if not asset: continue
        resolved = urljoin(url, asset)
        if urlparse(resolved).netloc == urlparse(ORIGIN).netloc:
            check(file_for(resolved).is_file(), f'Missing image {asset} in {url}')
    for source in page.attrs('source'):
        for candidate in source.get('srcset', '').split(','):
            asset = candidate.strip().split(' ')[0]
            if asset:
                resolved = urljoin(url, asset)
                if urlparse(resolved).netloc == urlparse(ORIGIN).netloc:
                    check(file_for(resolved).is_file(), f'Missing responsive image {asset} in {url}')
    for link in page.attrs('a'):
        resolved = urljoin(url, link.get('href', ''))
        parsed = urlparse(resolved)
        if parsed.netloc != urlparse(ORIGIN).netloc: continue
        destination = f'{parsed.scheme}://{parsed.netloc}{parsed.path}'
        if destination in incoming and destination != url: incoming[destination].add(url)
        check(not parsed.path.startswith('/demo/'), f'Public page links to duplicate/demo route: {resolved} in {url}')
        check(file_for(resolved).is_file(), f'Broken internal link {resolved} in {url}')
        if parsed.fragment and parsed.path == urlparse(url).path:
            check(any(a.get('id') == unquote(parsed.fragment) for _, a in page.tags), f'Broken fragment {resolved}')

check(len({p.title for p in pages.values()}) == len(pages), 'Duplicate titles among canonical public pages')
check(len({p.meta('description')[0] for p in pages.values()}) == len(pages), 'Duplicate descriptions among canonical public pages')
for url, sources in incoming.items():
    check(bool(sources), f'Public page has no incoming link from another sitemap page: {url}')
for alias, canonical in {'/demo/tarifs/': '/tarifs/', '/demo/aide/': '/aide/', '/demo/exemples/': '/exemples/'}.items():
    duplicate = Page(ROOT / alias.lstrip('/') / 'index.html')
    check([a.get('href') for a in duplicate.attrs('link') if a.get('rel') == 'canonical'] == [ORIGIN + canonical], f'Duplicate route canonical mismatch: {alias}')
studio_demo = Page(ROOT / 'demo/index.html')
check(any('noindex' in value for value in studio_demo.meta('robots')), 'Studio demonstration route must not be indexed')
check(not any(a.get('rel') == 'canonical' and a.get('href') == ORIGIN + '/' for a in studio_demo.attrs('link')), 'Studio demonstration must not claim the public homepage canonical')
for private in [ROOT / 'connexion/index.html', ROOT / 'mobile-preview/index.html', *(ROOT / 'app').glob('**/index.html')]:
    page = Page(private)
    check(any('noindex' in value for value in page.meta('robots')), f'Private or preview route without noindex: {private.relative_to(ROOT)}')
robots = (ROOT / 'robots.txt').read_text()
for noindex_path in ['/app/', '/connexion/', '/mobile-preview/']:
    check(f'Disallow: {noindex_path}' not in robots, f'robots.txt hides noindex on {noindex_path}')
check('Sitemap: ' + ORIGIN + '/sitemap.xml' in robots, 'robots.txt sitemap missing')
blog_urls = {url for url in urls if '/blog/' in url and url != ORIGIN + '/blog/'}
exported_blog_urls = {ORIGIN + '/blog/' + p.parent.name + '/' for p in (ROOT / 'blog').glob('*/index.html')}
check(blog_urls == exported_blog_urls, 'Blog export and sitemap disagree (missing or unintended draft route)')
index = pages[ORIGIN + '/blog/']
index_links = {urljoin(ORIGIN, a.get('href', '')) for a in index.attrs('a')}
check(blog_urls <= index_links, 'An article is missing from the blog index')
index_list = next((item.get('mainEntity', {}) for item in index.jsonld if item.get('@type') == 'CollectionPage'), {})
check({entry['url'] for entry in index_list.get('itemListElement', [])} == blog_urls, 'Blog structured list mismatch')
for url in blog_urls:
    page = pages[url]
    graph = [entry for item in page.jsonld for entry in item.get('@graph', [])]
    posting = next((entry for entry in graph if entry.get('@type') == 'BlogPosting'), {})
    check(posting.get('mainEntityOfPage', {}).get('@id') == url, f'BlogPosting URL mismatch: {url}')
    check(bool(posting.get('headline')), f'Incomplete BlogPosting: {url}')
    visible_dates = [item.get('datetime') for item in page.attrs('time') if item.get('datetime')]
    published_date = posting.get('datePublished', '')
    check(bool(published_date) == bool(visible_dates), f'Visible and structured publication dates disagree: {url}')
    if published_date:
        check(visible_dates == [published_date[:10]], f'Publication date mismatch: {url}')
    check(page.meta('og:url') == [url], f'Open Graph URL mismatch: {url}')
    check(bool(page.meta('twitter:card')), f'Social preview missing: {url}')
    if posting.get('image'):
        check(page.meta('og:image') == [posting['image']], f'Article/OG image mismatch: {url}')
    else:
        check(page.meta('twitter:card') == ['summary'], f'Text-only article card mismatch: {url}')
    check(any(a.get('aria-label') == 'Sommaire de l’article' for a in page.attrs('nav')), f'Missing article navigation: {url}')
    check(any(entry.get('@type') == 'BreadcrumbList' for entry in graph), f'Missing breadcrumb schema: {url}')

home_graph = [entry for item in pages[ORIGIN + '/'].jsonld for entry in item.get('@graph', [])]
check(any(item.get('@type') == 'WebSite' and item.get('url') == ORIGIN + '/' for item in home_graph), 'Missing website identity')
check(any(item.get('@id') == ORIGIN + '/#organization' for item in home_graph), 'Missing organization identity')

image_urls = set()
for entry in sitemap.findall('./{*}url'):
    url = entry.find('{*}loc').text
    listed = [node.text for node in entry.findall('{http://www.google.com/schemas/sitemap-image/1.1}image/{http://www.google.com/schemas/sitemap-image/1.1}loc')]
    for image in listed:
        image_urls.add(image)
        check(image.startswith(ORIGIN + '/demo/exemples/'), f'Unexpected sitemap image: {image}')
        check(file_for(image).is_file(), f'Missing sitemap image: {image}')
        check(any(urljoin(url, a.get('src', '')) == image for a in pages[url].attrs('img')), f'Sitemap image not present on its page: {image} in {url}')
    if url.startswith(ORIGIN + '/exemples/') and url != ORIGIN + '/exemples/':
        check(len(listed) == 2, f'Example must list its original and result images: {url}')

report = {'pages': len(pages), 'articles': len(blog_urls), 'sitemapImages': len(image_urls), 'errors': errors}
print(json.dumps(report, ensure_ascii=False, indent=2))
sys.exit(1 if errors else 0)
