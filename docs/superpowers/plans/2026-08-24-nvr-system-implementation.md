# KẾ HOẠCH TRIỂN KHAI HỆ THỐNG NVR THÔNG MINH (AI-POWERED NVR IMPLEMENTATION PLAN)

> **Dành cho Agent/Kỹ sư thực thi:** REQUIRED SUB-SKILL: Sử dụng `superpowers:subagent-driven-development` (khuyên dùng) hoặc `superpowers:executing-plans` để thực hiện từng task theo danh sách kiểm tra checkbox (`- [ ]`).

**Mục tiêu:** Xây dựng hoàn chỉnh hệ thống Network Video Recorder (NVR) thông minh phục vụ 4 – 32 camera, hỗ trợ xem trực tiếp WebRTC độ trễ siêu thấp (< 300ms), ghi hình 24/7 passthrough zero-copy fMP4, phân tích AI nhận diện người/xe/vùng cảnh báo (quản lý bằng `uv`, tăng tốc OpenVINO/ONNX/Coral), cơ sở dữ liệu SQLite WAL, dọn dẹp xoay vòng dung lượng đĩa, cảnh báo Telegram và Web Dashboard Next.js 16 với thanh tua timeline 24h mượt mà.

**Kiến trúc:** Mô hình Decoupled đa tầng:
1. `core/media`: Go Media Engine (RTSP Ingest, WebRTC WHEP, Zero-Copy fMP4 Recorder).
2. `core/ai`: Python AI Worker (quản lý gói & môi trường bằng `uv`, Motion Gate, YOLOv8/v11 Nano, ByteTrack, Zone/Tripwire logic).
3. `core/api`: Go API Gateway & Event Bus (SQLite WAL, RESTful API, WebSocket, Telegram Dispatcher, Retention Worker).
4. `web`: Next.js 16 Frontend Dashboard (Multi-Cam Grid, 24h Timeline Player, Visual Zone Editor, Event Gallery).
5. `deploy`: Docker Compose packaging với GPU/iGPU passthrough (`/dev/dri`).

**Công nghệ sử dụng:** Go 1.22+, Python 3.12 (`uv`), Next.js 16, React 19, TypeScript, Tailwind CSS 4, SQLite3 WAL, Docker & Docker Compose.

