"""Read-only HTTP checks for the public SEO surface (run against a built preview)."""
import argparse
import concurrent.futures
import json
from html.parser import HTMLParser
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.meta, self.links, self.anchors, self.images = [], [], [], []
        self.h1_count = 0
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == 'meta': self.meta.append(data)
        elif tag == 'link': self.links.append(data)
        elif tag == 'a': self.anchors.append(data)
        elif tag == 'img': self.images.append(data)
        elif tag == 'h1': self.h1_count += 1

    def metas(self, name):
        return [item.get('content', '') for item in self.meta if item.get('name', item.get('property')) == name]


def get(base, path):
    try:
        response = urllib.request.build_opener(NoRedirect).open(base + path, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    return response.status, response.read(), dict(response.headers)


def verify(base, canonical_origin):
    status, body, _ = get(base, '/sitemap.xml')
    assert status == 200, ('sitemap status', status)
    root = ET.fromstring(body)
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'x': 'http://www.w3.org/1999/xhtml'}
    urls = [entry.find('s:loc', ns).text for entry in root]
    assert len(urls) == len(set(urls)), 'Duplicate sitemap URLs'
    paths = [urllib.parse.urlparse(url).path for url in urls]
    assert all(url.startswith(canonical_origin + '/') for url in urls), 'Wrong canonical origin'
    assert not {'/guest-post', '/zh/guest-post'} & set(paths)
    for entry in root:
        alternates = entry.findall('x:link', ns)
        assert sorted(item.attrib['hreflang'] for item in alternates) == ['en', 'x-default', 'zh']
        assert len({(item.attrib['hreflang'], item.attrib['href']) for item in alternates}) == 3
    for path in paths:
        assert path == '/' or not path.endswith('/'), ('Trailing slash', path)
        assert not urllib.parse.urlparse(path).query
    slugs = ['golden-hour-hero', 'emerald-saree', 'midnight-city', 'diwali-glow', 'sunset-together', 'pink-editorial', 'cinematic-push', 'night-drive', 'living-memory']
    for slug in slugs:
        for prefix in ['', '/zh']:
            assert f'{prefix}/template/{slug}' in paths
    for prefix in ['', '/zh']:
        for suffix in ['/create', '/create/image', '/create/video']:
            assert prefix + suffix in paths

    status, body, _ = get(base, '/robots.txt')
    robots = body.decode()
    assert status == 200 and 'Disallow: /*?*' not in robots
    for prefix in ['', '/zh']:
        for private in ['/admin', '/settings', '/api/', '/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/verify-email']:
            assert 'Disallow: ' + prefix + private in robots

    all_paths = list(dict.fromkeys(paths + ['/guest-post', '/zh/guest-post', '/blog', '/zh/blog']))
    results, image_sources = [], set()
    def check(path):
        status, body, _ = get(base, path)
        assert status == 200, ('Expected direct 200 without redirect', path, status)
        source = body.decode()
        page = Page(source)
        zh = path == '/zh' or path.startswith('/zh/')
        canonical = [item['href'] for item in page.links if item.get('rel') == 'canonical']
        assert canonical == [canonical_origin + path], ('Canonical', path, canonical)
        alternates = [item for item in page.links if item.get('rel') == 'alternate']
        assert sorted(item.get('hreflang') for item in alternates) == ['en', 'x-default', 'zh'], ('Alternates', path)
        english_path = path[3:] or '/' if zh else path
        expected = {'en': canonical_origin + english_path, 'x-default': canonical_origin + english_path, 'zh': canonical_origin + ('/zh' if english_path == '/' else '/zh' + english_path)}
        assert {item['hreflang']: item['href'] for item in alternates} == expected, ('Alternate target', path)
        assert page.metas('og:locale') == ['zh_CN' if zh else 'en_US'], ('OG locale', path)
        assert len(page.metas('description')) == 1 and page.metas('description')[0]
        assert page.h1_count == 1, ('H1 count', path, page.h1_count)
        directives = ','.join(page.metas('robots'))
        if path in ['/guest-post', '/zh/guest-post']:
            assert 'noindex' in directives
        elif path in ['/blog', '/zh/blog']:
            assert ('noindex' not in directives) == (path in paths), ('Blog sitemap/indexing mismatch', path)
        else:
            assert 'noindex' not in directives, ('Unexpected noindex', path)
        for item in page.anchors:
            href = item.get('href', '')
            if href.startswith('/'):
                target = urllib.parse.urlparse(href)
                assert target.path == '/' or not target.path.endswith('/'), ('Trailing slash link', path, href)
                assert target.path not in ['/guest-post', '/zh/guest-post'], ('Guest-post link', path)
        template_links = {urllib.parse.urlparse(a.get('href', '')).path for a in page.anchors if '/template/' in a.get('href', '')}
        if '/template/' in path:
            assert len(template_links) == 8, ('Related links', path, template_links)
            examples = [image for image in page.images if image.get('src', '').startswith('/imgs/vikas/')]
            assert len(examples) == 3 and len({image['src'] for image in examples}) == 3
            assert all(image.get('alt') for image in examples)
            assert 'class="vikas-template-prompt"' in source and 'id="prompt"' in source
            assert any(urllib.parse.urlparse(a.get('href', '')).path in ['/create', '/zh/create'] for a in page.anchors)
        elif path in ['/', '/zh']:
            assert len(template_links) == 9, ('Homepage discovery links', path)
        return {'path': path, 'status': status, 'robots': directives or 'index (default)', 'og_locale': page.metas('og:locale')[0]}, [image['src'] for image in page.images if image.get('src', '').startswith('/imgs/vikas/')]

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result, images in pool.map(check, all_paths):
            results.append(result)
            image_sources.update(images)
    for src in sorted(image_sources):
        status, body, headers = get(base, src)
        assert status == 200 and body, ('Image missing', src, status)
        assert headers.get('Content-Type', headers.get('content-type', '')).startswith('image/'), ('Image MIME', src)
    status, _, _ = get(base, '/template/not-a-real-template')
    assert status == 404, ('Unknown template must be 404', status)
    return {'sitemap_count': len(urls), 'sitemap_urls': urls, 'pages': results, 'images_checked': len(image_sources), 'status': 'passed'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://127.0.0.1:4175')
    parser.add_argument('--canonical-origin', default='https://vikas-editor.net')
    parser.add_argument('--report')
    args = parser.parse_args()
    report = verify(args.base_url.rstrip('/'), args.canonical_origin.rstrip('/'))
    if args.report:
        Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k not in ['sitemap_urls', 'pages']}))
