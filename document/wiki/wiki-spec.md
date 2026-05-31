# WIKI-SPEC.md
> Implementation spec cho Claude Code
> Feature: In-app Wiki tại route `/wiki`
> Stack: Next.js 15 App Router (cùng app hiện tại)
> Cập nhật: 2026-05

---

## 1. Mục tiêu

Thêm một section `/wiki` vào app hiện tại — render các file `.md` từ thư mục `docs/` dưới dạng trang có navigation, search, và syntax highlighting. Mục đích: portfolio documentation visible trực tiếp trong app, không cần mở GitHub.

---

## 2. File structure cần tạo

```
frontend/
├── app/
│   └── wiki/
│       ├── layout.tsx           ← Layout riêng cho wiki (sidebar + content)
│       ├── page.tsx             ← /wiki → redirect đến /wiki/home
│       └── [...slug]/
│           └── page.tsx         ← /wiki/architecture, /wiki/gdpr-compliance, ...
│
├── components/
│   └── wiki/
│       ├── WikiSidebar.tsx      ← Navigation tree bên trái
│       ├── WikiContent.tsx      ← Render markdown + TOC
│       ├── WikiSearch.tsx       ← Search trong wiki (client-side)
│       └── WikiBreadcrumb.tsx   ← Breadcrumb navigation
│
docs/                            ← Thư mục chứa .md files (root level, ngoài frontend/)
├── home.md                      ← /wiki → landing page
├── architecture.md              ← /wiki/architecture
├── expense-lifecycle.md         ← /wiki/expense-lifecycle
├── gdpr-compliance.md           ← /wiki/gdpr-compliance (đã có nội dung)
├── gobd-notes.md                ← /wiki/gobd-notes
├── api-reference.md             ← /wiki/api-reference
├── tax-export.md                ← /wiki/tax-export
└── demo-guide.md                ← /wiki/demo-guide
```

---

## 3. Navigation config

Tạo file `docs/wiki-nav.json` — WikiSidebar đọc file này để render navigation tree. Không hardcode trong component.

```json
{
  "sections": [
    {
      "title": "Overview",
      "items": [
        { "title": "Home", "slug": "home" },
        { "title": "Demo guide", "slug": "demo-guide" }
      ]
    },
    {
      "title": "Architecture",
      "items": [
        { "title": "System architecture", "slug": "architecture" },
        { "title": "Expense lifecycle", "slug": "expense-lifecycle" }
      ]
    },
    {
      "title": "Compliance",
      "items": [
        { "title": "GDPR / DSGVO", "slug": "gdpr-compliance" },
        { "title": "GoBD notes", "slug": "gobd-notes" }
      ]
    },
    {
      "title": "Reference",
      "items": [
        { "title": "API reference", "slug": "api-reference" },
        { "title": "Tax export (DATEV/SEPA)", "slug": "tax-export" }
      ]
    }
  ]
}
```

---

## 4. Routing & data fetching

### `app/wiki/[...slug]/page.tsx`

```typescript
// Đây là Server Component — đọc file .md trực tiếp trên server
// slug: string[] — ví dụ ['gdpr-compliance'] hoặc ['architecture']

// Logic:
// 1. Join slug thành filename: slug.join('/') + '.md'
// 2. Đọc từ path.join(process.cwd(), 'docs', filename)
// 3. Parse markdown → HTML bằng thư viện (xem Section 5)
// 4. Extract headings cho TOC
// 5. Return props cho WikiContent

// generateStaticParams: đọc tất cả .md trong docs/ → generate routes
// → app được build tĩnh, không có runtime file I/O
```

### `app/wiki/page.tsx`

```typescript
// Redirect ngay đến /wiki/home
import { redirect } from 'next/navigation'
export default function WikiIndex() {
  redirect('/wiki/home')
}
```

---

## 5. Markdown processing

Dùng thư viện theo thứ tự ưu tiên — chọn cái đã có trong `package.json` trước:

