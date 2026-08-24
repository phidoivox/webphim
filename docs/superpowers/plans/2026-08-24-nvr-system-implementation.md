# KẾ HOẠCH TRIỂN KHAI HỆ THỐNG NVR THÔNG MINH (GO2RTC + PYTHON AI VIA UV + NEXT.JS)

> **Dành cho Agent/Kỹ sư thực thi:** REQUIRED SUB-SKILL: Sử dụng `superpowers:subagent-driven-development` (khuyên dùng) hoặc `superpowers:executing-plans` để thực hiện từng task theo danh sách kiểm tra checkbox (`- [ ]`).

**Mục tiêu:** Xây dựng hệ thống NVR hoàn chỉnh sử dụng **go2rtc** cho Media Streaming & Ingestion + **Python 3.12 (quản lý bằng `uv`)** cho AI Analytics, SQLite WAL Database & FastAPI Gateway + **Next.js 16** cho Web Dashboard.

**Kiến trúc:**
1. `config/go2rtc.yaml`: Cấu hình Media Streaming Hub, WebRTC WHEP, RTSP passthrough.
2. `core/ai`: Python FastAPI + `uv` (Motion Gate MOG2, YOLOv8/v11 Nano, ByteTrack, Zone/Tripwire filters, SQLite WAL, Telegram Alert, Retention loop).
3. `web`: Next.js 16 Frontend (Multi-Cam Grid, 24h Timeline Player, Visual Zone Canvas Editor).
4. `deploy`: Docker Compose packaging.

**Công nghệ sử dụng:** `go2rtc`, Python 3.12 (`uv`), FastAPI, OpenCV, ONNX Runtime, OpenVINO, Next.js 16, TypeScript, Tailwind CSS 4, SQLite3 WAL, Docker.

