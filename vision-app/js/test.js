import {
    FilesetResolver,
    ObjectDetector,
    DepthEstimation
} from '@mediapipe/tasks-vision';

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const loadingIndicator = document.getElementById("loadingIndicator");

let depthEstimationModel;
let lastSpokenObject = "";
let isSpeaking = false;
let speechEnabled = true;
const MAX_DISTANCE = 5.0;

const hiddenCanvas = document.createElement("canvas");
const hiddenCtx = hiddenCanvas.getContext("2d");

// Load MediaPipe Depth model
async function loadMediaPipeDepth() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    depthEstimationModel = await DepthEstimation.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision/depth_estimation.tflite"
        },
        runningMode: "VIDEO"
    });
    console.log("✅ MediaPipe Depth model loaded");
}

// Start camera
async function startCamera() {
    let cameraMode = localStorage.getItem("cameraMode") || "environment";
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraMode }
        });
        video.srcObject = stream;
        console.log("✅ Camera started");
    } catch (error) {
        console.error("❌ Camera error:", error);
    }
}

// Flip camera button
document.getElementById("flipcamra").addEventListener("click", () => {
    const current = localStorage.getItem("cameraMode") || "environment";
    localStorage.setItem("cameraMode", current === "user" ? "environment" : "user");
    startCamera();
});

// Toggle speech
document.getElementById("locationBtn").addEventListener("click", () => {
    speechEnabled = !speechEnabled;
    const icon = document.querySelector("#locationBtn i");
    icon.className = speechEnabled ? "bx bx-microphone" : "bx bx-microphone-off";
});

// Load COCO-SSD model
async function loadModel() {
    console.log("⏳ Loading COCO-SSD...");
    const model = await cocoSsd.load();
    console.log("✅ COCO-SSD loaded");
    detectObjects(model);
}

// Detect and overlay
function detectObjects(model) {
    async function renderFrame() {
        if (!video.videoWidth || !video.videoHeight) {
            requestAnimationFrame(renderFrame);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const predictions = await model.detect(video);

        if (depthEstimationModel) {
            const mpDepthResult = await depthEstimationModel.estimateDepth(video);
            const depthImage = mpDepthResult.depthImage;

            hiddenCanvas.width = depthImage.width;
            hiddenCanvas.height = depthImage.height;
            hiddenCtx.drawImage(depthImage, 0, 0);

            for (const pred of predictions) {
                const [x, y, w, h] = pred.bbox;
                const centerX = Math.floor((x + w / 2) * depthImage.width / canvas.width);
                const centerY = Math.floor((y + h / 2) * depthImage.height / canvas.height);

                const pixel = hiddenCtx.getImageData(centerX, centerY, 1, 1).data;
                const gray = pixel[0];
                const distance = (gray / 255) * MAX_DISTANCE;
                const label = `${pred.class} - ${distance.toFixed(2)}m`;

                // Draw box
                ctx.beginPath();
                ctx.strokeStyle = "green";
                ctx.lineWidth = 2;
                ctx.rect(x, y, w, h);
                ctx.stroke();

                // Draw label
                ctx.font = "16px Arial";
                ctx.fillStyle = "black";
                ctx.fillRect(x, y - 20, ctx.measureText(label).width + 10, 20);
                ctx.fillStyle = "white";
                ctx.fillText(label, x + 5, y - 5);

                // Speak
                if (!isSpeaking && label !== lastSpokenObject && speechEnabled) {
                    speak(label);
                    lastSpokenObject = label;
                    break;
                }
            }
        }

        requestAnimationFrame(renderFrame);
    }

    loadingIndicator.style.display = "none";
    renderFrame();
}

// Voice output
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => isSpeaking = true;
    utterance.onend = () => isSpeaking = false;
    speechSynthesis.speak(utterance);
}

// Init
window.addEventListener("DOMContentLoaded", () => {
    loadingIndicator.textContent = "Loading models...";
    loadingIndicator.style.display = "block";
    startCamera();
    loadMediaPipeDepth();
    loadModel();
});