1. **`remark` + `remark-html` + `remark-gfm`** — nếu đã có
2. **`marked`** — nếu đã có
3. **`gray-matter` + `remark`** — install mới nếu chưa có

**Yêu cầu bắt buộc:**
- GFM (GitHub Flavored Markdown): tables, task lists, strikethrough
- Syntax highlighting cho code blocks: dùng `highlight.js` hoặc `shiki` — chọn cái đã có trong project
- Nếu chưa có gì: install `remark` + `remark-html` + `remark-gfm` + `highlight.js`

**Extract TOC từ headings:**
```typescript
// Parse tất cả ## và ### heading trong markdown
// Return: Array<{ level: 2 | 3, text: string, id: string }>
// id = slugify(text): lowercase, replace space → '-', strip special chars
```

---

## 6. Component specs

### `WikiSidebar.tsx`

```
Props: currentSlug: string

Layout:
- Fixed width 240px
- Đọc wiki-nav.json
- Render từng section với title + danh sách links
- Active item: highlight bằng màu primary
- Collapsible sections (default: tất cả mở)
- Ở mobile (< 768px): sidebar ẩn, toggle bằng hamburger button

Behavior:
- Link active = slug hiện tại → không navigate lại
- Hover state nhẹ
```

### `WikiContent.tsx`

```
Props:
  html: string         ← processed markdown HTML
  toc: TocItem[]       ← array heading items
  title: string        ← h1 đầu tiên của trang
  lastModified?: string ← từ git hoặc file mtime (optional)

Layout:
- Max-width 720px, centered trong content area
- TOC float right ở desktop (width 200px), ẩn ở mobile
- TOC sticky khi scroll
- Prose styles cho markdown: heading sizes, table border, code block bg, blockquote border-left

Code block:
- Syntax highlighting theo ngôn ngữ (```sql, ```typescript, ```java)
- Copy button ở góc trên phải mỗi code block
- Background: dark theme luôn (không flip theo light/dark mode của app)
```

### `WikiSearch.tsx`

```
Behavior: client-side search — KHÔNG cần backend API

Implementation:
- Khi component mount: fetch /wiki-search-index.json (generated lúc build)
- Search index được tạo trong generateStaticParams: 
  đọc tất cả .md → extract text → write ra public/wiki-search-index.json
- Mỗi item trong index: { slug, title, excerpt (200 chars đầu) }
- Search: filter title + excerpt theo query string (simple includes(), không cần fuzzy)
- Hiện kết quả dưới search box dạng dropdown (max 6 kết quả)
- Nhấn kết quả → navigate đến /wiki/[slug]
- Shortcut: Cmd+K / Ctrl+K focus vào search box

UI:
- Search box nằm top của WikiSidebar
- Placeholder: "Search docs..."
- Dropdown overlay, đóng khi click outside hoặc Esc
```

### `WikiBreadcrumb.tsx`

```
Props: slug: string, sectionTitle: string

Render: Wiki / {Section} / {Page title}
Mỗi item là link, trừ item cuối (current page)
```

---

## 7. Layout (`app/wiki/layout.tsx`)

```
Layout riêng cho toàn bộ /wiki — KHÔNG kế thừa layout của app chính
(app chính có sidebar cho các role EMPLOYEE/MANAGER/FINANCE — wiki dùng layout khác)

Structure:
┌─────────────────────────────────────────┐
│  Header: "📖 Documentation"  [Back to app] │
├──────────────┬──────────────────────────┤
│              │                          │
│  WikiSidebar │     WikiContent          │
│   (240px)    │     (flex: 1)            │
│              │                          │
└──────────────┴──────────────────────────┘

Header:
- Logo/title "Documentation" ở trái
- Link "← Back to app" ở phải → navigate về /my-expenses (hoặc trang phù hợp theo role)
- Không hiện navigation của app chính (không có role-based sidebar)

