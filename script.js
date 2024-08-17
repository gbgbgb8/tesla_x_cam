let videoFiles = [];
let videos = {};
let videoPositions = {
    front: 'main',
    back: 'back',
    left: 'left',
    right: 'right'
};

document.addEventListener('DOMContentLoaded', () => {
    videos = {
        main: document.getElementById('main-video'),
        left: document.getElementById('left-video'),
        right: document.getElementById('right-video'),
        back: document.getElementById('back-video')
    };

    document.getElementById('folder-input').addEventListener('change', handleFolderSelect);
    document.getElementById('export-btn').addEventListener('click', exportVideo);

    // Add event listeners for video synchronization
    videos.main.addEventListener('play', syncPlay);
    videos.main.addEventListener('pause', syncPause);
    videos.main.addEventListener('seeked', syncSeek);

    // Add event listeners for video toggles
    document.querySelectorAll('.position-select').forEach(select => {
        select.addEventListener('change', handlePositionChange);
    });

    // Initialize video positions
    updateVideoLayout();
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
        const sources = {
            front: URL.createObjectURL(latestSet.find(f => f.name.includes('-front'))),
            back: URL.createObjectURL(latestSet.find(f => f.name.includes('-back'))),
            left: URL.createObjectURL(latestSet.find(f => f.name.includes('-left_repeater'))),
            right: URL.createObjectURL(latestSet.find(f => f.name.includes('-right_repeater')))
        };

        Object.keys(videoPositions).forEach(position => {
            if (videoPositions[position] !== 'disabled') {
                videos[videoPositions[position]].src = sources[position];
            }
        });
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
    Object.values(videos).forEach(video => {
        if (video !== videos.main && !video.paused) {
            video.play();
        }
    });
}

function syncPause() {
    Object.values(videos).forEach(video => {
        if (video !== videos.main) {
            video.pause();
        }
    });
}

function syncSeek() {
    const time = videos.main.currentTime;
    Object.values(videos).forEach(video => {
        if (video !== videos.main) {
            video.currentTime = time;
        }
    });
}

function handlePositionChange(event) {
    const select = event.target;
    const videoType = select.closest('.video-toggle').dataset.video;
    const newPosition = select.value;
    const oldPosition = videoPositions[videoType];

    // If there's a video in the new position, disable it
    Object.keys(videoPositions).forEach(key => {
        if (videoPositions[key] === newPosition) {
            videoPositions[key] = 'disabled';
            document.querySelector(`.video-toggle[data-video="${key}"] .position-select`).value = 'disabled';
        }
    });

    videoPositions[videoType] = newPosition;
    updateVideoLayout();
}

function updateVideoLayout() {
    Object.keys(videos).forEach(position => {
        videos[position].style.display = 'none';
    });

    Object.keys(videoPositions).forEach(videoType => {
        const position = videoPositions[videoType];
        if (position !== 'disabled') {
            videos[position].style.display = 'block';
            videos[position].src = getVideoSource(videoType);
        }
    });

    updateVideoSources();
}

function getVideoSource(videoType) {
    if (videoFiles.length >= 4) {
        const latestSet = videoFiles.slice(-4);
        const file = latestSet.find(f => f.name.includes(`-${videoType}`));
        return file ? URL.createObjectURL(file) : '';
    }
    return '';
}

function exportVideo() {
    // This function will handle video export using ffmpeg.wasm
    // It's a complex operation that requires more detailed implementation
    console.log('Export functionality not yet implemented');
    alert('Export functionality is not yet implemented. This would combine the visible videos into a single file.');
}