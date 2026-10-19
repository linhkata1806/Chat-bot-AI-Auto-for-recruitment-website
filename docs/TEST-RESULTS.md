# Kết quả kiểm thử tích hợp RMS Chatbot

Ngày ghi nhận: **2026-10-19**, múi giờ Asia/Saigon. Báo cáo chỉ mô tả kiểm tra đã thực hiện; chưa đáp ứng Definition of Done end-to-end.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả | Phạm vi bằng chứng |
|---|---|---|
| Đọc repo RMS, query public, security và template | Pass | Static source; không phải DB/runtime. |
| Tải/đọc hai template JSON chính thức | Pass | JSON gốc, version và SHA-256 trong provenance. |
| Sinh và parse JSON hai workflow | Pass | Cú pháp JSON và graph/reference nội bộ. |
| n8n 2.43.8 và import hai workflow | Pass | CLI version; SQLite read-only xác nhận `RmsCatalogRead01` và `RmsCandidateChat`, cả hai inactive. Không đồng nghĩa toàn bộ node đã execute. |
| Guard input/upload + format/ID và cấu hình read-only | Pass — 9/9 | `node --test tests/config-and-guards.test.mjs`; fixture tổng hợp, không có CV người thật. |
| Widget native trên standalone fixture desktop/mobile | Pass — 4 checks | Local vendor assets, Enter mở chat, lỗi kết nối native, viewport 1440×900/390×844. [Kết quả](../tests/widget-results.json). |
| Render fragment/shared topbar thật bằng engine Thymeleaf độc lập | Pass — 19 assertions | Default tắt, bật với từng flag, context path và tên env Spring; không chạy Spring Boot/DB. [Bằng chứng](../tests/thymeleaf-fragment-results.md). |
| Native PDF smoke bằng n8n CLI | Đang đối chiếu output / chưa Pass | Workflow kiểm tra riêng, PDF tổng hợp không có PII. Exit code 0 không được coi là đủ bằng chứng trích xuất; xem [native-results.json](../tests/native-results.json). |
| Kiểm tra dịch vụ local | Not Verified cho chức năng | Các GET tới localhost:8080/8081/8082/5678/11434 bị từ chối kết nối trong phiên kiểm tra. |

## Nghiệm thu chức năng bắt buộc

| # | Tình huống | Trạng thái | Điều kiện còn thiếu |
|---|---|---|---|
| 1 | Ask for active jobs | Not Tested / Not Verified | RMS chạy, catalog workflow chạy thành công, local model. |
| 2 | Search jobs by skills | Not Tested / Not Verified | RMS catalog thật + model. |
| 3 | Ask for requirements/JD/department | Not Tested / Not Verified | Runtime HTML extraction + model. |
| 4 | Upload sample PDF CV qua widget | Not Tested / Not Verified | n8n Embedded multipart + parser chạy thực. Unit guard không thay thế kiểm tra này. |
| 5 | Recommend jobs dựa trên CV và giải thích | Not Tested / Not Verified | PDF extraction, RMS thật, Ollama và model. |
| 6 | Follow-up “the first one” | Not Tested / Not Verified | Simple Memory và model chạy cùng phiên. |
| 7 | Loại job Closed/unpublished/future/expired | Not Verified runtime | Source query/badge đã kiểm tra; cần fixtures trên RMS test. |
| 8 | Không sửa dữ liệu RMS | Pass cấu hình; Not Verified runtime | Không có node ghi/DB/RMS credentials; cần quan sát lượt chạy và DB audit nếu muốn khẳng định runtime. |
| 9 | Invalid files | Pass local guard; Not Verified HTTP | Cần widget/Chat Trigger upload thật, gồm quá 5 MiB. |
| 10 | Missing model credentials | Not Tested / Not Verified | Chưa chạy n8n model error branch. |
| 11 | Source connection failure | Not Tested / Not Verified | Kiểm thử error branch trên n8n. SQL connection failure: không áp dụng, workflow không dùng SQL node. |
| 12 | RMS vẫn chạy; widget/header/footer/CTA desktop/mobile | Not Verified | Cần render RMS thật sau khi áp dụng overlay. |

## File áp dụng

Đã thêm một dòng include vào shared public topbar và 11 file widget/theme/vendor mới. Mặc định tắt cho đến khi cấu hình xong. Chi tiết và SHA-256: [rms-files-manifest.json](../integration/rms-files-manifest.json). Diff tracked của RMS chỉ có một dòng thêm tại thời điểm đối chiếu; các file mới được liệt kê riêng trong Git status.

## Giới hạn của bằng chứng

- Không truy cập Candidate/HR records hoặc sửa dữ liệu nghiệp vụ.
- Không gửi CV/tin nhắn người dùng cho dịch vụ model ngoài máy.
- Không chạy upstream Gmail, Sheets, scraping, auto-apply hoặc OCR cloud.
- Có kiểm tra metadata/MIME/đuôi/magic/size bằng local function harness; không khẳng định chống mọi file độc hại.
- Không báo Pass cho chất lượng matching, memory, xóa CV khỏi RAM/log hoặc việc RMS giữ nguyên hành vi khi chưa có bằng chứng runtime.
