"""Editable content for the site, without a page builder.

Pages are finished HTML. Elements that editors may change carry a marker attribute:

  data-c="key"          the element's text (inline: **bold**, *red word*, new line = <br>)
  data-c-text="key"     only the element's own text, icons inside it stay
  data-c-attr="href:key;src:key2"   attribute values
  data-c-img="key"      an <img>: {"src", "phone"?, "alt"?}; phone fills srcset / <picture><source>
  data-c-list="key"     a repeated block: each child element is one item, markers inside use keys
                        relative to the item; new items copy the first item's markup.
                        data-c-skip="1" leaves the first child (a group heading) out of the list

Keys starting with "site." live in content/site.json (shared by every Market page);
other keys live in content/pages/<page>.json. Links are stored as if written from the site
root ("cars.html", "auction/index.html"); images as "/assets/...".

  python3 tools/cms.py extract   pages -> content/*.json   (run once after adding markers)
  python3 tools/cms.py apply     content/*.json -> pages
  python3 tools/cms.py apply content/pages/glob.json   only what one save changed (the GitHub job does this)
  python3 tools/cms.py check     apply to memory, report pages that would change
  python3 tools/cms.py manifest  content/manifest.json for the on-page editor (?edit on any page)
  python3 tools/cms.py pull      download content/ from the published repo (run before publishing)
"""
import html
import posixpath
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
REPO = "N4p100/global-market-preview"
SITE_URL = "https://n4p100.github.io/global-market-preview/"
SAVE_URL = "https://finder-production-48b14990.up.railway.app/api/site-save"  # password saving (ai-assistant: src/app/api/site-save)

# page id -> (html files to write, label). Several files may share one content file.
PAGES = {
    "home": (["index.html"], "მთავარი (Market)"),
    "cars": (["cars.html"], "ყველა ავტომობილი"),
    "car": (["car.html"], "ავტომობილის გვერდი"),
    "favorites": (["favorites.html"], "რჩეულები"),
    "compare": (["compare.html"], "შედარება"),
    "about": (["about.html"], "ჩვენს შესახებ"),
    "contact": (["contact.html"], "კონტაქტი"),
    "sell": (["sell.html"], "ავტომობილის გაყიდვა"),
    "leasing": (["leasing.html"], "ლიზინგი"),
    "sold": (["sold.html"], "გაყიდული ავტომობილები"),
    "notfound": (["404.html"], "404 გვერდი"),
    "auction": (["auction/index.html"], "აუქციონი"),
    "lot": (["auction/lot.html"], "აუქციონის ლოტი"),
    "rules": (["auction/rules.html"], "აუქციონის წესები"),
    "glob": (["glob/index.html", "pages/glob/index.html"], "იმპორტი: მთავარი (glob.ge)"),
    "glob-transport": (["glob/transport.html", "pages/glob/transport.html"], "იმპორტი: ტრანსპორტირების კალკულატორი"),
    "glob-customs": (["glob/customs.html", "pages/glob/customs.html"], "იმპორტი: განბაჟების კალკულატორი"),
    "glob-tracking": (["glob/tracking.html", "pages/glob/tracking.html"], "იმპორტი: კონტეინერის ძიება"),
    "glob-documents": (["glob/documents.html", "pages/glob/documents.html"], "იმპორტი: საბუთის შემოწმება"),
    "glob-call": (["glob/call.html", "pages/glob/call.html"], "იმპორტი: მოითხოვე ზარი"),
    "glob-partner": (["glob/partner.html", "pages/glob/partner.html"], "იმპორტი: პარტნიორობა"),
    "glob-about": (["glob/about.html", "pages/glob/about.html"], "იმპორტი: ჩვენ შესახებ"),
    "glob-career": (["glob/career.html", "pages/glob/career.html"], "იმპორტი: კარიერა"),
    "glob-contact": (["glob/contact.html", "pages/glob/contact.html"], "იმპორტი: კონტაქტი და ოფისები"),
}
SHARED_LABEL = "საერთო: მენიუ, ფუტერი, კონტაქტი (Market)"

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
ABS = re.compile(r"^(?:[a-z][a-z0-9+.-]*:|//|#|\?)", re.I)


