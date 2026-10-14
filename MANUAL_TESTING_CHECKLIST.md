# 📱 CHECKLIST KIỂM THỬ THỦ CÔNG HỆ THỐNG NHÂN VIÊN (PWA) TRÊN MÁY THẬT

Tài liệu này hướng dẫn chi tiết quy trình kiểm thử thực tế trên thiết bị di động (Android & iPhone) cho hệ thống nhân viên PWA của QR Order.

---

## 🛠️ Môi Trường Yêu Cầu Trước Khi Test

1. **Kết nối HTTPS**:
   - Web Push và Service Worker **bắt buộc chạy trên giao thức HTTPS** (hoặc `http://localhost` khi test trên máy tính lập trình).
   - Khi test trên điện thoại thật trong mạng LAN: Cần dùng Caddy với chứng chỉ tự cấp (hoặc công cụ như ngrok/Cloudflare Tunnel: `cloudflared tunnel --url http://localhost:3000`) để có URL HTTPS công khai.
2. **Cấu hình VAPID**:
   - File `.env` trên máy chủ phải có đầy đủ:
     ```env
     VAPID_PUBLIC_KEY=...
     VAPID_PRIVATE_KEY=...
     VAPID_SUBJECT=mailto:admin@example.com
     ```
   - Nếu chưa có, sinh khóa bằng lệnh: `npm run vapid` (hoặc `make vapid`).
3. **Tài khoản kiểm thử**:
   - Quản lý: `manager@thevelvet.vn` / `Password123@`
   - Nhân viên 1 (Khu A): `staff_an@thevelvet.vn` / `Password123@`
   - Nhân viên 2 (Khu B): `staff_binh@thevelvet.vn` / `Password123@`
   - Nhân viên 3 (Linh hoạt): `staff_chi@thevelvet.vn` / `Password123@`

---

## 📋 Bảng Kiểm Thử Thực Tế (Field Test Checklist)

