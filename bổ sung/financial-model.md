# Mô hình quản trị tài chính PiXerse và PiXedu

## 1. Cấu trúc quản trị

| Cấp | Giá trị | Ý nghĩa |
|---|---|---|
| Pháp nhân | `pixerse` | Công ty chịu trách nhiệm pháp lý, hóa đơn, thuế và ngân hàng |
| Business unit | `pixerse_core` | AI R&D, software, outsourcing, consulting, SaaS |
| Business unit | `pixedu` | Lớp học, STEM, giáo cụ, EdTech |
| Business unit | `shared` | Văn phòng, kế toán, quản lý và chi phí dùng chung |

PiXedu không có báo cáo thuế hay tài khoản ngân hàng riêng. PiXedu chỉ là đơn vị quản trị nội bộ để đo doanh thu, chi phí và hiệu quả.

## 2. Trường cần có trên giao dịch

- `business_unit`: đơn vị tạo ra giao dịch.
- `project_id`: dự án PiXerse hoặc lớp/khóa học PiXedu.
- `customer_id`: khách hàng, phụ huynh hoặc trường học.
- `supplier_id`: nhà cung cấp hoặc giáo viên thuê ngoài.
- `payment_status`: chưa thu, thu một phần, đã thu, quá hạn.
- `cost_type`: chi phí trực tiếp hoặc chi phí dùng chung.
- `allocation_method`: cách phân bổ chi phí dùng chung.

## 3. Doanh thu PiXerse

- Hợp đồng AI/software.
- Dedicated team và outsourcing.
- PoC, discovery, tư vấn.
- Bảo trì, SLA và support.
- SaaS, FinOps, ERP và phí license.

## 4. Doanh thu PiXedu

- Học phí lớp/khóa học.
- Workshop, trại hè và đào tạo cho trường.
- Bộ kit STEM và giáo cụ.
- Dịch vụ EdTech/AI education.

## 5. Chi phí

### PiXerse core

Lương kỹ thuật, PM, sales; cloud/API AI; GPU; thiết bị Edge AI; phần mềm; subcontractor; pháp lý và bán hàng.

### PiXedu

Giáo viên, trợ giảng; giáo cụ; thuê phòng; marketing tuyển sinh; LMS/AI; hoàn học phí; vận chuyển.

### Shared

Văn phòng, kế toán, quản lý, ngân hàng, pháp lý và hạ tầng dùng chung.

## 6. Phân bổ chi phí dùng chung

Không tạo giao dịch ngân hàng giả. Lưu giao dịch gốc tại `shared`, sau đó tạo bản ghi phân bổ quản trị.

Ví dụ tiền thuê văn phòng 20.000.000 VND:

- PiXedu: 15% = 3.000.000 VND.
- PiXerse core: 85% = 17.000.000 VND.

Các phương pháp được phép: tỷ lệ doanh thu, số nhân sự, diện tích, giờ sử dụng hoặc tỷ lệ cố định do CFO thiết lập.

## 7. Báo cáo bắt buộc

- Doanh thu/chi phí/lãi gộp theo business unit.
- Dòng tiền hợp nhất của PiXerse.
- Công nợ phải thu và phải trả.
- Doanh thu chưa lập hóa đơn.
- Chi phí cloud/API theo dự án.
- Hiệu quả từng hợp đồng PiXerse.
- Doanh thu, chi phí và lãi gộp từng lớp PiXedu.
- Học phí chưa thu và tỷ lệ hoàn phí.
- Tồn kho kit STEM.

## 8. Quy tắc dữ liệu

- Một giao dịch phải thuộc một business unit.
- Tài khoản ngân hàng và pháp nhân không bị tách theo PiXedu.
- Doanh thu/chi phí nội bộ giữa PiXerse và PiXedu chỉ dùng cho báo cáo quản trị.
- Không đưa giao dịch nội bộ vào doanh thu hợp nhất.
- Mọi giao dịch có giá trị lớn phải có hợp đồng hoặc chứng từ liên quan.