class Node:
    __slots__ = ("tag", "attrs", "s", "se", "es", "e", "kids")

    def __init__(self, tag, attrs, s, se):
        self.tag, self.attrs, self.s, self.se = tag, dict(attrs), s, se
        self.es = self.e = se
        self.kids = []


class Tree(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.ls = [0]
        for m in re.finditer("\n", src):
            self.ls.append(m.end())
        self.root = Node("#root", [], 0, 0)
        self.root.es = self.root.e = len(src)
        self.stack = [self.root]
        self.feed(src)
        self.close()

    def off(self):
        line, col = self.getpos()
        return self.ls[line - 1] + col

    def handle_starttag(self, tag, attrs, void=False):
        s = self.off()
        n = Node(tag, attrs, s, s + len(self.get_starttag_text()))
        self.stack[-1].kids.append(n)
        if not void and tag not in VOID:
            self.stack.append(n)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs, void=True)

    def handle_endtag(self, tag):
        s = self.off()
        e = self.src.index(">", s) + 1
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                for n in self.stack[i + 1:]:  # unclosed children end where their parent ends
                    n.es = n.e = s
                node = self.stack[i]
                node.es, node.e = s, e
                del self.stack[i:]
                return


# ---------- values <-> html ----------

INLINE = re.compile(r'<b>(.*?)</b>|<span class="red-w">(.*?)</span>|<a class="link" href="([^"]*)">(.*?)</a>|<br\s*/?>', re.S)
MDLINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")


def html_to_text(frag, where, pdir=0):
    def sub(m):
        if m.group(1) is not None:
            return "**" + m.group(1) + "**"
        if m.group(2) is not None:
            return "*" + m.group(2) + "*"
        if m.group(3) is not None:
            return "[" + m.group(4) + "](" + url_out(html.unescape(m.group(3)), pdir) + ")"
        return "\n"
    out = INLINE.sub(sub, frag)
    if "<" in out:
        raise SystemExit(f"{where}: only text, <b> and red words can be marked editable, found: {frag[:120]!r}")
    return html.unescape(out)


