# Kết quả kiểm thử tích hợp RMS Chatbot

Đợt kiểm tra đầu: **2026-10-19**; bổ sung và kiểm tra lại: **2026-10-20**, múi giờ Asia/Saigon. Báo cáo chỉ mô tả kiểm tra đã thực hiện; chưa đáp ứng Definition of Done end-to-end.

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
| Native PDF smoke bằng n8n CLI | Pass | PDF tổng hợp: production validator chấp nhận; native parser trích 275 ký tự, có text kỳ vọng; production readability gate đi nhánh true. Kết quả JSON đã được đối chiếu, không chỉ exit code. [Bằng chứng](../tests/native-results.json). |
| Public static asset paths | Pass — 8 assets + negative control | Matcher `PathRequest.toStaticResources().atCommonLocations()` của Spring Boot 3.5.16 chấp nhận toàn bộ `/js/vendor/**`; từ chối đường dẫn `/vendor/**` cũ. Không sửa SecurityConfig. Runner: `tests/verify-static-paths.ps1`. |
| n8n local HTTP | Pass | Ngày 2026-10-20: `/healthz`, `/healthz/readiness`, `/` tại loopback5678 đều HTTP 200. [Bằng chứng](../tests/local-runtime-results.json). Không chứng minh workflow chat đã publish hoặc model hoạt động. |
| RMS/Ollama local | Not Verified cho chức năng | Ngày 2026-10-20: GET tại RMS8080/8081/8082 và Ollama11434 đều bị từ chối kết nối. |

## Nghiệm thu chức năng bắt buộc

| # | Tình huống | Trạng thái | Điều kiện còn thiếu |
|---|---|---|---|
| 1 | Ask for active jobs | Not Tested / Not Verified | RMS chạy, catalog workflow chạy thành công, local model. |
| 2 | Search jobs by skills | Not Tested / Not Verified | RMS catalog thật + model. |
| 3 | Ask for requirements/JD/department | Not Tested / Not Verified | Runtime HTML extraction + model. |
| 4 | Upload sample PDF CV qua widget | Not Tested / Not Verified qua widget | Native validator/parser/readability gate đã Pass với PDF tổng hợp qua CLI; Embedded multipart chưa được kiểm thử. |
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

Ngày 2026-10-20 đã chuyển đúng tám vendor asset sang `static/js/vendor/n8n-chat/1.42.6/`, sửa hai tham chiếu loader/fragment và chạy lại 4 kiểm tra UI + 19 assertions Thymeleaf. Nguyên nhân: `/vendor/**` không nằm trong common-static matcher được cấu hình public của RMS. Vendor giữ nguyên bytes/license; không có thay đổi auth hay dữ liệu nghiệp vụ.

## Giới hạn của bằng chứng

- Không truy cập Candidate/HR records hoặc sửa dữ liệu nghiệp vụ.
- Không gửi CV/tin nhắn người dùng cho dịch vụ model ngoài máy.
- Không chạy upstream Gmail, Sheets, scraping, auto-apply hoặc OCR cloud.
- Có kiểm tra metadata/MIME/đuôi/magic/size bằng local function harness; không khẳng định chống mọi file độc hại.
- Không báo Pass cho chất lượng matching, memory, xóa CV khỏi RAM/log hoặc việc RMS giữ nguyên hành vi khi chưa có bằng chứng runtime.
