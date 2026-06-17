import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

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

  private renderImages(display_element: HTMLElement, trial: TrialType<Info>): Record<string, HTMLImageElement> {
    const imageElements: Record<string, HTMLImageElement> = {};
    for (const img of trial.images ?? []) {
      const el = document.createElement('img');
      el.src = img.src;
      el.dataset.imageId = img.id;
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
    return imageElements;
  }

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    this.renderImages(display_element, trial);

    // Audio playback
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
