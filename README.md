# plugin-storybook

## Overview

Animated storybook with audio

## Loading

*Enter instructions for loading the plugin package here.*

To use the star progress bar, confetti, celebration banner, and image
animations, also load the extension browser bundles alongside the plugin:

```html
<script src="dist/index.browser.min.js"></script>
<script src="dist/extension-progress.browser.min.js"></script>
<script src="dist/extension-animations.browser.min.js"></script>
```

## Compatibility

`plugin-storybook` requires jsPsych v8.0.0 or later.

## Extensions

### `jspsych-extension-progress`

Renders a gold star progress bar at the top of the screen, fires confetti, and
shows a celebration banner (with an optional sound) once all pages are
complete. It's opted into per trial via jsPsych's standard `extensions` array,
so it stays decoupled from the plugin's own parameters and from however the
trial renders its content.

```js
const jsPsych = initJsPsych({
  extensions: [{ type: jsPsychExtensionProgress }],
});

const trial = {
  type: jsPsychStorybook,
  images: [...],
  extensions: [
    {
      type: jsPsychExtensionProgress,
      params: {
        show_progress_bar: true,   // show the star bar for this trial
        total_pages: 5,            // total number of stars
        pages_completed: 2,        // how many are filled in so far
        celebration_sound: null,   // path to an audio file, played on the final page
      },
    },
  ],
};
```

| Param                | Type            | Default | Description |
| --------------------- | --------------- | ------- | ----------- |
| `show_progress_bar`   | boolean         | `false` | Whether to render the star bar for this trial. |
| `total_pages`         | int             | `1`     | Total number of stars in the bar. |
| `pages_completed`     | int             | `0`     | How many stars are filled in. Once this reaches `total_pages`, the celebration banner and confetti cannon fire. |
| `celebration_sound`   | string \| null  | `null`  | Path to an audio file to play alongside the celebration banner. |

Confetti requires [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
to be loaded separately (e.g. via CDN `<script>` tag); the extension degrades
gracefully — no confetti, no error — if it isn't present.

### `jspsych-extension-animations`

Animates any image in the trial's `images` array, identified by `image_id`,
in one of two render modes:

- **`'dom'`** (default) — each image is its own DOM element. The extension finds
  it via a `data-image-id` attribute (which the plugin sets automatically) and
  writes the animation directly to its style.
- **`'canvas'`** — for setups where images are painted onto a shared `<canvas>`
  instead of being individual elements. The extension can't reach into someone
  else's canvas, so it doesn't touch the DOM in this mode. Instead, whatever
  code owns the canvas's draw loop should call `getImageTransform(image_id)`
  every frame and apply the returned transform itself when drawing that image.
  Both modes are driven by the same animation math, so they stay visually in sync.

```js
const trial = {
  type: jsPsychStorybook,
  images: [...],
  extensions: [
    {
      type: jsPsychExtensionAnimations,
      params: {
        render_mode: 'dom', // or 'canvas'
        animations: [
          { image_id: 'bunny', type: 'wiggle', duration: 1000, time_onset: 500 },
        ],
      },
    },
  ],
};
```

| Animation param | Type   | Default | Description |
| ---------------- | ------ | ------- | ----------- |
| `image_id`        | string | —       | Must match the `id` of an image in the trial's `images` array. |
| `type`             | string | —       | One of `wiggle`, `loom`, `translate`, `fadeIn`, `fadeOut`, `bounce`, `shake`. |
| `time_onset`       | int    | `0`     | Milliseconds to wait before the animation starts. |
| `duration`         | int    | `1000`  | How long the animation runs, in milliseconds. |
| `x`, `y`           | int    | `0`     | Pixel offset for the `translate` animation only. |

For canvas mode, the per-frame transform returned by `getImageTransform(image_id)`
looks like:

```js
{ rotate: 0, scale: 1, translateX: 0, translateY: 0, opacity: 1 } // identity
```

Reach the extension instance from a canvas-rendering plugin via
`jsPsych.extensions['storybook-animations']`.

## Documentation

See [documentation](/plugin-storybook/README.md)

## Author / Citation

Khuyen Le, Urvi Suwal, Valeria Inojosa, Aiden Brown, Becky Gilbert, Siying Zhang