**Tài liệu đặc tả (Spec):** [docs/superpowers/specs/2026-08-24-nvr-system-architecture-design.md](file:///d:/APP/laragon/www/webphim/docs/superpowers/specs/2026-08-24-nvr-system-architecture-design.md)

## Ràng buộc Toàn cục (Global Constraints)
- Toàn bộ module Python **bắt buộc quản lý và cài đặt thông qua công cụ `uv`** (Astral).
- Không thực hiện re-encode video H.264/H.265 ở luồng ghi hình 24/7 (Passthrough remuxing).
- Phân đoạn video cố định 60 giây và luôn bắt đầu bằng 1 I-Frame (Keyframe).
- Cơ sở dữ liệu SQLite phải bật chế độ `PRAGMA journal_mode=WAL;` và `PRAGMA synchronous=NORMAL;`.

---

### Task 1: Khởi tạo Cấu trúc Thư mục & Cơ sở dữ liệu SQLite (WAL Mode)

**Files:**
- Create: `core/api/db/schema.sql`
- Create: `core/api/db/db.go`
- Create: `core/api/db/db_test.go`

**Interfaces:**
- Produces: `InitDB(dbPath string) (*sql.DB, error)`, `GetDB() *sql.DB`

- [ ] **Step 1: Viết test khởi tạo DB SQLite với WAL mode và các bảng cameras, recordings, events, zones**

```go
package db

import (
	"os"
	"testing"
)

func TestInitDBSchema(t *testing.T) {
	tmpFile := "test_nvr.db"
	defer os.Remove(tmpFile)

	db, err := InitDB(tmpFile)
	if err != nil {
		t.Fatalf("Failed to init DB: %v", err)
	}
	defer db.Close()

	var journalMode string
	err = db.QueryRow("PRAGMA journal_mode;").Scan(&journalMode)
	if err != nil || journalMode != "wal" {
		t.Errorf("Expected journal_mode=wal, got %s, err: %v", journalMode, err)
	}
}
```

- [ ] **Step 2: Chạy test để xác nhận test fail**

Run: `go test ./core/api/db/ -v`
Expected: FAIL (package/function not yet implemented)

- [ ] **Step 3: Viết mã nguồn schema.sql và db.go**

```sql
-- core/api/db/schema.sql
CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rtsp_main TEXT NOT NULL,
    rtsp_sub TEXT,
    retention_days INTEGER DEFAULT 30,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    camera_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    duration REAL NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    has_audio INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_recordings_lookup ON recordings(camera_id, start_time, end_time);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    camera_id TEXT NOT NULL,
    label TEXT NOT NULL,
    track_id INTEGER NOT NULL,
    zone_name TEXT,
    confidence REAL NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    snapshot_path TEXT,
    clip_path TEXT,
    is_locked INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_timeline ON events(camera_id, start_time);

CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    camera_id TEXT NOT NULL,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL, -- polygon, tripwire, mask
    coordinates_json TEXT NOT NULL
);
```

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `go test ./core/api/db/ -v`
Expected: PASS

- [ ] **Step 5: Commit mã nguồn Task 1**

```bash
git add core/api/db/
git commit -m "feat(db): initialize SQLite database schema in WAL mode"
```

---

### Task 2: Go Media Engine - Thu nạp RTSP & Ghi hình Phân đoạn fMP4 Zero-Copy

**Files:**
- Create: `core/media/recorder/segmenter.go`
- Create: `core/media/recorder/segmenter_test.go`
- Create: `core/media/ingest/rtsp_client.go`

**Interfaces:**
- Consumes: RTSP stream NALUs
- Produces: `SegmentWriter.WriteNALU(nalu []byte, isKeyFrame bool, timestamp int64)`, `CloseCurrentSegment() (filePath string, duration float64)`

- [ ] **Step 1: Viết test cho fMP4 Segment Writer kiểm tra căn chỉnh Keyframe**

```go
package recorder

import (
	"os"
	"path/filepath"
	"testing"
)

func TestKeyframeAlignedSegmenting(t *testing.T) {
	tempDir, _ := os.MkdirTemp("", "nvr_rec_test")
	defer os.RemoveAll(tempDir)

	writer := NewSegmentWriter("cam01", tempDir, 60.0) // 60s segments
	// Segment must not start before first keyframe
	err := writer.WriteSample([]byte{0x00, 0x01}, false, 1000)
	if err == nil {
		t.Errorf("Expected error when writing non-keyframe as segment start")
	}

	err = writer.WriteSample([]byte{0x65, 0x01}, true, 1000) // IDR frame
	if err != nil {
		t.Fatalf("Failed to start segment with IDR frame: %v", err)
	}
}
```

- [ ] **Step 2: Chạy test xác nhận FAIL**

Run: `go test ./core/media/recorder/ -v`
Expected: FAIL

- [ ] **Step 3: Cài đặt SegmentWriter và RTSP auto-reconnect client**

- [ ] **Step 4: Chạy test xác nhận PASS**

Run: `go test ./core/media/recorder/ -v`
Expected: PASS

- [ ] **Step 5: Commit mã nguồn Task 2**

```bash
git add core/media/
git commit -m "feat(media): implement RTSP client and keyframe-aligned segment recorder"
```

---

### Task 3: Go Media Engine - WebRTC WHEP & MSE Streaming Hub

**Files:**
- Create: `core/media/webrtc/whep_handler.go`
- Create: `core/media/webrtc/whep_handler_test.go`
- Create: `core/media/hub/stream_hub.go`

**Interfaces:**
- Produces: `HandleWHEPOffer(camID string, sdpOffer string) (sdpAnswer string, err error)`

- [ ] **Step 1: Viết unit test cho SDP exchange của WHEP handler**
- [ ] **Step 2: Chạy test xác nhận FAIL**
- [ ] **Step 3: Triển khai Pion WebRTC PeerConnection và TrackLocalStaticRTP dispatch**
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Commit mã nguồn Task 3**

```bash
git add core/media/webrtc/ core/media/hub/
git commit -m "feat(webrtc): implement WHEP low-latency live streaming hub"
```

---

### Task 4: Python AI Worker - Quản lý môi trường với `uv`, Hardware Decoder & Motion Gate

**Files:**
- Create: `core/ai/pyproject.toml`
- Create: `core/ai/src/motion_gate.py`
- Create: `core/ai/tests/test_motion_gate.py`

**Interfaces:**
- Produces: `MotionGate.detect_motion(frame_gray: np.ndarray) -> bool`

- [ ] **Step 1: Khởi tạo dự án Python bằng `uv`**

Run:
```bash
cd core/ai && uv init --app
uv add opencv-python-headless numpy pydantic onnxruntime openvino pillow pytest
```

- [ ] **Step 2: Viết test cho Motion Gate (kiểm tra frame tĩnh vs frame có chuyển động)**

```python
# core/ai/tests/test_motion_gate.py
import numpy as np
from src.motion_gate import MotionGate

def test_motion_gate_static_vs_moving():
    gate = MotionGate(threshold=25, min_area=500)
    blank1 = np.zeros((180, 320), dtype=np.uint8)
    blank2 = np.zeros((180, 320), dtype=np.uint8)

    # Frame tĩnh -> Không có chuyển động
    assert gate.detect_motion(blank1) is False
    assert gate.detect_motion(blank2) is False

    # Frame có vật chuyển động (vẽ hình chữ nhật trắng lớn)
    moving_frame = np.zeros((180, 320), dtype=np.uint8)
    moving_frame[50:120, 50:120] = 255
    assert gate.detect_motion(moving_frame) is True
```

- [ ] **Step 3: Chạy test bằng `uv run pytest` để xác nhận FAIL**

Run: `cd core/ai && uv run pytest tests/test_motion_gate.py`
Expected: FAIL

- [ ] **Step 4: Cài đặt lớp MotionGate với MOG2/Frame Differencing**

```python
# core/ai/src/motion_gate.py
import cv2
import numpy as np

class MotionGate:
    def __init__(self, threshold: int = 25, min_area: int = 500):
        self.min_area = min_area
        self.fgbg = cv2.createBackgroundSubtractorMOG2(history=50, varThreshold=threshold, detectShadows=False)

    def detect_motion(self, frame_gray: np.ndarray) -> bool:
        fgmask = self.fgbg.apply(frame_gray)
        contours, _ = cv2.findContours(fgmask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            if cv2.contourArea(cnt) > self.min_area:
                return True
        return False
```

- [ ] **Step 5: Chạy test bằng `uv run pytest` để xác nhận PASS**

Run: `cd core/ai && uv run pytest tests/test_motion_gate.py`
Expected: PASS

- [ ] **Step 6: Commit mã nguồn Task 4**

```bash
git add core/ai/
git commit -m "feat(ai): setup uv environment and implement Motion Gate filter"
```

---

### Task 5: Python AI Worker - YOLO Inference, ByteTrack & Zone/Tripwire Logic

**Files:**
- Create: `core/ai/src/yolo_detector.py`
- Create: `core/ai/src/zone_filter.py`
- Create: `core/ai/src/event_emitter.py`
- Create: `core/ai/tests/test_zone_filter.py`

**Interfaces:**
- Produces: `ZoneFilter.check_violation(bbox: list[int], zones: list[dict]) -> list[str]`

- [ ] **Step 1: Viết test cho thuật toán kiểm tra điểm/bbox nằm trong Polygon Zone & Tripwire**
- [ ] **Step 2: Chạy test qua `uv run pytest` xác nhận FAIL**
- [ ] **Step 3: Cài đặt Ray-Casting algorithm cho Polygon Zone & Line Intersection cho Tripwire**
- [ ] **Step 4: Chạy test qua `uv run pytest` xác nhận PASS**
- [ ] **Step 5: Commit mã nguồn Task 5**

```bash
git add core/ai/
git commit -m "feat(ai): implement YOLO object detection, ByteTrack and spatial Zone filter"
```

---

### Task 6: Go API Gateway, Event Bus, Telegram Alert & Retention Engine

**Files:**
- Create: `core/api/handlers/camera_handler.go`
- Create: `core/api/handlers/playback_handler.go`
- Create: `core/api/retention/retention_worker.go`
- Create: `core/api/alerts/telegram_bot.go`
- Create: `core/api/main.go`

**Interfaces:**
- Produces: REST endpoints (`/api/cameras`, `/api/playback/timeline`, `/api/events`), WebSocket Hub (`/api/ws/events`), Telegram notification trigger.

- [ ] **Step 1: Viết test cho retention worker (xóa file phân đoạn cũ hơn N ngày và dọn khi đĩa đầy)**
- [ ] **Step 2: Chạy test xác nhận FAIL**
- [ ] **Step 3: Cài đặt Fiber/Gin router, SQLite query endpoints, Telegram Bot sender và Retention loop**
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Commit mã nguồn Task 6**

```bash
git add core/api/
git commit -m "feat(api): add REST endpoints, Telegram alert dispatcher and retention engine"
```

---

### Task 7: Next.js 16 Web Dashboard - Multi-Camera Grid & WebRTC Live View

**Files:**
- Create: `web/src/components/live/CameraGrid.tsx`
- Create: `web/src/components/live/WebRTCPlayer.tsx`
- Create: `web/src/hooks/useWebRTCStream.ts`

**Interfaces:**
- Produces: `<CameraGrid cameras={cameraList} layout="2x2" />`

- [ ] **Step 1: Viết component WebRTCPlayer kết nối WHEP endpoint với auto-reconnect**
- [ ] **Step 2: Viết component CameraGrid hỗ trợ bố cục 1x1, 2x2, 3x3, 4x4**
- [ ] **Step 3: Chạy lint và build kiểm tra `pnpm lint` & `pnpm build`**
- [ ] **Step 4: Commit mã nguồn Task 7**

```bash
git add web/src/components/live/
git commit -m "feat(web): implement multi-camera grid and WebRTC live player"
```

---

### Task 8: Next.js 16 Web Dashboard - 24h Interactive Timeline Player & Event Gallery

**Files:**
- Create: `web/src/components/playback/TimelineScrubber.tsx`
- Create: `web/src/components/playback/PlaybackPlayer.tsx`
- Create: `web/src/components/events/EventGallery.tsx`

**Interfaces:**
- Produces: `<TimelineScrubber date={selectedDate} segments={segments} events={events} onSeek={handleSeek} />`

- [ ] **Step 1: Viết component TimelineScrubber render dải màu (Xanh: 24/7, Cam: Người, Xanh dương: Xe) hỗ trợ zoom chuột**
- [ ] **Step 2: Viết logic chuyển đổi phân đoạn fMP4 mượt mà khi người dùng kéo thanh tua**
- [ ] **Step 3: Tạo trang Event Gallery lọc sự kiện theo camera/loại đối tượng/thời gian**
- [ ] **Step 4: Commit mã nguồn Task 8**

```bash
git add web/src/components/playback/ web/src/components/events/
git commit -m "feat(web): implement interactive 24h timeline player and event gallery"
```

---

### Task 9: Next.js 16 Web Dashboard - Visual Zone & Mask Canvas Editor

**Files:**
- Create: `web/src/components/settings/ZoneCanvasEditor.tsx`
- Create: `web/src/hooks/useCanvasDraw.ts`

**Interfaces:**
- Produces: `<ZoneCanvasEditor snapshotUrl={url} initialZones={zones} onSave={saveZones} />`

- [ ] **Step 1: Viết canvas tương tác cho phép click tạo các điểm Polygon, kéo Tripwire, vẽ vùng Mask**
- [ ] **Step 2: Tích hợp API lưu cấu hình zone về Go API Gateway**
- [ ] **Step 3: Commit mã nguồn Task 9**

```bash
git add web/src/components/settings/
git commit -m "feat(web): implement visual zone and mask canvas editor"
```

---

### Task 10: Docker Compose Packaging, Hardware Passthrough & Kiểm thử Tích hợp

**Files:**
- Create: `deploy/docker-compose.yml`
- Create: `deploy/Dockerfile.media`
- Create: `deploy/Dockerfile.ai` (Multi-stage build sử dụng `uv`)
- Create: `deploy/Dockerfile.api`
- Create: `deploy/Dockerfile.web`

- [ ] **Step 1: Viết Dockerfile cho Python AI Worker sử dụng `ghcr.io/astral-sh/uv:python3.12-bookworm-slim`**
- [ ] **Step 2: Viết Dockerfile cho Go Media/API và Next.js Frontend**
- [ ] **Step 3: Viết `docker-compose.yml` với cấu hình volume lưu trữ và passthrough `/dev/dri` (Intel iGPU)**
- [ ] **Step 4: Chạy kiểm thử tích hợp (End-to-End Simulation) với luồng RTSP mẫu**
- [ ] **Step 5: Commit mã nguồn Task 10**

```bash
git add deploy/
git commit -m "feat(deploy): add docker compose and uv-based container packaging"
```
