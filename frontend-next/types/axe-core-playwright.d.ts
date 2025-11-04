import type { Page } from "@playwright/test";

declare module "@axe-core/playwright" {
  interface AxePlaywrightParams {
    page: Page;
  }
}
