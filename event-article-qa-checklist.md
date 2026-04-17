# EventArticle - Admin Page UI Checklist + Acceptance Criteria (QA)

## 1. Scope
- Module: EventArticle public landing page + Admin/Manager CMS editor.
- FE Routes:
  - Public: `/articles/:slug`
  - Manager: `/manager/events/:id/article`
- Primary APIs:
  - Public: `GET /api/articles/{slug}`
  - Admin: `GET /api/admin/articles/by-activity/{activityId}`
  - Admin: `POST /api/admin/articles`
  - Admin: `PUT /api/admin/articles/{articleId}`
  - Admin: `PUT /api/admin/articles/{articleId}/publish`
  - Admin: `PUT /api/admin/articles/{articleId}/unpublish`

## 2. Test Data Preparation
- One activity with article draft.
- One activity without article.
- One published article with valid `slug`.
- One non-existing slug.
- One duplicate slug case for 400 validation.
- Sample article with:
  - `thumbnailUrl`
  - HTML content containing headings, list, link, image
  - SEO title + description
  - `registrationStatus` for each enum value (`UPCOMING`, `OPEN`, `FULL`, `CLOSED`).

## 3. Admin Page UI Checklist

### 3.1 Access & Navigation
- [ ] Manager/Admin can open `/manager/events/:id/article` from event detail button `Bài viết`.
- [ ] Unauthorized role cannot access editor route.
- [ ] Back button `Quay lại activity` returns to `/manager/events/:id`.

### 3.2 Initial Loading State
- [ ] Loading spinner is displayed while fetching article by activity ID.
- [ ] No layout break occurs on mobile and desktop.

### 3.3 Empty State (No Article Yet)
- [ ] If API `GET /by-activity/{activityId}` returns 404, UI shows `Chưa có bài viết` state.
- [ ] Form remains editable in create mode.
- [ ] Save action calls `POST /api/admin/articles` with `activityId`.

### 3.4 Edit State (Article Exists)
- [ ] If article exists, form fields are pre-filled correctly:
  - [ ] title
  - [ ] slug
  - [ ] thumbnailUrl
  - [ ] content
  - [ ] seoTitle
  - [ ] seoDescription
- [ ] Save action calls `PUT /api/admin/articles/{articleId}`.

### 3.5 Rich HTML Editor UX
- [ ] Editor supports mode switching: `Visual`, `HTML`, `Split`.
- [ ] Toolbar actions work in visual mode:
  - [ ] bold
  - [ ] italic
  - [ ] underline
  - [ ] heading (H1/H2)
  - [ ] paragraph
  - [ ] unordered list
  - [ ] ordered list
  - [ ] link insertion
  - [ ] image insertion
  - [ ] clear format
- [ ] Template insert buttons add expected HTML blocks (`Highlights`, `Agenda`).
- [ ] HTML source textarea updates visual content and vice versa.
- [ ] Sanitized preview displays safely in source/split mode.

### 3.6 Slug and SEO Helpers
- [ ] `Tạo từ title` generates normalized slug (lowercase, no accents, hyphenized).
- [ ] User can manually override slug after auto-generation.
- [ ] SEO counters display title length and SEO description length.

### 3.7 Publish Flow
- [ ] Publish button only shown after article is created.
- [ ] Clicking Publish triggers `PUT /publish` and updates status badge to `Published`.
- [ ] Clicking Unpublish triggers `PUT /unpublish` and updates status badge to `Draft`.
- [ ] Button shows loading state during request.

### 3.8 Preview Link
- [ ] Preview button opens `/articles/{slug}` in a new tab.
- [ ] If slug is empty, preview does not navigate.

### 3.9 Validation & Error Handling
- [ ] Save is blocked when `title`, `slug`, or `content` is empty.
- [ ] Backend error messages are displayed in error alert.
- [ ] Duplicate slug 400 is shown clearly to user and form values are retained.
- [ ] Network/server error does not clear editor inputs.

## 4. Public Landing Page Checklist

### 4.1 Routing and Fetching
- [ ] Accessing `/articles/:slug` calls `GET /api/articles/{slug}`.
- [ ] Non-existing slug renders `Không tìm thấy bài viết` page.

### 4.2 Rendering
- [ ] Title is displayed.
- [ ] Thumbnail is shown when provided.
- [ ] Content HTML is rendered correctly.
- [ ] Rendered HTML is sanitized (no unsafe script execution).

### 4.3 SEO
- [ ] `<title>` equals `seoTitle` when present; else falls back to `title`.
- [ ] `<meta name="description">` equals `seoDescription` when present; else empty string.

### 4.4 CTA Behavior
- [ ] `UPCOMING` -> button disabled, label `Sắp mở đăng ký`.
- [ ] `OPEN` -> button enabled, label `Đăng ký ngay`.
- [ ] `FULL` -> button disabled, label `Hết chỗ`.
- [ ] `CLOSED` -> button disabled, label `Đã đóng đăng ký`.
- [ ] `OPEN` + internal path `/...` navigates via router.
- [ ] `OPEN` + external `http(s)://...` redirects browser correctly.

## 5. Acceptance Criteria (Must Pass)
- [ ] AC-01: Public page `/articles/:slug` works with loading, success, and not-found states.
- [ ] AC-02: Content HTML is sanitized before render on public page.
- [ ] AC-03: SEO title and meta description are set from API fields.
- [ ] AC-04: CTA labels and enable/disable behavior match `registrationStatus` enum exactly.
- [ ] AC-05: Manager editor route `/manager/events/:id/article` is accessible for `ADMIN`/`MANAGER` only.
- [ ] AC-06: Editor supports create flow when no article exists (404 by-activity).
- [ ] AC-07: Editor supports update flow when article exists.
- [ ] AC-08: Publish/unpublish operations update UI state correctly.
- [ ] AC-09: Duplicate slug 400 is surfaced without data loss.
- [ ] AC-10: Preview opens correct public slug URL.
- [ ] AC-11: Build passes without new compile errors in touched files.

## 6. Regression Checks
- [ ] Event detail page still loads and action buttons still function.
- [ ] Existing routes unrelated to EventArticle are unaffected.
- [ ] Manager layout title displays correctly for article editor route.

## 7. Sign-off
- QA Result: Pass / Fail
- Tested by:
- Environment:
- Backend version:
- FE commit:
- Notes:
