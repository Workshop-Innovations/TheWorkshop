// Requires the loopback-only synthetic API from backend/tests/support/serve_preview.py.
import puppeteer from "puppeteer";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.argv[2] || "http://127.0.0.1:4181";
const api = "http://localhost:8000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Browser checks require a local synthetic environment.");
const screenshotDir = process.argv[3] || "/tmp/workshop-browser-checks";
await fs.mkdir(screenshotDir, { recursive: true });
const login = await fetch(api + "/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "previewlearner",
    password: "synthetic-audit-123",
  }),
}).then((r) => r.json());
assert.ok(login.access_token);
const headers = {
  Authorization: "Bearer " + login.access_token,
  "Content-Type": "application/json",
};
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const failures = [];
let checks = 0;
async function check(name, work) {
  await work();
  checks++;
  console.log("PASS " + name);
}
async function pageFor({
  authenticated = true,
  socket = "real",
  profileFailure = false,
} = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1365, height: 900 });
  await page.setRequestInterception(true);
  let failProfile = profileFailure;
  page.on("request", (request) => {
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(request.url()))
      return request.abort();
    if (
      failProfile &&
      request.method() === "GET" &&
      request.url().endsWith("/api/v1/users/me")
    ) {
      failProfile = false;
      return request.respond({
        status: 503,
        headers: { "Access-Control-Allow-Origin": base },
        contentType: "application/json",
        body: '{"detail":"Synthetic outage"}',
      });
    }
    return request.continue();
  });
  page.on("pageerror", (error) => failures.push(error.message));
  await page.evaluateOnNewDocument(
    (token, authenticated, socket) => {
      if (authenticated) localStorage.setItem("accessToken", token);
      if (socket === "blocked")
        window.WebSocket = class {
          close() {}
        };
      else {
        const Native = window.WebSocket;
        window.__sockets = [];
        window.WebSocket = class extends Native {
          constructor(...args) {
            super(...args);
            window.__sockets.push(this);
          }
        };
      }
    },
    login.access_token,
    authenticated,
    socket,
  );
  return { page, context };
}
try {
  await check(
    "login form loads the account and focus totals without a page reload",
    async () => {
      const { page, context } = await pageFor({ authenticated: false });
      await page.goto(base + "/login");
      await page.waitForSelector("#username");
      await page.type("#username", "previewlearner");
      await page.type("#password", "synthetic-audit-123");
      await page.click('button[type="submit"]');
      await page.waitForFunction(
        () =>
          location.pathname === "/dashboard" &&
          document.body.textContent.includes("49") &&
          document.body.textContent.includes("55"),
      );
      await context.close();
    },
  );
  await check(
    "dashboard uses one profile GET, one summary GET, and no collaboration traffic",
    async () => {
      const { page, context } = await pageFor();
      const requests = [];
      page.on("request", (r) => {
        if (r.method() === "GET" && r.url().includes("/api/v1/"))
          requests.push(new URL(r.url()).pathname);
      });
      await page.goto(base + "/dashboard");
      await page.waitForFunction(
        () =>
          document.body.textContent.includes("49") &&
          document.body.textContent.includes("55"),
      );
      await page.waitForNetworkIdle({ idleTime: 300 });
      assert.deepEqual(requests.sort(), [
        "/api/v1/log/summary",
        "/api/v1/users/me",
      ]);
      await page.screenshot({
        path: screenshotDir + "/dashboard-desktop.png",
        fullPage: true,
      });
      await context.close();
    },
  );
  await check("profile saves and persists after reload", async () => {
    const { page, context } = await pageFor();
    await page.goto(base + "/profile");
    await page.waitForSelector("#profile-username");
    await page.click("#profile-username");
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.type("#profile-username", "previewlearner-edited");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() =>
      document.body.textContent.includes("Your profile has been saved."),
    );
    await page.reload();
    await page.waitForSelector("#profile-username");
    assert.equal(
      await page.$eval("#profile-username", (e) => e.value),
      "previewlearner-edited",
    );
    const restored = await fetch(api + "/api/v1/users/me", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ username: "previewlearner" }),
    });
    assert.equal(restored.status, 200);
    await page.screenshot({
      path: screenshotDir + "/profile-desktop.png",
      fullPage: true,
    });
    await context.close();
  });
  await check(
    "temporary profile outage preserves authentication and retry succeeds",
    async () => {
      const { page, context } = await pageFor({ profileFailure: true });
      await page.goto(base + "/dashboard");
      await page.waitForSelector('[role="alert"]');
      assert.ok(await page.evaluate(() => localStorage.getItem("accessToken")));
      await page.evaluate(() =>
        [...document.querySelectorAll("button")]
          .find((b) => b.textContent === "Retry")
          .click(),
      );
      await page.waitForFunction(() =>
        document.querySelector("h1")?.textContent.includes("previewlearner"),
      );
      await context.close();
    },
  );
  await check(
    "messages appear through HTTP acknowledgement with WebSocket unavailable; failed send retains draft",
    async () => {
      const { page, context } = await pageFor({ socket: "blocked" });
      await page.goto(base + "/community");
      await page.waitForSelector('textarea[placeholder^="Message #"]');
      const message = "HTTP acknowledgement " + Date.now();
      await page.type('textarea[placeholder^="Message #"]', message);
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        (text) =>
          document.body.textContent.includes(text) &&
          document.querySelector('textarea[placeholder^="Message #"]')
            ?.value === "",
        {},
        message,
      );
      assert.equal(
        await page.$eval('textarea[placeholder^="Message #"]', (e) => e.value),
        "",
      );
      const fail = (r) => {
        if (
          r.method() === "POST" &&
          /\/channels\/[^/]+\/messages$/.test(r.url())
        ) {
          r.respond({
            status: 503,
            headers: { "Access-Control-Allow-Origin": base },
            contentType: "application/json",
            body: "{}",
          });
        }
      };
      // Replace routing listener so every intercepted request is handled exactly once.
      page.removeAllListeners("request");
      page.on("request", (r) =>
        r.method() === "POST" && /\/channels\/[^/]+\/messages$/.test(r.url())
          ? fail(r)
          : r.continue(),
      );
      await page.type('textarea[placeholder^="Message #"]', "Keep this draft");
      await page.keyboard.press("Enter");
      await page.waitForSelector('[role="alert"]');
      assert.equal(
        await page.$eval('textarea[placeholder^="Message #"]', (e) => e.value),
        "Keep this draft",
      );
      await context.close();
    },
  );
  await check("reconnect catches up on persisted messages", async () => {
    const { page, context } = await pageFor();
    await page.goto(base + "/community");
    await page.waitForSelector('textarea[placeholder^="Message #"]');
    await page.waitForFunction(() =>
      window.__sockets.some((s) => s.readyState === 1),
    );
    const communities = await fetch(api + "/api/v1/community/communities", {
      headers,
    }).then((r) => r.json());
    const community = communities.find((c) => c.name === "The Workshop");
    const channels = await fetch(
      api + `/api/v1/community/communities/${community.id}/channels`,
      { headers },
    ).then((r) => r.json());
    const channelName = await page.$eval(
      'textarea[placeholder^="Message #"]',
      (e) => e.placeholder.slice(9),
    );
    const channel = channels.find((c) => c.name === channelName);
    assert.ok(channel);
    await page.evaluate(() =>
      window.__sockets
        .filter((s) => s.readyState === 1)
        .forEach((s) => s.close(4000, "Synthetic disconnect")),
    );
    const text = "Reconnect catchup " + Date.now();
    assert.equal(
      (
        await fetch(api + `/api/v1/community/channels/${channel.id}/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content: text }),
        })
      ).status,
      200,
    );
    await page.waitForFunction(
      (t) => document.body.textContent.includes(t),
      { timeout: 15000 },
      text,
    );
    await context.close();
  });
  await check(
    "mobile landing, dashboard, profile and collaboration fit 390px viewport",
    async () => {
      const { page, context } = await pageFor();
      await page.setViewport({ width: 390, height: 844 });
      for (const route of ["/", "/dashboard", "/profile", "/community"]) {
        await page.goto(base + route);
        await page.waitForNetworkIdle({ idleTime: 300 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          true,
          route + " overflows",
        );
        if (route !== "/community")
          assert.ok(
            await page.$eval("nav", (e) => e.getBoundingClientRect().top >= 0),
            "Navigation must be immediately visible",
          );
        await page.screenshot({
          path:
            screenshotDir +
            "/" +
            (route === "/" ? "landing" : route.slice(1)) +
            "-mobile.png",
          fullPage: true,
        });
      }
      for (const panel of ["channels", "members", "chat"]) {
        await page.evaluate(
          (name) =>
            [
              ...document.querySelectorAll(
                'nav[aria-label="Collaboration panels"] button',
              ),
            ]
              .find((b) => b.textContent === name)
              .click(),
          panel,
        );
        assert.equal(
          await page.$eval(`button[aria-pressed="true"]`, (e) => e.textContent),
          panel,
        );
      }
      await context.close();
    },
  );
  await check("timer survives reload and pause persists", async () => {
    const { page, context } = await pageFor();
    await page.goto(base + "/pomodoro");
    await page.waitForSelector('[aria-label="Start timer"]');
    await page.click('[aria-label="Start timer"]');
    const end = await page.evaluate(
      () =>
        JSON.parse(
          Object.entries(localStorage).find(([key]) =>
            key.startsWith("timerState:"),
          )[1],
        ).endTime,
    );
    await page.reload();
    await page.waitForSelector('[aria-label="Pause timer"]');
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(
            Object.entries(localStorage).find(([key]) =>
              key.startsWith("timerState:"),
            )[1],
          ).endTime,
      ),
      end,
    );
    await page.click('[aria-label="Pause timer"]');
    await page.reload();
    await page.waitForSelector('[aria-label="Start timer"]');
    assert.ok(
      await page.evaluate(
        () =>
          JSON.parse(
            Object.entries(localStorage).find(([key]) =>
              key.startsWith("timerState:"),
            )[1],
          ).remainingTime > 0,
      ),
    );
    await context.close();
  });
  assert.deepEqual(failures, []);
  console.log(
    `${checks} browser scenarios passed; no uncaught browser exceptions. Screenshots: ${screenshotDir}`,
  );
} finally {
  await browser.close();
}
