/**
 * Audio tag
 * Syntax:
 * {% audio url %}
 */

'use strict';

hexo.extend.tag.register('audio', function(args) {
  const url = args[0];
  const id = 'audio-' + Math.random().toString(36).substring(2, 9);
  
  return `
    <div class="audio-player-container-wrapper">
      <div class="audio-player-container" id="${id}" data-src="${url}">
        <div class="audio-controls-wrapper">
            <div class="audio-play-pause-btn">
                <i class="fa-solid fa-play"></i>
            </div>
            <div class="audio-info">
                <div class="audio-waveform" id="waveform-${id}"></div>
                <div class="audio-time">
                    <span class="audio-current-time">0:00</span> / <span class="audio-duration">0:00</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  `;
});
