Để Frontend (FE) có thể dễ dàng thiết kế cấu trúc UI/UX, Quản lý State (State Management), và thiết kế Router, tôi đã nhóm các API này thành **9 Luồng hoạt động chính (User Flows)** chia làm 2 phân hệ: **Student/Public App** và **Admin/CMS Web**.

Tài liệu dưới đây được tối ưu cấu trúc Markdown rõ ràng, mạch lạc để cả lập trình viên và các AI Chatbot khác đều có thể "đọc vị" cấu trúc dự án một cách nhanh nhất.

---

# TÀI LIỆU ĐẶC TẢ LUỒNG NGHIỆP VỤ (USER FLOWS) - MODULE ARTICLE

Tài liệu này chuyển đổi danh sách API thô thành các luồng nghiệp vụ tương ứng với màn hình và hành vi của người dùng trên giao diện FE.

---

## PHẦN 1: PHÂN HỆ HỌC VIÊN / CÔNG KHAI (STUDENT / PUBLIC APP)

Luồng này phục vụ cho ứng dụng Mobile hoặc Website Portal của Sinh viên, ưu tiên tốc độ tải và trải nghiệm mượt mà.

### Flow 1: Khám phá & Tìm kiếm bài viết (Discovery Flow)

Luồng này tương ứng với các màn hình: **Trang chủ (Homepage)**, **Trang danh mục (Category Page)**, **Danh sách chuỗi sự kiện (Series Page)** và **Trang tìm kiếm**.

* **Màn hình chính / Trang chủ (Banner & Lưới bài viết):**
* FE gọi `GET /api/articles/featured` để lấy danh sách bài viết nổi bật hiển thị trên Slider/Banner đầu trang.
* FE gọi `GET /api/articles/trending` để lấy các bài viết có lượng tương tác/view khủng nhất N ngày gần đây đưa vào mục "Hot/Trending".
* FE gọi `GET /api/articles` (có phân trang) để hiển thị danh sách bài viết mới nhất ở luồng timeline chính (Hệ thống đã tự sắp xếp theo `isPinned` và `priority`).


* **Màn hình Lọc & Tìm kiếm:**
* Khi người dùng click vào một danh mục: FE chuyển hướng sang route danh mục và gọi `GET /api/articles/category/{categorySlug}`.
* Khi người dùng xem một chuỗi sự kiện lớn: FE gọi `GET /api/articles/series/{seriesId}` để gom nhóm toàn bộ bài viết liên quan.
* Khi người dùng nhập từ khóa vào thanh search: FE gọi `GET /api/articles/search?keyword=...` để trả ra kết quả khớp tiêu đề/nội dung.



---

### Flow 2: Đọc chi tiết bài viết & Ghi nhận hệ thống (Article Detail Flow)

Luồng này kích hoạt khi người dùng click vào một bài viết cụ thể.

```
[Click Bài Viết] 
       │
       ├──► FE gọi đồng thời: 
       │      ├── API 5: Chi tiết bài viết (Lấy HTML, Activity Info, Trạng thái Wishlist/Reaction cá nhân)
       │      ├── API 6: Danh sách bài viết liên quan (Gợi ý cuối bài)
       │      └── API 19: Lấy thống kê số lượng Emoji
       │
       └──► FE gọi ngầm (Background):
              └── API 8: Track view (+1 lượt xem)

```

* **Xử lý Logic Đặc Biệt cho FE:**
* **Cơ chế Redirect Slug:** Khi gọi API Chi tiết, nếu data trả về có `redirectedFrom` và `currentSlug`, FE cần tự động cập nhật lại URL trên trình duyệt sang `currentSlug` mới để tối ưu SEO.
* **Tải lịch (.ics):** Nếu nút "Thêm vào lịch" được click, FE kích hoạt tải file từ `GET /api/articles/{slug}/calendar`.
* **Chia sẻ bài viết:** Khi người dùng bấm Share (Facebook, Zalo...), FE gọi ngầm `POST /api/articles/{slug}/track-share` để ghi nhận số liệu.



---

### Flow 3: Đăng ký & Tương tác cá nhân (Engagement Flow)

Luồng xử lý khi học viên đã **Đăng nhập (Authenticated)** và thực hiện các hành động mang tính cá nhân hóa tại trang chi tiết.

* **Hành động Lưu trữ (Wishlist):**
* Người dùng nhấn nút "Lưu bài viết" ➔ FE gọi `POST /api/articles/{slug}/wishlist`.
* Người dùng hủy lưu ➔ FE gọi `DELETE /api/articles/{slug}/wishlist`.
* *Màn hình cá nhân (Trang Profile > Bài viết đã lưu):* FE gọi `GET /api/articles/wishlist` để hiển thị danh sách phân trang.


