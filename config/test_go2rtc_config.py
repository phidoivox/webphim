import pytest
import yaml
from config.go2rtc_helper import generate_go2rtc_config, parse_go2rtc_config

def test_generate_empty_cameras():
    config_yaml = generate_go2rtc_config([])
    parsed = yaml.safe_load(config_yaml)
    assert "api" in parsed
    assert parsed["api"]["listen"] == ":1984"
    assert "webrtc" in parsed
    assert parsed["webrtc"]["listen"] == ":8555"
    assert parsed["streams"] == {}

def test_generate_single_camera():
    cameras = [
        {
            "id": "cam_gate",
            "name": "Gate Camera",
            "rtsp_main": "rtsp://admin:pass@192.168.1.100:554/stream1",
            "rtsp_sub": "rtsp://admin:pass@192.168.1.100:554/stream2",
        }
    ]
    config_yaml = generate_go2rtc_config(cameras)
    parsed = parse_go2rtc_config(config_yaml)
    assert "cam_gate" in parsed["streams"]
    assert parsed["streams"]["cam_gate"] == ["rtsp://admin:pass@192.168.1.100:554/stream1"]
    assert "cam_gate_sub" in parsed["streams"]
    assert parsed["streams"]["cam_gate_sub"] == ["rtsp://admin:pass@192.168.1.100:554/stream2"]

def test_generate_camera_without_sub():
    cameras = [
        {
            "id": "cam_garage",
            "name": "Garage Camera",
            "rtsp_main": "rtsp://admin:pass@192.168.1.101:554/stream1",
            "rtsp_sub": None,
        }
    ]
    config_yaml = generate_go2rtc_config(cameras)
    parsed = parse_go2rtc_config(config_yaml)
    assert "cam_garage" in parsed["streams"]
    assert "cam_garage_sub" not in parsed["streams"]
