let videoFiles = [];

document.getElementById('folder-input').addEventListener('change', handleFolderSelect);
document.getElementById('export-btn').addEventListener('click', exportVideo);

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
    const mainVideo = document.getElementById('main-video');
    const frontVideo = document.getElementById('front-video');
    const backVideo = document.getElementById('back-video');
    const leftVideo = document.getElementById('left-video');
    const rightVideo = document.getElementById('right-video');

    if (videoFiles.length >= 4) {
        const latestSet = videoFiles.slice(-4);
        mainVideo.src = URL.createObjectURL(latestSet.find(f => f.name.includes('-front')));
        frontVideo.src = URL.createObjectURL(latestSet.find(f => f.name.includes('-front')));
        backVideo.src = URL.createObjectURL(latestSet.find(f => f.name.includes('-back')));
        leftVideo.src = URL.createObjectURL(latestSet.find(f => f.name.includes('-left')));
        rightVideo.src = URL.createObjectURL(latestSet.find(f => f.name.includes('-right')));
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

function exportVideo() {
    // This function will handle video export using ffmpeg.wasm
    // It's a complex operation that requires more detailed implementation
    console.log('Export functionality not yet implemented');
}