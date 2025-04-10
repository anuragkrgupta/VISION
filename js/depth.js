// depth.js

import * as tf from "https://esm.run/@tensorflow/tfjs@4.10.0";
import * as depthEstimation from "https://esm.run/@tensorflow-models/depth-estimation";

let model = null;

// Load the MiDaS depth model
export async function loadMediaPipeDepth() {
    model = await depthEstimation.load({
        modelUrl: 'https://tfhub.dev/intel/midas/v2/2',
    });
    console.log("✅ MiDaS model loaded");
}

// Main function to estimate depth for detected objects
export async function estimateDepth(video, predictions, ctx, canvas, speak, lastSpokenObject, isSpeaking, speechEnabled) {
    if (!model) return;

    const depthTensor = await model.estimateDepth(video);
    const depthData = await depthTensor.array();
    const [depthWidth, depthHeight] = depthTensor.shape;

    predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        const centerX = Math.floor(x + width / 2);
        const centerY = Math.floor(y + height / 2);

        // Map center to depth image size
        const mapX = Math.floor((centerX / canvas.width) * depthWidth);
        const mapY = Math.floor((centerY / canvas.height) * depthHeight);

        const objectDepth = depthData[mapY]?.[mapX];

        // Draw bounding box
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Draw label
        const label = `${prediction.class} (${objectDepth?.toFixed(2)}m)`;
        ctx.fillStyle = "black";
        ctx.fillRect(x, y - 20, ctx.measureText(label).width + 10, 20);
        ctx.fillStyle = "white";
        ctx.fillText(label, x + 5, y - 5);

        // Speak if object is close and not repeating
        if (speechEnabled && objectDepth < 5 && lastSpokenObject !== prediction.class && !isSpeaking) {
            lastSpokenObject = prediction.class;
            speak(`${prediction.class} is near in ${objectDepth.toFixed(1)} meters`);
        }
    });

    tf.dispose(depthTensor);
}
