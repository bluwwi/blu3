const FADE_DURATION = 50;
const FADE_STEPS = 5;

export function fadeSeek(audio: HTMLAudioElement, targetTime: number): Promise<void> {
  return new Promise((resolve) => {
    const initialVolume = audio.volume;
    const stepMs = FADE_DURATION / FADE_STEPS;
    const volStep = initialVolume / FADE_STEPS;
    let i = 0;

    const fadeOut = () => {
      if (i >= FADE_STEPS) {
        audio.currentTime = targetTime;
        let j = 0;
        const fadeIn = () => {
          if (j >= FADE_STEPS) {
            audio.volume = initialVolume;
            resolve();
            return;
          }
          j++;
          audio.volume = Math.min(initialVolume, volStep * j);
          setTimeout(fadeIn, stepMs);
        };
        fadeIn();
        return;
      }
      i++;
      audio.volume = Math.max(0, initialVolume - volStep * i);
      setTimeout(fadeOut, stepMs);
    };

    fadeOut();
  });
}
