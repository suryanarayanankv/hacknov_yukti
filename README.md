# Real-Time People Detection System

A smart monitoring system that uses AI to count people in real-time from camera feeds and sends alerts when areas get too busy.

## Features

- 🎥 Live camera monitoring with person detection
- 📊 Real-time people counting
- ⚠️ Automatic alerts when thresholds exceeded
- 🌍 Location tracking
- 📱 Web dashboard
- 🔄 Multi-camera support

## Quick Start

### Install Dependencies
```bash
pip install fastapi uvicorn ultralytics opencv-python geocoder requests
```

### Run the System

1. **Start the server:**
```bash
python server.py
```

2. **Start camera detection:**
```bash
python camera.py
```

3. **Open dashboard:**
Go to `http://localhost:8000` in your browser

## Configuration

### Camera Settings (camera.py)
```python
camera_id = "camera1"  # Unique camera ID
BACKEND_URL = "http://localhost:8000/update_count"  # Server URL
```

### Alert Threshold
- Default: 5 people
- Adjustable in web interface (1-100 people)

## API Endpoints

**POST /update_count** - Receive camera data
**GET /all_data** - Get data from all cameras
**GET /video_feed** - Live video stream

## Multi-Camera Setup

1. Install on each camera device
2. Set unique `camera_id` for each
3. Point all cameras to same server URL
4. All camera data gets stored in `server.py`
5. Dashboard fetches combined data from server
6. Monitor all cameras from single interface

## Troubleshooting

**Video not loading:**
- Check camera permissions
- Verify camera is working

**Connection failed:**
- Make sure server is running
- Check network connection

**Poor performance:**
- Lower video resolution
- Use fewer cameras
- Skip frames for processing

## File Structure
```
├── camera.py      # Camera detection
├── server.py      # Backend API
├── lat_long.py    # Location services
├── index.html     # Web interface
├── styles.css     # Styling
└── script.js      # Frontend logic
```
