import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

import {
  wiggle, loom, translate, disappear, appear,
  fadeIn, fadeOut, changeClickability, updateInteractability
} from './transitions';

declare global {
  interface Window {
    PIXI: any;
    confetti: any; // optional — include canvas-confetti in your page to enable
  }
}

const { Application, Container, Text, Assets, Sprite, Graphics } = window.PIXI;

const info = <const>{
  name: "plugin-storybook",
  version: version,
  parameters: {
    canvas_size: {
      type: ParameterType.INT,
      array: true,
      default: [500, 500],
    },
    background: {
      type: ParameterType.STRING,
      default: "white",
    },
    choices: {
      type: ParameterType.KEYS,
      default: "ALL_KEYS",
    },
    trial_duration: {
      type: ParameterType.INT,
      default: null,
    },
    response_ends_trial: {
      type: ParameterType.BOOL,
      default: true,
    },
    objects: {
      type: ParameterType.OBJECT,
      array: true,
      default: [],
    },
    animations: {
      type: ParameterType.OBJECT,
      array: true,
      default: [],
    },
    /** Show a star progress bar at the bottom of the canvas */
    show_progress_bar: {
      type: ParameterType.BOOL,
      default: false,
    },
    /** Total number of stars (pages) in the storybook */
    total_pages: {
      type: ParameterType.INT,
      default: 1,
    },
    /** How many stars are already collected when this trial starts */
    pages_completed: {
      type: ParameterType.INT,
      default: 0,
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
    rt: {
      type: ParameterType.INT,
    },
    response: {
      type: ParameterType.STRING,
    },
  },
  citations: '__CITATIONS__',
};

type Info = typeof info;

/**
 * **plugin-storybook**
 *
 * Animated storybook with audio, star progress bar, and confetti.
 *
 * @author Khuyen Le, Urvi Suwal, Valeria Inojosa, Aiden Brown, Becky Gilbert, Siying Zhang
 */
class StorybookPlugin implements JsPsychPlugin<Info> {
  static info = info;

  trialInfo?: TrialType<Info>;
  assets: Record<string, any>;
  pixiObjects: Record<string, any>;
  objects: Record<string, any>;
  container: any;
  app: any;
  generatedIdCounter: number;
  startTime: number;

  constructor(private jsPsych: JsPsych) {
    this.assets = {};
    this.trialInfo = null;
    this.pixiObjects = {};
    this.objects = {};
    this.generatedIdCounter = 0;
    this.startTime = 0;
  }

  async loadAssets() {
    const thingsToLoad = [];

    for (const obj of this.trialInfo.objects ?? []) {
      if (!obj.id) {
        obj.id = '!!!generated-' + (++this.generatedIdCounter).toString();
      }

      if (obj.type === 'image') {
        thingsToLoad.push(Assets.load(obj.src).then(texture => {
          this.assets[obj.id] = texture;
        }));
      }

      if (obj.type === 'audio') {
        thingsToLoad.push(this.jsPsych.pluginAPI.getAudioPlayer(obj.src).then(player => {
          this.assets[obj.id] = player;
        }));
      }

      if (obj.type === 'text') {
        const pixiobj = new Text({
          text: obj.src,
          style: { fill: obj.style?.fill ?? 0x000000 },
        });
        this.pixiObjects[obj.id] = pixiobj;
      }
    }

    await Promise.all(thingsToLoad);
  }

  async render() {
    await this.loadAssets();

    for (const obj of this.trialInfo.objects ?? []) {
      if ((obj.onset ?? 0) === 0) {
        this.renderObject(obj);
      } else {
        this.jsPsych.pluginAPI.setTimeout(() => this.renderObject(obj), obj.onset);
      }
    }

    for (const anim of this.trialInfo.animations ?? []) {
      if ((anim.onset ?? 0) === 0) {
        this.animateObject(anim);
      } else {
        this.jsPsych.pluginAPI.setTimeout(() => this.animateObject(anim), anim.onset);
      }
    }

    if (this.trialInfo.show_progress_bar) {
      this.renderProgressBar(this.trialInfo.total_pages, this.trialInfo.pages_completed);
    }

    this.startTime = performance.now();
  }

  animateObject(obj): Promise<void> {
    const pixiObject = this.pixiObjects[obj.id];

    const p: Promise<void> = (() => {
      if (obj.type === 'wiggle') {
        return wiggle(this, pixiObject, obj.durationPerWiggle ?? 250, obj.wiggleAmount ?? 0.5, obj.numberOfTimes ?? 2);
      } else if (obj.type === 'translate') {
        return translate(this, pixiObject, obj.x ?? 0, obj.y ?? 0, obj.duration ?? 0);
      } else if (obj.type === 'loom') {
        return loom(this, pixiObject, obj.duration ?? 2000, obj.maxSize ?? 2, obj.numberOfTimes ?? 2);
      } else if (obj.type === 'disappear') {
        return disappear(this, pixiObject, obj);
      } else if (obj.type === 'appear') {
        return appear(this, pixiObject, obj);
      } else if (obj.type === 'fadeIn') {
        return fadeIn(this, pixiObject, obj, obj.duration ?? 1000);
      } else if (obj.type === 'fadeOut') {
        return fadeOut(this, pixiObject, obj, obj.duration ?? 1000);
      } else if (obj.type === 'changeClickability') {
        return changeClickability(this, pixiObject, this.objects[obj.id], obj.state ?? true);
      } else {
        return Promise.reject(new Error(`Unknown animation type: ${obj.type}`));
      }
    })();

    return p.then(() => {
      if (obj.postTransitionTimeout) {
        return new Promise(resolve => setTimeout(resolve, obj.postTimeout));
      }
    });
  }

  _handleGeneralObjectProperties(pixiobj, obj) {
    pixiobj.x = obj.x ?? 0;
    pixiobj.y = obj.y ?? 0;
    pixiobj.scale = obj.scale ?? 1;
    pixiobj.zIndex = obj.z ?? 0;
    pixiobj.alpha = obj.alpha ?? 1;
    pixiobj.pivot.x = pixiobj.width / (obj.scale ?? 1) / 2;
    pixiobj.pivot.y = pixiobj.height / (obj.scale ?? 1) / 2;
    updateInteractability(this, pixiobj, obj, undefined);
  }

  renderObject(obj: any): void {
    if (obj.type === 'image') {
      const sprite = new Sprite(this.assets[obj.id]);
      this._handleGeneralObjectProperties(sprite, obj);
      this.pixiObjects[obj.id] = sprite;
      this.objects[obj.id] = obj;
      this.container.addChild(sprite);
    }

    if (obj.type === 'audio') {
      this.assets[obj.id].play();
    }

    if (obj.type === 'text') {
      const pixiobj = this.pixiObjects[obj.id];
      this._handleGeneralObjectProperties(pixiobj, obj);
      this.container.addChild(pixiobj);
    }

    if (obj.type === 'rectangle') {
      const g = new Graphics().rect(0, 0, obj.width ?? 100, obj.height ?? 100);
      if (obj.fill) g.fill(obj.fill);
      if (obj.stroke) g.stroke(obj.stroke);
      this._handleGeneralObjectProperties(g, obj);
      this.pixiObjects[obj.id] = g;
      this.container.addChild(g);
    }

    if (obj.type === 'circle') {
      const g = new Graphics().arc(obj.x ?? 0, obj.y ?? 0, obj.radius ?? 10, 0, Math.PI * 2);
      if (obj.fill) g.fill(obj.fill);
      if (obj.stroke) g.stroke(obj.stroke);
      this._handleGeneralObjectProperties(g, obj);
      this.pixiObjects[obj.id] = g;
      this.container.addChild(g);
    }

    if (obj.type === 'endTrial') {
      this.finish({ type: 'endTrial' });
    }
  }

  // -------------------------------------------------------------------------
  // Star progress bar
  // -------------------------------------------------------------------------

  private makeStarGraphic(filled: boolean): any {
    const OUTER = 30;
    const INNER = OUTER * 0.42;
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? OUTER : INNER;
      pts.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    const g = new Graphics();
    g.poly(pts);
    if (filled) g.fill(0xFFD700);
    g.stroke({ width: 2.5, color: 0xFFD700 });
    return g;
  }

  private renderProgressBar(totalPages: number, pagesCompleted: number): void {
    const OUTER   = 30;
    const GAP     = 18;
    const PITCH   = OUTER * 2 + GAP;
    const BAR_Y   = 80;
    const totalW  = totalPages * PITCH - GAP;
    const startX  = this.app.screen.width / 2 - totalW / 2;

    const starLayer = new Container();
    this.container.addChild(starLayer);

    for (let i = 0; i < totalPages; i++) {
      const filled = i < pagesCompleted;
      const g = this.makeStarGraphic(filled);
      g.x = startX + i * PITCH + OUTER;
      g.y = BAR_Y;
      starLayer.addChild(g);

      // Pop animation on the star that was just collected
      if (i === pagesCompleted - 1) {
        g.scale.set(0.2);
        let elapsed = 0;
        const POP_MS = 350;
        const onTick = (ticker) => {
          elapsed += ticker.deltaMS;
          const t = Math.min(elapsed / POP_MS, 1);
          const scale = 1 + 0.35 * Math.sin(t * Math.PI) * (1 - t * 0.6);
          g.scale.set(scale);
          if (elapsed >= POP_MS) {
            g.scale.set(1);
            this.app.ticker.remove(onTick);
          }
        };
        this.app.ticker.add(onTick);
      }
    }

    if (typeof window.confetti !== 'function') return;

    if (pagesCompleted >= totalPages) {
      // All pages done — sustained cannon burst from both sides
      const deadline = Date.now() + 2500;
      const fire = () => {
        if (Date.now() > deadline) return;
        window.confetti({ particleCount: 55, angle:  60, spread: 60, origin: { x: 0 } });
        window.confetti({ particleCount: 55, angle: 120, spread: 60, origin: { x: 1 } });
        requestAnimationFrame(fire);
      };
      setTimeout(fire, 400);
    } else if (pagesCompleted > 0) {
      // One star collected — small burst
      window.confetti({ particleCount: 70, spread: 55, startVelocity: 35, origin: { x: 0.5, y: 0.75 } });
    }
  }

  // -------------------------------------------------------------------------

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    this.trialInfo = trial;

    (async () => {
      const app = new Application();
      await app.init({ background: trial.background, resizeTo: window, antialias: true });
      display_element.appendChild(app.canvas);
      this.app = app;
      this.container = new Container();
      app.stage.addChild(this.container);
      this.render();
    })();

    let keyboardListener: any = null;

    const endTrial = (response) => {
      if (keyboardListener != null) {
        this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }
      this.finish({ rt: response.rt, response: response.key });
    };

    if (trial.choices !== 'NO_KEYS') {
      keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: (resp) => { if (trial.response_ends_trial) endTrial(resp); },
        valid_responses: trial.choices,
        rt_method: 'performance',
        persist: false,
        allow_held_key: false,
      });
    }

    if (trial.trial_duration !== null) {
      this.jsPsych.pluginAPI.setTimeout(() => endTrial({ rt: null, key: null }), trial.trial_duration);
    }
  }

  finish(data) {
    const now = performance.now();
    if (!data.rt) data.rt = now - this.startTime;
    this.app.destroy();
    this.jsPsych.pluginAPI.clearAllTimeouts();
    this.jsPsych.finishTrial(data);
  }
}

export default StorybookPlugin;
