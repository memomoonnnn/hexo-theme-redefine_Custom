/* global WaveSurfer */

document.addEventListener('DOMContentLoaded', () => {
  initAudioPlayers();
});

// Support Swup navigation
try {
    swup.hooks.on("page:view", () => {
        initAudioPlayers();
    });
} catch(e) {}


function initAudioPlayers() {
    const audioContainers = document.querySelectorAll('.audio-player-container');
    
    if (audioContainers.length === 0) return;

    audioContainers.forEach(container => {
        // Prevent double initialization
        if (container.classList.contains('initialized')) return;
        container.classList.add('initialized');

        // Get container specific styles (variables defined in CSS)
        const containerStyle = getComputedStyle(container);
        const primaryColor = containerStyle.getPropertyValue('--audio-primary-color').trim() || '#ff5722';
        const progressColor = containerStyle.getPropertyValue('--audio-progress-color').trim() || primaryColor;
        const waveColor = containerStyle.getPropertyValue('--audio-wave-color').trim() || '#ddd';

        const url = container.dataset.src;
        const id = container.id;
        const waveformId = `waveform-${id}`;
        
        const playBtn = container.querySelector('.audio-play-pause-btn');
        const icon = playBtn.querySelector('i');
        const currentTimeSpan = container.querySelector('.audio-current-time');
        const durationSpan = container.querySelector('.audio-duration');

        const wavesurfer = WaveSurfer.create({
            container: `#${waveformId}`,
            waveColor: waveColor,
            progressColor: progressColor,
            cursorColor: 'transparent',
            barWidth: 3,
            barRadius: 3,
            barGap: 1,
            height: 40,
            responsive: true,
            url: url
        });

        // Event Listeners
        wavesurfer.on('ready', () => {
            const duration = wavesurfer.getDuration();
            durationSpan.textContent = formatTime(duration);
        });

        wavesurfer.on('audioprocess', () => {
            const time = wavesurfer.getCurrentTime();
            currentTimeSpan.textContent = formatTime(time);
        });

        wavesurfer.on('finish', () => {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            playBtn.classList.remove('paused');
        });

        // Play/Pause button
        playBtn.addEventListener('click', () => {
            wavesurfer.playPause();
            togglePlayIcon(wavesurfer.isPlaying(), icon, playBtn);
        });
        
        // Handle play event (in case triggered by other means)
        wavesurfer.on('play', () => {
             togglePlayIcon(true, icon, playBtn);
        });

        wavesurfer.on('pause', () => {
             togglePlayIcon(false, icon, playBtn);
        });
    });
}

function togglePlayIcon(isPlaying, icon, btn) {
    if (isPlaying) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        btn.classList.add('paused');
    } else {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        btn.classList.remove('paused');
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}
