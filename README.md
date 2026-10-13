# 🍸 QR Order - Hệ Thống Gọi Món Quán Bar (Docker Native)

Hệ thống MVP **QR Order** cao cấp dành riêng cho mô hình Cocktail Bar / Lounge, vận hành hoàn toàn bằng Docker, độc lập 100% không phụ thuộc dịch vụ đám mây (Cloud-free / Self-hosted).

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend & Backend**: Next.js 14 (App Router, TypeScript, Standalone output).
- **Styling**: Tailwind CSS, Shadcn UI style, Glassmorphism dark luxury bar theme.
- **Hiệu ứng & Hoạt ảnh**: `framer-motion`, `lucide-react`.
- **Cơ sở dữ liệu**: PostgreSQL 16.
- **ORM & Migrations**: Prisma ORM, raw partial index constraint.
- **Xác thực & Bảo mật**: Session HTTP-only Cookie + JWT (`jose`), băm mật khẩu `bcryptjs`, Rate limiting chống brute-force.
- **Kiến trúc dữ liệu**: Data Access Layer (DAL) bắt buộc `restaurant_id` cho mọi truy vấn admin; Khách hàng cô lập 100% qua `tableToken`.
- **DevOps**: Docker Compose (Dev hot-reload & Prod multi-stage), Caddy reverse proxy HTTPS, tự động backup dữ liệu định kỳ 14 ngày.

---

## ⚡ Khởi Động Nhanh (Chỉ 1 Lệnh Duy Nhất)

### Lần đầu tiên chạy (Development):
```bash
docker compose up --build
```
> Hệ thống sẽ tự động:
> 1. Chờ PostgreSQL 16 khởi động và kiểm tra healthcheck.
> 2. Cài đặt dependencies và sinh Prisma Client.
> 3. Tự động đồng bộ Database schema (`prisma db push`).
> 4. Thiết lập ràng buộc partial index: **Mỗi bàn chỉ có tối đa 1 phiên 'open'**.
> 5. Seed dữ liệu mẫu: Quán "Demo Bar", 10 bàn (token ngẫu nhiên >= 20 ký tự), 4 danh mục, 12 món ăn/uống và tài khoản quản lý.
> 6. Mở cổng web tại: **http://localhost:3000**

---

## 🔑 Tài Khoản Quản Trị & Đường Dẫn Truy Cập

| Vai trò | Đường dẫn | Thông tin đăng nhập |
| :--- | :--- | :--- |
| **Trang chủ / Mô phỏng** | [http://localhost:3000](http://localhost:3000) | Chọn bàn để thử quét QR |
| **Giao diện Khách gọi món** | `http://localhost:3000/t/{table_token}` | Tự động tạo phiên và giỏ hàng |
| **Trang Đăng Nhập Quản Trị** | [http://localhost:3000/admin/login](http://localhost:3000/admin/login) | **Email**: `owner@demobar.vn`<br/>**Mật khẩu**: `Admin@123456` |
| **Bảng Điều Khiển Quán Bar** | [http://localhost:3000/admin](http://localhost:3000/admin) | Thống kê doanh thu, bàn đang phục vụ |
| **Màn Hình Quầy Bar (KDS)** | [http://localhost:3000/admin/orders](http://localhost:3000/admin/orders) | Nhận đơn, pha chế, phục vụ theo thời gian thực |
| **Quản Lý Bàn & Mã QR** | [http://localhost:3000/admin/tables](http://localhost:3000/admin/tables) | Xem trạng thái 10 bàn, in mã QR, chốt thanh toán |
| **Quản Lý Thực Đơn** | [http://localhost:3000/admin/menu](http://localhost:3000/admin/menu) | Bật/tắt còn món/hết món, sửa giá bán |

---

## 🛠️ Các Lệnh Thao Tác (Makefile / Scripts)

Nếu bạn có `make`:
```bash
make up          # Khởi động môi trường Dev
make down        # Dừng và tắt các container
make logs        # Xem log thời gian thực
make migrate     # Chạy cập nhật database schema
make seed        # Chạy lại seed dữ liệu quán bar
make prod-up     # Khởi động môi trường Production (Caddy HTTPS + Backup)
make prod-down   # Dừng Production
```

Trên Windows PowerShell:
```powershell
.\scripts\run.ps1 up
.\scripts\run.ps1 down
.\scripts\run.ps1 logs
.\scripts\run.ps1 migrate
.\scripts\run.ps1 seed
.\scripts\run.ps1 prod-up
```

Hoặc dùng trực tiếp lệnh Docker Compose:
- **Xem logs**: `docker compose logs -f`
- **Tắt dịch vụ**: `docker compose down`
- **Khởi chạy Production**: `docker compose -f docker-compose.prod.yml up --build -d`

---

## 🔒 Quy Trình Bảo Mật & Ràng Buộc Dữ Liệu

1. **Ràng buộc mỗi bàn chỉ có 1 session 'open'**:
   - Sử dụng PostgreSQL unique partial index:
     ```sql
     CREATE UNIQUE INDEX table_sessions_single_open_idx 
     ON table_sessions (table_id) 
     WHERE status = 'open';
     ```
   - Ngăn chặn hoàn toàn việc mở nhiều phiên trùng lặp khi nhiều khách cùng quét bàn.

2. **Lớp truy cập dữ liệu (Data Access Layer - DAL)**:
   - Các API quản trị (`/api/admin/*`) kiểm tra session cookie, trích xuất `restaurant_id` từ JWT và truyền bắt buộc vào mọi câu lệnh truy vấn Prisma (`where: { restaurant_id }`).
   - Khách hàng chỉ truy cập qua `tableToken`. Hệ thống tự động truy vết ngược lại đúng `restaurant_id` và bàn đó, tuyệt đối không có cơ chế cho khách đọc/ghi dữ liệu quán khác.

3. **Chống brute-force đăng nhập**:
   - Bộ theo dõi rate limiting khóa tài khoản tạm thời 15 phút nếu nhập sai quá 5 lần liên tiếp.

4. **Tự động sao lưu (Automated Daily Backup)**:
   - Container `backup` trong `docker-compose.prod.yml` chạy `pg_dump` nén gzip mỗi 24 giờ, tự động dọn dẹp và duy trì 14 bản sao lưu mới nhất trong volume `backup_data`.
