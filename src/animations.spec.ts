import { clickTarget, startTimeline } from "@jspsych/test-utils";

import jsPsychStorybook from "./index";

jest.useFakeTimers();

const baseTrial = {
  type: jsPsychStorybook,
  audio: [],
  highlight: [],
};

describe("renderImages", () => {
  it("renders an img element per entry, positioned from x_pos/y_pos/width/height", async () => {
    const { displayElement } = await startTimeline([
      {
        ...baseTrial,
        images: [{ id: "bunny", src: "bunny.png", x_pos: 42, y_pos: 60, width: 16, height: 25 }],
      },
    ]);

    const img = displayElement.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.src).toContain("bunny.png");
    expect(img.style.left).toBe("42%");
    expect(img.style.top).toBe("60%");
    expect(img.style.width).toBe("16%");
    expect(img.style.height).toBe("25%");
  });

  it("tags each image with its id via data-image-id, for extensions to target", async () => {
    const { displayElement } = await startTimeline([
      {
        ...baseTrial,
        images: [{ id: "bunny", src: "bunny.png" }],
      },
    ]);

    const img = displayElement.querySelector("img") as HTMLImageElement;
    expect(img.dataset.imageId).toBe("bunny");
  });

  it("finishes the trial with the image's id as the response when a clickable image is clicked", async () => {
    const { displayElement, getData } = await startTimeline([
      {
        ...baseTrial,
        images: [{ id: "cat", src: "cat.png", clickable: true }],
      },
    ]);

    const img = displayElement.querySelector("img") as HTMLImageElement;
    await clickTarget(img);

    const data = getData().values();
    expect(data[0].response).toBe("cat");
  });
});
