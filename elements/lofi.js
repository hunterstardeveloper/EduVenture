
const lofiMusic = document.getElementById("lofiMusic");
let clickTimeout = null;
let clickCount = 0;

// Function to handle lofi clicks
function toggleLofi() {
    console.log("Button clicked!"); // See if this shows up in F12 console
    if (!lofiMusic) {
        console.error("Audio element not found!");
        return;
    }
    if (!lofiMusic) return;

    clickCount++;

    // Clear any pending timeout
    if (clickTimeout) {
        clearTimeout(clickTimeout);
    }

    // Wait to see if there's a second click
    clickTimeout = setTimeout(() => {
        if (clickCount === 1) {
            // Single click: pause/play
            if (lofiMusic.paused) {
                lofiMusic.play();
                localStorage.setItem("lofiPlaying", "true");
            } else {
                lofiMusic.pause();
                localStorage.setItem("lofiPlaying", "false");
            }
        } else if (clickCount >= 2) {
            // Double click: restart
            lofiMusic.currentTime = 0;
            lofiMusic.play();
            localStorage.setItem("lofiPlaying", "true");
            localStorage.setItem("lofiTime", "0");
        }
        
        // Reset click count
        clickCount = 0;
        clickTimeout = null;
    }, 250); // 250ms window to detect double-click
}

// Resume music on page load
window.addEventListener("DOMContentLoaded", () => {
    if (!lofiMusic) return;

    // Restore time and play state
    const savedTime = parseFloat(localStorage.getItem("lofiTime")) || 0;
    const isPlaying = localStorage.getItem("lofiPlaying") === "true";

    // Set the time after metadata is loaded
    lofiMusic.addEventListener('loadedmetadata', () => {
        lofiMusic.currentTime = savedTime;
    }, { once: true });

    // Or if metadata is already loaded:
    if (lofiMusic.readyState >= 1) {
        lofiMusic.currentTime = savedTime;
    }

    if (isPlaying) {
        lofiMusic.play().catch(() => {
            // autoplay might be blocked
        });
    }

    // Save time when the audio time updates
    lofiMusic.addEventListener('timeupdate', () => {
        localStorage.setItem("lofiTime", lofiMusic.currentTime);
    });
});