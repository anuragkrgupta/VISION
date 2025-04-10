import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';
import { loadMediaPipeDepth, estimateDepth } from './depth.js';

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const loadingIndicator = document.getElementById("loadingIndicator");

let lastSpokenObject = "";
let isSpeaking = false;
let speechEnabled = true;

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

        await estimateDepth(video, predictions, ctx, canvas, speak, lastSpokenObject, isSpeaking, speechEnabled);

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