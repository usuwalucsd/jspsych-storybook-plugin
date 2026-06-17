import { startTimeline } from "@jspsych/test-utils";
import { initJsPsych } from "jspsych";

import jsPsychStorybook from ".";

jest.useFakeTimers();

// a fake audio player that records its `ended` listeners so a test can fire them
function makeFakePlayer() {
  const endedListeners: Array<() => void> = [];
  return {
    load: jest.fn(),
    play: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn((name: string, cb: () => void) => {
      if (name === "ended") endedListeners.push(cb);
    }),
    removeEventListener: jest.fn(),
    // helper used by the tests, not part of the interface
    fireEnded: () => endedListeners.forEach((cb) => cb()),
  };
}

describe("plugin-storybook", () => {
  it("ends right away when there is no audio and no image has a duration", async () => {
    const { expectFinished, getData } = await startTimeline([
      {
        type: jsPsychStorybook,
        highlight: [],
        animations: [],
        images: [{ id: "cat", src: "cat.png" }],
        audio: [],
      },
    ]);

    jest.advanceTimersByTime(0);
    await expectFinished();

    const data = getData().values()[0];
    expect(data.rt).toBeNull();
    expect(data.response).toBeNull();
  });

  it("with no audio, waits for the last image's duration to elapse before ending", async () => {
    const { expectRunning, expectFinished } = await startTimeline([
      {
        type: jsPsychStorybook,
        highlight: [],
        animations: [],
        images: [
          { id: "cat", src: "cat.png", time_onset: 0, duration: 2000 },
          { id: "dog", src: "dog.png", time_onset: 1000, duration: 3000 }, // ends at 4000
        ],
        audio: [],
      },
    ]);

    // neither image has finished yet
    jest.advanceTimersByTime(3999);
    await expectRunning();

    // dog's time_onset (1000) + duration (3000) = 4000, the latest of the two
    jest.advanceTimersByTime(1);
    await expectFinished();
  });

  it("with no audio, an image with no duration doesn't extend the end time", async () => {
    const { expectFinished } = await startTimeline([
      {
        type: jsPsychStorybook,
        highlight: [],
        animations: [],
        images: [
          { id: "cat", src: "cat.png", time_onset: 0, duration: 1000 },
          { id: "backdrop", src: "backdrop.png" }, // duration: null, stays until trial ends
        ],
        audio: [],
      },
    ]);

    jest.advanceTimersByTime(1000);
    await expectFinished();
  });

  it("with no audio, renders a background image and still ends based on image durations", async () => {
    const { expectRunning, expectFinished, getHTML } = await startTimeline([
      {
        type: jsPsychStorybook,
        highlight: [],
        animations: [],
        background_image: "background.jpeg",
        images: [{ id: "cat", src: "cat.png", time_onset: 0, duration: 1500 }],
        audio: [],
      },
    ]);

    expect(getHTML()).toContain("background.jpeg");

    jest.advanceTimersByTime(1499);
    await expectRunning();

    jest.advanceTimersByTime(1);
    await expectFinished();
  });

  it("plays the clip and ends once the audio finishes", async () => {
    const player = makeFakePlayer();
    const jsPsych = initJsPsych();
    jest.spyOn(jsPsych.pluginAPI, "getAudioPlayer").mockResolvedValue(player as any);

    const { expectRunning, expectFinished } = await startTimeline(
      [
        {
          type: jsPsychStorybook,
          highlight: [],
          animations: [],
          images: [{ id: "cat", src: "cat.png" }],
          audio: [{ src: "meow.mp3" }],
        },
      ],
      jsPsych
    );

    // the clip should have started and the trial should still be waiting on it
    expect(player.play).toHaveBeenCalledTimes(1);
    await expectRunning();

    // when the clip reports it has finished, the trial should end
    player.fireEnded();
    await expectFinished();

    expect(player.stop).toHaveBeenCalled();
  });

  it("with audio and a background image, ends when the audio finishes (not based on image durations)", async () => {
    const player = makeFakePlayer();
    const jsPsych = initJsPsych();
    jest.spyOn(jsPsych.pluginAPI, "getAudioPlayer").mockResolvedValue(player as any);

    const { expectRunning, expectFinished, getHTML } = await startTimeline(
      [
        {
          type: jsPsychStorybook,
          highlight: [],
          animations: [],
          background_image: "background.jpeg",
          images: [{ id: "cat", src: "cat.png", time_onset: 0, duration: 100000 }],
          audio: [{ src: "meow.mp3" }],
        },
      ],
      jsPsych
    );

    expect(getHTML()).toContain("background.jpeg");
    expect(player.play).toHaveBeenCalledTimes(1);
    await expectRunning();

    // the image's duration (100000ms) hasn't elapsed, but audio ending should
    // still finish the trial -- image durations only govern the no-audio case
    player.fireEnded();
    await expectFinished();
  });

  it("with audio and no background image, ends when the audio finishes", async () => {
    const player = makeFakePlayer();
    const jsPsych = initJsPsych();
    jest.spyOn(jsPsych.pluginAPI, "getAudioPlayer").mockResolvedValue(player as any);

    const { expectRunning, expectFinished, getHTML } = await startTimeline(
      [
        {
          type: jsPsychStorybook,
          highlight: [],
          animations: [],
          images: [{ id: "cat", src: "cat.png" }],
          audio: [{ src: "meow.mp3" }],
        },
      ],
      jsPsych
    );

    expect(getHTML()).not.toContain("background.jpeg");
    expect(player.play).toHaveBeenCalledTimes(1);
    await expectRunning();

    player.fireEnded();
    await expectFinished();
  });

  it("delays a clip with a time_onset until its scheduled time", async () => {
    const player = makeFakePlayer();
    const jsPsych = initJsPsych();
    jest.spyOn(jsPsych.pluginAPI, "getAudioPlayer").mockResolvedValue(player as any);

    const { expectRunning } = await startTimeline(
      [
        {
          type: jsPsychStorybook,
          highlight: [],
          animations: [],
          images: [{ id: "cat", src: "cat.png" }],
          audio: [{ src: "meow.mp3", time_onset: 1000 }],
        },
      ],
      jsPsych
    );

    // not played yet — onset is 1000ms in the future
    expect(player.play).not.toHaveBeenCalled();
    await expectRunning();

    jest.advanceTimersByTime(1000);
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("stops the previous clip when the next one starts (one audible at a time)", async () => {
    const first = makeFakePlayer();
    const second = makeFakePlayer();
    const jsPsych = initJsPsych();
    jest
      .spyOn(jsPsych.pluginAPI, "getAudioPlayer")
      .mockResolvedValueOnce(first as any)
      .mockResolvedValueOnce(second as any);

    const { expectRunning, expectFinished } = await startTimeline(
      [
        {
          type: jsPsychStorybook,
          highlight: [],
          animations: [],
          images: [{ id: "cat", src: "cat.png" }],
          audio: [
            { src: "first.mp3", time_onset: 0 },
            { src: "second.mp3", time_onset: 1000 },
          ],
        },
      ],
      jsPsych
    );

    // first clip plays immediately, second is still pending
    expect(first.play).toHaveBeenCalledTimes(1);
    expect(second.play).not.toHaveBeenCalled();
    await expectRunning();

    // at the second clip's onset, the first is stopped and the second starts
    jest.advanceTimersByTime(1000);
    expect(first.stop).toHaveBeenCalledTimes(1);
    expect(second.play).toHaveBeenCalledTimes(1);

    // the first clip finishing late (because it was stopped) must NOT end the
    // trial — only the final clip's end should
    first.fireEnded();
    await expectRunning();

    // when the final clip finishes, the trial ends
    second.fireEnded();
    await expectFinished();
  });
});
