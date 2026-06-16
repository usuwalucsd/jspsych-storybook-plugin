import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

declare global {
  interface Window { confetti: any; }
}

const info = <const>{
  name: "plugin-storybook",
  version: version,
  parameters: {
    /** An array of objects. Each object represents an image that appears on the screen. Each object contains a id, src, clickable, x_pos, y_pos, width, height, time_onset, and time_offset parameter that will be applied to the question. */
    images: {
      type: ParameterType.COMPLEX,
      array: true,
      nested: {
        /** unique ID for this image. This must not have any spaces or special characters. */
        id: {
          type: ParameterType.STRING,
          default: undefined,
        },

        /** The path of the image file to be displayed.  */
        src: {
          type: ParameterType.STRING,
          default: undefined,
        },

        /** Whether the image is clickable. */
        clickable: {
          type: ParameterType.BOOL,
          default: false,
        },

        /** The x position of the image on the screen in percentage. */
        x_pos : {
          type: ParameterType.INT,
          default: 0
        }, 

        /** The y position of the image on the screen in percentage. */
        y_pos : {
          type: ParameterType.INT,
          default: 0
        }, 

        /** The width of the image in percentage. */
        width : {
          type: ParameterType.INT,
          default: 100
        },

        /** The height of the image in percentage. */
        height : {
          type: ParameterType.INT,
          default: 100
        },

        /** The time in milliseconds when the image should appear on the screen. */
        time_onset : {
          type: ParameterType.INT,
          default: 0  
        }, 

        /** The time in milliseconds when the image should disappear from the screen. */
        time_offset : {
          type: ParameterType.INT,
          default: 0  
        }, 
        
        
      },
    },

    /** An array of objects. Each object represents an image that will be highlighted with a border. Each object contains an image_id parameter that corresponds to the ID of one of the images in the images array. */
    highlight: {
      type: ParameterType.COMPLEX,
      array: true,
      nested: {
        /** The ID of the image to be highlighted. This must match the ID of one of the images in the images array. */
        image_id: {
          type: ParameterType.STRING,
          default: undefined,
        },
        
        /** The time in milliseconds when the image should be highlighted. */
        time_onset : {
          type: ParameterType.INT,
          default: 0  
        }, 

        /** The time in milliseconds when the image should stop being highlighted. */
        time_offset : {
          type: ParameterType.INT,
          default: 0  
        }, 

      }
    },

    /** An array of objects. Each object represents an audio file that will be played. Each object contains a src, time_onset, and response_allowed_while_playing parameter that will be applied to the question. */
    audio: {
      type: ParameterType.COMPLEX,
      array: true,
      nested: {
        /** The path of the audio file to be played.  */
        src: {
          type: ParameterType.STRING,
          default: undefined,
        },

        /** The time in milliseconds when the audio should start playing. */
        time_onset : {
          type: ParameterType.INT,
          default: 0  
        },

        /** If true, then responses are allowed while the audio is playing. If false, then the audio must finish playing before the button choices are enabled and a response is accepted. Once the audio has played all the way through, the buttons are enabled and a response is allowed (including while the audio is being re-played via on-screen playback controls). */
        response_allowed_while_playing: {
          type: ParameterType.BOOL,
          default: true,
        },
      }
    },

    /** Show a star progress bar at the top of the screen. */
    show_progress_bar: {
      type: ParameterType.BOOL,
      default: false,
    },
    /** Total number of pages (stars) in the storybook. */
    total_pages: {
      type: ParameterType.INT,
      default: 1,
    },
    /** How many stars are already collected when this trial starts. */
    pages_completed: {
      type: ParameterType.INT,
      default: 0,
    },

    /** An array of animations to apply to images. Each object contains image_id, type, time_onset, duration, and optional x/y for translate. */
    animations: {
      type: ParameterType.COMPLEX,
      array: true,
      nested: {
        /** The ID of the image to animate. Must match an ID in the images array. */
        image_id: {
          type: ParameterType.STRING,
          default: undefined,
        },
        /** Animation type: 'wiggle', 'loom', 'translate', 'fadeIn', 'fadeOut' */
        type: {
          type: ParameterType.STRING,
          default: undefined,
        },
        /** Time in milliseconds when the animation starts. */
        time_onset: {
          type: ParameterType.INT,
          default: 0,
        },
        /** Duration of the animation in milliseconds. */
        duration: {
          type: ParameterType.INT,
          default: 1000,
        },
        /** X offset in pixels for translate animation. */
        x: {
          type: ParameterType.INT,
          default: 0,
        },
        /** Y offset in pixels for translate animation. */
        y: {
          type: ParameterType.INT,
          default: 0,
        },
      },
    },



  },
  data: {

    /** An object containing the response for each question. The object will have a separate key (variable) for each question, with the first question in the trial being recorded in `Q0`, the second in `Q1`, and so on. The responses are recorded as integers, representing the position selected on the likert scale for that question. If the `name` parameter is defined for the question, then the response object will use the value of `name` as the key for each question. This will be encoded as a JSON string when data is saved using the `.json()` or `.csv()` functions. */
    response: {
      type: ParameterType.OBJECT,
    },
    
    /** The response time in milliseconds for the participant to make a response. The time is measured from when the questions first appear on the screen until the participant's response(s) are submitted. */
    rt: {
      type: ParameterType.INT,
    },


  },
  // When you run build on your plugin, citations will be generated here based on the information in the CITATION.cff file.
  citations: '__CITATIONS__',
};