* **Hành động Bày tỏ cảm xúc (Reaction):**
* Người dùng click chọn 1 Emoji (`LIKE`, `LOVE`, `CLAP`...) ➔ FE gọi `POST /api/articles/{slug}/reaction?type=...`.
* *Lưu ý cho FE:* Nếu người dùng đổi từ `LIKE` sang `LOVE`, FE chỉ cần gọi lại chính API này với type mới, hệ thống sẽ tự cập nhật. Nếu click lại vào Emoji đang chọn ➔ FE gọi `DELETE /api/articles/{slug}/reaction` để thu hồi.


* **Hành động Đăng ký danh sách chờ (Waitlist):**
* Nếu bài viết đính kèm một Hoạt động đã hết chỗ (`registrationStatus` chuyển sang `WAITLIST`), FE sẽ hiển thị nút **"Đăng ký vào hàng đợi"**. Khi click, FE gọi `POST /api/articles/{slug}/waitlist`.



---

### Flow 4: Bình luận công khai (Social Comment Flow)

Luồng xử lý khu vực thảo luận dưới mỗi bài viết.

* **Tải dữ liệu:** FE gọi `GET /api/articles/{slug}/comments` để lấy cấu trúc cây bình luận (đã được lồng đệ quy qua mảng `replies`).
* **Hành động Viết bình luận / Trả lời:** Người dùng gửi bình luận ➔ FE gọi `POST /api/articles/{slug}/comments`.
* *Lưu ý xử lý State:* Nếu API trả về `isFlagged: true`, FE nên hiển thị một toast thông báo nhẹ nhàng cho user kiểu: *"Bình luận của bạn chứa từ ngữ cần kiểm duyệt và sẽ hiển thị sau khi Admin phê duyệt"*.


* **Hành động Xóa:** Người dùng click xóa comment của chính mình ➔ FE gọi `DELETE /api/articles/comments/{commentId}`. FE cần xóa comment đó và toàn bộ reply con trên UI ngay lập tức (Cascade Delete phía Client).

---

### Flow 5: Lịch sử đọc bài viết (Reading History Flow)

Phục vụ màn hình **"Bài viết đã xem gần đây"** trong trang cá nhân của học viên.

* Khi học viên vào trang Lịch sử: FE gọi `GET /api/articles/history` để render danh sách sắp xếp theo thời gian giảm dần (`viewedAt`).
* Người dùng xóa 1 bài khỏi lịch sử: Bấm nút X ➔ FE gọi `DELETE /api/articles/history/{historyId}`.
* Người dùng dọn sạch lịch sử: Bấm nút "Xóa tất cả" ➔ FE gọi `DELETE /api/articles/history`.

---

## PHẦN 2: PHÂN HỆ QUẢN TRỊ CMS (ADMIN / MANAGER WEB APP)

Luồng này phục vụ cho đội ngũ Admin và Manager quản lý nội dung Back-office, đòi hỏi giao diện dạng bảng (Data Table) và các form nhập liệu phức tạp.

### Flow 6: Quản lý vòng đời bài viết (Content Lifecycle Flow)

Luồng xử lý từ lúc bài viết còn là bản nháp cho đến khi xuất bản ra công chúng.

```
[Tạo Nháp] ──► [Cập nhật/Thêm Ảnh] ──► [Publish] ──► [Set Primary (Nếu có)] 
   │                                      │
   └── (API 4)                            ├── (API 6: Gửi thông báo tới Wishlist)
                                          │
                                          └──► [Hạ bài/Unpublish] (API 7)

```

* **Khởi tạo & Chỉnh sửa:**
* Admin tạo bài viết mới độc lập hoặc gắn với một Event thông qua Form ➔ FE gọi `POST /api/admin/articles`.
* Admin chỉnh sửa bài viết ➔ FE gọi `PUT /api/admin/articles/{articleId}`.
* *Quản lý Thư viện ảnh (Gallery):* Trong form sửa bài, Admin có thể upload và thêm ảnh vào gallery bằng `POST /api/admin/articles/{articleId}/images` hoặc xóa ảnh qua `DELETE /api/admin/articles/{articleId}/images/{imageId}`.


