async function exportVideo(format) {
    try {
        const visibleVideos = getVisibleVideos();
        if (visibleVideos.length === 0) {
            alert('No visible videos to export.');
            return;
        }

        console.log('Starting video export process...');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

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

        canvas.width = width;
        canvas.height = height;

        const stream = canvas.captureStream();
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tesla_cam_export_${format}.webm`;
            a.click();
            URL.revokeObjectURL(url);
        };

        mediaRecorder.start();

        const layout = calculateLayout(visibleVideos.length, width, height);
        const fps = 30;
        const duration = Math.min(...visibleVideos.map(v => v.duration));
        const totalFrames = Math.floor(duration * fps);

        for (let frame = 0; frame < totalFrames; frame++) {
            const time = frame / fps;
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < visibleVideos.length; i++) {
                const video = visibleVideos[i];
                video.currentTime = time;
                await new Promise(resolve => {
                    video.onseeked = resolve;
                });
                const { x, y, w, h } = layout[i];
                ctx.drawImage(video, x, y, w, h);
            }

            canvas.captureStream().getVideoTracks()[0].requestFrame();
        }

        mediaRecorder.stop();

        console.log('Export process complete');

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