type Info = typeof info;

/**
 * **plugin-storybook**
 *
 * Animated storybook with audio
 *
 * @author Khuyen Le, Urvi Suwal, Valeria Inojosa, Aiden Brown, Becky Gilbert, Siying Zhang
 * @see {@link /plugin-storybook/README.md}}
 */
class StorybookPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  private renderProgressBar(display_element: HTMLElement, totalPages: number, pagesCompleted: number): void {
    if (!document.getElementById('storybook-star-keyframes')) {
      const style = document.createElement('style');
      style.id = 'storybook-star-keyframes';
      style.textContent = `
        @keyframes storybook-star-pop {
          0%   { transform: scale(0.2); }
          60%  { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    const bar = document.createElement('div');
    bar.style.cssText = `
      position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 14px; z-index: 100;
    `;

    for (let i = 0; i < totalPages; i++) {
      const star = document.createElement('span');
      star.textContent = '★';
      const isNew = i === pagesCompleted - 1;
      star.style.cssText = `
        font-size: 38px; line-height: 1; display: inline-block;
        color: ${i < pagesCompleted ? '#FFD700' : 'transparent'};
        -webkit-text-stroke: 2.5px #FFD700;
        ${isNew ? 'animation: storybook-star-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;' : ''}
      `;
      bar.appendChild(star);
    }

    display_element.appendChild(bar);

    if (typeof window.confetti !== 'function') return;

    if (pagesCompleted >= totalPages) {
      const deadline = Date.now() + 2500;
      const fire = () => {
        if (Date.now() > deadline) return;
        window.confetti({ particleCount: 55, angle:  60, spread: 60, origin: { x: 0 } });
        window.confetti({ particleCount: 55, angle: 120, spread: 60, origin: { x: 1 } });
        requestAnimationFrame(fire);
      };
      setTimeout(fire, 400);
    } else if (pagesCompleted > 0) {
      window.confetti({ particleCount: 70, spread: 55, startVelocity: 35, origin: { x: 0.5, y: 0.2 } });
    }
  }

  private injectAnimationStyles(): void {
    if (document.getElementById('storybook-animation-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'storybook-animation-keyframes';
    style.textContent = `
      @keyframes storybook-wiggle {
        0%, 100% { transform: rotate(0deg); }
        15%       { transform: rotate(-12deg); }
        30%       { transform: rotate(12deg); }
        45%       { transform: rotate(-8deg); }
        60%       { transform: rotate(8deg); }
        75%       { transform: rotate(-4deg); }
        90%       { transform: rotate(4deg); }
      }
      @keyframes storybook-loom {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.6); }
      }
      @keyframes storybook-fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes storybook-fadeOut {
        from { opacity: 1; }
        to   { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    if (trial.show_progress_bar) {
      this.renderProgressBar(display_element, trial.total_pages, trial.pages_completed);
    }

    this.injectAnimationStyles();

    // Image rendering
    const imageElements: Record<string, HTMLImageElement> = {};
    for (const img of trial.images ?? []) {
      const el = document.createElement('img');
      el.src = img.src;
      el.style.cssText = `
        position: absolute;
        left: ${img.x_pos}%;
        top: ${img.y_pos}%;
        width: ${img.width}%;
        height: ${img.height}%;
        object-fit: contain;
        ${img.time_onset > 0 ? 'opacity: 0; pointer-events: none;' : ''}
        ${img.clickable ? 'cursor: pointer;' : ''}
      `;
      if (img.clickable) {
        el.addEventListener('click', () => {
          this.jsPsych.pluginAPI.clearAllTimeouts();
          display_element.innerHTML = '';
          this.jsPsych.finishTrial({ response: img.id, rt: 0 });
        });
      }
      display_element.appendChild(el);
      imageElements[img.id] = el;

      if (img.time_onset > 0) {
        this.jsPsych.pluginAPI.setTimeout(() => {
          el.style.opacity = '1';
          el.style.pointerEvents = '';
        }, img.time_onset);
      }
      if (img.time_offset > 0) {
        this.jsPsych.pluginAPI.setTimeout(() => {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        }, img.time_offset);
      }
    }

    // Animations
    for (const anim of trial.animations ?? []) {
      const apply = () => {
        const el = imageElements[anim.image_id];
        if (!el) return;
        const dur = anim.duration ?? 1000;
        if (anim.type === 'wiggle') {
          el.style.animation = `storybook-wiggle ${dur}ms ease-in-out`;
          el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
        } else if (anim.type === 'loom') {
          el.style.animation = `storybook-loom ${dur}ms ease-in-out`;
          el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
        } else if (anim.type === 'fadeIn') {
          el.style.animation = `storybook-fadeIn ${dur}ms ease-in-out forwards`;
        } else if (anim.type === 'fadeOut') {
          el.style.animation = `storybook-fadeOut ${dur}ms ease-in-out forwards`;
        } else if (anim.type === 'translate') {
          el.style.transition = `transform ${dur / 2}ms ease-in-out`;
          el.style.transform = `translate(${anim.x ?? 0}px, ${anim.y ?? 0}px)`;
          setTimeout(() => {
            el.style.transform = 'translate(0, 0)';
            setTimeout(() => { el.style.transition = ''; }, dur / 2);
          }, dur / 2);
        }
      };
      if ((anim.time_onset ?? 0) > 0) {
        this.jsPsych.pluginAPI.setTimeout(apply, anim.time_onset);
      } else {
        apply();
      }
    }

    // Audio playback (placeholder until team implements full trial rendering)
    for (const aud of trial.audio ?? []) {
      const play = () => {
        this.jsPsych.pluginAPI.getAudioPlayer(aud.src).then(player => player.play());
      };
      if (aud.time_onset > 0) {
        this.jsPsych.pluginAPI.setTimeout(play, aud.time_onset);
      } else {
        play();
      }
    }

    // Placeholder continue button — team will replace with full image/audio rendering
    const btn = document.createElement('button');
    btn.textContent = 'Continue →';
    btn.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      padding: 12px 28px; font-size: 16px; font-family: sans-serif;
      background: #5865F2; color: white; border: none; border-radius: 8px;
      cursor: pointer; z-index: 1000;
    `;
    btn.addEventListener('click', () => {
      this.jsPsych.pluginAPI.clearAllTimeouts();
      display_element.innerHTML = '';
      this.jsPsych.finishTrial({ response: 'continue', rt: 0 });
    });
    display_element.appendChild(btn);
  }
}

export default StorybookPlugin;
