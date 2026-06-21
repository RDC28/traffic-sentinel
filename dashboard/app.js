// DOM Selectors
const galleryCards = document.querySelectorAll('.gallery-card');
const imageUpload = document.getElementById('image-upload');
const cameraFeed = document.getElementById('camera-feed');
const canvas = document.getElementById('canvas-overlay');
const ctx = canvas.getContext('2d');
const btnAnalyze = document.getElementById('btn-analyze');
const promptInput = document.getElementById('vlm-prompt');

// Results elements
const summaryCard = document.getElementById('summary-card');
const violationStatusBadge = document.getElementById('violation-status-badge');
const violationTypeVal = document.getElementById('violation-type-val');
const vlmExplanation = document.getElementById('vlm-explanation');

// OCR elements
const ocrPlateNumber = document.getElementById('ocr-plate-number');
const ocrConfidenceFill = document.getElementById('ocr-confidence-fill');
const ocrConfidenceVal = document.getElementById('ocr-confidence-val');

// Preprocessing elements
const preprocessingLogOp = document.getElementById('preprocessing-log-op');
const btnOrigView = document.getElementById('btn-orig-view');
const btnProcView = document.getElementById('btn-proc-view');

// Evidence elements
const hashContainer = document.getElementById('hash-container');
const evidenceHashSpan = document.getElementById('evidence-hash');
const btnExportPkg = document.getElementById('btn-export-pkg');

// Clock and stats elements
const liveTimeSpan = document.getElementById('live-time');
const overlayTimestamp = document.getElementById('overlay-timestamp');
const feedLocation = document.getElementById('feed-location');

// Judicial Review elements
const auditQueueBody = document.getElementById('audit-queue-body');
const btnAuditApprove = document.getElementById('btn-audit-approve');
const btnAuditReject = document.getElementById('btn-audit-reject');
const statPending = document.getElementById('audit-stat-pending');
const statApproved = document.getElementById('audit-stat-approved');
const statRejected = document.getElementById('audit-stat-rejected');
const statPrecision = document.getElementById('audit-stat-precision');

const certLockTitle = document.getElementById('cert-lock-title');
const certLockSeal = document.getElementById('cert-lock-seal');
const certLockDesc = document.getElementById('cert-lock-desc');

// Local state
let currentBase64 = "";
let activeImageId = "helmet_violation"; // Default preset
let currentInferenceData = null; // Store active results for export

// Maps preset image IDs to Camera IDs
const cameraLocationMap = {
    "helmet_violation": "JN-NCR-04-A1 (Helmet Check)",
    "triple_riding": "JN-NCR-04-A2 (Capacity Enforcement)",
    "red_light": "JN-NCR-05-B1 (Intersection Light Gate)",
    "illegal_parking": "JN-NCR-08-C1 (Footpath Side Scan)",
    "wrong_side": "JN-NCR-01-A4 (Divided Highway Flow)",
    "no_seatbelt": "JN-NCR-10-D2 (Speed Violation Front)",
    "stop_line": "JN-NCR-05-B3 (Pedestrian Crosswalk Line)"
};

// Seed Data for Human Audit review queue
let auditQueue = [
    { id: "CASE-401", imageId: "helmet_violation", location: "JN-NCR-04-A1", infraction: "Helmet Non-compliance", confidence: "96%", status: "Pending" },
    { id: "CASE-402", imageId: "triple_riding", location: "JN-NCR-04-A2", infraction: "Triple Riding", confidence: "95%", status: "Pending" },
    { id: "CASE-403", imageId: "red_light", location: "JN-NCR-05-B1", infraction: "Red-light Violation", confidence: "98%", status: "Pending" },
    { id: "CASE-404", imageId: "illegal_parking", location: "JN-NCR-08-C1", infraction: "Illegal Parking", confidence: "93%", status: "Pending" },
    { id: "CASE-405", imageId: "wrong_side", location: "JN-NCR-01-A4", infraction: "Wrong-side Driving", confidence: "96%", status: "Pending" },
    { id: "CASE-406", imageId: "no_seatbelt", location: "JN-NCR-10-D2", infraction: "Seatbelt Non-compliance", confidence: "98%", status: "Pending" },
    { id: "CASE-407", imageId: "stop_line", location: "JN-NCR-05-B3", infraction: "Stop-line Violation", confidence: "97%", status: "Pending" }
];