Responsive:
- Desktop (≥ 1024px): sidebar cố định bên trái, content bên phải
- Tablet (768–1023px): sidebar collapse thành icon, mở bằng button
- Mobile (< 768px): sidebar ẩn, toggle bằng hamburger, overlay khi mở
```

---

## 8. Sidebar integration (app chính)

Thêm link "Documentation" vào `Sidebar.tsx` của app chính — hiển thị cho tất cả roles:

```typescript
// Trong navigation items, thêm ở cuối (trước logout):
{
  href: '/wiki',
  label: 'Documentation',
  icon: BookOpenIcon,  // hoặc icon tương đương đang dùng trong app
  // KHÔNG có role restriction — tất cả roles đều thấy
}
```

---

## 9. Seed content cho `docs/`

Tạo nội dung placeholder cho tất cả 7 file `.md` — đủ để wiki không trống khi chạy lần đầu. Nội dung thực sẽ được bổ sung sau.

### `docs/home.md` (viết đầy đủ)

```markdown
# FintechSaaS Expense Platform — Documentation

Corporate expense management platform với AI-powered OCR, 
DATEV/SEPA/XRechnung export, và GDPR-compliant data handling.

## Quick links

- [System architecture](/wiki/architecture) — C4 diagrams, tech stack
- [Expense lifecycle](/wiki/expense-lifecycle) — State machine, sequence diagram
- [GDPR / DSGVO](/wiki/gdpr-compliance) — Data classification, erasure workflow
- [GoBD notes](/wiki/gobd-notes) — 10-year retention, immutability
- [API reference](/wiki/api-reference) — All endpoints by role
- [Tax export](/wiki/tax-export) — DATEV CSV, SEPA XML, XRechnung
- [Demo guide](/wiki/demo-guide) — One-click demo login, test scenarios

## Demo users

| Role | Name | Login |
|------|------|-------|
| Employee | Anna Müller | One-click on /auth/login |
| Manager | Thomas Weber | One-click on /auth/login |
| Finance | Sarah Chen | One-click on /auth/login |
| Admin | David Kim | One-click on /auth/login |
```

### Các file còn lại: tạo placeholder với structure chuẩn

Mỗi file có:
- H1 title
- 1 đoạn mô tả ngắn
- Section "## Overview" với 2-3 bullet points tóm tắt nội dung sẽ có
- Note: `> 🚧 Full content coming soon.`

Ví dụ `docs/gobd-notes.md`:
```markdown
# GoBD Notes

Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern — 
German compliance requirements for digital bookkeeping.

## Overview

- 10-year mandatory retention for financial records (§14 GoBD)
- Immutability requirement for receipts after creation
- MinIO storage strategy for WORM compliance

> 🚧 Full content coming soon.
```

---

## 10. Dependencies cần install (nếu chưa có)

```bash
# Check package.json trước, chỉ install nếu chưa có:
npm install remark remark-html remark-gfm
npm install highlight.js
npm install gray-matter   # nếu cần frontmatter support
```

---

## 11. Không làm trong spec này

- Authentication/authorization cho `/wiki` — để public, không cần login
- Edit wiki trong app (WYSIWYG editor) — edit trực tiếp `.md` file
- Versioning / history của wiki pages
- Comment system
- Dark/light mode toggle riêng cho wiki (kế thừa từ app)

---

## 12. Definition of done

- [ ] `GET /wiki` redirect về `/wiki/home`
- [ ] `GET /wiki/gdpr-compliance` render đúng nội dung `docs/gdpr-compliance.md`
- [ ] Tất cả 7 pages trong nav có thể navigate được
- [ ] Code blocks có syntax highlighting
- [ ] Copy button hoạt động trên code blocks
- [ ] TOC hiển thị và scroll-spy đúng heading
- [ ] Search tìm được theo title và excerpt
- [ ] Cmd+K / Ctrl+K focus search
- [ ] Responsive: mobile sidebar toggle hoạt động
- [ ] Link "Documentation" xuất hiện trong sidebar app chính (tất cả roles)
- [ ] Build `next build` không có error