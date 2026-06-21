from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time
from mock_vlm_engine import process_image_query, generate_evidence_hash

app = FastAPI(title="TrafficSentinel CV API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageQueryRequest(BaseModel):
    image_data: str # base64
    prompt: str
    image_id: Optional[str] = None

@app.post("/api/analyze-image")
def analyze_image(req: ImageQueryRequest):
    # Process through our "VLM"
    vlm_result = process_image_query(req.prompt, req.image_id)
    
    # Generate cryptographic hash of the evidence
    timestamp = time.time()
    evidence_hash = generate_evidence_hash(req.image_data, {
        "timestamp": timestamp,
        "prompt": req.prompt,
        "boxes": vlm_result["bounding_boxes"]
    })
    
    return {
        "status": "success",
        "timestamp": timestamp,
        "evidence_hash": evidence_hash,
        "vlm_analysis": vlm_result
    }

if __name__ == "__main__":
    import uvicorn
    # Port 8002 for complete independence
    uvicorn.run(app, host="0.0.0.0", port=8002)
