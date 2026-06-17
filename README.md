# plugin-storybook

## Overview

Animated storybook with audio

## Loading

*Enter instructions for loading the plugin package here.*

To use the star progress bar, confetti, and celebration banner, also load the
`extension-progress` browser bundle alongside the plugin:

```html
<script src="dist/index.browser.min.js"></script>
<script src="dist/extension-progress.browser.min.js"></script>
```

## Compatibility

`plugin-storybook` requires jsPsych v8.0.0 or later.

## Animations

The `animations` parameter triggers a CSS animation on any image in the trial's
`images` array, identified by `image_id`.

```js
animations: [
  { image_id: 'bunny', type: 'wiggle', duration: 1000, time_onset: 500 },
]
```

| Parameter   | Type   | Default | Description |
| ----------- | ------ | ------- | ----------- |
| `image_id`  | string | —       | Must match the `id` of an image in the trial's `images` array. |
| `type`      | string | —       | One of `wiggle`, `loom`, `translate`, `fadeIn`, `fadeOut`, `bounce`, `shake`. |
| `time_onset`| int    | `0`     | Milliseconds to wait before the animation starts. |
| `duration`  | int    | `1000`  | How long the animation runs, in milliseconds. |
| `x`, `y`    | int    | `0`     | Pixel offset for the `translate` animation only. |

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

## Documentation

See [documentation](/plugin-storybook/README.md)

## Author / Citation

Khuyen Le, Urvi Suwal, Valeria Inojosa, Aiden Brown, Becky Gilbert, Siying Zhang
