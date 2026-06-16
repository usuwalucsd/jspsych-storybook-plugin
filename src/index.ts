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

/**
 * **plugin-storybook**
 *
 * Animated storybook with audio
 *
 * @author Khuyen Le, Urvi Suwal, Valeria Inojosa,a Aiden Brown, Becky Gilbert, Siying Zhang
 * @see {@link /plugin-storybook/README.md}}
 */
class StorybookPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    // data saving
    var trial_data = {
      data1: 99, // Make sure this type and name matches the information for data1 in the data object contained within the info const.
      data2: "hello world!", // Make sure this type and name matches the information for data2 in the data object contained within the info const.
    };
    // end trial
    this.jsPsych.finishTrial(trial_data);
  }
}

export default StorybookPlugin;
