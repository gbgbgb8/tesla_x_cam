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

        let width, height;
        switch (format) {
            case 'landscape':
                width = 1280; height = 720;
                break;
            case 'portrait':
                width = 720; height = 1280;
                break;
            case 'square':
                width = 720; height = 720;
                break;
            case 'original':
                width = 1280; height = 960;
                break;
            default:
                throw new Error('Invalid format specified');
        }

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

        const startTime = new Date(document.getElementById('start-time').value).getTime();
        const endTime = new Date(document.getElementById('end-time').value).getTime();
        const totalDuration = endTime - startTime;

        mediaRecorder.start();

        const mainVideo = document.getElementById('main-video');
        mainVideo.currentTime = 0;
        await new Promise(resolve => mainVideo.onseeked = resolve);

        const drawFrame = () => {
            ctx.clearRect(0, 0, width, height);
            visibleVideos.forEach((video, index) => {
                const layout = calculateLayout(visibleVideos.length, width, height)[index];
                ctx.drawImage(video, layout.x, layout.y, layout.w, layout.h);
            });

            if (mainVideo.currentTime < mainVideo.duration) {
                requestAnimationFrame(drawFrame);
            } else {
                mediaRecorder.stop();
                console.log('Export complete');
            }
        };

        mainVideo.play();
        drawFrame();

        // Stop recording after the total duration
        setTimeout(() => {
            mainVideo.pause();
            mediaRecorder.stop();
            console.log('Export complete');
        }, totalDuration);

        console.log('Export process started. This may take a while...');

    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please check the console for details.');
    }
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