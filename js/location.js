const locationDetails = document.getElementById("locationDetails");

// Add event listener for double tap to toggle location access
let tapCount = 0;
let tapTimeout;

function handleTap() {
  tapCount++;
  clearTimeout(tapTimeout);
  tapTimeout = setTimeout(() => {
    if (tapCount === 2) {
      getLocation(); // Call getLocation on double tap
    }
    tapCount = 0;
  }, 300); // Reset tap count after 300ms
}

// document.addEventListener("click", handleTap);
document.addEventListener("touchstart", handleTap);

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
        const textToSpeak = `You are in ${fullAddress}. State: ${state}.`;
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