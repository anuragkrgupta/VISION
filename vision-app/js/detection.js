const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let lastDetectedObjects = {}; // Store detected objects with timestamps
let lastSpokenObject = ""; // Store the last spoken object
let lastSpokenNoObjectTime = Date.now(); // Store last time no object was spoken
let isVoiceCommandActive = false; // Flag to track voice command status

// Function to start the camera
async function startCamera() {
    let cameraMode = localStorage.getItem("cameraMode") || "environment";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraMode }
        });

        video.srcObject = stream;
        console.log("✅ Camera started successfully");
    } catch (error) {
        console.error("❌ Camera access error:", error);
        alert("Failed to access the camera. Please check permissions.");
    }
}

// Camera flip button functionality
document.getElementById("flipcamra").addEventListener("click", function () {
    let currentMode = localStorage.getItem("cameraMode") || "environment";
    let newMode = currentMode === "user" ? "environment" : "user";

    localStorage.setItem("cameraMode", newMode);
    console.log("📷 Camera mode switched to:", newMode);

    startCamera(); // Restart the camera
});

// Ensure localStorage has "environment" as default
if (!localStorage.getItem("cameraMode")) {
    localStorage.setItem("cameraMode", "environment");
}

// Function to load TensorFlow.js model
async function loadModel() {
    console.log("⏳ Loading model...");
    const model = await cocoSsd.load();
    console.log("✅ Model loaded successfully.");
    detectObjects(model);
}

// Function to detect objects and update canvas
async function detectObjects(model) {
    async function renderFrame() {
        if (!video.videoWidth || !video.videoHeight) {
            requestAnimationFrame(renderFrame);
            return;
        }

        // Update canvas size dynamically
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear the canvas before drawing
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Mirror effect for video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Object detection
        const predictions = await model.detect(video);
        const currentDetectedObjects = {};

        predictions.forEach(prediction => {
            const objectName = prediction.class;

            // Draw bounding box
            ctx.strokeStyle = "green";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                canvas.width - prediction.bbox[0] - prediction.bbox[2],
                prediction.bbox[1],
                prediction.bbox[2],
                prediction.bbox[3]
            );

            // Draw label
            ctx.fillStyle = "green";
            ctx.font = "16px Arial";
            ctx.fillText(
                objectName,
                canvas.width - prediction.bbox[0] - prediction.bbox[2],
                prediction.bbox[1] - 5
            );

            // Track current detected objects
            currentDetectedObjects[objectName] = Date.now();
        });

        // Announce new objects or objects still present
        Object.keys(currentDetectedObjects).forEach(objectName => {
            if (
                !lastDetectedObjects[objectName] || // New object
                Date.now() - lastDetectedObjects[objectName] > 5000 // Reannounce after timeout
            ) {
                if (objectName !== lastSpokenObject && !isVoiceCommandActive) {
                    // Debounce speech synthesis
                    if (!window.speechSynthesis.speaking) {
                        speak(objectName);
                        lastSpokenObject = objectName;
                    }
                }
                lastDetectedObjects[objectName] = Date.now();
            }
        });

        // Remove objects that are no longer in the frame
        Object.keys(lastDetectedObjects).forEach(objectName => {
            if (!currentDetectedObjects[objectName]) {
                delete lastDetectedObjects[objectName];
                lastSpokenObject = "";
            }
        });

        // Speak if no objects are detected
        if (Object.keys(currentDetectedObjects).length === 0) {
            if (Date.now() - lastSpokenNoObjectTime > 8000 && !isVoiceCommandActive) {
                speak("I am not able to detect any object.");
                lastSpokenNoObjectTime = Date.now();
            }
        }

        requestAnimationFrame(renderFrame);
    }

    renderFrame();
}

// Listen for the disableObjectDetectionSpeech event
document.addEventListener('disableObjectDetectionSpeech', function() {
    isVoiceCommandActive = true; // Disable object detection speech
});

// Listen for the locationSpeechCompleted event
document.addEventListener('locationSpeechCompleted', function() {
    isVoiceCommandActive = false; // Re-enable object detection speech
});

// Function to speak detected objects
function speak(text) {
    if (text.trim() === "") return; // Avoid speaking empty text
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

// Add event listener to stop speech when finished
window.speechSynthesis.addEventListener('end', () => {
    // Speech has ended, you can now speak again
});

// Initialize the app
startCamera();
loadModel();
