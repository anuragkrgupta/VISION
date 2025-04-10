setTimeout(function() {
    window.location.href = "aboutpage.html";
}, 3100);

screen.orientation.lock('portrait').catch(function(error) {
    console.error('Orientation lock failed:', error);
});