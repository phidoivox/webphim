from typing import Any, Dict, List, Optional
import yaml

def generate_go2rtc_config(
    cameras: List[Dict[str, Any]],
    api_port: int = 1984,
    webrtc_port: int = 8555,
    rtsp_port: int = 8554,
) -> str:
    """
    Generates dynamic YAML configuration string for go2rtc based on active camera list.
    """
    streams: Dict[str, List[str]] = {}

    for cam in cameras:
        cam_id = cam["id"]
        rtsp_main = cam.get("rtsp_main")
        rtsp_sub = cam.get("rtsp_sub")

        if rtsp_main:
            streams[cam_id] = [rtsp_main]

        if rtsp_sub:
            streams[f"{cam_id}_sub"] = [rtsp_sub]

    config = {
        "api": {"listen": f":{api_port}"},
        "webrtc": {"listen": f":{webrtc_port}"},
        "rtsp": {"listen": f":{rtsp_port}"},
        "streams": streams,
    }

    return yaml.dump(config, sort_keys=False)


def parse_go2rtc_config(yaml_str: str) -> Dict[str, Any]:
    """
    Parses a go2rtc YAML string into a Python dictionary.
    """
    return yaml.safe_load(yaml_str) or {}
