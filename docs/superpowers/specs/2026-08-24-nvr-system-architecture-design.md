# TÀI LIỆU ĐẶC TẢ THIẾT KẾ KIẾN TRÚC HỆ THỐNG NVR THÔNG MINH (AI-POWERED NVR SYSTEM DESIGN)

- **Ngày ban hành:** 24/08/2026
- **Trạng thái:** Đã phê duyệt (Approved)
- **Quy mô mục tiêu:** SMB / Smart Home NVR (4 – 32 Camera)
- **Nền tảng triển khai:** Mini PC / Server nhỏ / Edge Devices (Intel iGPU, Google Coral TPU, NVIDIA GPU, ARM NPU)

---

## 1. TỔNG QUAN HỆ THỐNG (EXECUTIVE SUMMARY)

Hệ thống NVR (Network Video Recorder) là một nền tảng quản lý, ghi hình và phân tích video thông minh hoạt động 24/7 theo mô hình kiến trúc đa tầng tách rời (Decoupled Multi-tier Architecture).

### Mục tiêu cốt lõi:
1. **Hiệu năng cao & Tiết kiệm tài nguyên:** Áp dụng chiến lược luồng kép (Dual-stream) và cơ chế ghi hình không giải mã (Zero-CPU Transcoding) cho phép thiết bị nhỏ (như Intel N100 hoặc i3) xử lý ổn định 16 – 32 camera.
2. **AI Video Analytics thông minh:** Tích hợp bộ lọc chuyển động đa tầng (Motion Gate) kết hợp mô hình nhận diện đối tượng YOLO (YOLOv8/v11 Nano) được tăng tốc phần cứng qua OpenVINO, Edge TPU hoặc TensorRT để nhận diện người, xe, thú cưng và cảnh báo hàng rào ảo.
3. **Độ trễ thấp & Trải nghiệm xem lại mượt mà:** Phát trực tiếp qua giao thức WebRTC (WHEP) với độ trễ < 300ms; thanh tua thời gian 24 giờ trực quan (Timeline Scrubbing) với các dải màu sự kiện AI.
4. **Lưu trữ an toàn & Bền bỉ:** Ghi hình phân đoạn 60s fMP4 (Keyframe-aligned) kết hợp cơ chế xoay vòng dung lượng tự động (Retention Engine) và bảo vệ khóa các sự kiện quan trọng.

---

## 2. SƠ ĐỒ KIẾN TRÚC & LUỒNG DỮ LIỆU (SYSTEM ARCHITECTURE)

```mermaid
flowchart TD
    subgraph IP_CAMERAS [IP Cameras (ONVIF / RTSP)]
        CAM[Camera 1..N]
        CAM -->|Main Stream: 2K/4K H.264/H.265| RTSP_MAIN[RTSP Main Stream]
        CAM -->|Sub Stream: 720p/D1 H.264| RTSP_SUB[RTSP Sub Stream]
    end

    subgraph CORE_NVR [NVR Core Services (Docker)]
        subgraph MEDIA_ENGINE [1. Go Media Server / Engine]
            RTSP_IN[RTSP Ingest & Demuxer]
            LIVE_HUB[Live Hub: WebRTC WHEP / MSE]
            RECORDER[Zero-Copy fMP4 Segment Recorder]
        end

        subgraph AI_PIPELINE [2. AI Inference Worker (Python / C++)]
            SUB_DEC[Sub-Stream Hardware Decoder]
            MOTION_GATE[Motion Vector / Scene Gate]
            YOLO_INF[YOLO Object Detector (Person/Car/Pet)]
            TRACKER[ByteTrack Object Tracker & Zone Filter]
        end

        subgraph DATA_EVENT [3. Event & Storage Layer]
            STORAGE[(Video Storage: SSD/HDD Array)]
            DB[(SQLite WAL Database Index)]
            EVT_BUS[Event Bus / WebSocket Hub]
        end

        subgraph NOTIFICATION [4. Alert Dispatcher]
            TELEGRAM[Telegram Bot / Web Push / MQTT]
        end
    end

    subgraph CLIENTS [User Interfaces]
        WEB[Next.js 16 Web Dashboard]
        MOBILE[Mobile / PWA Client]
    end

    %% Data Flow Connections
    RTSP_MAIN --> RTSP_IN
    RTSP_SUB --> SUB_DEC

    RTSP_IN --> LIVE_HUB
    RTSP_IN --> RECORDER
    RECORDER -->|Direct I/O 60s Chunks| STORAGE
    RECORDER -->|Index Chunk Range| DB

    SUB_DEC --> MOTION_GATE
    MOTION_GATE -->|Có chuyển động| YOLO_INF
    YOLO_INF --> TRACKER
    TRACKER -->|Event: Person in Zone| EVT_BUS

    EVT_BUS -->|Gắn Event Tag & Thumbnail| DB
    EVT_BUS -->|Bắn Alert kèm Ảnh Snapshot| TELEGRAM
    EVT_BUS -->|Realtime WebSocket Alert| WEB

    LIVE_HUB -->|WebRTC < 300ms| WEB
    LIVE_HUB -->|WebRTC / HLS| MOBILE
    DB -->|Query Events & Timeline| WEB
    STORAGE -->|Stream Playback fMP4| WEB
```