// Convert image element to Base64
function getBase64Image(img) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.naturalWidth || img.width;
    tempCanvas.height = img.naturalHeight || img.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(img, 0, 0);
    return tempCanvas.toDataURL("image/png");
}

// Draw bounding boxes on canvas
function drawBoundingBoxes(boxes) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Check if currently active scenario was rejected by officer (we hide boxes on rejections)
    const currentCase = auditQueue.find(c => c.imageId === activeImageId);
    if (currentCase && currentCase.status === "Rejected") return;

    if (!boxes || boxes.length === 0) return;

    boxes.forEach(box => {
        const x = box.x * canvas.width;
        const y = box.y * canvas.height;
        const w = box.w * canvas.width;
        const h = box.h * canvas.height;

        // Bounding Box stroke style (red for violations/alerts, cyan for standard labels)
        const isViolation = box.label.toLowerCase().includes('no') || 
                            box.label.toLowerCase().includes('violation') || 
                            box.label.toLowerCase().includes('triple') || 
                            box.label.toLowerCase().includes('wrong');
        
        const boxColor = isViolation ? "#ef4444" : "#3b82f6";

        // Draw outer glow border
        ctx.shadowBlur = 10;
        ctx.shadowColor = boxColor;
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        // Reset shadow for text and label backgrounds
        ctx.shadowBlur = 0;

        // Draw Label Background
        ctx.fillStyle = boxColor;
        const labelText = `${box.label} (${(box.confidence * 100).toFixed(0)}%)`;
        ctx.font = "bold 11px Arial";
        const textWidth = ctx.measureText(labelText).width;
        
        // Draw tag tab
        ctx.fillRect(x, y - 20 >= 0 ? y - 20 : y, textWidth + 12, 20);
        
        // Draw Label Text
        ctx.fillStyle = "#ffffff";
        ctx.fillText(labelText, x + 6, y - 20 >= 0 ? y - 6 : y + 14);
    });
}

// Adjust canvas coordinates overlay
function resizeCanvas() {
    canvas.width = cameraFeed.clientWidth;
    canvas.height = cameraFeed.clientHeight;
    
    // Position canvas exactly on top of camera image inside flex container
    const rect = cameraFeed.getBoundingClientRect();
    const containerRect = document.getElementById('img-container').getBoundingClientRect();
    canvas.style.left = (rect.left - containerRect.left) + 'px';
    canvas.style.top = (rect.top - containerRect.top) + 'px';
    
    // Redraw boxes if we have active inference data
    if (currentInferenceData && currentInferenceData.vlm_analysis) {
        drawBoundingBoxes(currentInferenceData.vlm_analysis.bounding_boxes);
    }
}

// Auto resize on layout changes
window.addEventListener('resize', resizeCanvas);
cameraFeed.addEventListener('load', () => {
    resizeCanvas();
    try {
        if (!cameraFeed.src.startsWith('data:')) {
            currentBase64 = getBase64Image(cameraFeed);
        }
    } catch(e) {
        console.warn("Cross-origin fallback for base64 conversions");
        currentBase64 = "base64_placeholder_demo_url";
    }
});

// Render the Judicial Review Audit Table Grid
function renderAuditTable() {
    auditQueueBody.innerHTML = "";
    
    auditQueue.forEach(item => {
        const tr = document.createElement('tr');
        if (item.imageId === activeImageId) {
            tr.className = "active-row";
        }
        
        // Status Class mapping
        let statusClass = "pending";
        if (item.status === "Approved") statusClass = "approved";
        if (item.status === "Rejected") statusClass = "rejected";
        
        tr.innerHTML = `
            <td><strong>${item.id}</strong></td>
            <td>${item.location}</td>
            <td>${item.infraction}</td>
            <td><span class="text-secondary">${item.confidence}</span></td>
            <td><span class="status-tag ${statusClass}">${item.status}</span></td>
        `;
        
        // Row click loads that scenario
        tr.addEventListener('click', () => {
            loadScenario(item.imageId);
        });
        
        auditQueueBody.appendChild(tr);
    });
    
    updateAuditStats();
}

