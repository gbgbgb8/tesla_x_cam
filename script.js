let videoFiles = [];
let videos = {};
let videoPositions = {
    front: 'disabled',
    back: 'disabled',
    left: 'disabled',
    right: 'disabled'
};

document.addEventListener('DOMContentLoaded', () => {
    videos = {
        main: document.getElementById('main-video'),
        'top-center': document.getElementById('top-center-video'),
        'bottom-center': document.getElementById('bottom-center-video'),
        'left-center': document.getElementById('left-center-video'),
        'right-center': document.getElementById('right-center-video'),
        'top-left': document.getElementById('top-left-video'),
        'top-right': document.getElementById('top-right-video'),
        'bottom-left': document.getElementById('bottom-left-video'),
        'bottom-right': document.getElementById('bottom-right-video')
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
            left: URL.createObjectURL(latestSet.find(f => f.name.includes('-left'))),
            right: URL.createObjectURL(latestSet.find(f => f.name.includes('-right')))
        };

        Object.keys(videoPositions).forEach(position => {
            if (videoPositions[position] !== 'disabled') {
                videos[videoPositions[position]].src = sources[position];
            }
        });

        // Set initial main video if not set
        if (!videos.main.src) {
            videos.main.src = sources.front;
        }
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
    Object.keys(videoPositions).forEach(videoType => {
        const position = videoPositions[videoType];
        if (position !== 'disabled') {
            videos[position].style.display = 'block';
            videos[position].style.opacity = '1';
        }
    });

    Object.keys(videos).forEach(position => {
        if (position !== 'main' && !Object.values(videoPositions).includes(position)) {
            videos[position].style.display = 'none';
            videos[position].style.opacity = '0';
        }
    });

    updateVideoSources();
}

function exportVideo() {
    // This function will handle video export using ffmpeg.wasm
    // It's a complex operation that requires more detailed implementation
    console.log('Export functionality not yet implemented');
}