**Tài liệu đặc tả (Spec):** [docs/superpowers/specs/2026-08-24-nvr-system-architecture-design.md](file:///d:/APP/laragon/www/webphim/docs/superpowers/specs/2026-08-24-nvr-system-architecture-design.md)

---

### Task 1: Khởi tạo Cấu hình go2rtc Media Engine

**Files:**
- Create: `config/go2rtc.yaml`
- Create: `config/go2rtc_helper.py`
- Create: `config/test_go2rtc_config.py`

**Interfaces:**
- Produces: `generate_go2rtc_config(cameras: list[dict]) -> str`

- [ ] **Step 1: Viết test cho hàm sinh cấu hình go2rtc từ danh sách camera**
- [ ] **Step 2: Chạy test qua `uv run pytest config/test_go2rtc_config.py` xác nhận FAIL**
- [ ] **Step 3: Cài đặt hàm sinh cấu hình go2rtc động**
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Commit mã nguồn Task 1**

```bash
git add config/
git commit -m "feat(media): configure go2rtc media engine and dynamic config generator"
```

---

### Task 2: Khởi tạo Python AI & Backend Module với `uv` và SQLite WAL

**Files:**
- Create: `core/ai/pyproject.toml`
- Create: `core/ai/src/db.py`
- Create: `core/ai/tests/test_db.py`

**Interfaces:**
- Produces: `get_db_connection(db_path: str)`, `init_schema(conn)`

- [ ] **Step 1: Khởi tạo project Python với `uv`**

```bash
cd core/ai && uv init --app
uv add fastapi uvicorn[standard] opencv-python-headless numpy pydantic onnxruntime openvino pillow httpx pytest aiosqlite
```

- [ ] **Step 2: Viết test kiểm tra SQLite ở chế độ WAL và khởi tạo bảng cameras, recordings, events, zones**
- [ ] **Step 3: Chạy test `uv run pytest tests/test_db.py` xác nhận FAIL**
- [ ] **Step 4: Cài đặt `db.py` với kết nối SQLite WAL**
- [ ] **Step 5: Chạy test xác nhận PASS**
- [ ] **Step 6: Commit mã nguồn Task 2**

```bash
git add core/ai/
git commit -m "feat(ai-backend): setup uv project and SQLite WAL database layer"
```

---

### Task 3: Python AI - Motion Gate (Lọc chuyển động MOG2 giảm tải CPU)

**Files:**
- Create: `core/ai/src/motion_gate.py`
- Create: `core/ai/tests/test_motion_gate.py`

**Interfaces:**
- Produces: `MotionGate.detect_motion(frame_gray: np.ndarray) -> bool`

- [ ] **Step 1: Viết test kiểm tra MotionGate trên frame tĩnh và frame có chuyển động**
- [ ] **Step 2: Chạy test `uv run pytest tests/test_motion_gate.py` xác nhận FAIL**
- [ ] **Step 3: Cài đặt `MotionGate` với MOG2 background subtractor**
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Commit mã nguồn Task 3**

```bash
git add core/ai/src/motion_gate.py core/ai/tests/test_motion_gate.py
git commit -m "feat(ai): implement MOG2 Motion Gate filter"
```

---

### Task 4: Python AI - YOLOv8/v11 Nano Detector & OpenVINO/ONNX Inference

**Files:**
- Create: `core/ai/src/yolo_detector.py`
- Create: `core/ai/tests/test_yolo_detector.py`

**Interfaces:**
- Produces: `YOLODetector.detect(frame: np.ndarray) -> list[DetectionResult]`

- [ ] **Step 1: Viết unit test cho YOLO Detector (giả lập frame và định dạng output bbox/confidence/label)**
- [ ] **Step 2: Chạy test `uv run pytest tests/test_yolo_detector.py` xác nhận FAIL**
- [ ] **Step 3: Cài đặt `YOLODetector` với NMS, scaling và fallback ONNX/OpenVINO**
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Commit mã nguồn Task 4**

```bash
git add core/ai/src/yolo_detector.py core/ai/tests/test_yolo_detector.py
git commit -m "feat(ai): implement YOLO object detection runner"
```

---

### Task 5: Python AI - ByteTrack Object Tracking & Spatial Zone/Tripwire Filter

**Files:**
- Create: `core/ai/src/tracker.py`
- Create: `core/ai/src/zone_filter.py`
- Create: `core/ai/tests/test_zone_filter.py`

**Interfaces:**
- Produces: `ZoneFilter.evaluate(track_id: int, bbox: list[int], zones: list[dict]) -> list[str]`

- [ ] **Step 1: Viết test cho thuật toán Ray-Casting đa giác (Polygon Zone) và cắt đường thẳng (Tripwire)**
- [ ] **Step 2: Chạy test `uv run pytest tests/test_zone_filter.py` xác nhận FAIL**
- [ ] **Step 3: Cài đặt thuật toán hình học trong `zone_filter.py`**
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Commit mã nguồn Task 5**

```bash
git add core/ai/src/tracker.py core/ai/src/zone_filter.py core/ai/tests/test_zone_filter.py
git commit -m "feat(ai): implement ByteTrack tracking and spatial zone/tripwire filter"
```

---

### Task 6: FastAPI Gateway - REST API, WebSocket Events & Telegram Alert

**Files:**
- Create: `core/ai/src/api.py`
- Create: `core/ai/src/alerts.py`
- Create: `core/ai/tests/test_api.py`

**Interfaces:**
- Produces: REST endpoints (`/api/cameras`, `/api/playback/timeline`, `/api/events`, `/api/zones`), `WebSocket /api/ws/events`, Telegram dispatch.

- [ ] **Step 1: Viết test cho FastAPI endpoints với TestClient**
- [ ] **Step 2: Chạy test `uv run pytest tests/test_api.py` xác nhận FAIL**
- [ ] **Step 3: Cài đặt FastAPI routes, WebSocket Manager và Telegram Alert sender**
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Commit mã nguồn Task 6**

```bash
git add core/ai/src/api.py core/ai/src/alerts.py core/ai/tests/test_api.py
git commit -m "feat(api): implement FastAPI REST endpoints, WebSocket hub and Telegram alerts"
```

---

### Task 7: Retention Engine - Tự động dọn dẹp xoay vòng dung lượng ổ cứng

**Files:**
- Create: `core/ai/src/retention.py`
- Create: `core/ai/tests/test_retention.py`

**Interfaces:**
- Produces: `RetentionWorker.cleanup_old_recordings(retention_days: int)`, `RetentionWorker.check_disk_watermark(max_percent: int)`

- [ ] **Step 1: Viết test cho cơ chế dọn dẹp theo ngày và theo dung lượng đĩa**
- [ ] **Step 2: Chạy test `uv run pytest tests/test_retention.py` xác nhận FAIL**
- [ ] **Step 3: Cài đặt `RetentionWorker` dọn dẹp file và cập nhật SQLite**
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Commit mã nguồn Task 7**

```bash
git add core/ai/src/retention.py core/ai/tests/test_retention.py
git commit -m "feat(storage): implement automated circular retention engine"
```

---

### Task 8: Next.js 16 Web Dashboard - Multi-Camera Grid & WebRTC Live View

**Files:**
- Create: `web/src/components/live/CameraGrid.tsx`
- Create: `web/src/components/live/WebRTCPlayer.tsx`
- Create: `web/src/app/live/page.tsx`

**Interfaces:**
- Produces: `<CameraGrid layout="2x2" />` kết nối WHEP của go2rtc

- [ ] **Step 1: Viết WebRTCPlayer kết nối trực tiếp WHEP endpoint của go2rtc**
- [ ] **Step 2: Viết giao diện lưới đa camera 1x1, 2x2, 3x3, 4x4**
- [ ] **Step 3: Chạy lint kiểm tra `pnpm lint`**
- [ ] **Step 4: Commit mã nguồn Task 8**

```bash
git add web/src/components/live/ web/src/app/live/
git commit -m "feat(web): implement multi-camera grid with go2rtc WebRTC player"
```

---

### Task 9: Next.js 16 Web Dashboard - 24h Timeline Player & Visual Zone Canvas Editor

**Files:**
- Create: `web/src/components/playback/TimelineScrubber.tsx`
- Create: `web/src/components/settings/ZoneCanvasEditor.tsx`
- Create: `web/src/app/playback/page.tsx`
- Create: `web/src/app/settings/zones/page.tsx`

**Interfaces:**
- Produces: `<TimelineScrubber />`, `<ZoneCanvasEditor />`

- [ ] **Step 1: Xây dựng thanh tua timeline 24h với dải màu sự kiện (Xanh/Cam/Xanh dương)**
- [ ] **Step 2: Xây dựng Canvas vẽ đa giác Polygon và Hàng rào ảo Tripwire trên ảnh camera**
- [ ] **Step 3: Chạy kiểm tra lint và build Next.js**
- [ ] **Step 4: Commit mã nguồn Task 9**

```bash
git add web/src/components/playback/ web/src/components/settings/ web/src/app/
git commit -m "feat(web): implement interactive 24h timeline player and visual zone canvas editor"
```

---

### Task 10: Docker Compose Packaging & Tích hợp Toàn diện

**Files:**
- Create: `deploy/docker-compose.yml`
- Create: `core/ai/Dockerfile` (Multi-stage build sử dụng `ghcr.io/astral-sh/uv:python3.12-bookworm-slim`)
- Create: `web/Dockerfile`

- [ ] **Step 1: Viết Dockerfile cho Python AI & API sử dụng `uv`**
- [ ] **Step 2: Viết `docker-compose.yml` kết nối go2rtc, nvr-ai-api và nvr-web**
- [ ] **Step 3: Kiểm thử toàn bộ hệ thống bằng kịch bản chạy thử**
- [ ] **Step 4: Commit mã nguồn Task 10**

```bash
git add deploy/ core/ai/Dockerfile web/Dockerfile
git commit -m "feat(deploy): complete docker-compose packaging with go2rtc and uv"
```