---

## 3. THIẾT KẾ CÁC MODULE CHI TIẾT

### Module 1: Media Engine & Streaming Core (Ngôn ngữ: Go)
- **RTSP Client:**
  - Hỗ trợ RTSP over TCP và RTSP over UDP.
  - Cơ chế tự động kết nối lại (Exponential Backoff: 1s, 2s, 4s, tối đa 30s) khi camera mất kết nối.
  - Tự động dò tìm camera trong mạng LAN qua ONVIF WS-Discovery.
- **Phân phối Luồng Xem trực tiếp (Live Streaming Hub):**
  - **WebRTC (WHEP):** Sử dụng thư viện `pion/webrtc`, truyền trực tiếp video H.264/H.265; transcode âm thanh G.711u/a sang Opus/AAC. Độ trễ 150ms – 300ms.
  - **MSE (Media Source Extensions over WebSocket):** Chuyển tiếp fMP4 qua WebSocket làm phương án dự phòng khi mạng bị chặn WebRTC.
  - **LL-HLS:** Xuất luồng HLS độ trễ thấp phục vụ nhúng web hoặc truy cập từ xa.
- **Bộ Ghi hình Zero-Copy (Passthrough fMP4 Recorder):**
  - Đóng gói trực tiếp các gói NALU từ luồng Main-stream vào container fMP4 / MPEG-TS mà không decode/transcode.
  - Phân đoạn video cố định 60 giây/file, bắt buộc bắt đầu bằng 1 I-Frame (IDR/Keyframe) để phục vụ việc xem lại tức thì.
  - RAM Ring Buffer (4MB/camera) để gộp dữ liệu trước khi ghi xuống đĩa nhằm giảm áp lực I/O.

---

### Module 2: AI Video Analytics & Detection Pipeline (Python / C++)
- **Giải mã Luồng phụ (Sub-stream Decoder):**
  - Tiếp nhận Sub-stream (640x360 hoặc 1280x720 @ 5–10 FPS).
  - Sử dụng phần cứng để decode: Intel VAAPI / QuickSync, NVIDIA NVDEC, Video4Linux2 hoặc CPU.
