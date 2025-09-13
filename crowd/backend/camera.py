from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
import cv2
from lat_long import get_location  # import your function
import requests

# Initialize FastAPI
app = FastAPI()

# Load YOLOv8s model (small, CPU-friendly)
model = YOLO("yolov8s.pt")

# Open webcam
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

frame_count = 0

# Get camera latitude & longitude once at startup
latitude, longitude = get_location()
camera_id = "camera1"  # change per laptop/camera

BACKEND_URL = "http://10.238.58.15:8000/update_count"  # replace with backend IP

def send_count_to_backend(people_count):
    data = {
        "camera_id": camera_id,
        "latitude": latitude,
        "longitude": longitude,
        "people_count": people_count
    }
    try:
        requests.post(BACKEND_URL, json=data)
    except:
        pass  # ignore errors for now

def gen_frames():
    global frame_count
    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        frame_count += 1

        # Optional: skip every other frame to improve FPS
        if frame_count % 1 == 0:
            results = model(frame)

            people_count = 0  # count people in this frame

            # Draw bounding boxes for people (class 0)
            for result in results:
                if result.boxes is not None:
                    for box, cls in zip(result.boxes.xyxy, result.boxes.cls):
                        if int(cls) == 0:
                            people_count += 1
                            x1, y1, x2, y2 = map(int, box)
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                            cv2.putText(frame, "Person", (x1, y1-10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255), 2)

            # Send people count + location to backend
            send_count_to_backend(people_count)

        # Encode frame as JPEG
        _, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()

        # Yield frame for browser
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(gen_frames(), media_type='multipart/x-mixed-replace; boundary=frame')

@app.get("/")
def index():
    return """
    <html>
        <head>
            <title>Person Detection</title>
        </head>
        <body>
            <h1>Real-time Person Detection</h1>
            <img src="/video_feed" width="640" height="480">
        </body>
    </html>
    """