| STT | Kịch Bản Kiểm Thử | Các Bước Thực Hiện | Kết Quả Mong Đợi | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Cài đặt PWA trên Android (Chrome)** | 1. Mở Chrome trên Android, truy cập `https://{DOMAIN}/staff`.<br>2. Quan sát thanh banner "Cài ứng dụng" xuất hiện ở chân trang.<br>3. Bấm "Cài đặt" (hoặc menu 3 chấm → "Cài đặt ứng dụng"). | Icon ứng dụng xuất hiện trên Màn hình chính Android. Mở app chạy chế độ Standalone không có thanh địa chỉ trình duyệt. | [ ] |
| **2** | **Cài đặt PWA trên iPhone (iOS 16.4+)** | 1. Mở Safari trên iPhone, truy cập `https://{DOMAIN}/staff`.<br>2. App hiển thị modal hướng dẫn màu vàng gold sang trọng.<br>3. Bấm nút Chia sẻ (Share ⎋) → "Thêm vào MH chính" (Add to Home Screen).<br>4. Mở app từ icon trên Màn hình chính và đăng nhập. | Mở app từ Home Screen không có thanh URL. Banner hướng dẫn tự ẩn đi. Trang chẩn đoán `/staff/diagnostics` xác nhận đã ở chế độ Standalone. | [ ] |
| **3** | **Kích hoạt âm thanh & quyền Push** | 1. Nhân viên đăng nhập vào `/staff`.<br>2. Bấm nút lớn **"BẮT ĐẦU CA"**.<br>3. Trình duyệt hiển thị popup xin quyền thông báo. Bấm "Cho phép" (Allow). | 1. Nghe tiếng chuông chào mừng phát ra (xác nhận Audio Context đã mở khóa).<br>2. Trạng thái Push chuyển sang "Đã bật".<br>3. Màn hình tự động giữ sáng (Screen Wake Lock kích hoạt). | [ ] |
| **4** | **Nhận Web Push khi khóa màn hình** | 1. Nhân viên đã bấm "Bắt đầu ca" trên điện thoại.<br>2. Khóa màn hình điện thoại (ấn nút nguồn tắt màn hình).<br>3. Trên thiết bị khác, đóng vai khách quét bàn 01 gửi đơn hoặc bấm "Gọi nhân viên". | Điện thoại nhân viên rung/sáng màn hình, hiển thị Push Notification: *"Bàn 01 – Gọi nhân viên"*. Bấm vào thông báo sẽ mở thẳng app `/staff?request=...`. | [ ] |
| **5** | **Hai nhân viên cùng bấm "NHẬN" (Race Condition)** | 1. Bàn 02 có đơn mới (trạng thái Chờ nhận).<br>2. Hai nhân viên (Nhân viên A & Nhân viên B) cùng mở tab "Chờ nhận" trên 2 điện thoại.<br>3. Cả 2 cùng bấm nút **"NHẬN"** gần như cùng một tích tắc. | - Nhân viên bấm trước: Nhận thành công, đơn chuyển vào tab "Của tôi".<br>- Nhân viên bấm sau: Giao diện phản hồi nhẹ nhàng toast vàng: *"Đã có người nhận (Bởi ...)"*, thẻ tự rời khỏi tab "Chờ nhận", **KHÔNG BÁO LỖI ĐỎ BẠO LỰC**. | [ ] |
| **6** | **Tự động Leo thang (Escalation) sau 60 giây** | 1. Khách gửi yêu cầu hoặc gọi nhân viên tại Bàn 03.<br>2. Không có nhân viên nào bấm nhận trong vòng 60 giây.<br>3. Quan sát đồng hồ đếm ngược trên thẻ (chuyển từ Vàng → Cam → Đỏ nhấp nháy). | - Sau 60s, tiến trình nền tự động Escalate request.<br>- Còi báo động khẩn cấp hú chuông ngắt quãng lớn.<br>- Thẻ xuất hiện cho TẤT CẢ nhân viên trong ca (bất kể khu) và Quản lý.<br>- Bàn 03 trên sơ đồ bàn của Quản lý chuyển sang màu **ĐỎ CẢNH BÁO**. | [ ] |
| **7** | **Mất mạng & Tự phục hồi dữ liệu (Offline Resilience)** | 1. Nhân viên đang mở trang `/staff`.<br>2. Bật chế độ máy bay (Airplane mode) hoặc tắt Wi-Fi/4G.<br>3. Quan sát banner cảnh báo: *"Mất kết nối – có thể bỏ lỡ đơn"* màu đỏ nổi bật.<br>4. Trong lúc mất mạng, khách gửi 2 đơn mới.<br>5. Bật lại mạng Wi-Fi/4G. | Hệ thống tự động phát hiện kết nối phục hồi, tự động gọi API đồng bộ lại toàn bộ danh sách, hiển thị đầy đủ 2 đơn mới mà **không bị sót bất kỳ đơn nào**. | [ ] |
| **8** | **Nhân viên bấm "ĐÃ PHỤC VỤ" → Sơ đồ bàn đổi XANH tức thì** | 1. Quản lý mở trang Sơ đồ bàn `/admin`. Bàn 04 đang màu Cam (đang có việc chờ).<br>2. Nhân viên phụ trách xử lý xong món và bấm nút lớn **"ĐÃ PHỤC VỤ"** trên app `/staff`.<br>3. Quan sát màn hình của Quản lý. | Ngay lập tức (dưới 500ms) qua kết nối SSE realtime, Bàn 04 trên sơ đồ quản lý tự động chuyển sang màu **XANH LÁ (Mọi việc đã hoàn tất)** mà không cần F5. | [ ] |
| **9** | **Khóa tài khoản nhân viên (Immediate Revocation)** | 1. Nhân viên đang mở app `/staff` trên điện thoại.<br>2. Quản lý vào `/admin/staff`, bấm nút "Khóa tài khoản" nhân viên đó.<br>3. Trên điện thoại nhân viên: thao tác bấm bất kỳ nút nào hoặc chờ heartbeat tiếp theo (tối đa 20s). | - API trả về 403 Forbidden.<br>- Phiên đăng nhập bị hủy ngay lập tức.<br>- Thiết bị tự động hủy Push Subscription.<br>- Điện thoại tự chuyển hướng về trang đăng nhập `/staff/login` kèm thông báo tài khoản bị khóa. | [ ] |
| **10** | **Kiểm tra Trang in Wi-Fi & Hướng dẫn A5** | 1. Quản lý truy cập `/admin/staff/guide`.<br>2. Nhập SSID: `TheVelvet_Staff` và Mật khẩu: `BarStaff@2026;Secret`.<br>3. Kiểm tra mã QR Wi-Fi tạo ra có quét kết nối được ngay trên điện thoại không.<br>4. Nhấn nút "In tờ hướng dẫn A5". | Tờ in hiển thị chuẩn khổ A5, gồm 2 mã QR rõ nét (QR Wi-Fi và QR Web App Staff), các ký tự đặc biệt `;` `\` được thoát chuẩn cú pháp `WIFI:T:WPA;S:...;P:...;;`. | [ ] |

---

## 💡 Lưu Ý Quan Trọng Khi Test Trên iOS (Apple Web Push)

1. **Yêu cầu iOS 16.4 trở lên**: Apple chỉ hỗ trợ Web Push Notification trên iOS bắt đầu từ phiên bản iOS 16.4.
2. **Bắt buộc thêm vào Màn hình chính**: Web Push trên Safari iOS **chỉ hoạt động** khi người dùng đã bấm *"Thêm vào Màn hình chính"* và mở ứng dụng từ icon đó (Standalone Web App). Nếu mở trực tiếp trong tab Safari thông thường, trình duyệt sẽ không cho phép đăng ký Service Worker Push.
3. **Tương tác người dùng để bật âm thanh**: Trình duyệt di động (cả Safari và Chrome) chặn tự động phát âm thanh (`autoplay policy`). Do đó, nút **"Bắt đầu ca"** là bắt buộc để mở khóa âm thanh ngay từ thao tác bấm đầu tiên của nhân viên.
