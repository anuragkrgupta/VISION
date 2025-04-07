// test.js
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let depthEstimationModel;
let lastSpokenObject = "";
let isSpeaking = false;

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

document.getElementById("flipcamra").addEventListener("click", () => {
    const current = localStorage.getItem("cameraMode") || "environment";
    localStorage.setItem("cameraMode", current === "user" ? "environment" : "user");
    startCamera();
});

// Load COCO-SSD model
async function loadModel() {
    console.log("⏳ Loading COCO-SSD...");
    const model = await cocoSsd.load();
    console.log("✅ COCO-SSD loaded");
    detectObjects(model);
}

// Object detection + depth check
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

        predictions.forEach((pred) => {
            const [x, y, w, h] = pred.bbox;
            const X = canvas.width - x - w;

            ctx.beginPath();
            ctx.strokeStyle = "green";
            ctx.lineWidth = 2;
            ctx.rect(X, y, w, h);
            ctx.stroke();

            ctx.font = "16px Arial";
            ctx.fillStyle = "green";
            ctx.fillText(`${pred.class}`, X, y - 5);
        });

        if (depthEstimationModel) {
            const mpDepthResult = await depthEstimationModel.estimateDepth(video);
            const depthImage = mpDepthResult.depthImage;

            for (const pred of predictions) {
                const [x, y, w, h] = pred.bbox;
                const centerX = Math.floor(x + w / 2);
                const centerY = Math.floor(y + h / 2);

                let distance = 100;
                try {
                    distance = depthImage.getFloat32(centerX, centerY);
                } catch (e) {
                    distance = 100;
                }

                const label = distance <= 1 ? `${pred.class} is near` : `${pred.class} is far`;

                if (!isSpeaking && label !== lastSpokenObject) {
                    speak(label);
                    lastSpokenObject = label;
                    break;
                }
            }
        }

        requestAnimationFrame(renderFrame);
    }

    renderFrame();
}

// Speech function
function speak(text) {
    if (!text.trim()) return;
    const utter = new SpeechSynthesisUtterance(text);
    isSpeaking = true;
    utter.onend = () => {
        isSpeaking = false;
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
}

window.addEventListener("DOMContentLoaded", () => {
    startCamera();
    loadMediaPipeDepth();
    loadModel();
});
