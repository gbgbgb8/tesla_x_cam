// Load FFmpeg
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

let ffmpegLoaded = false;

async function loadFFmpeg() {
    if (!ffmpegLoaded) {
        await ffmpeg.load();
        ffmpegLoaded = true;
    }
}

async function exportVideo(format) {
    try {
        await loadFFmpeg();

        const visibleVideos = getVisibleVideos();
        if (visibleVideos.length === 0) {
            alert('No visible videos to export.');
            return;
        }

        // Write visible video files to FFmpeg's virtual file system
        for (let i = 0; i < visibleVideos.length; i++) {
            const videoBlob = await fetch(visibleVideos[i].src).then(r => r.blob());
            ffmpeg.FS('writeFile', `input${i}.mp4`, await fetchFile(videoBlob));
        }

        let outputDimensions, filterComplex;
        switch (format) {
            case 'landscape':
                outputDimensions = '1280x720';
                filterComplex = createLayoutFilter(visibleVideos.length, 1280, 720);
                break;
            case 'portrait':
                outputDimensions = '720x1280';
                filterComplex = createLayoutFilter(visibleVideos.length, 720, 1280);
                break;
            case 'square':
                outputDimensions = '720x720';
                filterComplex = createLayoutFilter(visibleVideos.length, 720, 720);
                break;
            case 'original':
                outputDimensions = '1280x960'; // Assuming original Tesla cam resolution
                filterComplex = createLayoutFilter(visibleVideos.length, 1280, 960);
                break;
            default:
                throw new Error('Invalid format specified');
        }

        // Construct FFmpeg command
        const inputFiles = visibleVideos.map((_, i) => `-i input${i}.mp4`).join(' ');
        await ffmpeg.run(
            ...`${inputFiles} -filter_complex "${filterComplex}" -map "[outv]" -c:v libx264 -preset slow -crf 22 -profile:v high -pix_fmt yuv420p -r 30 -movflags +faststart -y output.mp4`.split(' ')
        );

        // Read the output file
        const data = ffmpeg.FS('readFile', 'output.mp4');

        // Create a download link
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tesla_cam_export_${format}.mp4`;
        a.click();

        // Clean up
        URL.revokeObjectURL(url);
        visibleVideos.forEach((_, i) => ffmpeg.FS('unlink', `input${i}.mp4`));
        ffmpeg.FS('unlink', 'output.mp4');

    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please check the console for details.');
    }
}

function getVisibleVideos() {
    return Object.values(videos).filter(video => video.style.display !== 'none');
}

function createLayoutFilter(videoCount, width, height) {
    let layout;
    switch (videoCount) {
        case 1:
            layout = '[0:v]scale=${width}:${height}[outv]';
            break;
        case 2:
            layout = '[0:v]scale=${width/2}:${height}[v0];[1:v]scale=${width/2}:${height}[v1];[v0][v1]hstack[outv]';
            break;
        case 3:
            layout = '[0:v]scale=${width}:${height/2}[v0];[1:v]scale=${width/2}:${height/2}[v1];[2:v]scale=${width/2}:${height/2}[v2];[v1][v2]hstack[bottom];[v0][bottom]vstack[outv]';
            break;
        case 4:
            layout = '[0:v]scale=${width/2}:${height/2}[v0];[1:v]scale=${width/2}:${height/2}[v1];[2:v]scale=${width/2}:${height/2}[v2];[3:v]scale=${width/2}:${height/2}[v3];[v0][v1]hstack[top];[v2][v3]hstack[bottom];[top][bottom]vstack[outv]';
            break;
        default:
            throw new Error('Unsupported number of videos');
    }
    return layout.replace(/\${width}/g, width).replace(/\${height}/g, height);
}