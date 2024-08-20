let mediaRecorder;
let recordedChunks = [];

async function exportVideo(format) {
    try {
        const visibleVideos = getVisibleVideos();
        if (visibleVideos.length === 0) {
            alert('No visible videos to export.');
            return;
        }

        console.log('Starting video export process...');
        console.log(`Visible videos: ${visibleVideos.length}`);

        const { width, height } = getExportDimensions(format);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const stream = canvas.captureStream(30); // 30 fps
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tesla_cam_export_${format}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            recordedChunks = [];
        };

        // Prepare videos
        await prepareVideos(visibleVideos);

        mediaRecorder.start();

        const startTime = performance.now();
        const duration = Math.min(...visibleVideos.map(v => v.duration)) * 1000;

        function drawFrame(timestamp) {
            const elapsed = timestamp - startTime;
            const currentTime = elapsed / 1000;

            ctx.clearRect(0, 0, width, height);
            visibleVideos.forEach((video, index) => {
                video.currentTime = currentTime % video.duration;
                const layout = calculateLayout(visibleVideos.length, width, height)[index];
                ctx.drawImage(video, layout.x, layout.y, layout.w, layout.h);
            });

            if (elapsed < duration) {
                requestAnimationFrame(drawFrame);
            } else {
                mediaRecorder.stop();
                console.log('Export complete');
            }
        }

        requestAnimationFrame(drawFrame);

    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please check the console for details.');
    }
}

function getExportDimensions(format) {
    switch (format) {
        case 'landscape': return { width: 1280, height: 720 };
        case 'portrait': return { width: 720, height: 1280 };
        case 'square': return { width: 720, height: 720 };
        case 'original': return { width: 1280, height: 960 };
        default: throw new Error('Invalid format specified');
    }
}

async function prepareVideos(videos) {
    await Promise.all(videos.map(async (video) => {
        video.muted = true;
        video.currentTime = 0;
        await new Promise((resolve) => {
            video.onseeked = resolve;
            video.onerror = resolve;
        });
    }));
    console.log('All videos prepared');
}

function getVisibleVideos() {
    return Object.values(videos).filter(video => video.style.display !== 'none');
}

function calculateLayout(videoCount, width, height) {
    switch (videoCount) {
        case 1:
            return [{ x: 0, y: 0, w: width, h: height }];
        case 2:
            return [
                { x: 0, y: 0, w: width / 2, h: height },
                { x: width / 2, y: 0, w: width / 2, h: height }
            ];
        case 3:
            return [
                { x: 0, y: 0, w: width, h: height / 2 },
                { x: 0, y: height / 2, w: width / 2, h: height / 2 },
                { x: width / 2, y: height / 2, w: width / 2, h: height / 2 }
            ];
        case 4:
            return [
                { x: 0, y: 0, w: width / 2, h: height / 2 },
                { x: width / 2, y: 0, w: width / 2, h: height / 2 },
                { x: 0, y: height / 2, w: width / 2, h: height / 2 },
                { x: width / 2, y: height / 2, w: width / 2, h: height / 2 }
            ];
        default:
            throw new Error('Unsupported number of videos');
    }
}