const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const socket = new WebSocket("ws://tvpi:8000/ws");

const videoInput = document.getElementById("video-url");
const videoPlayer = document.getElementById("video-player");

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.lineWidth = 5;
ctx.lineCap = "round";
ctx.strokeStyle = "black";

let drawing = false;

function startDrawing(e) {
    drawing = true;
    draw(e);
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!drawing) return;
    
    const x = e.clientX;
    const y = e.clientY;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Send drawing data
    const drawData = JSON.stringify({ type: "draw", x, y });
    socket.send(drawData);
}

// Send YouTube video link to WebSocket server
function sendVideo() {
    const url = videoInput.value;
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
        alert("Please enter a valid YouTube URL!");
        return;
    }
    const videoData = JSON.stringify({ type: "video", url });
    socket.send(videoData);
}

// Handle incoming WebSocket messages
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "draw") {
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
    } else if (data.type === "video") {
        // Extract video ID and embed it
        const videoId = extractYouTubeID(data.url);
        videoPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
};

// Extract YouTube Video ID
function extractYouTubeID(url) {
    const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Detect full-screen changes
document.addEventListener("fullscreenchange", () => {
    const isFullScreen = !!document.fullscreenElement;
    const fullScreenData = JSON.stringify({ type: "fullscreen", state: isFullScreen });
    socket.send(fullScreenData);
});

// Enter full-screen mode
function enterFullScreen() {
    if (videoPlayer.requestFullscreen) {
        videoPlayer.requestFullscreen();
    } else if (videoPlayer.mozRequestFullScreen) { // Firefox
        videoPlayer.mozRequestFullScreen();
    } else if (videoPlayer.webkitRequestFullscreen) { // Chrome, Safari
        videoPlayer.webkitRequestFullscreen();
    } else if (videoPlayer.msRequestFullscreen) { // IE/Edge
        videoPlayer.msRequestFullscreen();
    }
}

// Exit full-screen mode
function exitFullScreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// Handle incoming WebSocket messages
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "fullscreen") {
        if (data.state) {
            enterFullScreen();
        } else {
            exitFullScreen();
        }
    }
};

// Add a button to trigger full-screen (optional)
document.body.insertAdjacentHTML("beforeend", '<button onclick="enterFullScreen()">Full Screen</button>');
// Attach event listeners
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);

