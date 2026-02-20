import { expect, type Locator, type Page } from "@playwright/test";

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const clickMuiOption = async (page: Page, option: string) => {
  const exactOption = page.getByRole("option", {
    name: new RegExp(`^${escapeRegex(option)}$`, "i"),
  });
  await expect(exactOption.first()).toBeVisible();
  await exactOption.first().click();
};

/**
 * Select an option from either native <select> or MUI Select.
 */
export const selectOption = async (page: Page, field: Locator, option: string) => {
  await expect(field).toBeVisible();

  const tagName = await field.evaluate((element) => element.tagName.toLowerCase());

  if (tagName === "select") {
    await field.selectOption({ label: option });
    return;
  }

  await field.click();
  await clickMuiOption(page, option);
};
