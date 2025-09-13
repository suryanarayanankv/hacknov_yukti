from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Crowd Management Backend")

# Allow frontend or manager laptops to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace "*" with specific domain/IP in production
    allow_methods=["*"],
    allow_headers=["*"]
)

# Data model for incoming camera updates
class CameraData(BaseModel):
    camera_id: str
    latitude: float
    longitude: float
    people_count: int

# Store latest data for each camera
camera_data_store = {}

@app.post("/update_count")
def update_count(data: CameraData):
    """
    Receive data from a camera and store the latest count + location.
    """
    camera_data_store[data.camera_id] = {
        "latitude": data.latitude,
        "longitude": data.longitude,
        "people_count": data.people_count
    }
    print(f"[DEBUG] Camera: {data.camera_id} | "
          f"Lat: {data.latitude} | Lon: {data.longitude} | "
          f"People: {data.people_count}")
    return {"status": "ok", "data": camera_data_store[data.camera_id]}

@app.get("/all_data")
def get_all_data():
    """
    Return the latest data from all cameras.
    """
    return camera_data_store

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
