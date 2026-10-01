import { execFile } from "node:child_process";
import { chromium } from "playwright";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BOOKING_URL = "https://politietbooking.nemo-q.se/Booking/Booking/Index/Avtale";
const START_DATE = new Date(2026, 9, 8);
const END_DATE_EXCLUSIVE = new Date(2026, 9, 23);
const PROFILE_DIR = process.env.PROFILE_DIR ?? ".browser-profile";

const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  headless: false,
  viewport: { width: 1280, height: 900 },
});
const page = context.pages()[0] ?? await context.newPage();

await page.goto(BOOKING_URL, { waitUntil: "domcontentloaded" });
console.log("Browser opened. Log in manually if prompted; the checker will start automatically.");

while (true) {
  try {
    await waitForBookingPage(page);
    await keepSessionAlive(page);

    await page.locator("#datepicker").fill("2026-10-08");
    const searchButton = page.getByRole("button", { name: "Vis første ledige time", exact: true });
    await searchButton.click();
    await page.waitForLoadState("domcontentloaded");

    const slots = await availableSlotsInRange(page, START_DATE, END_DATE_EXCLUSIVE);
    if (slots.length > 0) {
      const firstSlot = slots[0];
      console.log(`Found ${firstSlot.label}; selecting and confirming it.`);
      await firstSlot.locator.click();
      await page.locator("#booking-next").click();
      await page.waitForLoadState("domcontentloaded");
      await notify(`Appointment booked: ${firstSlot.label}`);
      console.log(`Booked ${firstSlot.label}. The browser remains open for verification.`);
      break;
    }

    console.log(`${new Date().toLocaleTimeString()}: no appointment from 2026-10-08 through 2026-10-22.`);
  } catch (error) {
    console.error(`${new Date().toLocaleTimeString()}: ${error.message}`);
  }

  await page.waitForTimeout(60_000);
}

async function waitForBookingPage(currentPage) {
  while (!await currentPage.getByRole("button", { name: "Vis første ledige time", exact: true }).isVisible()) {
    console.log("Waiting for you to reach the appointment selection page...");
    await currentPage.waitForTimeout(2_000);
  }
}

async function keepSessionAlive(currentPage) {
  const refreshButton = currentPage.locator("#refresh-session-btn");
  if (await refreshButton.isVisible()) {
    await refreshButton.click();
  }
}

async function availableSlotsInRange(currentPage, startDate, endDateExclusive) {
  const candidates = currentPage.locator('button[aria-label^="2026-"]');
  const slots = [];

  for (let index = 0; index < await candidates.count(); index += 1) {
    const locator = candidates.nth(index);
    const label = await locator.getAttribute("aria-label");
    const match = label?.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (!match) continue;

    const [, year, month, day, hour, minute, second] = match.map(Number);
    const date = new Date(year, month - 1, day, hour, minute, second);
    if (date >= startDate && date < endDateExclusive) {
      slots.push({ date, label, locator });
    }
  }

  return slots.sort((left, right) => left.date - right.date);
}

async function notify(message) {
  process.stdout.write("\u0007");
  if (process.platform !== "darwin") return;

  const escaped = message.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  await execFileAsync("osascript", [
    "-e",
    `display notification "${escaped}" with title "Politiet appointment checker" sound name "Glass"`,
  ]);
}
