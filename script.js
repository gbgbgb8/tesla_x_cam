let videoFiles = [];
let videos = [];

document.addEventListener('DOMContentLoaded', () => {
    videos = [
        document.getElementById('main-video'),
        document.getElementById('front-video'),
        document.getElementById('back-video'),
        document.getElementById('left-video'),
        document.getElementById('right-video')
    ];

    document.getElementById('folder-input').addEventListener('change', handleFolderSelect);
    document.getElementById('export-btn').addEventListener('click', exportVideo);

    // Add event listeners for video synchronization
    videos[0].addEventListener('play', syncPlay);
    videos[0].addEventListener('pause', syncPause);
    videos[0].addEventListener('seeked', syncSeek);
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
        videos[0].src = URL.createObjectURL(latestSet.find(f => f.name.includes('-front')));
        videos[1].src = URL.createObjectURL(latestSet.find(f => f.name.includes('-front')));
        videos[2].src = URL.createObjectURL(latestSet.find(f => f.name.includes('-back')));
        videos[3].src = URL.createObjectURL(latestSet.find(f => f.name.includes('-left')));
        videos[4].src = URL.createObjectURL(latestSet.find(f => f.name.includes('-right')));
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

function exportVideo() {
    // This function will handle video export using ffmpeg.wasm
    // It's a complex operation that requires more detailed implementation
    console.log('Export functionality not yet implemented');
}