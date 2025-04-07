// Check if the browser supports the Web Speech API
if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true; // Keep recognition on
  recognition.interimResults = false; // Do not return interim results
  recognition.lang = "en-IN"; // Set language to English (India)

  const loadingIndicator = document.getElementById("loadingIndicator");
  const locationDetails = document.getElementById("locationDetails");
  const locationBtn = document.getElementById("locationBtn");
  const microphoneIcon = locationBtn.querySelector("i");
  let isRecognitionActive = true; // Start recognition initially

  // Event handler for speech recognition results
  recognition.onresult = (event) => {
    if (event.results && event.results[event.resultIndex]) {
      const speechResult = event.results[event.resultIndex][0].transcript.toLowerCase();
      console.log("Speech result: ", speechResult); // Log the speech result for debugging
      if (speechResult.includes("location")) {
        // Disable object detection speech before getting location
        document.dispatchEvent(new CustomEvent('disableObjectDetectionSpeech'));
        getLocation(); // Call getLocation if "location" is mentioned
      }
    }
    loadingIndicator.style.display = "none"; // Hide loading indicator
  };

  // Event handler for speech recognition errors
  recognition.onerror = (event) => {
    console.error("Speech recognition error", event);
    loadingIndicator.style.display = "none"; // Hide loading indicator
  };

  // Event handler for when speech recognition ends
  recognition.onend = () => {
    loadingIndicator.style.display = "none"; // Hide loading indicator
    if (isRecognitionActive) {
      recognition.start(); // Restart recognition if it should be active
    }
  };

  // Start speech recognition automatically
  // recognition.start();
  loadingIndicator.style.display = "block"; // Show loading indicator
  console.log("Speech recognition started");

  // Add event listener to toggle recognition on double-click anywhere on the screen
  document.addEventListener("dblclick", function () {
    const microphoneIcon = locationBtn.querySelector("i");
    if (microphoneIcon.classList.contains("bx-microphone-off")) {
      microphoneIcon.classList.remove("bx-microphone-off");
      microphoneIcon.classList.add("bx-microphone");
      isRecognitionActive = true;
      recognition.start();
      loadingIndicator.style.display = "block"; // Show loading indicator
      console.log("Speech recognition started");
    } else {
      microphoneIcon.classList.remove("bx-microphone");
      microphoneIcon.classList.add("bx-microphone-off");
      isRecognitionActive = false;
      recognition.stop();
      loadingIndicator.style.display = "none"; // Hide loading indicator
      console.log("Speech recognition stopped");
    }
  });
} else {
  console.error("Web Speech API is not supported in this browser.");
}

// Function to get the location using Geolocation API
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } else {
    locationDetails.innerHTML = "Geolocation is not supported by this browser.";
  }
}

// Function to show the position using Geolocation API
function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.address) {
        const fullAddress = data.display_name;
        const state = data.address.state;

        console.log("Full Address: " + fullAddress);
        console.log("State: " + state);

        // Show the details in the div
        locationDetails.innerHTML = `
          <p><strong>Full Address:</strong> ${fullAddress}</p>
          <p><strong>State:</strong> ${state}</p>
        `;

        // Convert address to speech
        const textToSpeak = `Your current location is ${fullAddress}. State: ${state}.`;
        speakText(textToSpeak);
      } else {
        const errorMessage = "Location not found";
        speakText(errorMessage);
        locationDetails.innerHTML = errorMessage;
      }
    })
    .catch((error) => {
      locationDetails.innerHTML = "Error fetching location data";
      console.error("Error fetching location data", error);
    });
}

// Function to handle errors from Geolocation API
function showError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      locationDetails.innerHTML = "User denied the request for Geolocation.";
      break;
    case error.POSITION_UNAVAILABLE:
      locationDetails.innerHTML = "Location information is unavailable.";
      break;
    case error.TIMEOUT:
      locationDetails.innerHTML = "The request to get user location timed out.";
      break;
    case error.UNKNOWN_ERROR:
      locationDetails.innerHTML = "An unknown error occurred.";
      break;
  }
}

// Function to convert text to speech using Web Speech API
function speakText(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "hi-IN"; // Set language to Hindi (India)
  speech.rate = 1; // Set speed
  speech.pitch = 1; // Set pitch
  speech.onend = function() {
      // Trigger an event to indicate that the location speech is completed
      document.dispatchEvent(new CustomEvent('locationSpeechCompleted'));
  };
  window.speechSynthesis.speak(speech);
}
