let images = document.querySelectorAll(".slider img");
let currentIndex = 0;

function changeImage() {
  images[currentIndex].classList.remove("active");
  currentIndex = (currentIndex + 1) % images.length;
  images[currentIndex].classList.add("active");
}
setInterval(changeImage, 3000);

const headers = ["Scan", "Location", "Path"];
const messages = [
  "Scan & Find Anything is an intelligent object detection tool designed to identify and locate various objects in real-time.",
  " With just one tap, instantly find any location with speed and accuracy. No delays, no hassle—just quick and precise results at your fingertips!",
  "Path detection helps you navigate efficiently by providing real-time guidance, ensuring you reach your destination quickly and accurately with ease.",
];

let index = 0;

// Show the first message immediately when the page loads
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("msgHeder").textContent = headers[index];
  document.getElementById("msg").textContent = messages[index];

  // Start looping after 3 seconds
  setInterval(() => {
    index = (index + 1) % headers.length; // Loop through the array
    document.getElementById("msgHeder").textContent = headers[index];
    document.getElementById("msg").textContent = messages[index];
  }, 3200);
});


// Redirect to detection page on double click
const btn = document.getElementById("aboutPage");
btn.addEventListener("dblclick", function () {
  // console.log("clicked");
  window.location.href = "test_detection.html";
});

screen.orientation.lock('portrait').catch(function(error) {
  console.error('Orientation lock failed:', error);
});