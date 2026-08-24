# TÀI LIỆU ĐẶC TẢ THIẾT KẾ KIẾN TRÚC HỆ THỐNG NVR THÔNG MINH (GO2RTC + PYTHON AI VIA UV + NEXT.JS)

- **Ngày cập nhật:** 24/08/2026
- **Trạng thái:** Đã phê duyệt (Approved)
- **Quy mô mục tiêu:** SMB / Smart Home NVR (4 – 32 Camera)
- **Nền tảng triển khai:** Mini PC / Server / Docker (Intel iGPU OpenVINO, Coral TPU, NVIDIA GPU, CPU)

---

## 1. TỔNG QUAN HỆ THỐNG (EXECUTIVE SUMMARY)

Hệ thống NVR (Network Video Recorder) kết hợp sức mạnh của:
1. **Lõi Media Server (go2rtc):** Xử lý toàn bộ giao thức media: RTSP ingestion, WebRTC (WHEP) siêu nhanh (< 200ms), MSE WebSocket, HLS, ONVIF discovery, MP4 snapshot/recording passthrough.
2. **Lõi AI & API Gateway (Python 3.12 quản lý bằng `uv`):** FastAPI + SQLite WAL + YOLOv8/v11 Nano (OpenVINO/ONNX) + ByteTrack + Bộ lọc vùng Zone/Tripwire + Telegram Alert + Retention Engine.
3. **Giao diện Web Dashboard (Next.js 16 + Tailwind CSS):** Xem trực tiếp WebRTC mượt mà, thanh tua timeline 24h tương tác, trình vẽ vùng cảnh báo trực quan Canvas.

---

## 2. SƠ ĐỒ KIẾN TRÚC & LUỒNG DỮ LIỆU

```mermaid
flowchart TD
    subgraph IP_CAMERAS [IP Cameras (ONVIF / RTSP)]
        CAM[Camera 1..N]
        CAM -->|Main Stream: 2K/4K| RTSP_MAIN[RTSP Main Stream]
        CAM -->|Sub Stream: 720p/D1| RTSP_SUB[RTSP Sub Stream]
    end

    subgraph NVR_SYSTEM [NVR Core Services]
        subgraph MEDIA_LAYER [1. Media Server: go2rtc Core]
            GO2RTC_IN[RTSP Ingest & Demuxer]
            GO2RTC_WHEP[WebRTC WHEP Server]
            GO2RTC_MSE[MSE / WebSocket Server]
            GO2RTC_REC[Passthrough MP4/Segment Recorder]
        end

        subgraph AI_API_LAYER [2. AI & API Service: Python + uv]
            SUB_DEC[Hardware Accelerated Sub-stream Frame Grabber]
            MOTION_GATE[Motion Gate: MOG2 Background Subtraction]
            YOLO_INF[YOLOv8/v11 Nano Detector (OpenVINO/ONNX/Coral)]
            TRACKER[ByteTrack Object Tracker & Zone/Tripwire Logic]
            API_SRV[FastAPI REST Gateway & WebSocket Event Hub]
            RETENTION[Retention & Disk Space Cleaner Worker]
            TG_BOT[Telegram Alert Dispatcher]
            DB[(SQLite WAL Database: cameras, recordings, events, zones)]
        end
    end

    subgraph CLIENTS [User Interfaces]
        WEB[Next.js 16 Web Dashboard]
        MOBILE[Mobile / PWA Client]
    end

    %% Media Connections
    RTSP_MAIN & RTSP_SUB --> GO2RTC_IN
    GO2RTC_IN --> GO2RTC_WHEP
    GO2RTC_IN --> GO2RTC_MSE
    GO2RTC_IN --> GO2RTC_REC
    GO2RTC_REC -->|Lưu phân đoạn fMP4 60s| STORAGE[(Storage: /storage/recordings)]

    %% AI Pipeline
    GO2RTC_IN -->|RTSP/MJPEG Stream| SUB_DEC
    SUB_DEC --> MOTION_GATE
    MOTION_GATE -->|Có chuyển động| YOLO_INF
    YOLO_INF --> TRACKER
    TRACKER -->|Sự kiện vi phạm Vùng| API_SRV

    %% Database & Notification
    API_SRV --> DB
    API_SRV --> TG_BOT
    RETENTION --> DB & STORAGE

    %% Web UI Connections
    GO2RTC_WHEP -->|WebRTC < 200ms| WEB
    API_SRV -->|REST & WebSocket Events| WEB
    DB -->|Query Events & Timeline| WEB
```

