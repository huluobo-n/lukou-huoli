import puppeteer from "puppeteer-core";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shotDir = path.join(root, "tests", "screenshots");
fs.mkdirSync(shotDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--window-size=480,900"],
  defaultViewport: { width: 480, height: 900, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push("console: " + msg.text());
});

await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle0", timeout: 15000 });
await page.waitForFunction(() => window.__LUKOU__ && window.__LUKOU__.getState, { timeout: 8000 });

async function shot(name) {
  const file = path.join(shotDir, name + ".png");
  await page.screenshot({ path: file, type: "png" });
  console.log("截图", name);
}

function state() {
  return page.evaluate(() => window.__LUKOU__.getState());
}

let failed = 0;
function check(cond, msg) {
  if (cond) console.log("  ✓", msg);
  else {
    failed += 1;
    console.error("  ✗", msg);
  }
}

const title = await state();
check(title.state === "title", "页面启动后为开局界面，得到 " + title.state);
await shot("01-title");

// 点「开始游戏」
const box = await page.$("#game");
const rect = await box.boundingBox();
// 逻辑坐标按钮中心 (360, 600)，画布 CSS 可能不是 720
await page.evaluate(() => window.__LUKOU__.start());
const playing = await state();
check(playing.state === "playing", "开始游戏后进入对局");
check(playing.squadCount === 1, "开局 1 人，得到 " + playing.squadCount);
check(playing.weapon === "pistol", "开局手枪，得到 " + playing.weapon);
check(playing.hint === true, "开局显示提示");
await new Promise((r) => setTimeout(r, 200));
await shot("02-start");

// 暂停循环，用 step 快进，避免 rAF 与 step 双计时
await page.evaluate(() => window.__LUKOU__.setPaused(true));
await page.evaluate(() => window.__LUKOU__.step(6.05));
await page.evaluate(() => window.__LUKOU__.draw());
const at6 = await state();
const plus3 = at6.gates.find((g) => g.label === "+3" && g.lane === "left");
check(!!plus3, "第 6 秒左道出现 +3 蓝门，当前门: " + JSON.stringify(at6.gates));
check(at6.enemies.length >= 1, "第 6 秒右道已有游走体，数量 " + at6.enemies.length);
await shot("03-t6-plus3");

await page.evaluate(() => {
  window.__LUKOU__.step(1.3);
  window.__LUKOU__.draw();
});
const at74 = await state();
const smg = at74.gates.find((g) => g.label === "冲锋枪");
check(!!smg, "约 7.3 秒出现冲锋枪门，当前门: " + JSON.stringify(at74.gates));
await shot("04-t7-smg");

await page.evaluate(() => {
  window.__LUKOU__.step(15.0);
  window.__LUKOU__.draw();
});
const at22 = await state();
const x2 = at22.gates.find((g) => g.label === "×2") || at22.time >= 22;
check(at22.time >= 21.9 && at22.time <= 23, "时间推进到 20–25 秒窗口");
const spawnedX2 = await page.evaluate(() =>
  window.__LUKOU__.game.spawned.some((e) => e.gate === "mul" && e.value === 2),
);
check(spawnedX2, "×2 蓝门已按时间轴放出");
await shot("05-t22-x2");

await page.evaluate(() => {
  window.__LUKOU__.step(19.0);
  window.__LUKOU__.draw();
});
const at41 = await state();
const red = await page.evaluate(() =>
  window.__LUKOU__.game.spawned.some((e) => e.gate === "red" && e.label === "-3" && e.time >= 40),
);
check(red, "约 40 秒后放出红门 -3");
check(at41.time >= 40, "时间已过 40 秒，当前 " + at41.time.toFixed(2));
await shot("06-t41-red");

const realErrors = errors.filter((e) => !/favicon|404/.test(e));
check(realErrors.length === 0, "页面无脚本错误: " + realErrors.join(" | "));

// 完整教学段：靠右开火再向左穿门
await page.evaluate(() => {
  window.__LUKOU__.start();
  window.__LUKOU__.setPaused(true);
  // 右道清怪
  window.__LUKOU__.step(8.2);
  // 向左穿 +3 与冲锋枪门
  window.__LUKOU__.game.input.targetX = -3.25;
  window.__LUKOU__.step(4.0);
  window.__LUKOU__.draw();
});
const play = await state();
check(play.kills >= 5, "教学段击杀掉开局游走体，击杀 " + play.kills);
check(play.squadCount >= 4, "向左穿过 +3 后人数 >= 4，得到 " + play.squadCount);
check(play.weapon === "smg", "穿过武器门后为冲锋枪，得到 " + play.weapon);
await shot("07-squad-after-gates");

await browser.close();
if (failed) {
  console.error(`浏览器验收失败 ${failed} 项`);
  process.exit(1);
}
console.log("浏览器验收全部通过");
