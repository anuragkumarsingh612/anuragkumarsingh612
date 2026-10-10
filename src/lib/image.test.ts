import { describe, expect, it } from "vitest";
import { prepareImage } from "./image";
import { copy } from "./i18n";
describe("image boundary validation", () => {
  it("rejects non-images before allocating browser resources", async () => {
    await expect(
      prepareImage(new File(["hello"], "text.txt", { type: "text/plain" })),
    ).rejects.toThrow(copy.capture.invalid);
  });
  it("rejects images above 8 MB before decompression", async () => {
    const file = new File([new Uint8Array(8 * 1024 * 1024 + 1)], "large.jpg", {
      type: "image/jpeg",
    });
    await expect(prepareImage(file)).rejects.toThrow(copy.capture.invalid);
  });
});