---

## 3. THIẾT KẾ CHI TIẾT TỪNG MODULE

### Module 1: go2rtc Media Engine
- Đóng vai trò Media Proxy & Router trung tâm.
- Cấu hình qua `go2rtc.yaml`:
  ```yaml
  streams:
    cam_gate_01:
      - rtsp://admin:pass@192.168.1.100:554/stream1 # Main-stream (2K/4K)
    cam_gate_01_sub:
      - rtsp://admin:pass@192.168.1.100:554/stream2 # Sub-stream (720p/360p)
  webrtc:
    listen: ":8555"
  api:
    listen: ":1984"
  ```
- **Live Stream:** WebRTC (WHEP `/api/ws?src=cam01`) cho trình duyệt xem trực tiếp với độ trễ siêu thấp 150–200ms.
- **Recording:** Trích xuất luồng MP4 không decode trực tiếp vào thư mục `/storage/recordings/` theo từng phân đoạn 60s.

---

### Module 2: Python AI Analytics & API Service (Quản lý bằng `uv`)
- **Quản lý Package bằng `uv`:**
  ```bash
  uv init --app
  uv add fastapi uvicorn[standard] opencv-python-headless numpy pydantic onnxruntime openvino pillow httpx pytest
  ```
- **Motion Gate (MOG2):** Chỉ đưa frame vào YOLO khi có chuyển động thực tế (giảm 80% CPU).
- **YOLO Detection & Hardware Acceleration:**
  - Intel CPU/iGPU: Tăng tốc qua **OpenVINO Toolkit**.
  - Coral TPU: Chạy qua runtime **Edge TPU**.
  - NVIDIA: Chạy qua **TensorRT / ONNX CUDA**.
  - Classes: `person`, `car`, `motorcycle`, `bicycle`, `dog`, `cat`.
- **ByteTrack & Zone / Tripwire Filter:**
  - Định danh đối tượng qua từng khung hình để tránh spam cảnh báo.
  - Thuật toán Ray-Casting kiểm tra đối tượng đi vào vùng đa giác (Polygon) hoặc cắt qua đường ranh giới (Tripwire).
- **SQLite WAL Database:**
  - `cameras`: Quản lý IP, RTSP, tên camera, chu kỳ lưu trữ.
  - `recordings`: Danh mục phân đoạn video 60s phục vụ tua timeline tức thì.
  - `events`: Sự kiện AI kèm đường dẫn snapshot và clip.
  - `zones`: Danh sách vùng đa giác và hàng rào ảo.
- **Alert Dispatcher & Retention Worker:**
  - Telegram Bot gửi ảnh snapshot cảnh báo trong 1 giây.
  - Tự động xóa phân đoạn cũ khi quá hạn (15-30 ngày) hoặc khi dung lượng ổ cứng đạt 90%.

---

### Module 3: Next.js 16 Web Dashboard
- **Multi-Cam Grid View:** Bố cục 1x1, 2x2, 3x3, 4x4 kết nối WebRTC go2rtc WHEP, tự động tối ưu Sub/Main stream.
- **Interactive 24h Timeline Player:** Thanh tua thời gian hiển thị dải màu trực quan (Xanh: 24/7, Cam: Người, Xanh dương: Xe), hỗ trợ zoom chuột từ 24h về 5 phút.
- **Visual Zone & Mask Editor:** Canvas vẽ đa giác (Polygon), đường kẻ (Tripwire) trực tiếp trên ảnh chụp camera.
- **Event Gallery:** Lọc sự kiện thông minh, xem clip và xuất MP4.

---

## 4. ĐÓNG GÓI TRIỂN KHAI DOCKER COMPOSE

```yaml
version: '3.8'

services:
  go2rtc:
    image: alexxit/go2rtc:latest
    container_name: nvr-go2rtc
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./config/go2rtc.yaml:/config/go2rtc.yaml
      - /storage/recordings:/storage/recordings

  nvr-ai-api:
    build:
      context: ./core/ai
      dockerfile: Dockerfile
    container_name: nvr-ai-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - /storage:/storage
      - /storage/db:/app/data
    devices:
      - /dev/dri:/dev/dri # Intel iGPU passthrough
    environment:
      - GO2RTC_URL=http://localhost:1984
      - STORAGE_PATH=/storage
      - MODEL_BACKEND=openvino

  nvr-web:
    build:
      context: ./web
      dockerfile: Dockerfile
    container_name: nvr-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_GO2RTC_URL=http://localhost:1984
```
