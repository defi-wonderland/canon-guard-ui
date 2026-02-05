import type { Locator, Page } from "@playwright/test";

/**
 * Selects an option from a MUI Select component (chain selector with icons)
 *
 * @param page - Playwright page
 * @param selector - The locator for the chain selector
 * @param label - The label text of the option to select
 */
export async function selectChain(page: Page, selector: Locator, label: string): Promise<void> {
  // Click on the select to open the dropdown
  await selector.click();

  // Wait for the dropdown menu to appear and click on the option
  await page.getByRole("option", { name: label }).click();
}
