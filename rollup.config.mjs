import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { makeRollupConfig } from "@jspsych/config/rollup";
import esbuild from "rollup-plugin-esbuild";
import externals from "rollup-plugin-node-externals";

// Browser-only IIFE bundles for additional jsPsych extensions that live in this same
// repo. Unlike the main plugin, these aren't published as their own npm package, so
// they skip the ESM/CJS/dts/citations machinery `makeRollupConfig` provides for that.
const makeExtensionBrowserConfig = (input, name, destination) => {
  const sharedPlugins = (minify) => [
    externals({ deps: false }),
    resolve({ preferBuiltins: false }),
    esbuild({ target: minify ? "es2015" : "esnext", minify, loaders: { ".json": "json" } }),
    commonjs({ extensions: [".js", ".json"] }),
  ];

  return [
    {
      input,
      external: ["jspsych"],
      plugins: sharedPlugins(false),
      output: {
        file: `dist/${destination}.browser.js`,
        format: "iife",
        name,
        sourcemap: true,
        globals: { jspsych: "jsPsychModule" },
      },
    },
    {
      input,
      external: ["jspsych"],
      plugins: sharedPlugins(true),
      output: {
        file: `dist/${destination}.browser.min.js`,
        format: "iife",
        name,
        sourcemap: true,
        globals: { jspsych: "jsPsychModule" },
      },
    },
  ];
};

export default [
  ...makeRollupConfig("jsPsychStorybook"),
  ...makeExtensionBrowserConfig("src/extension-progress.ts", "jsPsychExtensionProgress", "extension-progress"),
  ...makeExtensionBrowserConfig("src/extension-animations.ts", "jsPsychExtensionAnimations", "extension-animations"),
];
