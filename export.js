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

        const stream = canvas.captureStream();
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

        mediaRecorder.start();

        const videoEncoder = new VideoEncoder({
            output: (chunk, metadata) => {
                if (chunk.type === 'key') {
                    console.log('Key frame');
                }
            },
            error: (e) => {
                console.error(e.message);
            }
        });

        await videoEncoder.configure({
            codec: 'vp09.00.10.08',
            width: width,
            height: height,
            bitrate: 10_000_000, // 10 Mbps
            framerate: 30,
        });

        let frameCounter = 0;
        const maxFrames = 30 * 10; // 10 seconds at 30 fps

        function drawFrame() {
            ctx.clearRect(0, 0, width, height);
            visibleVideos.forEach((video, index) => {
                const layout = calculateLayout(visibleVideos.length, width, height)[index];
                ctx.drawImage(video, layout.x, layout.y, layout.w, layout.h);
            });

            const videoFrame = new VideoFrame(canvas, { timestamp: frameCounter * 1000000 / 30 });
            videoEncoder.encode(videoFrame);
            videoFrame.close();

            frameCounter++;

            if (frameCounter < maxFrames) {
                requestAnimationFrame(drawFrame);
            } else {
                mediaRecorder.stop();
                videoEncoder.close();
            }
        }

        drawFrame();

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