// Calculate and render review metrics
function updateAuditStats() {
    const pending = auditQueue.filter(c => c.status === "Pending").length;
    const approved = auditQueue.filter(c => c.status === "Approved").length;
    const rejected = auditQueue.filter(c => c.status === "Rejected").length;
    
    statPending.textContent = pending;
    statApproved.textContent = approved;
    statRejected.textContent = rejected;
    
    // Precision = True Positives / (True Positives + False Positives)
    // Here, Approved = True Positives, Rejected = False Positives
    const totalReviewed = approved + rejected;
    if (totalReviewed > 0) {
        const precisionRate = Math.round((approved / totalReviewed) * 100);
        statPrecision.textContent = `${precisionRate}%`;
    } else {
        statPrecision.textContent = "100%";
    }
}

// Loads a scenario and triggers inference
function loadScenario(imageId) {
    activeImageId = imageId;
    
    // Find matching gallery card and active state
    galleryCards.forEach(c => {
        if (c.dataset.imageId === imageId) {
            c.classList.add('active');
            cameraFeed.src = c.dataset.src;
            promptInput.value = c.dataset.prompt;
        } else {
            c.classList.remove('active');
        }
    });

    // Update location details
    const location = cameraLocationMap[imageId] || "JN-NCR-04-A1";
    feedLocation.textContent = `Camera Location: ${location}`;

    // Reset layout dimensions and trigger analysis
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentInferenceData = null;

    setTimeout(() => {
        currentBase64 = getBase64Image(cameraFeed);
        runInference();
    }, 150);
}