* **Điều phối trạng thái hiển thị:**
* Ấn nút "Xuất bản" ➔ Gọi `PUT /api/admin/articles/{articleId}/publish`. (Hệ thống sẽ tự trigger gửi notify cho học viên thích bài này).
* Ấn nút "Hạ bài viết" ➔ Gọi `PUT /api/admin/articles/{articleId}/unpublish`.
* Đặt làm bài viết đại diện chính cho sự kiện ➔ Gọi `PUT /api/admin/articles/{articleId}/set-primary`.



---

### Flow 7: Quản lý danh mục & Thẻ cấu hình (Metadata & Taxonomy Flow)

Màn hình cấu hình phân loại bài viết (thường nằm trong mục Cài đặt nội dung).

* **Danh mục (Categories):** FE xây dựng màn hình CRUD danh mục bằng cách kết hợp các API: `GET /api/admin/articles/categories` (Đổ ra bảng), `POST` (Tạo mới), `PUT` (Sửa), và `DELETE` (Xóa danh mục).
* **Thẻ (Tags):** Tương tự như danh mục nhưng tinh gọn hơn, FE sử dụng nhóm API Tags gồm: `GET` (Lấy toàn bộ tag để đưa vào dropdown select khi viết bài), `POST` (Tạo nhanh tag mới), và `DELETE` (Xóa tag).

---

### Flow 8: Kiểm duyệt bình luận (Content Moderation Flow)

Màn hình dành riêng cho Đội ngũ kiểm duyệt nội dung (Moderator) xử lý các báo cáo vi phạm hoặc từ ngữ tục tĩu.

* FE gọi `GET /api/admin/articles/{articleId}/comments` để lấy toàn bộ cây bình luận (Bao gồm cả các bình luận bị hệ thống tự động gắn cờ ẩn `isHidden = true` hoặc `isFlagged = true`).
* **Hành động của Admin:**
* Nếu phát hiện comment vi phạm thuần phong mỹ tục ➔ Click "Ẩn" ➔ FE gọi `PUT /api/admin/articles/comments/{commentId}/hide`.
* Nếu muốn khôi phục một comment bị ẩn oan ➔ Click "Hiện" ➔ FE gọi `PUT /api/admin/articles/comments/{commentId}/unhide`.
* Nếu muốn xóa sổ vĩnh viễn khỏi Database ➔ Click "Xóa vĩnh viễn" ➔ FE gọi `DELETE /api/admin/articles/comments/{commentId}`.



---

### Flow 9: Thống kê & Xuất báo cáo (Analytics & Reporting Flow)

Màn hình **Dashboard** tổng quan của Admin.

* **Màn hình Dashboard trực quan:** Ngay khi Admin đăng nhập vào CMS, FE gọi `GET /api/admin/articles/statistics` để lấy các số liệu tổng quan (`totalArticles`, `totalViews`...) và dữ liệu vẽ biểu đồ (`articlesByCategory`, `articlesByMonth`).
* **Bảng quản lý nâng cao (Bộ lọc đa năng):** Tại trang danh sách bài viết tổng của Admin, FE thiết kế bộ lọc nâng cao (Trạng thái, Khoảng ngày, Loại bài viết...) và đẩy parameter vào API Lọc nâng cao `GET /api/admin/articles`.
* **Xuất dữ liệu:** Khi Admin click nút "Xuất file Excel", FE chuyển hướng hoặc gọi API `GET /api/admin/articles/export` với các filter tương ứng để trình duyệt tự động tải xuống file `.xlsx` nhị phân.

---

## 💡 LỜI KHUYÊN CHO FRONTEND KHI PHÁT TRIỂN MODULE NÀY:

1. **Cache dữ liệu Public:** Các API ở **Flow 1** (Featured, Trending, Category list) là các dữ liệu ít thay đổi thường xuyên, FE có thể cấu hình thời gian cache (Stale-While-Revalidate) khoảng 2-5 phút để giảm tải cho server.
2. **Xử lý Component Đệ Quy (Recursive Component):** Danh sách bình luận (API 15 ở Public và API 20 ở Admin) trả về cấu trúc lồng nhau (`replies` nằm trong comment cha). FE nên viết một component `CommentItem` có khả năng tự gọi lại chính nó để render cây thư mục bình luận không giới hạn cấp độ.
3. **Xử lý HTML an toàn (XSS Protection):** API Chi tiết bài viết trả về trường `content` dạng chuỗi HTML. FE khi render chuỗi này bắt buộc phải qua một thư viện lọc mã độc (như `DOMPurify`) trước khi inject vào DOM (ví dụ: `dangerouslySetInnerHTML` trong React hoặc `v-html` trong Vue) để tránh bị tấn công XSS.