const { createFFmpeg, fetchFile } = FFmpeg;
let ffmpeg;

async function loadFFmpeg() {
    if (ffmpeg) return;
    ffmpeg = createFFmpeg({ 
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
        wasmPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm',
        workerPath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js'
    });
    await ffmpeg.load();
}

async function exportVideo(format) {
    try {
        const visibleVideos = getVisibleVideos();
        if (visibleVideos.length === 0) {
            alert('No visible videos to export.');
            return;
        }

        console.log('Starting video export process...');
        console.log(`Visible videos: ${visibleVideos.length}`);

        await loadFFmpeg();

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

        // Write input videos to FFmpeg's virtual file system
        for (let i = 0; i < visibleVideos.length; i++) {
            const video = visibleVideos[i];
            const data = await fetchFile(video.src);
            ffmpeg.FS('writeFile', `input${i}.mp4`, data);
        }

        // Prepare the FFmpeg command
        const filterComplex = visibleVideos.map((_, i) => `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2[v${i}]`).join(';');
        const overlayFilter = visibleVideos.map((_, i) => `[tmp][v${i}]overlay=shortest=1:x=${i % 2 === 1 ? 'W/2' : '0'}:y=${i >= 2 ? 'H/2' : '0'}[tmp]`).join(';');

        const command = [
            ...visibleVideos.map((_, i) => ['-i', `input${i}.mp4`]).flat(),
            '-filter_complex',
            `${filterComplex};${visibleVideos.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${visibleVideos.length}:layout=0_0|w0_0|0_h0|w0_h0[tmp];${overlayFilter.slice(0, -5)}`,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            'output.mp4'
        ];

        // Run FFmpeg command
        await ffmpeg.run(...command);

        // Read the output file and create a download link
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tesla_cam_export_${format}.mp4`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('Export complete, file should be downloading');

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