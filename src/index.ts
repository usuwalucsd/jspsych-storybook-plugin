import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import { AudioPlayerInterface } from "./AudioPlayer";
import autoBind from "auto-bind";
import { version } from "../package.json";

const info = <const>{
  name: "plugin-storybook",
  version: version,
  parameters: {
    
    /** Background image file path. */
    background_image : {
      type: ParameterType.STRING,
      default: "",
    },
    
    /** The width of the background image in percentage. */
    width: {
      type: ParameterType.INT,
      default: null,
    },
    
    /** The height of the background image in percentage. */
    height: {
      type: ParameterType.INT,
      default: null,
    },
    
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
          default: null
        },
        
        /** The height of the image in percentage. */
        height : {
          type: ParameterType.INT,
          default: null
        },
        
        /** The time in milliseconds when the image should appear on the screen. */
        time_onset : {
          type: ParameterType.INT,
          default: 0
        }, 
        
        /** The time in milliseconds when the image should be removed from the screen. If null, the image will remain on the screen till trial ends*/
        duration : {
          type: ParameterType.INT,
          default: null
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
    
    animations: {
      type: ParameterType.COMPLEX,
      array: true,
      nested: {
        /** The ID of the image to be animated. This must match the ID of one of the images in the images array. */
        image_id: {
          type: ParameterType.STRING,
          default: undefined,
        },
        
        /** The type of animation to be applied to the image. This can be either "shake", "bounce", or "flash". */    
        // animation_type: {
        //   type: ParameterType.STRING,
        //   default: undefined,
        // },
      }
    },
      
      /** An array of objects. Each object represents an audio file that will be played. Each object contains a src, time_onset, and response_allowed_while_playing parameter that will be applied to the question. */
      audio: {
        type: ParameterType.COMPLEX,
        array: true,
        default: [],
        nested: {
          /** The path of the audio file to be played.  */
          src: {
            type: ParameterType.STRING,
            default: undefined,
          },
          
          /** The time in milliseconds when the audio should start playing. */
          time_onset: {
            type: ParameterType.INT,
            default: 0
          },
          
          /** If true, then responses are allowed while the audio is playing. If false, then the audio must finish playing before the button choices are enabled and a response is accepted. Once the audio has played all the way through, the buttons are enabled and a response is allowed (including while the audio is being re-played via on-screen playback controls). */
          response_allowed_while_playing: {
            type: ParameterType.BOOL,
            default: true,
          },
        }
      }
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
  
  /**;
  * **plugin-storybook**
  *
  * Animated storybook with audio
  *
  * @author Khuyen Le, Urvi Suwal, Valeria Inojosa, Aiden Brown, Becky Gilbert, Siying Zhang
  * @see {@link /plugin-storybook/README.md}}
  */
  class StorybookPlugin implements JsPsychPlugin<Info> {
    static info = info;
    private audioPlayers: AudioPlayerInterface[] = [];
    // the clip currently in front (only one clip is audible at a time)
    private currentPlayer: AudioPlayerInterface | null = null;
    private clipsStarted: number = 0;
    private nClips: number = 0;
    private trialEnded: boolean = false;
    private params!: TrialType<Info>;
    // private display: HTMLElement;
    private response: { rt: number | null; button: number | null } = { rt: null, button: null };
    private context: AudioContext | null = null;
    private startTime: number = 0;
    private trial_complete!: (trial_data: { rt: number | null; response: number | null }) => void;
    
    constructor(private jsPsych: JsPsych) {
      autoBind(this);
    }
    
    async trial(display_element: HTMLElement, trial: TrialType<Info>, on_load: () => void) {
      
      // keep a reference to the trial parameters for use in end_trial
      this.params = trial;
      
      // set up the audio context
      this.context = this.jsPsych.pluginAPI.audioContext();
      
      // load an audio player for every clip declared in the `audio` parameter
      const clips = trial.audio ?? [];
      this.nClips = clips.length;
      this.audioPlayers = await Promise.all(
        clips.map((clip) => this.jsPsych.pluginAPI.getAudioPlayer(clip.src))
      );
      
      // notify when each clip finishes; the closure tells us which clip ended
      this.audioPlayers.forEach((player) =>
        player.addEventListener("ended", () => this.handle_audio_ended(player))
    );
    
    on_load();
    
    // start time
    this.startTime = performance.now();
    if (this.context !== null) {
      this.startTime = this.context.currentTime;
    }
    
    display_element.innerHTML = "";

    const containerDiv = document.createElement("div");
    containerDiv.id = "jspsych-storybook-background-image";
    containerDiv.style.display = "block";
    containerDiv.style.position = "relative";
    containerDiv.style.overflow = "hidden";

    if (trial.background_image !== "") {
      if (trial.width === null && trial.height === null) {
        containerDiv.style.width = "100vw";
        containerDiv.style.height = "100vh";
      } else if (trial.width !== null && trial.height === null) {
        containerDiv.style.width = `${trial.width}vw`;
        // height preserves aspect ratio — set once image loads
        const img = new Image();
        img.src = trial.background_image;
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const widthPx = (trial.width / 100) * window.innerWidth;
          containerDiv.style.height = `${(widthPx / aspectRatio / window.innerHeight) * 100}vh`;
        };
      } else if (trial.height !== null && trial.width === null) {
        containerDiv.style.height = `${trial.height}vh`;
        const img = new Image();
        img.src = trial.background_image;
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const heightPx = (trial.height / 100) * window.innerHeight;
          containerDiv.style.width = `${(heightPx * aspectRatio / window.innerWidth) * 100}vw`;
        };
      } else {
        containerDiv.style.width = `${trial.width}vw`;
        containerDiv.style.height = `${trial.height}vh`;
      }


      const bgImg = document.createElement("img");
      bgImg.src = trial.background_image;
      bgImg.style.position = "relative";  // takes up space, sizes the container
      bgImg.style.display = "block";
      bgImg.style.width = "100%";
      bgImg.style.height = "100%";
      containerDiv.appendChild(bgImg);
    } else {
      containerDiv.style.width = trial.width !== null ? `${trial.width}vw` : "100vw";
      containerDiv.style.height = trial.height !== null ? `${trial.height}vh` : "100vh";
      containerDiv.style.backgroundColor = "black";
    }

    display_element.appendChild(containerDiv);

    // overlay images — positioned as % of containerDiv so they scale with it
    for (const image of trial.images) {
      const img = document.createElement("img");
      img.src = image.src;
      img.id = `jspsych-storybook-image-${image.id}`;
      img.dataset.imageId = image.id;  // for reference in highlights and animations
      img.style.position = "absolute";
      img.style.left = `${image.x_pos}%`;
      img.style.top = `${image.y_pos}%`;
      img.style.width = image.width !== null ? `${image.width}%` : "auto";
      img.style.height = image.height !== null ? `${image.height}%` : "auto";
      img.style.display = "block";

      // initially hide all images; they will be shown at their specified onset times
      this.jsPsych.pluginAPI.setTimeout(() => {
        containerDiv.appendChild(img);
      }, image.time_onset);

      // if a duration is specified, set a timeout to hide the image after the duration has passed
      if (image.duration !== null) {
        this.jsPsych.pluginAPI.setTimeout(() => {
          img.style.visibility = "hidden";
        }, image.time_onset + image.duration);
      }

    }

    // start each clip at its scheduled onset (or immediately if time_onset is 0)
    clips.forEach((clip, i) => {
      const player = this.audioPlayers[i];
      if (clip.time_onset > 0) {
        this.jsPsych.pluginAPI.setTimeout(() => this.start_clip(player), clip.time_onset);
      } else {
        this.start_clip(player);
      }
    });
    
    const trial_promise = new Promise((resolve) => {
      // hold the .resolve() function from the Promise that ends the trial
      this.trial_complete = resolve;
    });
    
    // with no audio, end once the last image's display finishes (time_onset + duration);
    // images with no duration don't have a natural end time, so they don't count here
    if (this.nClips === 0) {
      const lastImageEnd = trial.images.reduce((maxEnd, image) => {
        if (image.duration === null) return maxEnd;
        return Math.max(maxEnd, image.time_onset + image.duration);
      }, 0);
      this.jsPsych.pluginAPI.setTimeout(() => this.end_trial(), lastImageEnd);
    }
    
    return trial_promise;
  }
  
  // bring a clip to the front: stop whatever is currently playing so only one
  // clip is audible at a time, then start the new one
  private start_clip = (player: AudioPlayerInterface) => {
    if (this.trialEnded) return;
    
    const previous = this.currentPlayer;
    this.currentPlayer = player;
    this.clipsStarted++;
    
    if (previous && previous !== player) {
      // stopping a clip mid-playback (or one that already ended) is safe once
      // it has been started; guard anyway in case the audio node disagrees
      try {
        previous.stop();
      } catch {
        /* already stopped */
      }
    }
    
    player.play();
  };
  
  // called when a clip finishes (either naturally or because it was stopped)
  private handle_audio_ended = (player: AudioPlayerInterface) => {
    if (this.trialEnded) return;
    // ignore clips that ended because a later clip replaced them; only the clip
    // currently in front matters
    if (player !== this.currentPlayer) return;
    // wait until every clip has had its turn to start before ending the trial
    if (this.clipsStarted < this.nClips) return;
    this.end_trial();
  };
  
  // method to end trial when it is time
  private end_trial = () => {
    if (this.trialEnded) return;
    this.trialEnded = true;
    
    // stop the clip that is still playing (others have already finished)
    if (this.currentPlayer) {
      try {
        this.currentPlayer.stop();
      } catch {
        /* already stopped */
      }
    }
    
    // gather the data to store for the trial
    var trial_data = {
      rt: this.response.rt,
      response: this.response.button,
    };
    
    // move on to the next trial
    this.trial_complete(trial_data);
  }
  /** Stops playback and ends this page early — for use when an embedding plugin needs to swap pages before this one finishes naturally. */
  public cancel = () => {
    this.end_trial();
  };
}

export default StorybookPlugin;