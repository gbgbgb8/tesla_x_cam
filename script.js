let videoFiles = [];
let videos = {};
let videoPositions = {
    front: 'main',
    back: 'bottom-right',
    left: 'top-left',
    right: 'top-right'
};

document.addEventListener('DOMContentLoaded', () => {
    initializeVideos();
    addEventListeners();
    updateVideoLayout();
});

function initializeVideos() {
    videos = {
        main: document.getElementById('main-video'),
        'top-left': document.getElementById('top-left-video'),
        'top-right': document.getElementById('top-right-video'),
        'bottom-left': document.getElementById('bottom-left-video'),
        'bottom-right': document.getElementById('bottom-right-video')
    };

    Object.values(videos).forEach(video => {
        video.addEventListener('loadedmetadata', () => {
            video.currentTime = 0;
        });
    });
}

function addEventListeners() {
    document.getElementById('folder-input').addEventListener('change', handleFolderSelect);
    document.getElementById('export-btn').addEventListener('click', () => {
        const format = document.getElementById('export-format').value;
        exportVideo(format);
    });

    const mainVideo = videos.main;
    mainVideo.addEventListener('play', () => syncVideos('play'));
    mainVideo.addEventListener('pause', () => syncVideos('pause'));
    mainVideo.addEventListener('seeked', () => syncVideos('seek'));

    document.querySelectorAll('.position-select').forEach(select => {
        select.addEventListener('change', handlePositionChange);
    });
}

function handleFolderSelect(event) {
    const files = event.target.files;
    videoFiles = Array.from(files).filter(file => file.name.endsWith('.mp4'));
    
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

        Object.keys(videoPositions).forEach(videoType => {
            const position = videoPositions[videoType];
            if (position !== 'hidden') {
                videos[position].src = sources[videoType];
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

function syncVideos(action) {
    const mainVideo = videos.main;
    Object.values(videos).forEach(video => {
        if (video !== mainVideo && !video.paused) {
            if (action === 'play') video.play().catch(() => {});
            else if (action === 'pause') video.pause();
            else if (action === 'seek') video.currentTime = mainVideo.currentTime;
        }
    });
}

function handlePositionChange(event) {
    const select = event.target;
    const videoType = select.closest('.video-toggle').dataset.video;
    const newPosition = select.value;
    const oldPosition = videoPositions[videoType];

    // If there's a video in the new position, swap positions
    Object.keys(videoPositions).forEach(key => {
        if (videoPositions[key] === newPosition) {
            videoPositions[key] = oldPosition;
            document.querySelector(`.video-toggle[data-video="${key}"] .position-select`).value = oldPosition;
        }
    });

    videoPositions[videoType] = newPosition;
    updateVideoLayout();
}

function updateVideoLayout() {
    Object.values(videos).forEach(video => video.style.display = 'none');

    Object.keys(videoPositions).forEach(videoType => {
        const position = videoPositions[videoType];
        if (position !== 'hidden') {
            videos[position].style.display = 'block';
        }
    });

    updateVideoSources();
}

// This function is used by export.js
function getVisibleVideos() {
    return Object.values(videos).filter(video => video.style.display !== 'none' && video.src);
}