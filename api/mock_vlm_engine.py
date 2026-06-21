import hashlib
import time
import random

# Predefined ground-truth database for the 7 preloaded scenarios
TEST_IMAGES_DB = {
    "helmet_violation": {
        "violation_found": True,
        "explanation": "Detected motorcycle with two occupants. Neither rider nor passenger is wearing a safety helmet. Violation verified.",
        "bounding_boxes": [
            {"label": "Rider (No Helmet)", "confidence": 0.96, "x": 0.47, "y": 0.44, "w": 0.05, "h": 0.08},
            {"label": "Passenger (No Helmet)", "confidence": 0.92, "x": 0.42, "y": 0.46, "w": 0.05, "h": 0.08},
            {"label": "Motorcycle", "confidence": 0.99, "x": 0.30, "y": 0.32, "w": 0.35, "h": 0.55}
        ],
        "ocr_plate": "OCCLUDED",
        "ocr_confidence": 0.0,
        "preprocessing_applied": "Low-Light Enhancement & Contrast Equalization",
        "violation_type": "Helmet Non-compliance"
    },
    "triple_riding": {
        "violation_found": True,
        "explanation": "Three people detected on a single two-wheeler (scooter), violating vehicle capacity regulations (triple riding).",
        "bounding_boxes": [
            {"label": "Triple Riding", "confidence": 0.95, "x": 0.25, "y": 0.28, "w": 0.45, "h": 0.62},
            {"label": "Rider 1 (No Helmet)", "confidence": 0.98, "x": 0.33, "y": 0.30, "w": 0.12, "h": 0.25},
            {"label": "Rider 2 (No Helmet)", "confidence": 0.97, "x": 0.42, "y": 0.33, "w": 0.11, "h": 0.25},
            {"label": "Rider 3 (No Helmet)", "confidence": 0.94, "x": 0.50, "y": 0.36, "w": 0.10, "h": 0.22}
        ],
        "ocr_plate": "MH 12 GP 4410",
        "ocr_confidence": 0.94,
        "preprocessing_applied": "Motion Blur Deconvolution & Sharpening",
        "violation_type": "Triple Riding"
    },
    "red_light": {
        "violation_found": True,
        "explanation": "Sedan vehicle detected crossing the intersection stop line while the traffic light signal was active red.",
        "bounding_boxes": [
            {"label": "Red Light Signal", "confidence": 0.99, "x": 0.62, "y": 0.08, "w": 0.08, "h": 0.12},
            {"label": "Vehicle (Violation)", "confidence": 0.98, "x": 0.35, "y": 0.52, "w": 0.32, "h": 0.38},
            {"label": "Stop Line", "confidence": 0.95, "x": 0.25, "y": 0.72, "w": 0.55, "h": 0.03}
        ],
        "ocr_plate": "DL 1C AA 7788",
        "ocr_confidence": 0.95,
        "preprocessing_applied": "Rain De-hazing & Highlight Recovery",
        "violation_type": "Red-light Violation"
    },
    "illegal_parking": {
        "violation_found": True,
        "explanation": "SUV vehicle parked fully on the pedestrian footpath under a clearly visible 'No Parking' sign, causing foot traffic obstruction.",
        "bounding_boxes": [
            {"label": "Illegal Parking", "confidence": 0.93, "x": 0.18, "y": 0.42, "w": 0.42, "h": 0.48},
            {"label": "No Parking Sign", "confidence": 0.97, "x": 0.72, "y": 0.28, "w": 0.10, "h": 0.18}
        ],
        "ocr_plate": "DL 3C AY 4455",
        "ocr_confidence": 0.92,
        "preprocessing_applied": "Shadow Exposure Correction",
        "violation_type": "Illegal Parking"
    },
    "wrong_side": {
        "violation_found": True,
        "explanation": "Vehicle detected traveling in the wrong direction against the designated flow of traffic, posing severe collision risk.",
        "bounding_boxes": [
            {"label": "Wrong-Way Vehicle", "confidence": 0.96, "x": 0.32, "y": 0.45, "w": 0.25, "h": 0.38},
            {"label": "Oncoming Traffic Lane", "confidence": 0.90, "x": 0.15, "y": 0.50, "w": 0.50, "h": 0.40}
        ],
        "ocr_plate": "UP 16 AT 5521",
        "ocr_confidence": 0.96,
        "preprocessing_applied": "CCTV Noise Reduction & Contrast Stretch",
        "violation_type": "Wrong-side Driving"
    },
    "no_seatbelt": {
        "violation_found": True,
        "explanation": "Driver detected operating the vehicle without wearing the safety seatbelt, violating safety regulations.",
        "bounding_boxes": [
            {"label": "Driver (No Seatbelt)", "confidence": 0.98, "x": 0.42, "y": 0.28, "w": 0.18, "h": 0.28},
            {"label": "Windshield Zone", "confidence": 0.99, "x": 0.25, "y": 0.18, "w": 0.48, "h": 0.55}
        ],
        "ocr_plate": "OUT OF FRAME",
        "ocr_confidence": 0.0,
        "preprocessing_applied": "Refraction/Glare Reduction Polarizer Filter",
        "violation_type": "Seatbelt Non-compliance"
    },
    "stop_line": {
        "violation_found": True,
        "explanation": "Motorcycle detected waiting at the red light signal but positioned completely past the solid stop-line paint, blocking pedestrian crosswalk.",
        "bounding_boxes": [
            {"label": "Stop Line Violation", "confidence": 0.97, "x": 0.38, "y": 0.48, "w": 0.22, "h": 0.35},
            {"label": "Stop Line", "confidence": 0.96, "x": 0.15, "y": 0.65, "w": 0.70, "h": 0.03}
        ],
        "ocr_plate": "DL 8S BQ 1122",
        "ocr_confidence": 0.97,
        "preprocessing_applied": "Overexposure Control & Color Calibration",
        "violation_type": "Stop-line Violation"
    }
}