- **Cơ chế Lọc đa tầng (Multi-Stage Processing):**
  1. **Stage 1 (Motion Gate):** Sử dụng thuật toán Background Subtraction (MOG2 / Frame Differencing) trên ảnh grayscale 320x180 để phát hiện chuyển động. Nếu không có chuyển động, bỏ qua frame ngay lập tức (tiết kiệm 80% tải tính toán AI).
  2. **Stage 2 (Object Detection):** Đẩy frame vào mô hình YOLOv8n / YOLOv11n (hoặc MobileNet-SSD) chạy trên các backend tăng tốc:
     - Intel iGPU / CPU: OpenVINO Toolkit (FP16 / INT8).
     - Google Coral TPU: TFLite Edge TPU runtime.
     - NVIDIA GPU: TensorRT FP16 runtime.
     - Phổ thông: ONNX Runtime.
     - Các class nhận diện: `person` (người), `car` (ô tô), `motorcycle` (xe máy), `bicycle` (xe đạp), `dog` (chó), `cat` (mèo).
  3. **Stage 3 (Object Tracking):** Sử dụng thuật toán ByteTrack / Norfair để gán duy nhất 1 `track_id` cho mỗi đối tượng xuyên suốt hành trình, chống spam cảnh báo trùng lặp.
  4. **Stage 4 (Zone & Tripwire Filter):** Kiểm tra tọa độ của đối tượng có vi phạm Vùng đa giác (Polygon ROI) hoặc cắt qua Hàng rào ảo (Tripwire) không. Loại trừ các vùng bị che (Motion Masks).
  5. **Stage 5 (Event Emission):** Trích xuất ảnh Snapshot JPEG chất lượng cao (kèm bounding box tùy chọn) và phát sự kiện vào Event Bus.

---

### Module 3: Storage Engine, Database & Retention Policy
- **Cấu trúc Thư mục Lưu trữ:**
  ```
  /storage/
  ├── recordings/{camera_id}/{YYYY-MM-DD}/{HH}/{start_timestamp}_{end_timestamp}.mp4
  ├── events/{YYYY-MM-DD}/{event_id}_(thumb.jpg|full.jpg|clip.mp4)
  └── db/nvr_master.db
  ```
- **Cơ sở dữ liệu (SQLite ở chế độ WAL):**
  - `cameras`: Quản lý thông tin kết nối, trạng thái, cấu hình luồng và chu kỳ lưu trữ.
  - `recordings`: Quản lý danh mục các file phân đoạn 60s (`start_time`, `end_time`, `file_path`, `duration`, `file_size`, `has_audio`). Có đánh chỉ mục trên `(camera_id, start_time, end_time)`.
  - `events`: Quản lý các sự kiện AI (`id`, `camera_id`, `label`, `track_id`, `zone_name`, `confidence`, `start_time`, `snapshot_path`, `clip_path`, `is_locked`).
  - `zones`: Quản lý danh sách các vùng đa giác, đường hàng rào ảo và mặt nạ loại trừ dưới dạng JSON coordinates.
- **Chiến lược Xoay vòng Lưu trữ (Retention Policy):**
  - Tự động xóa các thư mục giờ cũ nhất khi video vượt quá số ngày cấu hình (ví dụ 15 hoặc 30 ngày).
  - Giám sát mức sử dụng ổ cứng: Nếu dung lượng đạt **90%**, tự động dọn dẹp các phân đoạn 24/7 cũ nhất.
  - Các sự kiện AI được gắn cờ `is_locked = 1` sẽ được bảo vệ vĩnh viễn không bị xóa tự động.

---

### Module 4: API Gateway, Alert Dispatcher & Giao diện Web Dashboard
- **RESTful API & WebSocket Core:**
  - `GET /api/cameras` & `POST /api/cameras`: Quản lý thiết bị camera.
  - `POST /api/cameras/discover`: Quét tự động ONVIF trong mạng nội bộ.
  - `POST /api/cameras/:id/whep`: Khởi tạo luồng WebRTC Live.
  - `GET /api/playback/timeline`: Lấy danh sách phân đoạn video và sự kiện AI theo khoảng thời gian.
  - `GET /api/playback/stream`: Phát luồng tua lại video theo mốc thời gian.
  - `POST /api/playback/export`: Cắt ghép và tải xuống đoạn video MP4 tùy chỉnh.
  - `GET/PUT /api/cameras/:id/zones`: Lưu/Cập nhật vùng cảnh báo trực quan.
  - `WS /api/ws/events`: Bắn sự kiện realtime về giao diện web.