def text_to_html(text, pdir=0):
    t = html.escape(str(text), quote=False)
    t = MDLINK.sub(lambda m: '<a class="link" href="' + html.escape(url_in(html.unescape(m.group(2)), pdir), quote=True) + '">' + m.group(1) + "</a>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t, flags=re.S)
    t = re.sub(r"\*(.+?)\*", r'<span class="red-w">\1</span>', t, flags=re.S)
    return t.replace("\n", "<br>")


def split_url(v):
    m = re.match(r"([^?#]*)(.*)", v, re.S)
    return m.group(1), m.group(2)


def url_out(v, pdir, image=False):
    """page attribute -> stored value: relative links become paths from the site root"""
    v = v.strip()
    if not v or ABS.match(v) or v.startswith("/"):
        return v
    path, rest = split_url(v)
    full = posixpath.normpath(posixpath.join(pdir, path)) if path else pdir
    if full.startswith(".."):
        return v
    return ("/" if image else "") + full + rest


def url_in(v, pdir):
    """stored value -> page attribute, relative to the page's folder"""
    v = str(v).strip()
    if not v or (ABS.match(v) and not v.startswith("/")) or v.startswith("//"):
        return v
    path, rest = split_url(v.lstrip("/"))
    return posixpath.relpath(path, pdir or ".") + rest


def srcset_out(v, pdir):
    return ", ".join(" ".join([url_out(p.split()[0], pdir, True)] + p.split()[1:]) for p in v.split(",") if p.strip())


def set_attr(tag_src, name, value):
    esc = html.escape(value, quote=True).replace("&#x27;", "'")
    pat = re.compile(r'(\s%s=)"[^"]*"' % re.escape(name))
    if pat.search(tag_src):
        return pat.sub(lambda m: m.group(1) + '"' + esc + '"', tag_src, count=1)
    end = -2 if tag_src.endswith("/>") else -1
    return tag_src[:end] + f' {name}="{esc}"' + tag_src[end:]


def gaps(n):
    """direct text runs of a node, as (start, end)"""
    pos, out = n.se, []
    for k in n.kids:
        out.append((pos, k.s))
        pos = k.e
    out.append((pos, n.es))
    return out


# ---------- key paths ----------

def resolve(key, ctx, site):
    if key.startswith("site."):
        return site, key[5:].split(".")
    return ctx, key.split(".")


def get(key, ctx, site):
    d, parts = resolve(key, ctx, site)
    for p in parts:
        if not isinstance(d, dict) or p not in d:
            return None
        d = d[p]
    return d


def put(key, value, ctx, site, where, clash):
    d, parts = resolve(key, ctx, site)
    for p in parts[:-1]:
        d = d.setdefault(p, {})
    last = parts[-1]
    if last in d and d[last] != value:
        if key.startswith("site."):
            clash.append(f"{where}: {key} differs between pages: {d[last]!r} vs {value!r}")
        else:
            clash.append(f"{where}: {key} is used twice with different values")
    d.setdefault(last, value)


def parse_attr_spec(spec):
    return [tuple(x.split(":", 1)) for x in spec.split(";") if x.strip()]


# ---------- the walk ----------

def parse_fields(spec):
    out = []
    for part in (spec or "").split(";"):
        if part.strip():
            bits = part.strip().split(":")
            out.append((bits[0], bits[1], bits[2] if len(bits) > 2 else "c"))
    return out


def matches(n, sel):
    tag, _, cls = sel.partition(".")
    if tag and n.tag != tag:
        return False
    return not cls or cls in (n.attrs.get("class") or "").split()


def walk(src, pdir, ctx, site, mode, where, clash, auto=None):
    """mode 'extract' fills ctx/site from src; mode 'apply' returns new src from ctx/site."""
    tree = Tree(src)
    edits = []

    def img_value(n, sources):
        v = {"src": url_out(n.attrs.get("src", ""), pdir, True)}
        if sources:
            v["phone"] = url_out(sources[0].attrs.get("srcset", ""), pdir, True)
        elif n.attrs.get("srcset"):
            small = [p.split()[0] for p in n.attrs["srcset"].split(",") if p.strip() and p.split()[0] != n.attrs.get("src")]
            if small:
                v["phone"] = url_out(small[0], pdir, True)
        if n.attrs.get("alt"):
            v["alt"] = n.attrs["alt"]
        return v

    def img_edits(n, parent, key):
        sources = [k for k in parent.kids if k.tag == "source"] if parent is not None and parent.tag == "picture" else []
        cur = img_value(n, sources)
        if mode == "extract":
            put(key, cur, ctx, site, where, clash)
            return
        val = get(key, ctx, site)
        if not isinstance(val, dict) or not val.get("src"):
            return
        if {k: v for k, v in val.items() if v} == cur:
            return
        big, phone = url_in(val["src"], pdir), url_in(val.get("phone") or "", pdir)
        tag = set_attr(src[n.s:n.se], "src", big)
        if "srcset" in n.attrs:
            tag = set_attr(tag, "srcset", f"{phone} 1200w, {big} 2400w" if phone else big)
        if "alt" in val or "alt" in n.attrs:
            tag = set_attr(tag, "alt", val.get("alt") or "")
        edits.append((n.s, n.se, tag))
        for so in sources:
            edits.append((so.s, so.se, set_attr(src[so.s:so.se], "srcset", phone or big)))

    used = set()

    def effective(n):
        a = dict(n.attrs)
        for i, (sel, key, how) in enumerate(auto or []):
            if i in used or not matches(n, sel):
                continue
            used.add(i)
            if how == "c":
                a["data-c"] = key
            elif how == "text":
                a["data-c-text"] = key
            elif how == "img":
                a["data-c-img"] = key
            else:
                a["data-c-attr"] = (a.get("data-c-attr", "") + ";" + how + ":" + key).strip(";")
        return a

    def visit(n, parent):
        a = effective(n)
        if "data-c-img" in a:
            img_edits(n, parent, a["data-c-img"])
        if "data-c-attr" in a:
            tag = src[n.s:n.se]
            for name, key in parse_attr_spec(a["data-c-attr"]):
                is_url = name in ("href", "src", "srcset")
                raw = a.get(name) or ""
                if name == "srcset":
                    cur = srcset_out(raw, pdir)
                elif is_url:
                    cur = url_out(raw, pdir, name == "src")
                else:
                    cur = raw
                if mode == "extract":
                    put(key, cur, ctx, site, where, clash)
                else:
                    v = get(key, ctx, site)
                    if v is not None and str(v) != cur:
                        tag = set_attr(tag, name, url_in(v, pdir) if is_url else str(v))
            if mode == "apply":
                edits.append((n.s, n.se, tag))
        if "data-c" in a:
            key = a["data-c"]
            cur = html_to_text(src[n.se:n.es], f"{where} [{key}]", pdir)
            if mode == "extract":
                put(key, cur, ctx, site, where, clash)
            else:
                v = get(key, ctx, site)
                if v is not None and str(v) != cur:
                    edits.append((n.se, n.es, text_to_html(v, pdir)))
            return
        if "data-c-text" in a:
            key = a["data-c-text"]
            run = next(((s, e) for s, e in gaps(n) if src[s:e].strip()), None)
            if run is None:
                raise SystemExit(f"{where}: [{key}] has no text of its own")
            s, e = run
            raw = src[s:e]
            lead, core, trail = raw[:len(raw) - len(raw.lstrip())], raw.strip(), raw[len(raw.rstrip()):]
            cur = html_to_text(core, f"{where} [{key}]", pdir)
            if mode == "extract":
                put(key, cur, ctx, site, where, clash)
            else:
                v = get(key, ctx, site)
                if v is not None and str(v) != cur:
                    edits.append((s, e, lead + text_to_html(v, pdir) + trail))
            return
        if "data-c-list" in a:
            key = a["data-c-list"]
            skip = int(a.get("data-c-skip") or 0)
            for k in n.kids[:skip]:
                visit(k, n)
            items = n.kids[skip:]
            fields = parse_fields(a.get("data-c-fields"))
            if not items:
                if mode == "extract":
                    raise SystemExit(f"{where}: list [{key}] is empty")
                return  # a source page whose list the build fills in later
            if mode == "extract":
                vals = []
                for it in items:
                    item_ctx = {}
                    walk(src[it.s:it.e], pdir, item_ctx, site, "extract", f"{where} [{key}]", clash, fields)
                    vals.append(item_ctx)
                put(key, vals, ctx, site, where, clash)
                return
            vals = get(key, ctx, site)
            if not isinstance(vals, list) or not vals:
                return
            sep = src[items[0].e:items[1].s] if len(items) > 1 else ""
            out = []
            for i, v in enumerate(vals):
                if i < len(items):
                    tpl = src[items[i].s:items[i].e]
                else:
                    tpl = re.sub(r'data-mcount="[^"]*"', 'data-mcount=""', src[items[0].s:items[0].e])
                out.append(walk(tpl, pdir, v if isinstance(v, dict) else {}, site, "apply", f"{where} [{key}]", clash, fields))
            edits.append((items[0].s, items[-1].e, sep.join(out)))
            return
        for k in n.kids:
            visit(k, n)

    for k in tree.root.kids:
        visit(k, None)
    if mode == "extract":
        return None
    edits.sort()
    out, pos = [], 0
    for s, e, t in edits:
        if s < pos:
            raise SystemExit(f"{where}: overlapping markers near {src[s:s + 80]!r}")
        out.append(src[pos:s])
        out.append(t)
        pos = e
    out.append(src[pos:])
    return "".join(out)


# ---------- page sections: order, hide, delete, copy, new blocks ----------
# Top-level blocks of <main> carry data-c-sec="id". The page's "_layout" lists them in order:
#   {"id": "s2"}  {"id": "s3", "hide": true}  {"id": "s4", "deleted": true}
#   {"id": "n-k3j9", "type": "text"}   a new block from content/blocks.json
#   {"id": "c-8fd2", "from": "s2"}     a copy of block s2
# Sections the layout does not mention stay where they were (a section added by hand is never lost).

def find_main(n):
    for k in n.kids:
        if k.tag == "main":
            return k
        f = find_main(k)
        if f:
            return f
    return None


def page_root(pdir):
    return "../" * len(pdir.split("/")) if pdir else ""


def prefix_keys(markup, prefix):
    """a copied or new block gets its own keys: title -> n-k3j9.title (keys inside list items stay relative)"""
    tree = Tree(markup)
    edits = []

    def walk(n, in_item):
        if not in_item:
            tag = new = markup[n.s:n.se]
            for attr in ("data-c", "data-c-text", "data-c-img", "data-c-list"):
                v = n.attrs.get(attr)
                if v and not v.startswith("site."):
                    new = set_attr(new, attr, prefix + "." + v)
            spec = n.attrs.get("data-c-attr")
            if spec:
                new = set_attr(new, "data-c-attr", ";".join(
                    f"{a}:{k if k.startswith('site.') else prefix + '.' + k}" for a, k in parse_attr_spec(spec)))
            new = re.sub(r'\sid="[^"]*"', "", new, count=1)
            if new != tag:
                edits.append((n.s, n.se, new))
        lst = "data-c-list" in n.attrs
        skip = int(n.attrs.get("data-c-skip") or 0)
        for i, k in enumerate(n.kids):
            walk(k, in_item or (lst and i >= skip))

    for k in tree.root.kids:
        walk(k, False)
    for s_, e_, t in sorted(edits, reverse=True):
        markup = markup[:s_] + t + markup[e_:]
    return markup


def first_tag(markup, fn):
    m = re.match(r"\s*<[^>]+>", markup)
    return markup[:m.start()] + fn(markup[m.start():m.end()]) + markup[m.end():]


def set_hidden(markup, hide):
    def fn(tag):
        tag = re.sub(r'\sdata-c-hide(="[^"]*")?', "", tag)
        return tag[:-1] + ' data-c-hide="1">' if hide else tag
    return first_tag(markup, fn)


def block_markup(btype, sid, pdir):
    blocks = load(CONTENT / "blocks.json")
    b = blocks.get(btype)
    if not b:
        return None
    m = b["html"].replace("{root}", page_root(pdir))
    m = prefix_keys(m, sid)
    return first_tag(m, lambda t: set_attr(t, "data-c-sec", sid))


def layout_read(src):
    tree = Tree(src)
    main = find_main(tree.root)
    if not main:
        return None
    lay = [{"id": k.attrs["data-c-sec"], **({"hide": True} if "data-c-hide" in k.attrs else {})} for k in main.kids if "data-c-sec" in k.attrs]
    return lay or None


def layout_apply(src, lay, pdir):
    if not lay:
        return src
    tree = Tree(src)
    main = find_main(tree.root)
    if not main:
        return src
    kids = main.kids
    order, seg, node = [], {}, {}
    for k in kids:
        sid = k.attrs.get("data-c-sec")
        if sid:
            order.append(sid)
            seg[sid] = [k.s, k.e]
            node[sid] = k
        elif order:
            seg[order[-1]][1] = k.e  # a spacer between blocks moves with the block before it
    if not order:
        return src
    last = node[order[-1]]
    seg[order[-1]][1] = last.e  # spacers after the last block stay at the bottom
    start, end = seg[order[0]][0], seg[order[-1]][1]
    markup = {sid: src[a:b] for sid, (a, b) in seg.items()}
    out, known = [], set()
    for e in lay:
        sid = e.get("id")
        known.add(sid)
        if not sid or e.get("deleted"):
            continue
        if sid in markup:
            m = markup[sid]
        elif e.get("type"):
            m = block_markup(e["type"], sid, pdir)
        elif e.get("from") in node:
            n = node[e["from"]]
            m = first_tag(prefix_keys(src[n.s:n.e], sid), lambda t: set_attr(t, "data-c-sec", sid))
        else:
            m = None
        if m is None:
            continue
        out.append([sid, set_hidden(m, e.get("hide"))])
    for i, sid in enumerate(order):  # blocks the layout does not know about keep their place
        if sid in known:
            continue
        ids = [x[0] for x in out]
        pos = ids.index(order[i - 1]) + 1 if i and order[i - 1] in ids else 0
        out.insert(pos, [sid, markup[sid]])
    if [x[0] for x in out] == order and all(m == markup[sid] for sid, m in out):
        return src
    gaps_ = [src[seg[order[i]][1]:seg[order[i + 1]][0]] for i in range(len(order) - 1)]
    sep = max(set(gaps_), key=gaps_.count) if gaps_ else "\n\n  "
    if sep.strip():
        sep = "\n\n  "
    return src[:start] + sep.join(m for _, m in out) + src[end:]


def dir_of(rel):
    return posixpath.dirname(rel)


def load(p):
    return json.loads(p.read_text()) if p.exists() else {}


def dump(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def extract():
    site, clash = {}, []
    for pid, (files, _) in PAGES.items():
        ctx = {}
        f = files[0]
        src = (ROOT / f).read_text()
        walk(src, dir_of(f), ctx, site, "extract", f, clash)
        lay = layout_read(src)
        if lay:
            ctx["_layout"] = lay
        dump(CONTENT / "pages" / f"{pid}.json", ctx)
    dump(CONTENT / "site.json", site)
    for c in clash:
        print("WARN", c)
    print("extracted", len(PAGES), "pages")


def apply(write=True, changed_files=None):
    """changed_files: content files a CMS save touched. Then only those values are written, so a page
    someone edited by hand is never reset by a save on another page. None = write everything."""
    only_pages = site_changed = None
    if changed_files is not None:
        names = [Path(f).as_posix() for f in changed_files]
        site_changed = "content/site.json" in names
        only_pages = {Path(n).stem for n in names if n.startswith("content/pages/")}
    site = load(CONTENT / "site.json") if site_changed is not False else {}
    changed = []
    for pid, (files, _) in PAGES.items():
        if only_pages is not None and pid not in only_pages and not site_changed:
            continue
        ctx = load(CONTENT / "pages" / f"{pid}.json") if only_pages is None or pid in only_pages else {}
        for f in files:
            p = ROOT / f
            if not p.exists():
                continue
            src = p.read_text()
            # the glob source page keeps its {{V}} placeholders; pdir follows the built page
            out = layout_apply(src, ctx.get("_layout"), dir_of(files[0]))
            out = walk(out, dir_of(files[0]), ctx, site, "apply", f, [])
            if out != src:
                changed.append(f)
                if write:
                    p.write_text(out)
    print(("updated " if write else "would change ") + (", ".join(changed) or "nothing"))
    return changed


# ---------- admin/config.yml ----------

LABELS = {
    # sections
    "hero": "ჰერო (პირველი ეკრანი)", "steps": "ნაბიჯები", "terms": "პირობები", "figures": "ციფრები", "lines": "სახაზო კომპანიები",
    "group": "ჯგუფი", "dealers": "დილერები", "offices": "ოფისები", "menu": "მენიუ", "footer": "ფუტერი", "categories": "კატეგორიები",
    "recent": "ახლახან დამატებული", "chapter": "ფოტო-ბლოკი", "services": "სერვისები", "transit": "გზაში", "auction": "აუქციონი",
    "head": "გვერდის თავი", "contact": "კონტაქტი", "cta": "ბოლო ბლოკი", "form": "ფორმა", "calc": "კალკულატორი", "rail": "ავტომობილების რიგი",
    "rules": "წესები", "lots": "ლოტები", "sections": "ტექსტური ბლოკები", "increments": "ბიდის ბიჯი", "links": "ბმულები", "tools": "ინსტრუმენტები",
    "import": "იმპორტი", "company": "კომპანია", "market": "მარკეტი", "items": "ელემენტები", "tiles": "ბარათები", "rows": "რიგები",
    "header": "ჰედერი", "seo": "Google და გაზიარება", "tabs": "ჩანართები", "specs": "მახასიათებლები", "filters": "ფილტრები",
    # fields
    "title": "სათაური", "lead": "ქვესათაური", "text": "ტექსტი", "label": "წარწერა", "kicker": "ზედა წარწერა", "note": "შენიშვნა",
    "button": "ღილაკი", "button2": "მეორე ღილაკი", "button_link": "ღილაკის ბმული", "button2_link": "მეორე ღილაკის ბმული",
    "link": "ბმული", "link_text": "ბმულის ტექსტი", "href": "ბმული", "photo": "ფოტო", "num": "რიცხვი", "name": "სახელი", "city": "ქალაქი",
    "address": "მისამართი", "hours": "სამუშაო საათები", "phone": "ტელეფონი (ჩვენება)", "phone_full": "ტელეფონი (სრული)",
    "phone_link": "ტელეფონის ბმული (tel:)", "email": "ელფოსტა", "email_link": "ელფოსტის ბმული (mailto:)", "whatsapp": "WhatsApp ბმული",
    "map": "რუკის ბმული", "tagline": "მოკლე აღწერა", "soon": "მალე", "value": "მნიშვნელობა", "amount": "თანხა", "submit": "გაგზავნის ღილაკი",
    "description": "აღწერა", "caption": "ფოტოს წარწერა", "src": "ფოტო (კომპიუტერი)", "phone_img": "ფოტო (ტელეფონი)", "alt": "ფოტოს აღწერა",
    "badge": "ნიშანი", "heading": "სათაური", "body": "ტექსტი", "logo": "ლოგო", "lang": "ენა", "copyright": "ქვედა ხაზი", "privacy": "კონფიდენციალურობა",
    "cta_text": "ღილაკის ტექსტი", "crumb": "ნავიგაციის ტექსტი", "hint": "მინიშნება", "more": "მეტის ღილაკი",
    "auction_register": "აუქციონზე რეგისტრაციის ბმული", "branches": "ოფისების რაოდენობა", "branches_label": "ოფისების წარწერა",
    "cars_label": "წარწერა: ავტომობილი გაყიდვაში", "sessions_label": "წარწერა: აუქციონის სესიები", "sold_label": "წარწერა: გაყიდული",
    "leasing_num": "ლიზინგის შენატანი", "leasing_label": "ლიზინგის წარწერა", "warranty_num": "გარანტიის ვადა", "warranty_label": "გარანტიის წარწერა",
    "year": "დაარსების წელი", "year_label": "წლის წარწერა", "map_text": "რუკის ბმულის ტექსტი", "whatsapp_text": "WhatsApp ტექსტი",
    "market_hours": "მარკეტის სამუშაო საათები", "market_map": "მარკეტის რუკის ბმული", "market_phone": "მარკეტის ტელეფონი (მოკლე)",
    "market_phone_full": "მარკეტის ტელეფონი (სრული)", "market_phone_link": "მარკეტის ტელეფონის ბმული (tel:)", "search": "ძებნის ღილაკი",
    "steps_title": "ნაბიჯების სათაური", "share_description": "გაზიარების აღწერა", "import_phone": "იმპორტის ტელეფონი",
    "import_phone_link": "იმპორტის ტელეფონის ბმული (tel:)", "import_hours": "იმპორტის სამუშაო საათები",
}

HELP = "**სიტყვა** = მუქი, *სიტყვა* = წითელი სიტყვა, [ტექსტი](cars.html) = ბმული. ბმული საიტის ფესვიდან: cars.html, auction/index.html, glob/index.html, ან სრული https://..."


def label_for(key):
    return LABELS.get(key) or LABELS.get(re.sub(r"\d+", "", key)) or key.replace("_", " ")


def ordered(d):
    """links after the text they belong to, so the form reads top to bottom like the page"""
    return sorted(d.items(), key=lambda kv: kv[0].endswith("link") or kv[0] in ("href", "link"))


def yq(s):
    return json.dumps(s, ensure_ascii=False)


def field_yaml(name, val, ind, required=True):
    pad = " " * ind
    head = f"{pad}- name: {yq(name)}\n{pad}  label: {yq(label_for(name))}\n"
    if not required:
        head += f"{pad}  required: false\n"
    if isinstance(val, dict) and "src" in val:
        out = head + f"{pad}  widget: object\n{pad}  collapsed: true\n{pad}  fields:\n"
        out += f'{pad}    - {{ name: "src", label: {yq(LABELS["src"])}, widget: image }}\n'
        out += f'{pad}    - {{ name: "phone", label: {yq(LABELS["phone_img"])}, widget: image, required: false }}\n'
        out += f'{pad}    - {{ name: "alt", label: {yq(LABELS["alt"])}, widget: string, required: false }}\n'
        return out
    if isinstance(val, dict):
        out = head + f"{pad}  widget: object\n{pad}  fields:\n"
        for k, v in ordered(val):
            out += field_yaml(k, v, ind + 4)
        return out
    if isinstance(val, list):
        keys = {}
        for it in val:
            for k, v in (it or {}).items():
                keys.setdefault(k, v)
        out = head + f"{pad}  widget: list\n{pad}  min: 1\n"
        first = next((k for k in ("title", "name", "label", "city", "text", "num") if isinstance(keys.get(k), str)), None)
        if first:
            out += f"{pad}  summary: {yq('{{fields.' + first + '}}')}\n"
        out += f"{pad}  fields:\n"
        for k, v in ordered(keys):
            out += field_yaml(k, v, ind + 4, required=all(k in (it or {}) for it in val))
        return out
    widget = "text" if ("\n" in str(val) or len(str(val)) > 70) else "string"
    return head + f"{pad}  widget: {widget}\n"


def config():
    site = load(CONTENT / "site.json")
    y = f"""# Written by tools/cms.py config. Edit labels there, not here.
backend:
  name: github
  repo: {REPO}
  branch: main
  commit_messages:
    update: "CMS: {{{{collection}}}} · {{{{slug}}}}"
    uploadMedia: "CMS: upload {{{{path}}}}"
site_url: {SITE_URL}
media_folder: assets/uploads
public_folder: /assets/uploads
collections:
  - name: pages
    label: "გვერდები"
    description: {yq(HELP)}
    files:
"""
    entries = [("site", SHARED_LABEL, "content/site.json", site)] + [
        (pid, lab, f"content/pages/{pid}.json", load(CONTENT / "pages" / f"{pid}.json")) for pid, (_, lab) in PAGES.items()]
    for pid, lab, path, data in entries:
        if not data:
            continue
        y += f"      - name: {pid}\n        label: {yq(lab)}\n        file: {path}\n        format: json\n        fields:\n"
        for k, v in ordered(data):
            y += field_yaml(k, v, 10)
    (ROOT / "admin").mkdir(exist_ok=True)
    (ROOT / "admin" / "config.yml").write_text(y)
    print("wrote admin/config.yml")


TOKEN_URL = ("https://github.com/settings/personal-access-tokens/new?name=Global+site+editor"
             "&description=Publishes+edits+from+the+site+edit+mode&target_name=" + REPO.split("/")[0] + "&expires_in=366&contents=write")


def manifest():
    """content/manifest.json: what the on-page editor (js/edit.js) needs to know"""
    pages = {}
    for pid, (files, _) in PAGES.items():
        for f in files:
            if not f.startswith("pages/"):
                pages[f] = pid
    dump(CONTENT / "manifest.json", {
        "repo": REPO, "branch": "main", "site_url": SITE_URL, "token_url": TOKEN_URL, "save_url": SAVE_URL,
        "pages": pages, "names": {pid: lab for pid, (_, lab) in PAGES.items()} | {"site": SHARED_LABEL}, "labels": LABELS})
    print("wrote content/manifest.json")


def pull():
    """content/ from the published repo, so local publishing never overwrites CMS edits"""
    listing = json.loads(subprocess.check_output(["gh", "api", f"repos/{REPO}/git/trees/main?recursive=1"]))
    n = 0
    for t in listing["tree"]:
        if t["type"] == "blob" and t["path"].startswith("content/") and t["path"].endswith(".json"):
            raw = subprocess.check_output(["gh", "api", f"repos/{REPO}/contents/{t['path']}", "-H", "Accept: application/vnd.github.raw"])
            dump(ROOT / t["path"], json.loads(raw))
            n += 1
    print("pulled", n, "content files")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "extract":
        extract()
        manifest()
    elif cmd == "manifest":
        manifest()
    elif cmd == "apply":
        apply(changed_files=sys.argv[2:] if len(sys.argv) > 2 else None)
    elif cmd == "check":
        sys.exit(1 if apply(write=False) else 0)
    elif cmd == "config":
        config()
    elif cmd == "pull":
        pull()
    else:
        print(__doc__)
