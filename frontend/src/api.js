const API_BASE = '/api';

export const api = {
    analyze: async (folderPaths) => {
        const res = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder_paths: folderPaths }),
        });
        return res.json();
    },

    generate: async (imagePaths, outputPath, resolution, audioPath, audioStart, audioEnd, imageDuration, titleText, kenBurnsEffect) => {
        const res = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_paths: imagePaths,
                output_path: outputPath,
                resolution: resolution,
                audio_path: audioPath,
                audio_start: audioStart,
                audio_end: audioEnd,
                image_duration: imageDuration,
                title_text: titleText,
                ken_burns_effect: kenBurnsEffect
            })
        });
        return res.json();
    },

    getProgress: async () => {
        const res = await fetch(`${API_BASE}/progress`);
        return res.json();
    },

    browse: async () => {
        const res = await fetch(`${API_BASE}/browse`, { method: 'POST' });
        return res.json();
    },

    browseFile: async () => {
        const res = await fetch(`${API_BASE}/browse_file`, { method: 'POST' });
        return res.json();
    }
};

export default api;