// Run VLM Inference
async function runInference() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert("Please enter a Zero-Shot search prompt.");
        return;
    }

    btnAnalyze.textContent = "Analyzing Feed...";
    btnAnalyze.disabled = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        const API_BASE = 'http://127.0.0.1:8002/api';
        const response = await fetch(`${API_BASE}/analyze-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                image_data: currentBase64, 
                prompt: prompt,
                image_id: activeImageId 
            })
        });
        
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }

        const data = await response.json();
        currentInferenceData = data;
        
        const analysis = data.vlm_analysis;
        
        // Find corresponding audit queue item
        const caseItem = auditQueue.find(c => c.imageId === activeImageId);
        
        if (caseItem && caseItem.status === "Rejected") {
            // If the case is rejected, visually cancel the violation states
            vlmExplanation.textContent = "Review officer flagged this case as a FALSE POSITIVE. Bounding boxes cleared. No challan will be issued.";
            violationStatusBadge.textContent = "AUDIT REJECTED";
            violationStatusBadge.className = "badge-status rejected-badge";
            summaryCard.className = "status-summary-card rejected-mode";
            violationTypeVal.textContent = "Invalid Flag (Cancelled)";
            
            // Invalidate evidence lock
            certLockTitle.innerHTML = `<span class="material-icons cert-badge-icon" style="color:#ef4444; font-size:14px; margin-right:4px;">cancel</span> EVIDENCE STATUS: INVALIDATED`;
            certLockSeal.textContent = "VOID";
            certLockSeal.style.background = "rgba(239, 68, 68, 0.15)";
            certLockSeal.style.color = "#ef4444";
            certLockSeal.style.borderColor = "rgba(239, 68, 68, 0.3)";
            certLockDesc.textContent = "This incident was audited and flagged as a false positive. Cryptographic lock has been voided.";
            hashContainer.className = "evidence-locker-cert rejected-cert";
            evidenceHashSpan.style.textDecoration = "line-through";
            evidenceHashSpan.style.color = "#64748b";
            
            // Clear boxes
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            // Restore active state values
            vlmExplanation.textContent = analysis.explanation;
            
            if (analysis.violation_found) {
                violationStatusBadge.textContent = "VIOLATION CAPTURED";
                violationStatusBadge.className = "badge-status violation";
                summaryCard.className = "status-summary-card";
            } else {
                violationStatusBadge.textContent = "COMPLIANT FEED";
                violationStatusBadge.className = "badge-status compliant";
                summaryCard.className = "status-summary-card compliant-mode";
            }
            
            violationTypeVal.textContent = analysis.violation_type || "Safety Compliance Check";

            // Restore evidence locker cert styles
            certLockTitle.innerHTML = `<span class="material-icons cert-badge-icon" style="color:#10b981; font-size:14px; margin-right:4px;">security</span> COURT EVIDENCE SECURED`;
            certLockSeal.textContent = "Locked";
            certLockSeal.style.background = "rgba(16, 185, 129, 0.15)";
            certLockSeal.style.color = "#10b981";
            certLockSeal.style.borderColor = "rgba(16, 185, 129, 0.3)";
            certLockDesc.textContent = "This image and inference metadata have been signed using HMAC SHA-256 for judicial authenticity.";
            hashContainer.className = "evidence-locker-cert";
            evidenceHashSpan.style.textDecoration = "none";
            evidenceHashSpan.style.color = "#10b981";

            // Draw Bounding Boxes
            drawBoundingBoxes(analysis.bounding_boxes);
        }

        // Update OCR License Plate Details
        const plateHolder = document.querySelector('.ocr-plate-holder');
        const plateBadge = document.querySelector('.ocr-plate-badge');
        const confPercent = Math.round((analysis.ocr_confidence || 0) * 100);

        ocrPlateNumber.textContent = analysis.ocr_plate || "N/A";
        ocrConfidenceFill.style.width = `${confPercent}%`;
        ocrConfidenceVal.textContent = `${confPercent}%`;

        const occludedTerms = ["OCCLUDED", "NOT IN FRAME", "NOT DETECTED", "OUT OF FRAME", "N/A"];
        const isOccluded = occludedTerms.includes(analysis.ocr_plate) || confPercent === 0;
        const isLowConfidence = confPercent > 0 && confPercent < 50;

        if (isOccluded) {
            plateHolder.style.background = "rgba(255, 255, 255, 0.03)";
            plateHolder.style.border = "2px dashed rgba(239, 68, 68, 0.4)";
            plateHolder.style.boxShadow = "none";
            ocrPlateNumber.style.color = "#ef4444";
            ocrPlateNumber.style.letterSpacing = "0.5px";
            ocrPlateNumber.style.fontSize = "13px";
            ocrPlateNumber.style.fontWeight = "700";
            if (plateBadge) plateBadge.style.display = "none";
            ocrConfidenceFill.style.backgroundColor = "#ef4444";
        } else if (isLowConfidence) {
            plateHolder.style.background = "rgba(245, 158, 11, 0.06)";
            plateHolder.style.border = "2px dashed rgba(245, 158, 11, 0.4)";
            plateHolder.style.boxShadow = "none";
            ocrPlateNumber.style.color = "#f59e0b";
            ocrPlateNumber.style.letterSpacing = "0.5px";
            ocrPlateNumber.style.fontSize = "13px";
            ocrPlateNumber.style.fontWeight = "700";
            if (plateBadge) plateBadge.style.display = "none";
            ocrConfidenceFill.style.backgroundColor = "#f59e0b";
        } else {
            plateHolder.style.background = "#ffffff";
            plateHolder.style.border = "3px solid #111111";
            plateHolder.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
            ocrPlateNumber.style.color = "#111111";
            ocrPlateNumber.style.letterSpacing = "1.5px";
            ocrPlateNumber.style.fontSize = "20px";
            ocrPlateNumber.style.fontWeight = "800";
            if (plateBadge) plateBadge.style.display = "flex";
            ocrConfidenceFill.style.backgroundColor = "#10b981";
        }

        // Update Preprocessing Logs
        preprocessingLogOp.textContent = analysis.preprocessing_applied || "Standard Contrast Equalization";

        // Cryptographic Hash Signatures
        evidenceHashSpan.textContent = data.evidence_hash;
        hashContainer.style.display = 'flex';

        // Re-render table to update active highlighting
        renderAuditTable();

    } catch (err) {
        console.error(err);
        alert("API Error: Make sure the Topic 3 FastAPI backend is running on Port 8002.");
    } finally {
        btnAnalyze.textContent = "Run Inference";
        btnAnalyze.disabled = false;
    }
}

// Bind run inference button
btnAnalyze.addEventListener('click', runInference);

// Gallery Card Click Handler
galleryCards.forEach(card => {
    card.addEventListener('click', () => {
        loadScenario(card.dataset.imageId);
    });
});

// File Upload Handler
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentBase64 = event.target.result;
            cameraFeed.src = currentBase64;
            activeImageId = null; // Mark as custom upload
            
            // Clear presets active state
            galleryCards.forEach(c => c.classList.remove('active'));
            feedLocation.textContent = "Camera Location: User Uploaded Feed (Offline Node)";
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Put a generic suggestion prompt
            promptInput.value = "Detect and identify any vehicles, people, and safety compliance checks in the image";
            
            // Remove active highlights in table
            renderAuditTable();
        };
        reader.readAsDataURL(file);
    }
});

// Preprocessing toggle views (Original vs Enhanced)
btnOrigView.addEventListener('click', () => {
    btnOrigView.classList.add('active');
    btnProcView.classList.remove('active');
    cameraFeed.classList.remove('preprocessed');
});

btnProcView.addEventListener('click', () => {
    btnProcView.classList.add('active');
    btnOrigView.classList.remove('active');
    cameraFeed.classList.add('preprocessed');
});

// Human Officer Verification handlers
btnAuditApprove.addEventListener('click', () => {
    if (!activeImageId) {
        alert("Select a case from the audit queue first.");
        return;
    }
    const currentCase = auditQueue.find(c => c.imageId === activeImageId);
    if (currentCase) {
        currentCase.status = "Approved";
        runInference(); // Re-run to update UI states with approved data
    }
});

btnAuditReject.addEventListener('click', () => {
    if (!activeImageId) {
        alert("Select a case from the audit queue first.");
        return;
    }
    const currentCase = auditQueue.find(c => c.imageId === activeImageId);
    if (currentCase) {
        currentCase.status = "Rejected";
        runInference(); // Re-run to clear bounding boxes and show cancelled locks
    }
});

// Export signed evidence package download
btnExportPkg.addEventListener('click', () => {
    if (!currentInferenceData) {
        alert("Run inference first to generate signing credentials.");
        return;
    }
    
    // Include the human audit status in the exported payload
    const caseItem = auditQueue.find(c => c.imageId === activeImageId);
    const exportData = {
        ...currentInferenceData,
        audit_record: {
            officer_decision: caseItem ? caseItem.status : "Pending Verification",
            audit_timestamp: new Date().toISOString()
        }
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sentinel_evidence_${activeImageId || 'custom'}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// Update Digital Clock & timestamp
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    liveTimeSpan.textContent = timeStr;
    
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    if (overlayTimestamp) overlayTimestamp.textContent = dateStr;
}
setInterval(updateClock, 1000);
updateClock();

// Theme Toggle Logic
const themeToggle = document.getElementById('theme-toggle');
const themeToggleIcon = document.getElementById('theme-toggle-icon');

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeToggleIcon.textContent = 'light_mode';
    } else {
        themeToggleIcon.textContent = 'dark_mode';
    }
}

if (themeToggle) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

// Run default preset on load
window.addEventListener('DOMContentLoaded', () => {
    renderAuditTable();
    loadScenario(activeImageId);
});