def process_image_query(prompt: str, image_id: str = None):
    """
    Simulates a Zero-Shot VLM (like GPT-4o or LLaVA).
    Parses the natural language prompt and returns simulated bounding boxes.
    """
    time.sleep(1.2) # Realism processing delay
    prompt_lower = prompt.lower()

    # Specialized VLM logic for preloaded scenarios based on prompt keyword matching
    if image_id and image_id in TEST_IMAGES_DB:
        # Default response is the violation check profile
        default_res = TEST_IMAGES_DB[image_id]

        if image_id == "helmet_violation":
            if any(k in prompt_lower for k in ["car", "vehicle", "sedan"]):
                return {
                    "violation_found": False,
                    "violation_type": "Traffic Scan",
                    "explanation": "Active vehicles detected in lane: 1 motorcycle, 1 background sedan.",
                    "bounding_boxes": [
                        {"label": "Motorcycle", "confidence": 0.99, "x": 0.30, "y": 0.32, "w": 0.35, "h": 0.55},
                        {"label": "Sedan (Background)", "confidence": 0.94, "x": 0.70, "y": 0.40, "w": 0.20, "h": 0.30}
                    ],
                    "ocr_plate": "OCCLUDED",
                    "ocr_confidence": 0.0,
                    "preprocessing_applied": default_res["preprocessing_applied"]
                }
            return default_res

        elif image_id == "triple_riding":
            if any(k in prompt_lower for k in ["car", "vehicle", "rickshaw", "traffic"]):
                return {
                    "violation_found": False,
                    "violation_type": "Traffic Scan",
                    "explanation": "Active road users classified: 1 motorcycle, 1 hatchback car on left lane, and 1 auto-rickshaw on right lane.",
                    "bounding_boxes": [
                        {"label": "Motorcycle", "confidence": 0.99, "x": 0.42, "y": 0.42, "w": 0.15, "h": 0.45},
                        {"label": "Hatchback (Car)", "confidence": 0.98, "x": 0.12, "y": 0.44, "w": 0.22, "h": 0.33},
                        {"label": "Auto Rickshaw", "confidence": 0.95, "x": 0.72, "y": 0.46, "w": 0.20, "h": 0.38}
                    ],
                    "ocr_plate": "NOT IN FRAME",
                    "ocr_confidence": 0.0,
                    "preprocessing_applied": default_res["preprocessing_applied"]
                }
            return default_res

        elif image_id == "red_light":
            if any(k in prompt_lower for k in ["car", "vehicle", "sedan"]):
                return {
                    "violation_found": False,
                    "violation_type": "Traffic Scan",
                    "explanation": "Detected 1 white sedan vehicle approaching the intersection.",
                    "bounding_boxes": [
                        {"label": "Sedan (Car)", "confidence": 0.98, "x": 0.35, "y": 0.52, "w": 0.32, "h": 0.38}
                    ],
                    "ocr_plate": "DL 1C AA 7788",
                    "ocr_confidence": 0.95,
                    "preprocessing_applied": default_res["preprocessing_applied"]
                }
            return default_res

        elif image_id == "illegal_parking":
            if any(k in prompt_lower for k in ["car", "vehicle", "suv"]) and not any(k in prompt_lower for k in ["illegal", "parked", "parking", "violation", "obstruction"]):
                return {
                    "violation_found": False,
                    "violation_type": "Traffic Scan",
                    "explanation": "One dark SUV vehicle detected stationary.",
                    "bounding_boxes": [
                        {"label": "SUV (Car)", "confidence": 0.97, "x": 0.18, "y": 0.42, "w": 0.42, "h": 0.48}
                    ],
                    "ocr_plate": "DL 3C AY 4455",
                    "ocr_confidence": 0.92,
                    "preprocessing_applied": default_res["preprocessing_applied"]
                }
            return default_res

        elif image_id == "wrong_side":
            if any(k in prompt_lower for k in ["car", "sedan", "vehicle"]) and not any(k in prompt_lower for k in ["wrong", "way", "side", "violation"]):
                return {
                    "violation_found": False,
                    "violation_type": "Traffic Scan",
                    "explanation": "Active vehicles detected in lane: 1 oncoming white sedan violating lane flow, background traffic moving in normal direction.",
                    "bounding_boxes": [
                        {"label": "Sedan (Car)", "confidence": 0.98, "x": 0.32, "y": 0.45, "w": 0.25, "h": 0.38}
                    ],
                    "ocr_plate": "UP 16 AT 5521",
                    "ocr_confidence": 0.96,
                    "preprocessing_applied": default_res["preprocessing_applied"]
                }
            return default_res

        elif image_id == "no_seatbelt":
            if any(k in prompt_lower for k in ["person", "driver", "man", "occupant"]) and not any(k in prompt_lower for k in ["seatbelt", "without", "violation", "no"]):
                return {
                    "violation_found": False,
                    "violation_type": "Traffic Scan",
                    "explanation": "One occupant (driver) detected behind front windshield.",
                    "bounding_boxes": [
                        {"label": "Driver (Male)", "confidence": 0.99, "x": 0.40, "y": 0.25, "w": 0.22, "h": 0.45}
                    ],
                    "ocr_plate": "OUT OF FRAME",
                    "ocr_confidence": 0.0,
                    "preprocessing_applied": default_res["preprocessing_applied"]
                }
            return default_res

        elif image_id == "stop_line":
            if any(k in prompt_lower for k in ["scooter", "motorcycle", "bike", "vehicle"]) and not any(k in prompt_lower for k in ["stop", "line", "past", "encroachment", "violation"]):
                return {
                    "violation_found": False,
                    "violation_type": "Traffic Scan",
                    "explanation": "One scooter vehicle detected at red signal intersection.",
                    "bounding_boxes": [
                        {"label": "Scooter (Motorcycle)", "confidence": 0.97, "x": 0.38, "y": 0.48, "w": 0.22, "h": 0.35}
                    ],
                    "ocr_plate": "DL 8S BQ 1122",
                    "ocr_confidence": 0.97,
                    "preprocessing_applied": default_res["preprocessing_applied"]
                }
            return default_res

        return default_res

    # Custom file uploads or non-scenario fallback processing logic
    boxes = []
    violation_found = False
    explanation = "Detected objects matching your natural language query."
    ocr_plate = "DL 3S CD 9988"
    ocr_confidence = 0.95
    preprocessing_applied = "Standard Histogram Equalization"
    violation_type = "Traffic Scan"
    
    # Smarter query keyword matching for general uploads
    if any(k in prompt_lower for k in ["helmet", "pillion"]):
        violation_type = "Safety Compliance Scan"
        explanation = "Scanned image for motorcycle safety. Two-wheeler detected."
        boxes.append({"label": "Rider (No Helmet)", "confidence": 0.92, "x": 0.45, "y": 0.25, "w": 0.12, "h": 0.18})
        boxes.append({"label": "Motorcycle", "confidence": 0.98, "x": 0.40, "y": 0.40, "w": 0.22, "h": 0.42})
        if "violation" in prompt_lower or "illegal" in prompt_lower or "no" in prompt_lower:
            violation_found = True
            violation_type = "Helmet Non-compliance"
            explanation = "Safety compliance alert: Motorcyclist detected without helmet."
            
    elif any(k in prompt_lower for k in ["park", "footpath", "sidewalk"]):
        violation_type = "Obstruction Scan"
        explanation = "Scanned footpath for obstacles. Detected SUV near curb."
        boxes.append({"label": "SUV", "confidence": 0.94, "x": 0.30, "y": 0.40, "w": 0.40, "h": 0.45})
        if "violation" in prompt_lower or "illegal" in prompt_lower or "parking" in prompt_lower:
            violation_found = True
            violation_type = "Illegal Parking"
            explanation = "Obstruction alert: Vehicle parked illegally blocking sidewalk."
            
    elif any(k in prompt_lower for k in ["signal", "red", "light"]):
        violation_type = "Intersection Light Scan"
        explanation = "Scanned light signal. Active light is active red."
        boxes.append({"label": "Red Light Signal", "confidence": 0.99, "x": 0.50, "y": 0.10, "w": 0.05, "h": 0.1})
        boxes.append({"label": "Sedan (Car)", "confidence": 0.92, "x": 0.45, "y": 0.50, "w": 0.20, "h": 0.35})
        if "violation" in prompt_lower or "crossing" in prompt_lower or "red" in prompt_lower:
            violation_found = True
            violation_type = "Red-light Violation"
            explanation = "Light violation alert: Vehicle crossed stop line on active red signal."
            
    elif any(k in prompt_lower for k in ["car", "vehicle", "sedan", "suv"]):
        violation_type = "Vehicle Counting"
        explanation = "Scanned frame for automobiles. Hatchback car identified."
        boxes.append({"label": "Hatchback (Car)", "confidence": 0.96, "x": 0.25, "y": 0.38, "w": 0.48, "h": 0.45})
        
    elif any(k in prompt_lower for k in ["person", "pedestrian", "people"]):
        violation_type = "Pedestrian Scan"
        explanation = "Scanned frame for foot traffic. Pedestrian detected near crosswalk."
        boxes.append({"label": "Pedestrian", "confidence": 0.89, "x": 0.45, "y": 0.20, "w": 0.15, "h": 0.50})
        
    else:
        # Fallback for completely custom prompts
        violation_type = "Custom Inquiry Scan"
        explanation = "Identified targets matching custom prompt keywords."
        boxes.append({"label": "Detected Target", "confidence": round(random.uniform(0.75, 0.98), 2), "x": 0.35, "y": 0.35, "w": 0.30, "h": 0.30})

    return {
        "violation_found": violation_found,
        "violation_type": violation_type,
        "explanation": explanation,
        "bounding_boxes": boxes,
        "ocr_plate": ocr_plate,
        "ocr_confidence": ocr_confidence,
        "preprocessing_applied": preprocessing_applied
    }

def generate_evidence_hash(image_base64: str, metadata: dict):
    """
    Simulates the cryptographic evidence locking mechanism.
    Hashes the image along with the timestamp and bounding box metadata
    to ensure it cannot be tampered with for court evidence.
    """
    payload = image_base64[:100] + str(metadata)
    evidence_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    return evidence_hash