- **Kênh Thông báo Cảnh báo (Alert Dispatcher):**
  - **Telegram Bot:** Gửi tin nhắn kèm ảnh Snapshot và đường link xem lại clip khi có sự kiện vi phạm.
  - **MQTT Bridge:** Gửi trạng thái cảnh báo sang Home Assistant để kích hoạt kịch bản nhà thông minh (bật đèn, hú còi).
  - **Web Push / Mobile PWA:** Bắn thông báo đẩy về trình duyệt và thiết bị di động.
- **Giao diện Web Dashboard (Next.js 16 + Tailwind CSS):**
  - **Multi-Camera Grid View:** Xem đồng thời 1/4/9/16 camera, tự động chuyển Sub-stream khi xem lưới và Main-stream khi xem chi tiết.
  - **Interactive 24h Timeline Player:** Thanh cuộn tua thời gian mượt mà với dải màu phân biệt (Xanh: 24/7, Cam: Người, Xanh dương: Xe), hỗ trợ zoom in/out và chọn lịch.
  - **Visual Zone & Mask Editor:** Giao diện Canvas cho phép vẽ trực tiếp vùng Polygon, Tripwire và Mask ngay trên ảnh chụp camera.
  - **Event Gallery:** Danh mục sự kiện thông minh có bộ lọc theo camera, nhãn nhận diện, thời gian và xem lại clip tức thì.

---

## 4. CẤU HÌNH PHẦN CỨNG & ĐÓNG GÓI TRIỂN KHAI (DOCKER)

### Khuyến nghị Phần cứng:
- **4 – 8 Camera:** Mini PC Intel N100, 16GB RAM, 1x 4TB Surveillance HDD + 256GB NVMe SSD.
- **8 – 16 Camera:** Intel Core i3/i5 Gen 12+, 16GB/32GB RAM, iGPU Intel UHD/Iris Xe (OpenVINO) hoặc 1 Google Coral USB TPU, 1x 8TB Surveillance HDD.
- **16 – 32 Camera:** Intel Core i5/i7 Gen 12+ / AMD Ryzen, 32GB RAM, GPU NVIDIA RTX 3050/3060 hoặc Dual Coral TPU, 2x 8TB HDD.

### Cấu trúc Đóng gói Docker Compose (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  nvr-media-engine:
    image: nvr-media-engine:latest
    container_name: nvr-media-engine
    restart: unless-stopped
    network_mode: host
    volumes:
      - /storage:/storage
      - /storage/db:/app/data
    devices:
      - /dev/dri:/dev/dri # Intel iGPU passthrough
    environment:
      - STORAGE_PATH=/storage

  nvr-ai-worker:
    image: nvr-ai-worker:latest
    container_name: nvr-ai-worker
    restart: unless-stopped
    volumes:
      - /storage/events:/storage/events
    devices:
      - /dev/dri:/dev/dri     # Intel OpenVINO
      - /dev/apex_0:/dev/apex_0 # Coral TPU (nếu có)
    environment:
      - MODEL_BACKEND=openvino
      - TARGET_DEVICE=GPU

  nvr-api-gateway:
    image: nvr-api-gateway:latest
    container_name: nvr-api-gateway
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /storage:/storage
      - /storage/db:/app/data
    depends_on:
      - nvr-media-engine

  nvr-frontend:
    image: nvr-frontend:latest
    container_name: nvr-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 5. LỘ TRÌNH TRIỂN KHAI DỰ ÁN (5 GIAI ĐOẠN)

```
[Giai đoạn 1] Media Engine & Passthrough Recording Core (Tuần 1)
      ↓
[Giai đoạn 2] AI Video Analytics Pipeline & ByteTrack (Tuần 2)
      ↓
[Giai đoạn 3] API Gateway, SQLite WAL & Alert Dispatcher (Tuần 3)
      ↓
[Giai đoạn 4] Next.js 16 Web Dashboard & 24h Timeline Player (Tuần 4)
      ↓
[Giai đoạn 5] Tối ưu hóa Phần cứng, Chịu tải & Đóng gói Docker (Tuần 5)
```
