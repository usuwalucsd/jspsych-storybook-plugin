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
  it("ends immediately when there is no audio", async () => {
    const { expectFinished, getData } = await startTimeline([
      {
        type: jsPsychStorybook,
        images: [{ id: "cat", src: "cat.png" }],
        audio: [],
      },
    ]);

    await expectFinished();

    const data = getData().values()[0];
    expect(data.rt).toBeNull();
    expect(data.response).toBeNull();
  });

  it("plays the clip and ends once the audio finishes", async () => {
    const player = makeFakePlayer();
    const jsPsych = initJsPsych();
    jest.spyOn(jsPsych.pluginAPI, "getAudioPlayer").mockResolvedValue(player as any);

    const { expectRunning, expectFinished } = await startTimeline(
      [
        {
          type: jsPsychStorybook,
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

  it("delays a clip with a time_onset until its scheduled time", async () => {
    const player = makeFakePlayer();
    const jsPsych = initJsPsych();
    jest.spyOn(jsPsych.pluginAPI, "getAudioPlayer").mockResolvedValue(player as any);

    const { expectRunning } = await startTimeline(
      [
        {
          type: jsPsychStorybook,
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
