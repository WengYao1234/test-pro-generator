const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const protoUrl = process.env.PROTO_URL || process.argv[2];
const runDir = process.env.RUN_DIR || process.argv[3];

if (!protoUrl || !runDir) {
  console.error("Usage: node scripts/playwright-explore-template.js <PROTO_URL> <RUN_DIR>");
  console.error("Or set PROTO_URL and RUN_DIR environment variables.");
  process.exit(1);
}

const screenshotDir = path.join(runDir, "screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });

function safeName(value, fallback) {
  const cleaned = String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|#\s]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return cleaned || fallback;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const observations = [];

  try {
    await page.goto(protoUrl, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(screenshotDir, "home.png"), fullPage: true });

    const navLinks = await page.locator("nav a, [role='navigation'] a, a[href]").evaluateAll((links) =>
      links.slice(0, 15).map((link) => ({
        text: link.textContent.trim(),
        href: link.href || link.getAttribute("href"),
      }))
    );

    observations.push({ type: "navigation", count: navLinks.length, items: navLinks });

    for (let index = 0; index < navLinks.length; index += 1) {
      const link = navLinks[index];
      const label = safeName(link.text || link.href, `nav-${index + 1}`);
      try {
        await page.goto(link.href, { waitUntil: "networkidle" });
        await page.screenshot({ path: path.join(screenshotDir, `${label}.png`), fullPage: true });
      } catch (error) {
        observations.push({
          type: "navigation-error",
          target: link,
          error: error.message,
        });
      }
    }

    await page.goto(protoUrl, { waitUntil: "networkidle" });

    const forms = await page.locator("form").evaluateAll((nodes) =>
      nodes.slice(0, 20).map((form, formIndex) => ({
        index: formIndex + 1,
        fields: Array.from(form.querySelectorAll("input, select, textarea")).map((field) => ({
          tag: field.tagName.toLowerCase(),
          name: field.getAttribute("name"),
          type: field.getAttribute("type"),
          placeholder: field.getAttribute("placeholder"),
          required: field.required || field.getAttribute("aria-required") === "true",
          maxlength: field.getAttribute("maxlength"),
          pattern: field.getAttribute("pattern"),
          disabled: field.disabled,
          readonly: field.readOnly,
        })),
      }))
    );

    observations.push({ type: "forms", count: forms.length, items: forms });

    const buttons = await page.locator("button, [role='button'], input[type='button'], input[type='submit']").evaluateAll((nodes) =>
      nodes.slice(0, 20).map((button) => ({
        text: button.textContent.trim() || button.getAttribute("value") || button.getAttribute("aria-label"),
        disabled: button.disabled || button.getAttribute("aria-disabled") === "true",
        type: button.getAttribute("type"),
      }))
    );

    observations.push({ type: "buttons", count: buttons.length, items: buttons });
  } finally {
    await browser.close();
  }

  const outputPath = path.join(runDir, "playwright-observations.json");
  fs.writeFileSync(outputPath, JSON.stringify(observations, null, 2), "utf8");
  console.log(`Wrote observations to ${outputPath}`);
  console.log(`Wrote screenshots to ${screenshotDir}`);
})();
