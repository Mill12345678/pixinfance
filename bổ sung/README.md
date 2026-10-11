# Bổ sung mô hình tài chính PiXerse và PiXedu

Thư mục này chứa các tài liệu và migration đề xuất để mở rộng Pixinfance.

## Nguyên tắc

- PiXerse là pháp nhân duy nhất.
- PiXedu là business unit trực thuộc PiXerse, không phải công ty riêng.
- Giao dịch thực tế vẫn đi qua tài khoản, hóa đơn và giấy phép của PiXerse.
- Báo cáo quản trị được tách theo `business_unit` nhưng báo cáo pháp nhân được hợp nhất.

## Nội dung

- `financial-model.md`: mô hình dữ liệu, danh mục, báo cáo và quy tắc vận hành.
- `0003_business_units_and_pixedu.sql`: migration Supabase đề xuất.

## Cách áp dụng migration

1. Sao lưu cơ sở dữ liệu Supabase.
2. Kiểm tra migration trên môi trường test.
3. Chạy sau `0001_init.sql` và `0002_categories_and_seed.sql`.
4. Kiểm tra dữ liệu mẫu và RLS trước khi đưa lên production.

Migration chỉ bổ sung cấu trúc dữ liệu; giao diện và API cần được cập nhật tiếp theo tài liệu `financial-model.md`.
