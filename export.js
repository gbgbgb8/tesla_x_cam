let ffmpeg = null;

async function loadFFmpeg() {
    if (!ffmpeg) {
        ffmpeg = FFmpeg.createFFmpeg({ log: true });
        await ffmpeg.load();
    }
}

async function exportVideo(format) {
    try {
        await loadFFmpeg();
        
        const visibleVideos = getVisibleVideos();
        if (visibleVideos.length === 0) {
            alert('No videos to export');
            return;
        }

        // Prepare FFmpeg command based on the selected format
        let outputWidth, outputHeight;
        switch (format) {
            case 'landscape':
                outputWidth = 1280;
                outputHeight = 720;
                break;
            case 'portrait':
                outputWidth = 720;
                outputHeight = 1280;
                break;
            case 'square':
                outputWidth = 720;
                outputHeight = 720;
                break;
            case 'original':
                outputWidth = videos.main.videoWidth;
                outputHeight = videos.main.videoHeight;
                break;
            default:
                throw new Error('Invalid format');
        }

        // Create filter complex string based on visible videos and their positions
        const filterComplex = createFilterComplex(visibleVideos, outputWidth, outputHeight);

        // Write input files to FFmpeg's virtual file system
        for (let i = 0; i < visibleVideos.length; i++) {
            const videoFile = await FFmpeg.fetchFile(visibleVideos[i].src);
            ffmpeg.FS('writeFile', `input${i}.mp4`, videoFile);
        }

        // Run FFmpeg command
        await ffmpeg.run(
            ...visibleVideos.flatMap((_, i) => ['-i', `input${i}.mp4`]),
            '-filter_complex', filterComplex,
            '-c:v', 'libx264',
            '-profile:v', 'high',
            '-preset', 'slow',
            '-crf', '18',
            '-r', '30',
            '-movflags', '+faststart',
            '-pix_fmt', 'yuv420p',
            'output.mp4'
        );

        // Read the output file
        const data = ffmpeg.FS('readFile', 'output.mp4');

        // Create a download link and trigger download
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported_video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Clean up
        visibleVideos.forEach((_, i) => ffmpeg.FS('unlink', `input${i}.mp4`));
        ffmpeg.FS('unlink', 'output.mp4');

    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed: ' + error.message);
    }
}

function createFilterComplex(videos, outputWidth, outputHeight) {
    const layouts = {
        main: '[0:v]scale=' + outputWidth + ':' + outputHeight + '[main];',
        'top-left': '[1:v]scale=iw/3:ih/3[tl];[main][tl]overlay=0:0[v1];',
        'top-right': '[2:v]scale=iw/3:ih/3[tr];[v1][tr]overlay=main_w-overlay_w:0[v2];',
        'bottom-left': '[3:v]scale=iw/3:ih/3[bl];[v2][bl]overlay=0:main_h-overlay_h[v3];',
        'bottom-right': '[4:v]scale=iw/3:ih/3[br];[v3][br]overlay=main_w-overlay_w:main_h-overlay_h'
    };

    let filterComplex = '';
    let lastOutput = 'main';

    videos.forEach((video, index) => {
        const position = Object.entries(videoPositions).find(([_, pos]) => pos === video.id.replace('-video', ''))[1];
        if (position !== 'main') {
            filterComplex += layouts[position].replace(/\[v\d\]/g, `[v${index}]`).replace(/\[v\d\]/g, `[v${index + 1}]`);
            lastOutput = `v${index + 1}`;
        }
    });

    return filterComplex + `[${lastOutput}]`;
}