let videoFiles = [];
let videos = [];
let videoToggles = [];
let primaryVideoRadios = [];

document.addEventListener('DOMContentLoaded', () => {
    videos = [
        document.getElementById('main-video'),
        document.getElementById('front-video'),
        document.getElementById('back-video'),
        document.getElementById('left-video'),
        document.getElementById('right-video')
    ];

    videoToggles = [
        document.getElementById('toggle-front'),
        document.getElementById('toggle-back'),
        document.getElementById('toggle-left'),
        document.getElementById('toggle-right')
    ];

    primaryVideoRadios = document.querySelectorAll('input[name="primary-video"]');

    document.getElementById('folder-input').addEventListener('change', handleFolderSelect);
    document.getElementById('export-btn').addEventListener('click', exportVideo);

    // Add event listeners for video synchronization
    videos[0].addEventListener('play', syncPlay);
    videos[0].addEventListener('pause', syncPause);
    videos[0].addEventListener('seeked', syncSeek);

    // Add event listeners for video toggles
    videoToggles.forEach((toggle, index) => {
        toggle.addEventListener('change', () => toggleVideoVisibility(index + 1));
    });

    // Add event listeners for primary video selection
    primaryVideoRadios.forEach(radio => {
        radio.addEventListener('change', handlePrimaryVideoChange);
    });
});

function handleFolderSelect(event) {
    const files = event.target.files;
    videoFiles = Array.from(files).filter(file => file.name.endsWith('.mp4'));
    
    // Sort files by timestamp
    videoFiles.sort((a, b) => {
        const timestampA = getTimestampFromFilename(a.name);
        const timestampB = getTimestampFromFilename(b.name);
        return timestampA - timestampB;
    });

    updateVideoSources();
    updateTimeRange();
}

function getTimestampFromFilename(filename) {
    const parts = filename.split('_');
    const dateStr = parts[0];
    const timeStr = parts[1].split('-').slice(0, 3).join(':');
    return new Date(`${dateStr}T${timeStr}`).getTime();
}

function updateVideoSources() {
    if (videoFiles.length >= 4) {
        const latestSet = videoFiles.slice(-4);
        videos[1].src = URL.createObjectURL(latestSet.find(f => f.name.includes('-front')));
        videos[2].src = URL.createObjectURL(latestSet.find(f => f.name.includes('-back')));
        videos[3].src = URL.createObjectURL(latestSet.find(f => f.name.includes('-left')));
        videos[4].src = URL.createObjectURL(latestSet.find(f => f.name.includes('-right')));
        
        // Set initial main video to front camera
        videos[0].src = videos[1].src;
    }
}

function updateTimeRange() {
    if (videoFiles.length > 0) {
        const startTime = getTimestampFromFilename(videoFiles[0].name);
        const endTime = getTimestampFromFilename(videoFiles[videoFiles.length - 1].name);
        
        document.getElementById('start-time').value = new Date(startTime).toISOString().slice(0, 16);
        document.getElementById('end-time').value = new Date(endTime).toISOString().slice(0, 16);
    }
}

function syncPlay() {
    videos.forEach(video => {
        if (video !== videos[0]) {
            video.play();
        }
    });
}

function syncPause() {
    videos.forEach(video => {
        if (video !== videos[0]) {
            video.pause();
        }
    });
}

function syncSeek() {
    const time = videos[0].currentTime;
    videos.forEach(video => {
        if (video !== videos[0]) {
            video.currentTime = time;
        }
    });
}

function toggleVideoVisibility(index) {
    const video = videos[index];
    const isVisible = videoToggles[index - 1].checked;
    video.style.opacity = isVisible ? '1' : '0';
    video.style.pointerEvents = isVisible ? 'auto' : 'none';
}

function handlePrimaryVideoChange(event) {
    const selectedValue = event.target.value;
    const selectedIndex = ['front', 'back', 'left', 'right'].indexOf(selectedValue) + 1;
    
    // Swap sources between main video and selected corner video
    const tempSrc = videos[0].src;
    videos[0].src = videos[selectedIndex].src;
    videos[selectedIndex].src = tempSrc;

    // Pause all videos and reset their current time
    const currentTime = videos[0].currentTime;
    videos.forEach(video => {
        video.pause();
        video.currentTime = currentTime;
    });

    // Play the main video if it was playing before
    if (!videos[0].paused) {
        videos[0].play();
    }
}

function exportVideo() {
    // This function will handle video export using ffmpeg.wasm
    // It's a complex operation that requires more detailed implementation
    console.log('Export functionality not yet implemented');
}