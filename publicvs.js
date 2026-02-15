"use strict";

console.log("publicvs.js is running ✅");
//#region Others
/***********************
 * 1) Easy customization
 ***********************/
const CONFIG = {
  recipientName: "Special Someone", // <-- change this
  toLine: "To: ",
  mainMessage: "Will you be my Valentine? 💖",
  subMessage: "I love you very much.",
  yesResultTitle: "YAYYYYY!!! 💘 Thanks for playing 🥺",
  yesResultText: "I love you so much! Heehee!",
  yesButtonText: "YES",
  noButtonText: "No",
};

// Put your photos in the same folder OR use an /photos folder. Full pool of photos.
const ALL_PHOTOS = [
  "photos/photo1.jpg",
  "photos/photo2.jpg",
  "photos/photo3.jpg",
  "photos/photo4.jpg",
  "photos/photo5.jpg",
  "photos/photo6.jpg",
  "photos/photo7.jpg",
  "photos/photo8.jpg",
  "photos/photo9.jpg",
  "photos/photo10.jpg",
  "photos/photo11.jpg",
  "photos/photo12.jpg",
  "photos/photo13.jpg",
  "photos/photo14.jpg",
  "photos/photo15.jpg",
  "photos/photo16.jpg",
  "photos/photo17.jpg",
  "photos/photo18.jpg",
  "photos/photo19.jpg",
  "photos/photo20.jpg",
  "photos/photo21.jpg",
  "photos/photo22.jpg",
  "photos/photo23.jpg",
  "photos/photo24.jpg",
  "photos/photo25.jpg",
];

// Mini-game photos (always exactly 3 per run)
let CAROUSEL_PHOTOS = [];
// ---- Random + no-overlap photo dealing (per session) ----
const PHOTO_GAME_COUNT = 3; // photo mini game uses 3 photos
let PHOTO_GAME_PHOTOS = []; // photos used in photo mini game

let SCRATCH_PHOTO = ""; // photo used in scratch game

let JIGSAW_PHOTO = ""; // photo used in jigsaw game

const MEMORY_UNIQUE_COUNT = 6; // 6 unique photos duplicated => 12 cards
let MEMORY_UNIQUE_PHOTOS = []; // set each session

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealSessionPhotos() {
  const pool = shuffle([...ALL_PHOTOS]);

  // Photo game gets 3
  PHOTO_GAME_PHOTOS = pool.slice(0, PHOTO_GAME_COUNT);

  // Scratch gets 1
  SCRATCH_PHOTO = pool[PHOTO_GAME_COUNT] || pool[0];

  // Memory gets 6 unique (no overlaps)
  MEMORY_UNIQUE_PHOTOS = pool.slice(
    PHOTO_GAME_COUNT + 1,
    PHOTO_GAME_COUNT + 1 + MEMORY_UNIQUE_COUNT,
  );

  // Jigsaw gets 1 unique (the next photo)
  JIGSAW_PHOTO = pool[PHOTO_GAME_COUNT + 1 + MEMORY_UNIQUE_COUNT] || "";

  // Safety fallback if something weird happens
  const used = new Set(
    [...PHOTO_GAME_PHOTOS, SCRATCH_PHOTO, ...MEMORY_UNIQUE_PHOTOS].filter(
      Boolean,
    ),
  );
  if (!JIGSAW_PHOTO || used.has(JIGSAW_PHOTO)) {
    const remaining = pool.filter((p) => !used.has(p));
    JIGSAW_PHOTO = remaining[0] || pool[0];
  }

  // Pop Hearts gets 1 unique (next remaining photo)
  const used2 = new Set(
    [
      ...PHOTO_GAME_PHOTOS,
      SCRATCH_PHOTO,
      ...MEMORY_UNIQUE_PHOTOS,
      JIGSAW_PHOTO,
    ].filter(Boolean),
  );

  const remaining2 = pool.filter((p) => !used2.has(p));

  // Pop Hearts gets a deck of photos (ideally unique per heart)
  const targetCount = 8; // match POP_HEART_COUNT
  let deck = remaining2.slice(0, targetCount);

  // if not enough remaining, safely fill by looping the full pool
  while (deck.length < targetCount) deck.push(pool[deck.length % pool.length]);

  saveJSON(SESSION_KEYS.popDeck, deck);

  // ✅ persist dealt results so refresh doesn't wipe the game pools
  saveJSON(SESSION_KEYS.photoGamePhotos, PHOTO_GAME_PHOTOS);
  saveJSON(SESSION_KEYS.scratchPhoto, SCRATCH_PHOTO);
  saveJSON(SESSION_KEYS.memoryUniquePhotos, MEMORY_UNIQUE_PHOTOS);

  // jigsaw already has a key, so persist it too
  saveJSON(SESSION_KEYS.jigsawPhoto, JIGSAW_PHOTO);

}

// Utility helpers (shared)
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function drawSpriteCover(g, img, x, y, w, h) {
  // ✅ guard: image not ready yet
  if (!img || !img.complete) return;

  // Draw image covering the destination (like object-fit: cover)
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;

  g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/***********************
 * 2) Helpers + elements
 ***********************/
const $ = (sel, root = document) => root.querySelector(sel);

const el = {
  toLine: $("#toLine"),
  mainMessage: $("#mainMessage"),
  subMessage: $("#subMessage"),
  yesBtn: $("#yesBtn"),
  noBtn: $("#noBtn"),
  hint: $("#hint"),

  btnRow: $("#btnRow"),
  heartsLayer: $("#hearts-layer"),
  bgMusic: $("#bgMusic"),
  bgMusicAfter: $("#bgMusicAfter"),

  // sections
  planner: $("#planner"),
  gamesMenu: $("#gamesMenu"),
  carousel: $("#carousel"),
  result: $("#result"),

  // planner
  plannerView: $("#plannerView"),
  cancelPlanBtn: $("#cancelPlanBtn"),
  donePlanningBtn: $("#donePlanningBtn"),
  exportTxtBtn: $("#exportTxtBtn"),

  // result
  resultTitle: $("#resultTitle"),
  resultText: $("#resultText"),
  restartBtn: $("#restartBtn"),
  replayBackBtn: $("#replayBackBtn"),

  // games
  photoGameBtn: $("#photoGameBtn"),
  gamesBackBtn: $("#gamesBackBtn"),
  gamesContinueBtn: $("#gamesContinueBtn"),

  // photo game
  gameArea: $("#gameArea"),
  gameOverlay: $("#gameOverlay"),
  lockText: $("#lockText"),
  hintText: $("#hintText"),
  gamePrompt: $("#gamePrompt"),
  gameStatus: $("#gameStatus"),
  ping: $("#ping"),
  carouselImg: $("#carouselImg"),
  carouselBadge: $("#carouselBadge"),
  nextPhotoBtn: $("#nextPhotoBtn"),
  prevPhotoBtn: $("#prevPhotoBtn"),
  backBtn: $("#backBtn"),
  continueBtn: $("#continueBtn"),

  // scratch game
  scratchImg: $("#scratchImg"),
  scratchGameBtn: $("#scratchGameBtn"),
  scratchGame: $("#scratchGame"),
  scratchCanvas: $("#scratchCanvas"),
  scratchContinueBtn: $("#scratchContinueBtn"),
  scratchBackBtn: $("#scratchBackBtn"),

  // memory match game
  memoryGameBtn: $("#memoryGameBtn"),
  memoryGame: $("#memoryGame"),
  memoryGrid: $("#memoryGrid"),
  memoryStatus: $("#memoryStatus"),
  memoryBackBtn: $("#memoryBackBtn"),
  memoryContinueBtn: $("#memoryContinueBtn"),

  // love quiz
  loveQuizBtn: $("#loveQuizBtn"),
  loveQuiz: $("#loveQuiz"),
  loveQuizScore: $("#loveQuizScore"),
  loveQuizProgress: $("#loveQuizProgress"),
  loveQuizQuestion: $("#loveQuizQuestion"),
  loveQuizOptions: $("#loveQuizOptions"),
  loveQuizNextBtn: $("#loveQuizNextBtn"),
  loveQuizContinueBtn: $("#loveQuizContinueBtn"),
  loveQuizBackToGamesBtn: $("#loveQuizBackToGamesBtn"),
  loveQuizScoreLine: $("#loveQuizScoreLine"),
  loveQuizScoreDetails: $("#loveQuizScoreDetails"),
  loveQuizScoreBackBtn: $("#loveQuizScoreBackBtn"),
  quizToast: $("#quizToast"),

  // jigsaw game
  jigsawGameBtn: $("#jigsawGameBtn"),
  jigsawGame: $("#jigsawGame"),
  jigsawBoard: $("#jigsawBoard"),
  jigsawTray: $("#jigsawTray"),
  jigsawCounter: $("#jigsawCounter"),
  jigsawBackBtn: $("#jigsawBackBtn"),
  jigsawContinueBtn: $("#jigsawContinueBtn"),

  // pop hearts game
  popHeartsBtn: $("#popHeartsBtn"),
  popHeartsGame: $("#popHeartsGame"),
  popArena: $("#popArena"),
  popHeartsStatus: $("#popHeartsStatus"),
  popBackBtn: $("#popBackBtn"),
  popContinueBtn: $("#popContinueBtn"),
  popModal: $("#popModal"),
  popModalImg: $("#popModalImg"),
  popModalMsg: $("#popModalMsg"),
  popModalCloseBtn: $("#popModalCloseBtn"),

  // love dash
  loveDashBtn: $("#loveDashBtn"),
  loveDashGame: $("#loveDashGame"),
  loveDashCanvas: $("#loveDashCanvas"),
  loveDashStatus: $("#loveDashStatus"),
  loveDashScore: $("#loveDashScore"),
  loveDashBest: $("#loveDashBest"),
  loveDashOverlay: $("#loveDashOverlay"),
  loveDashOverTitle: $("#loveDashOverTitle"),
  loveDashOverScore: $("#loveDashOverScore"),
  loveDashOverMsg: $("#loveDashOverMsg"),
  loveDashBackBtn: $("#loveDashBackBtn"),
  loveDashReplayBtn: $("#loveDashReplayBtn"),
  loveDashContinueBtn: $("#loveDashContinueBtn"),

  // heart blaster
  heartBlasterBtn: $("#heartBlasterBtn"),
  heartBlasterGame: $("#heartBlasterGame"),
  heartBlasterCanvas: $("#heartBlasterCanvas"),
  heartBlasterStatus: $("#heartBlasterStatus"),
  hbWave: $("#hbWave"),
  hbKills: $("#hbKills"),
  hbHp: $("#hbHp"),
  hbAmmo: $("#hbAmmo"),
  hbOpFace: $("#hbOpFace"),
  hbOverlay: $("#hbOverlay"),
  hbOverlayTitle: $("#hbOverlayTitle"),
  hbOverlayMsg: $("#hbOverlayMsg"),
  hbOverlayScore: $("#hbOverlayScore"),
  heartBlasterBackBtn: $("#heartBlasterBackBtn"),
  heartBlasterRestartBtn: $("#heartBlasterRestartBtn"),
  heartBlasterContinueBtn: $("#heartBlasterContinueBtn"),
  heartBlasterPopBtn: $("#heartBlasterPopBtn"),
  hbModal: $("#hbModal"),
  hbModalStage: $("#hbModalStage"),
  hbModalCloseBtn: $("#hbModalCloseBtn"),
  hbModalBackBtn: $("#hbModalBackBtn"),
  hbModalRestartBtn: $("#hbModalRestartBtn"),
  hbModalContinueBtn: $("#hbModalContinueBtn"),

  // confetti
  confettiCanvas: $("#confetti"),
};

const ctx = el.confettiCanvas.getContext("2d");

// Screens used for navigation (optional helper)
const SCREENS = [
  el.planner,
  el.gamesMenu,
  el.carousel,
  el.scratchGame,
  el.memoryGame,
  el.loveQuiz,
  el.loveQuizScore,
  el.jigsawGame,
  el.popHeartsGame,
  el.loveDashGame,
  el.heartBlasterGame,
  el.result,
];

// Optional helper (you can use later)
function showScreen(screen) {
  SCREENS.forEach((s) => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function showStart() {
  SCREENS.forEach((s) => s.classList.add("hidden"));
  el.btnRow.classList.remove("hidden");
  el.hint.classList.remove("hidden");
}

// Heart cursor trail
let lastHeartTrail = 0;
let cursorTrailEnabled = true;

function spawnHeartTrail(x, y) {
  const s = document.createElement("div");
  s.className = "heartTrail";
  s.style.left = `${x}px`;
  s.style.top = `${y}px`;

  // ❤️ random heart size
  const size = 8 + Math.random() * 12;
  s.style.setProperty("--s", `${size}px`);

  // 💕 random pink / red shades
  const colors = ["#ffffff", "#ffe4e6", "#fdf2f8"];
  s.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);

  // ✨ random float direction
  s.style.setProperty("--dx", `${(Math.random() - 0.5) * 40}px`);
  s.style.setProperty("--dy", `${-20 - Math.random() * 40}px`);

  document.body.appendChild(s);
  setTimeout(() => s.remove(), 700);
}

window.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return; // removed on mobile
  if (!cursorTrailEnabled) return;

  const now = performance.now();
  if (now - lastHeartTrail < 18) return;
  lastHeartTrail = now;

  spawnHeartTrail(e.clientX, e.clientY);
});

document.addEventListener("pointerlockchange", () => {
  const lockedToHB = document.pointerLockElement === el.heartBlasterCanvas;
  cursorTrailEnabled = !lockedToHB;

  // ✅ remove any leftover hearts immediately when gameplay starts
  if (lockedToHB) {
    document.querySelectorAll(".heartTrail").forEach((n) => n.remove());
  }
});

/***********************
 * 3) Initialize text
 ***********************/
el.toLine.textContent = `${CONFIG.toLine}${CONFIG.recipientName} 💌`;
el.mainMessage.textContent = CONFIG.mainMessage;
el.subMessage.textContent = CONFIG.subMessage;

el.yesBtn.textContent = CONFIG.yesButtonText;
el.noBtn.textContent = CONFIG.noButtonText;

el.resultTitle.textContent = CONFIG.yesResultTitle;
el.resultText.textContent = CONFIG.yesResultText;

/***********************
 * 4) Audio
 ***********************/
function playMusicSafely(which = "start") {
  const audio = which === "after" ? el.bgMusicAfter : el.bgMusic;
  if (!audio) return;

  // pause the other track so they never overlap
  const other = which === "after" ? el.bgMusic : el.bgMusicAfter;
  if (other && !other.paused) other.pause();

  audio.volume = 0.35;
  audio.play().catch(() => {});
}

/***********************
 * 5) YES/NO button behavior
 ***********************/
let noCount = 0;
let yesScale = 1;

function moveNoButtonAway() {
  const rowRect = el.btnRow.getBoundingClientRect();
  const btnRect = el.noBtn.getBoundingClientRect();

  const maxX = rowRect.width - btnRect.width;
  const maxY = rowRect.height - btnRect.height;

  const x = Math.random() * Math.max(0, maxX);
  const y = Math.random() * Math.max(0, maxY);

  el.noBtn.style.position = "absolute";
  el.noBtn.style.left = `${x}px`;
  el.noBtn.style.top = `${y}px`;
}

function growYesButton() {
  yesScale = Math.min(yesScale + 0.12, 2.2);
  el.yesBtn.style.transform = `scale(${yesScale})`;
}

const FULLSCREEN_AFTER_NO_CLICKS = 10; // change this number if you want

let yesOverlayEl = null;

function makeYesFullscreen() {
  if (!yesOverlayEl) {
    yesOverlayEl = document.createElement("div");
    yesOverlayEl.id = "yesOverlay";
    document.body.appendChild(yesOverlayEl);
  }
  yesOverlayEl.appendChild(el.yesBtn);

  // reset inline styles
  el.yesBtn.style.position = "static";
  el.yesBtn.style.left = "";
  el.yesBtn.style.top = "";
  el.yesBtn.style.right = "";
  el.yesBtn.style.bottom = "";
  el.yesBtn.style.transform = "none";
}

const noPhrases = [
  "BRUH? 🥺",
  "Like… Really? 😭",
  "Stop this! 😳",
  "I promise to not be annoying tho 💗",
  "Ok wow… rude! 😈",
  "So you hate me? 😭",
  "So you'd rather I dissapear? 😭",
  "I'm telling your family that you hate me. 😡",
  "You know... you can just click YES and this would be over.",
];

el.noBtn.addEventListener("click", () => {
  playMusicSafely("start");
  noCount++;

  if (noCount >= FULLSCREEN_AFTER_NO_CLICKS) {
    makeYesFullscreen();
    el.hint.textContent =
      noPhrases[Math.min(noCount - 1, noPhrases.length - 1)];
    spawnHearts(6 + noCount * 2);
    return; // prevents growYesButton() / moveNoButtonAway()
  }

  growYesButton();
  moveNoButtonAway();

  el.hint.textContent = noPhrases[Math.min(noCount - 1, noPhrases.length - 1)];
  spawnHearts(6 + noCount * 2);
});

// Bonus: make it harder by also moving when hovered (desktop)
el.noBtn.addEventListener("mouseenter", () => {
  if (noCount >= 3) moveNoButtonAway();
});

el.yesBtn.addEventListener("click", () => {
  playMusicSafely("after");

  // If YES is fullscreen, remove overlay so planner is clickable/visible
  if (yesOverlayEl) {
    el.btnRow.insertBefore(el.yesBtn, el.btnRow.firstChild);
    yesOverlayEl.remove();
    yesOverlayEl = null;
  }

  // Hide the buttons and open planner instead of final result
  el.btnRow.classList.add("hidden");
  el.hint.classList.add("hidden");
  el.planner.classList.remove("hidden");

  // Confetti + hearts party (next frame so it always paints)
  requestAnimationFrame(() => startConfetti());
  spawnHearts(18);

  // Planner always starts on activity picker
  selectedActivity = null;
  renderActivityPicker();
  updatePlannerActions();
});

/***********************
 * 6) Planner (no inline onclicks)
 ***********************/
const ACTIVITIES = [
  { id: "dinner", name: "Dinner Date", img: "activity/dinner.gif" },
  { id: "movie", name: "Movie Night", img: "activity/movie.gif" },
  { id: "skating", name: "Ice Skating", img: "activity/skating.gif" },
  { id: "chilling", name: "Just Chill", img: "activity/chilling.gif" },
];

const STORAGE_KEY = "valentine_plans";
let plans = safeLoadPlans();
let selectedActivity = null;

function safeLoadPlans() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePlans() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

function renderActivityPicker() {
  el.plannerView.innerHTML = `
    <p class="tiny">Choose an activity:</p>

    <div class="activity-grid">
      ${ACTIVITIES.map(
        (a) => `
        <button class="activity-btn" type="button" data-action="select-activity" data-activity-id="${a.id}">
          <img src="${a.img}" alt="${a.name}" />
          ${a.name}
        </button>
      `,
      ).join("")}
    </div>

    <div class="saved-list">
      <div class="saved-list__head">
        <strong>Saved plans:</strong>
        <button class="btn secondary" type="button" data-action="clear-plans">Clear ✖</button>
      </div>

      ${
        plans.length
          ? plans
              .map(
                (p) =>
                  `<div>• ${escapeHtml(p.date)} — ${escapeHtml(p.activity)}</div>`,
              )
              .join("")
          : "<div class='tiny'>None yet</div>"
      }
    </div>
  `;
}

function renderPlanForm(activity) {
  el.plannerView.innerHTML = `
    <div class="planner-form">
      <label>
        Date
        <input type="date" id="planDate" />
      </label>

      <label>
        Note
        <textarea id="planNote" rows="3" placeholder="Optional note..."></textarea>
      </label>

      <button class="btn yes" type="button" data-action="save-plan">Save 💘</button>
    </div>
  `;

  // focus date input for nice UX
  const input = $("#planDate");
  if (input) input.focus();
}

function updatePlannerActions() {
  // Hide Done planning if:
  // - you're inside an activity form
  // - OR you haven't saved anything yet
  if (selectedActivity || plans.length === 0) {
    el.donePlanningBtn.classList.add("hidden");
  } else {
    el.donePlanningBtn.classList.remove("hidden");
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Planner event delegation
el.plannerView.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;

  if (action === "select-activity") {
    const id = btn.dataset.activityId;
    selectedActivity = ACTIVITIES.find((a) => a.id === id) || null;
    updatePlannerActions();
    if (selectedActivity) renderPlanForm(selectedActivity);
    return;
  }

  if (action === "save-plan") {
    const date = $("#planDate")?.value;
    const note = ($("#planNote")?.value || "").trim();

    if (!date) {
      spawnHearts(6);
      return;
    }

    plans.push({
      date,
      activity: selectedActivity?.name || "Unknown",
      note,
    });

    savePlans();

    // Exit the form view back to picker
    selectedActivity = null;
    renderActivityPicker();
    updatePlannerActions();
    return;
  }

  if (action === "clear-plans") {
    const confirmDelete = confirm("Delete all saved plans? 💔");
    if (!confirmDelete) return;

    plans = [];
    localStorage.removeItem(STORAGE_KEY);

    selectedActivity = null;
    renderActivityPicker();
    updatePlannerActions();
  }
});

function exportTxt() {
  const text = plans
    .map((p) => `${p.date} | ${p.activity} | ${p.note || "(no note)"}`)
    .join("\n");

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "valentine-plans.txt";
  a.click();

  // cleanup
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

el.exportTxtBtn.addEventListener("click", exportTxt);

el.cancelPlanBtn.addEventListener("click", () => {
  // If you're inside an activity form, go back to the activity picker
  if (selectedActivity) {
    selectedActivity = null;
    renderActivityPicker();
    updatePlannerActions();
    return;
  }

  // Otherwise you're already on the picker -> go back to YES/NO start screen
  showStart();
});

el.donePlanningBtn.addEventListener("click", () => {
  // Only deal + reset game state ONCE per session (prevents refresh -> wipe)
  const alreadyDealt = loadBool(SESSION_KEYS.dealt);

  if (!alreadyDealt) {
    dealSessionPhotos();
    saveBool(SESSION_KEYS.dealt, true);
  }

  showScreen(el.gamesMenu);
  updateGamesContinue();
});

el.gamesBackBtn.addEventListener("click", () => {
  el.gamesMenu.classList.add("hidden");
  showScreen(el.planner);

  selectedActivity = null;
  renderActivityPicker();
  updatePlannerActions();
});

/***********************
 * 7) Games menu + flow
 ***********************/
// --- Session progress (persists until Replay is clicked) ---
const SESSION_KEYS = {
  photoDone: "vday_photo_done",
  scratchDone: "vday_scratch_done",
  memoryDone: "vday_memory_done",
  loveQuizDone: "vday_lovequiz_done",
  jigsawDone: "vday_jigsaw_done",

  // ✅ Photo game in-progress
  photoUnlocked: "vday_photo_unlocked",
  photoIndex: "vday_photo_index",
  photoLocked: "vday_photo_locked",

  // ✅ Dealt photo pools (so refresh doesn't wipe the choices)
  photoGamePhotos: "vday_photo_game_photos",
  scratchPhoto: "vday_scratch_photo",
  memoryUniquePhotos: "vday_memory_unique_photos",

  // ✅ Memory game in-progress
  memoryDeck: "vday_memory_deck",
  memoryMatchedIds: "vday_memory_matched_ids",

  // ✅ Love Quiz in-progress
  loveQuizIndex: "vday_lovequiz_index",
  loveQuizSelected: "vday_lovequiz_selected",
  loveQuizSolved: "vday_lovequiz_solved",
  loveQuizWrongTotal: "vday_lovequiz_wrong_total",

  // ✅ Jigsaw in-progress
  jigsawPhoto: "vday_jigsaw_photo",
  jigsawPlaced: "vday_jigsaw_placed", // array of booleans length 12
  jigsawRot: "vday_jigsaw_rot", // array of ints length 12 (0..3)
  jigsawOrder: "vday_jigsaw_order", // array of piece ids in tray order

  // ✅ Pop Heart in-progress
  popDeck: "vday_pop_deck",
  popDone: "vday_pop_done",
  popPopped: "vday_pop_popped", // array of popped heart ids
  popStickerState: "vday_pop_stickers", // { [id]: { x, y, rot } }

  // ✅ Love Dash in-progress
  loveDashDone: "vday_lovedash_done",
  loveDashBest: "vday_lovedash_best",

  // ✅ Heart Blaster in-progress / done
  heartBlasterDone: "vday_heartblaster_done",
  heartBlasterState: "vday_heartblaster_state",

  dealt: "vday_dealt_once",
};

function loadBool(key) {
  return sessionStorage.getItem(key) === "1";
}

function saveBool(key, val) {
  sessionStorage.setItem(key, val ? "1" : "0");
}

// ✅ JSON helpers
function loadJSON(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, val) {
  sessionStorage.setItem(key, JSON.stringify(val));
}

let photoGameCompleted = loadBool(SESSION_KEYS.photoDone);
let scratchGameCompleted = loadBool(SESSION_KEYS.scratchDone);
let memoryGameCompleted = loadBool(SESSION_KEYS.memoryDone);
let loveQuizCompleted = loadBool(SESSION_KEYS.loveQuizDone);
let jigsawGameCompleted = loadBool(SESSION_KEYS.jigsawDone);
let popHeartsCompleted = loadBool(SESSION_KEYS.popDone);
let loveDashCompleted = loadBool(SESSION_KEYS.loveDashDone);
let heartBlasterCompleted = loadBool(SESSION_KEYS.heartBlasterDone);

// ✅ Save the original button labels (so we can restore them)
const BASE_GAME_LABELS = {
  photo: el.photoGameBtn.textContent,
  scratch: el.scratchGameBtn.textContent,
  memory: el.memoryGameBtn.textContent,
  loveQuiz: el.loveQuizBtn.textContent,
  jigsaw: el.jigsawGameBtn.textContent,
  pop: el.popHeartsBtn.textContent,
  dash: el.loveDashBtn.textContent,
  blaster: el.heartBlasterBtn.textContent,
};

function setCompletedBadge(btn, isDone) {
  if (isDone) {
    btn.classList.add("is-completed");
    btn.setAttribute("aria-disabled", "true");
  } else {
    btn.classList.remove("is-completed");
    btn.removeAttribute("aria-disabled");
  }
}

function updateCompletedBadges() {
  photoGameCompleted = loadBool(SESSION_KEYS.photoDone);
  scratchGameCompleted = loadBool(SESSION_KEYS.scratchDone);
  memoryGameCompleted = loadBool(SESSION_KEYS.memoryDone);
  loveQuizCompleted = loadBool(SESSION_KEYS.loveQuizDone);
  jigsawGameCompleted = loadBool(SESSION_KEYS.jigsawDone);
  popHeartsCompleted = loadBool(SESSION_KEYS.popDone);
  loveDashCompleted = loadBool(SESSION_KEYS.loveDashDone);
  heartBlasterCompleted = loadBool(SESSION_KEYS.heartBlasterDone);

  setCompletedBadge(el.photoGameBtn, photoGameCompleted);
  setCompletedBadge(el.scratchGameBtn, scratchGameCompleted);
  setCompletedBadge(el.memoryGameBtn, memoryGameCompleted);
  setCompletedBadge(el.loveQuizBtn, loveQuizCompleted);
  setCompletedBadge(el.jigsawGameBtn, jigsawGameCompleted);
  setCompletedBadge(el.popHeartsBtn, popHeartsCompleted);
  setCompletedBadge(el.loveDashBtn, loveDashCompleted);
  setCompletedBadge(el.heartBlasterBtn, heartBlasterCompleted);
}

function updateGamesContinue() {
  // ✅ update button badges first (also refreshes booleans)
  updateCompletedBadges();

  if (
    photoGameCompleted &&
    scratchGameCompleted &&
    memoryGameCompleted &&
    loveQuizCompleted &&
    jigsawGameCompleted &&
    popHeartsCompleted &&
    loveDashCompleted &&
    heartBlasterCompleted
  ) {
    el.gamesContinueBtn.classList.remove("hidden");
    el.gamesContinueBtn.disabled = false;
    el.gamesContinueBtn.textContent = "Finish ▶";
  } else {
    el.gamesContinueBtn.classList.add("hidden");
    el.gamesContinueBtn.disabled = true;
  }
}

const LOVE_QUIZ_QUESTIONS = [
  {
    q: "Who was the first President of the United States? 🇺🇸",
    options: ["Abraham Lincoln", "Thomas Jefferson", "George Washington", "John Adams"],
    correctIndex: 2,
    wrongMsg: "Not quite! Think earlier in American history 🧐.",
  },
  {
    q: "What is the largest planet in our solar system? 🪐",
    options: ["Saturn", "Earth", "Jupiter", "Neptune"],
    correctIndex: 2,
    wrongMsg: "Almost! Think BIGGER 🌌.",
  },
  {
    q: "Who wrote 'Romeo and Juliet'? 📖",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctIndex: 1,
    wrongMsg: "Nope! Think famous English playwright 🎭.",
  },
  {
    q: "What year did World War II end? 🌍",
    options: ["1942", "1945", "1939", "1950"],
    correctIndex: 1,
    wrongMsg: "Close! It ended in the mid-1940s 🕰️.",
  },
  {
    q: "Which element has the chemical symbol 'O'? 🧪",
    options: ["Gold", "Osmium", "Oxygen", "Zinc"],
    correctIndex: 2,
    wrongMsg: "Not quite! It's something you breathe 🌬️.",
  },
  {
    q: "Who painted the Mona Lisa? 🎨",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
    correctIndex: 2,
    wrongMsg: "Nope! Think Renaissance genius 🖌️.",
  },
  {
    q: "Which country won the FIFA World Cup in 2018? ⚽",
    options: ["Germany", "Brazil", "Argentina", "France"],
    correctIndex: 3,
    wrongMsg: "Not quite! Think European champions 🇪🇺.",
  },
  {
    q: "What is the hardest natural substance on Earth? 💎",
    options: ["Gold", "Diamond", "Iron", "Quartz"],
    correctIndex: 1,
    wrongMsg: "Nope! It’s used in engagement rings 💍.",
  },
  {
    q: "Who is known as the 'King of Pop'? 🎤",
    options: ["Elvis Presley", "Michael Jackson", "Prince", "Justin Timberlake"],
    correctIndex: 1,
    wrongMsg: "Not quite! Think moonwalk 🕺.",
  },
  {
    q: "What is the capital city of Japan? 🗾",
    options: ["Seoul", "Beijing", "Tokyo", "Kyoto"],
    correctIndex: 2,
    wrongMsg: "Close! It’s Japan’s largest city 🌆.",
  },

];

function burstHeartsAt(x, y, count = 10) {
  for (let i = 0; i < count; i++) {
    const h = document.createElement("div");
    h.className = "burst-heart";
    h.style.left = `${x}px`;
    h.style.top = `${y}px`;
    h.style.color = randomHeartColor();

    const s = 10 + Math.random() * 14;
    h.style.setProperty("--s", `${s}px`);

    const dx = -80 + Math.random() * 160 + "px";
    const dy = -120 + Math.random() * 140 + "px";
    h.style.setProperty("--dx", dx);
    h.style.setProperty("--dy", dy);

    document.body.appendChild(h);
    setTimeout(() => h.remove(), 750);
  }
}

el.gamesContinueBtn.addEventListener("click", () => {
  showScreen(el.result);
});
//#endregion
//#region Other games
/***********************
 * 8.0) Photo mini game
 ***********************/
const PhotoGame = (() => {
  let didBind = false;

  //internal state (no globals)
  let photos = [];
  let unlockedCount = 0; // how many photos are unlocked (0..3)
  let currentPhotoIndex = 0; // which photo we are working on (0..2)

  let lastUnlockAt = 0;
  const UNLOCK_COOLDOWN_MS = 350; // ✅ B) anti-spam cooldown

  let targetX = 50; // percent
  let targetY = 50; // percent
  let prevTargetX = null;
  let prevTargetY = null;

  const HIT_RADIUS = 10; // percent
  const MIN_TARGET_DIST = 30; // 👈 how far apart targets must be (tweak 26–35)

  function setNewTarget() {
    const maxTries = 40;
    let x, y;

    for (let i = 0; i < maxTries; i++) {
      x = 15 + Math.random() * 70;
      y = 20 + Math.random() * 60;

      // first heart ever → accept immediately
      if (prevTargetX === null || prevTargetY === null) break;

      const dx = x - prevTargetX;
      const dy = y - prevTargetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // accept only if FAR ENOUGH
      if (dist >= MIN_TARGET_DIST) break;
    }

    targetX = x;
    targetY = y;

    // remember this target for next time
    prevTargetX = targetX;
    prevTargetY = targetY;
  }

  function updateProgressUI() {
    el.carouselBadge.textContent = `${unlockedCount} / ${photos.length}`;
    el.gameStatus.textContent = `${unlockedCount} / ${photos.length} photos unlocked`;
  }

  function persistPhotoState() {
    saveJSON(SESSION_KEYS.photoUnlocked, unlockedCount);
    saveJSON(SESSION_KEYS.photoIndex, currentPhotoIndex);

    // locked = overlay visible
    const locked = !el.gameOverlay.classList.contains("hidden");
    saveJSON(SESSION_KEYS.photoLocked, locked);
  }

  function updatePhotoNav() {
    const total = photos.length;
    const locked = !el.gameOverlay.classList.contains("hidden");

    // Continue only when finished
    if (photoGameCompleted || unlockedCount >= total) {
      el.continueBtn.classList.remove("hidden");
    } else {
      el.continueBtn.classList.add("hidden");
    }

    // Prev allowed when there's something unlocked (even if currently locked)
    if (unlockedCount > 0 && (locked || currentPhotoIndex > 0)) {
      el.prevPhotoBtn.classList.remove("hidden");
    } else {
      el.prevPhotoBtn.classList.add("hidden");
    }

    // Next hidden while locked
    if (locked) {
      el.nextPhotoBtn.classList.add("hidden");
      return;
    }

    // If completed: Next = browse forward only
    if (photoGameCompleted) {
      if (currentPhotoIndex < total - 1) {
        el.nextPhotoBtn.textContent = "Next photo ▷";
        el.nextPhotoBtn.classList.remove("hidden");
      } else {
        el.nextPhotoBtn.classList.add("hidden");
      }
      return;
    }

    // Not completed:
    // If browsing older unlocked photos → Next photo
    if (currentPhotoIndex < unlockedCount - 1) {
      el.nextPhotoBtn.textContent = "Next photo ▷";
      el.nextPhotoBtn.classList.remove("hidden");
      return;
    }

    // If at last unlocked photo → show Unlock next (if more remain)
    if (unlockedCount < total) {
      el.nextPhotoBtn.textContent = "Unlock next ▶";
      el.nextPhotoBtn.classList.remove("hidden");
    } else {
      el.nextPhotoBtn.classList.add("hidden");
    }
  }

  function lockPhoto() {
    el.carouselImg.classList.add("hidden");
    el.gameOverlay.classList.remove("hidden");

    // Next photo button is not available while locked
    el.nextPhotoBtn.classList.add("hidden");

    el.lockText.textContent = "🔒 Locked";
    el.hintText.textContent = "Click around to find the heart 💘";

    setNewTarget();
    updateProgressUI();
    persistPhotoState();
    updatePhotoNav();
  }

  function revealPhoto() {
    el.carouselImg.src = photos[currentPhotoIndex];
    el.carouselImg.classList.remove("hidden");
    el.gameOverlay.classList.add("hidden");

    spawnHearts(14);
    persistPhotoState();
    updatePhotoNav();
  }

  function distanceHint(dist) {
    if (dist < 10) return "SO CLOSE 😳";
    if (dist < 20) return "Warmer 👀";
    if (dist < 30) return "Getting there 🙂";
    return "Cold 🥶";
  }

  function showPing(xPx, yPx) {
    el.ping.classList.remove("hidden");
    el.ping.style.left = `${xPx}px`;
    el.ping.style.top = `${yPx}px`;

    el.ping.style.animation = "none";
    el.ping.offsetHeight; // reflow
    el.ping.style.animation = "";

    setTimeout(() => el.ping.classList.add("hidden"), 600);
  }

  function init() {
    // ✅ Recover dealt photos after refresh (or deal them if missing)
    if (!Array.isArray(PHOTO_GAME_PHOTOS) || PHOTO_GAME_PHOTOS.length === 0) {
      const saved = loadJSON(SESSION_KEYS.photoGamePhotos, []);
      if (Array.isArray(saved) && saved.length) {
        PHOTO_GAME_PHOTOS = saved;
      } else {
        // last-resort: deal now so we never end up with undefined src
        dealSessionPhotos();
        saveBool(SESSION_KEYS.dealt, true);
      }
    }

    photos = PHOTO_GAME_PHOTOS.slice(); // dealt per session

    // If completed, show completed state
    photoGameCompleted = loadBool(SESSION_KEYS.photoDone);

    if (photoGameCompleted) {
      unlockedCount = photos.length;
      currentPhotoIndex = loadJSON(SESSION_KEYS.photoIndex, photos.length - 1);

      el.gamePrompt.textContent = "All photos unlocked 💞";
      updateProgressUI();

      // show current photo
      el.carouselImg.src = photos[currentPhotoIndex];
      el.carouselImg.classList.remove("hidden");
      el.gameOverlay.classList.add("hidden");

      el.lockText.textContent = "✅ Complete";
      el.hintText.textContent = "Browse photos or press Back ⬅";

      el.continueBtn.classList.remove("hidden");
      updatePhotoNav();
      updateGamesContinue();

      return;
    }

    // ✅ Load in-progress state (if any)
    unlockedCount = loadJSON(SESSION_KEYS.photoUnlocked, 0);
    currentPhotoIndex = loadJSON(SESSION_KEYS.photoIndex, 0);
    const wasLocked = loadJSON(SESSION_KEYS.photoLocked, true);

    // Safety clamps
    unlockedCount = Math.max(0, Math.min(unlockedCount, photos.length));
    currentPhotoIndex = Math.max(
      0,
      Math.min(currentPhotoIndex, photos.length - 1),
    );

    el.gamePrompt.textContent =
      "Find the hidden heart to reveal the next photo 👀";
    updateProgressUI();

    if (wasLocked) {
      lockPhoto();
    } else {
      // reveal current photo
      el.carouselImg.src = photos[currentPhotoIndex];
      el.carouselImg.classList.remove("hidden");
      el.gameOverlay.classList.add("hidden");
    }

    updatePhotoNav();
  }

  function onGameAreaClick(e) {
    if (unlockedCount >= photos.length) return;

    //Only allow unlocking when the photo is LOCKED (overlay visible)
    const isLocked = !el.gameOverlay.classList.contains("hidden");
    if (!isLocked) return;

    const rect = el.gameArea.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    showPing(e.clientX - rect.left, e.clientY - rect.top);

    const dx = x - targetX;
    const dy = y - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= HIT_RADIUS) {
      //anti-spam / double-click guard
      const now = performance.now();
      if (now - lastUnlockAt < UNLOCK_COOLDOWN_MS) return;
      lastUnlockAt = now;

      //Heart burst animation (same as Love Quiz)
      burstHeartsAt(e.clientX, e.clientY, 12);

      el.lockText.textContent = "💖 Found it!";
      el.hintText.textContent = "Unlocked 😤";

      //Count the unlock NOW (heart found = unlocked)
      unlockedCount = Math.min(unlockedCount + 1, photos.length);
      updateProgressUI();
      persistPhotoState();

      //Reveal the photo for the current index
      revealPhoto();

      //If that was the last photo, finish the game (no Finish button here)
      if (unlockedCount >= photos.length) {
        el.gamePrompt.textContent = "All photos unlocked 🥹💞";
        el.lockText.textContent = "✅ Complete";
        el.hintText.textContent = "Press Back ◁";

        photoGameCompleted = true;
        saveBool(SESSION_KEYS.photoDone, true);
        startConfetti();
        updateGamesContinue();
        return;
      }
    } else {
      el.hintText.textContent = distanceHint(dist);
    }
  }

  function onNextClick() {
    const total = photos.length;

    // If browsing unlocked photos, move forward in unlocked range
    if (currentPhotoIndex < unlockedCount - 1) {
      currentPhotoIndex++;
      persistPhotoState();
      revealPhoto();
      return;
    }

    // At last unlocked photo -> start unlocking next (if any left)
    if (unlockedCount < total) {
      currentPhotoIndex = unlockedCount;
      lockPhoto(); // this also persists
    }
  }

  function onPrevClick() {
    const locked = !el.gameOverlay.classList.contains("hidden");

    // If currently locked, jump back to the last unlocked photo
    if (locked) {
      if (unlockedCount <= 0) return;
      currentPhotoIndex = Math.min(unlockedCount - 1, photos.length - 1);

      // reveal previous
      el.gameOverlay.classList.add("hidden");
      persistPhotoState();
      revealPhoto();
      return;
    }

    // Normal browse back
    if (currentPhotoIndex > 0) {
      currentPhotoIndex--;
      persistPhotoState();
      revealPhoto();
    }
  }

  function bindUIOnce() {
    el.gameArea.addEventListener("click", onGameAreaClick);
    el.nextPhotoBtn.addEventListener("click", onNextClick);
    el.prevPhotoBtn.addEventListener("click", onPrevClick);

    //these buttons are only used in photo game
    el.backBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);

      //Never return to the Yes/No screen from games
      el.btnRow.classList.add("hidden");
      el.hint.classList.add("hidden");

      updateGamesContinue();
    });

    el.continueBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });
  }

  function open() {
    showScreen(el.carousel);

    if (!didBind) {
      bindUIOnce();
      didBind = true;
    }

    updateGamesContinue(); //don't reset progress
    init();
  }

  return { open };
})();

//opens photo game from games menu
el.photoGameBtn.addEventListener("click", () => {
  PhotoGame.open();
});

/***********************
 * 8.1) Scratch to Reveal Game
 ***********************/
const ScratchGame = (() => {
  let didBind = false;
  let scratching = false;

  function stampHeart(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 30, size / 30);

    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(0, -10, -20, -10, -20, 5);
    ctx.bezierCurveTo(-20, 20, 0, 28, 0, 38);
    ctx.bezierCurveTo(0, 28, 20, 20, 20, 5);
    ctx.bezierCurveTo(20, -10, 0, -10, 0, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function checkScratchProgress(ctx) {
    const img = ctx.getImageData(
      0,
      0,
      el.scratchCanvas.width,
      el.scratchCanvas.height,
    );
    let cleared = 0;

    for (let i = 3; i < img.data.length; i += 4) {
      if (img.data[i] === 0) cleared++;
    }

    const percent =
      cleared / (el.scratchCanvas.width * el.scratchCanvas.height);

    if (percent > 0.55 && !scratchGameCompleted) {
      scratchGameCompleted = true;
      saveBool(SESSION_KEYS.scratchDone, true);

      el.scratchContinueBtn.classList.remove("hidden");
      spawnHearts(16);
      startConfetti();
      updateGamesContinue();
    }
  }

  function init() {
    const canvas = el.scratchCanvas;
    const ctx = canvas.getContext("2d");

    scratching = false;

    // ✅ important: size + paint AFTER the image loads
    el.scratchImg.onload = () => {
      const rect = el.scratchImg.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);

      // paint grey overlay (normal mode)
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#bdbdbd";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // switch to erase mode
      ctx.globalCompositeOperation = "destination-out";
    };

    // set src last so onload fires
    el.scratchImg.src = SCRATCH_PHOTO;
  }

  function bindUIOnce() {
    const canvas = el.scratchCanvas;

    // pointer controls (works for mouse + touch + pen)
    canvas.style.touchAction = "none"; // stops page scroll/zoom while scratching

    const scratchAtClient = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const ctx = canvas.getContext("2d");
      stampHeart(ctx, x, y, 32);
      checkScratchProgress(ctx);
    };

    if ("PointerEvent" in window) {
      canvas.addEventListener("pointerdown", (e) => {
        scratching = true;
        canvas.setPointerCapture?.(e.pointerId);
        e.preventDefault();
        scratchAtClient(e.clientX, e.clientY); // scratch immediately on touch-down
      });

      canvas.addEventListener("pointermove", (e) => {
        if (!scratching) return;
        e.preventDefault();
        scratchAtClient(e.clientX, e.clientY);
      });

      const end = (e) => {
        scratching = false;
        e?.preventDefault?.();
      };

      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);
      canvas.addEventListener("pointerleave", end);
    } else {
      // fallback for very old mobile browsers
      canvas.addEventListener(
        "touchstart",
        (e) => {
          scratching = true;
          e.preventDefault();
          const t = e.touches[0];
          if (t) scratchAtClient(t.clientX, t.clientY);
        },
        { passive: false },
      );

      canvas.addEventListener(
        "touchmove",
        (e) => {
          if (!scratching) return;
          e.preventDefault();
          const t = e.touches[0];
          if (t) scratchAtClient(t.clientX, t.clientY);
        },
        { passive: false },
      );

      canvas.addEventListener("touchend", () => (scratching = false));
      canvas.addEventListener("touchcancel", () => (scratching = false));
    }

    // navigation
    el.scratchBackBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    el.scratchContinueBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });
  }

  function open() {
    showScreen(el.scratchGame);

    scratchGameCompleted = loadBool(SESSION_KEYS.scratchDone);

    if (!didBind) {
      bindUIOnce();
      didBind = true;
    }

    if (scratchGameCompleted) {
      el.scratchContinueBtn.classList.remove("hidden");
    } else {
      el.scratchContinueBtn.classList.add("hidden");
      init();
    }

    updateGamesContinue();
  }

  return { open };
})();

//opens scratch game from games menu
el.scratchGameBtn.addEventListener("click", () => {
  ScratchGame.open();
});

/***********************
 * 8.2) Memory Match Game (4x3 = 12 cards)
 ***********************/
const MemoryGame = (() => {
  let didBind = false;

  //internal state (no globals)
  let memoryDeck = [];
  let firstPick = null;
  let lockBoard = false;
  let matchesFound = 0;

  function buildMemoryDeck() {
    const chosen = MEMORY_UNIQUE_PHOTOS.slice(0, 6);

    // Duplicate to create pairs => 12 cards
    const doubled = chosen.concat(chosen);

    // Unique id per card
    return shuffle(doubled.map((src, i) => ({ id: i, src })));
  }

  function renderMemoryGrid() {
    el.memoryGrid.innerHTML = memoryDeck
      .map(
        (card) => `
      <button class="memory-card" type="button" data-id="${card.id}" aria-label="Memory card">
        <div class="front">💖</div>
        <img src="${card.src}" alt="Memory photo" />
      </button>
    `,
      )
      .join("");
  }

  function setMemoryStatus(text) {
    if (el.memoryStatus) el.memoryStatus.textContent = text;
  }

  function flipCard(btn) {
    btn.classList.add("flipped");
    btn.disabled = true;
  }

  function unflipCard(btn) {
    btn.classList.remove("flipped");
    btn.disabled = false;
  }

  function markMatched(btnA, btnB) {
    btnA.classList.add("matched");
    btnB.classList.add("matched");
    // keep disabled
  }

  function finish() {
    memoryGameCompleted = true;
    saveBool(SESSION_KEYS.memoryDone, true);

    setMemoryStatus("All matched 💞");
    el.memoryContinueBtn.classList.remove("hidden");
    spawnHearts(18);
    startConfetti();
    updateGamesContinue();
  }

  function reset() {
    memoryGameCompleted = loadBool(SESSION_KEYS.memoryDone);

    firstPick = null;
    lockBoard = false;

    // ✅ Load or create a persistent deck for the session
    const savedDeck = loadJSON(SESSION_KEYS.memoryDeck, null);
    if (savedDeck && Array.isArray(savedDeck) && savedDeck.length === 12) {
      memoryDeck = savedDeck;
    } else {
      memoryDeck = buildMemoryDeck();
      saveJSON(SESSION_KEYS.memoryDeck, memoryDeck);
    }

    // ✅ Load matched ids
    const matchedIds = loadJSON(SESSION_KEYS.memoryMatchedIds, []);
    const matchedSet = new Set(matchedIds);

    // matchesFound derived from pairs (each pair = 2 ids)
    matchesFound = Math.floor(matchedSet.size / 2);

    renderMemoryGrid();

    // ✅ Re-apply matched visuals
    [...el.memoryGrid.querySelectorAll(".memory-card")].forEach((btn) => {
      const id = Number(btn.dataset.id);
      if (matchedSet.has(id)) {
        btn.classList.add("matched", "flipped");
        btn.disabled = true;
      }
    });

    el.memoryContinueBtn.classList.add("hidden");

    if (memoryGameCompleted) {
      setMemoryStatus(
        "Already completed ✅ You can play again or press Continue!",
      );
      el.memoryContinueBtn.classList.remove("hidden");
    } else {
      setMemoryStatus(`Matched ${matchesFound} / 6 pairs 💘`);
    }
  }

  function onGridClick(e) {
    const btn = e.target.closest(".memory-card");
    if (!btn || lockBoard) return;

    // If they click a matched card (disabled), ignore
    const id = Number(btn.dataset.id);
    const card = memoryDeck.find((c) => c.id === id);
    if (!card) return;

    flipCard(btn);

    if (!firstPick) {
      firstPick = { btn, card };
      return;
    }

    // second pick
    const secondPick = { btn, card };

    // same card protection (rare but safe)
    if (secondPick.card.id === firstPick.card.id) return;

    // match?
    if (secondPick.card.src === firstPick.card.src) {
      markMatched(firstPick.btn, secondPick.btn);

      // ✅ persist matched ids
      const matchedIds = loadJSON(SESSION_KEYS.memoryMatchedIds, []);
      matchedIds.push(firstPick.card.id, secondPick.card.id);
      saveJSON(SESSION_KEYS.memoryMatchedIds, matchedIds);

      matchesFound++;

      firstPick = null;
      spawnHearts(8);

      if (matchesFound >= 6) {
        finish();
      } else {
        setMemoryStatus(`Matched ${matchesFound} / 6 pairs 💘`);
      }
      return;
    }

    // not a match -> flip back after a moment
    lockBoard = true;
    setTimeout(() => {
      unflipCard(firstPick.btn);
      unflipCard(secondPick.btn);
      firstPick = null;
      lockBoard = false;
    }, 650);
  }

  function bindUIOnce() {
    el.memoryGrid.addEventListener("click", onGridClick);

    el.memoryBackBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);

      updateGamesContinue();
    });

    el.memoryContinueBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });
  }

  function open() {
    showScreen(el.memoryGame);

    if (!didBind) {
      bindUIOnce();
      didBind = true;
    }

    reset();
    updateGamesContinue();
  }

  return { open };
})();

//opens memory game from games menu
el.memoryGameBtn.addEventListener("click", () => {
  MemoryGame.open();
});

/***********************
 * 8.3) Love Quiz (10 Qs, 4 options)
 ***********************/
const LoveQuiz = (() => {
  let didBind = false;
  let quizToastTimer = null;
  let loveQuizIndex = 0;

  function getQuizSelected() {
    return loadJSON(
      SESSION_KEYS.loveQuizSelected,
      Array(LOVE_QUIZ_QUESTIONS.length).fill(null),
    );
  }

  function getQuizSolved() {
    return loadJSON(
      SESSION_KEYS.loveQuizSolved,
      Array(LOVE_QUIZ_QUESTIONS.length).fill(false),
    );
  }

  function getWrongTotal() {
    return loadJSON(SESSION_KEYS.loveQuizWrongTotal, 0);
  }

  function setQuizSelected(arr) {
    saveJSON(SESSION_KEYS.loveQuizSelected, arr);
  }

  function setQuizSolved(arr) {
    saveJSON(SESSION_KEYS.loveQuizSolved, arr);
  }

  function setWrongTotal(n) {
    saveJSON(SESSION_KEYS.loveQuizWrongTotal, n);
  }

  function clampQuizIndex() {
    loveQuizIndex = Math.max(
      0,
      Math.min(loveQuizIndex, LOVE_QUIZ_QUESTIONS.length - 1),
    );
    saveJSON(SESSION_KEYS.loveQuizIndex, loveQuizIndex);
  }

  function showQuizToast(msg) {
    if (!el.quizToast) return;

    // Update text immediately
    el.quizToast.textContent = msg;

    // Make sure it's visible
    el.quizToast.classList.remove("hidden");

    // Restart animation every time
    el.quizToast.classList.remove("show");
    void el.quizToast.offsetHeight; // reflow
    el.quizToast.classList.add("show");

    // ✅ Reset the hide timer if they spam wrong answers
    if (quizToastTimer) clearTimeout(quizToastTimer);

    // Match this to your CSS animation duration (e.g., 2800ms)
    quizToastTimer = setTimeout(() => {
      el.quizToast.classList.remove("show");
      el.quizToast.classList.add("hidden");
      quizToastTimer = null;
    }, 2800);
  }

  function render() {
    clampQuizIndex();

    const selected = getQuizSelected();
    const solved = getQuizSolved();

    const item = LOVE_QUIZ_QUESTIONS[loveQuizIndex];

    el.loveQuizProgress.textContent = `Question ${loveQuizIndex + 1} / ${LOVE_QUIZ_QUESTIONS.length} (General Knowledge Quiz for public use)`;
    el.loveQuizQuestion.textContent = item.q;

    const LETTERS = ["A", "B", "C", "D"];

    el.loveQuizOptions.innerHTML = item.options
      .map((opt, idx) => {
        return `
          <button class="quiz-option" type="button" data-idx="${idx}">
            <strong>${LETTERS[idx]}.</strong> ${escapeHtml(opt)}
          </button>
          `;
      })
      .join("");

    // Apply persisted styling:
    const buttons = [...el.loveQuizOptions.querySelectorAll(".quiz-option")];
    const chosen = selected[loveQuizIndex];

    // If already solved, lock all + pop correct
    if (solved[loveQuizIndex]) {
      buttons.forEach((b) => {
        const idx = Number(b.dataset.idx);
        b.disabled = true;
        if (idx === item.correctIndex) b.classList.add("is-correct");
        else b.classList.add("is-disabled");
      });
      return;
    }

    // If they previously clicked a wrong option, keep that one grey+disabled
    if (chosen !== null && chosen !== item.correctIndex) {
      buttons.forEach((b) => {
        const idx = Number(b.dataset.idx);
        if (idx === chosen) {
          b.disabled = true;
          b.classList.add("is-wrong");
        }
      });
    }
  }

  function showScoreScreen() {
    const wrongTotal = getWrongTotal();

    el.loveQuizScoreLine.textContent =
      wrongTotal === 0
        ? "Total wrong attempts: 0 💞 What a Legend! 😭"
        : `Total wrong attempts: ${wrongTotal} 👎 Boo! 🍅🍅🍅`;

    // clear the second line (optional)
    el.loveQuizScoreDetails.textContent = "";

    // show final score screen
    showScreen(el.loveQuizScore);

    // show screen controls
    el.loveQuizNextBtn.classList.add("hidden");
    el.loveQuizContinueBtn.classList.remove("hidden");
  }

  function finish() {
    saveBool(SESSION_KEYS.loveQuizDone, true);
    loveQuizCompleted = true;

    spawnHearts(18);
    startConfetti();
    updateGamesContinue();

    showScoreScreen();
  }

  function onAnswerClick(e) {
    const btn = e.target.closest(".quiz-option");
    if (!btn) return;

    const idx = Number(btn.dataset.idx);
    const item = LOVE_QUIZ_QUESTIONS[loveQuizIndex];
    if (!item) return;

    const selected = getQuizSelected();
    const solved = getQuizSolved();

    if (solved[loveQuizIndex]) return;

    // If they click the same wrong button again, ignore
    if (selected[loveQuizIndex] === idx && idx !== item.correctIndex) return;

    if (idx !== item.correctIndex) {
      selected[loveQuizIndex] = idx;
      setQuizSelected(selected);

      setWrongTotal(getWrongTotal() + 1);

      showQuizToast(item.wrongMsg || "Wrong 😈 Try again!");
      spawnHearts(2);

      // re-render to apply persistent greyed state
      render();
      return;
    }

    // correct ✅
    selected[loveQuizIndex] = idx;
    setQuizSelected(selected);

    solved[loveQuizIndex] = true;
    setQuizSolved(solved);

    // lock all + highlight correct
    const buttons = [...el.loveQuizOptions.querySelectorAll(".quiz-option")];
    buttons.forEach((b) => {
      const bIdx = Number(b.dataset.idx);
      b.disabled = true;
      if (bIdx === item.correctIndex) b.classList.add("is-correct");
      else b.classList.add("is-disabled");
    });

    spawnHearts(10);

    // show Next button
    el.loveQuizNextBtn.classList.remove("hidden");

    // burst hearts from clicked answer (uses GLOBAL burstHeartsAt)
    const rect = btn.getBoundingClientRect();
    burstHeartsAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
  }

  function onNext() {
    el.loveQuizNextBtn.classList.add("hidden");

    if (loveQuizIndex >= LOVE_QUIZ_QUESTIONS.length - 1) {
      finish();
      return;
    }

    loveQuizIndex++;
    saveJSON(SESSION_KEYS.loveQuizIndex, loveQuizIndex);
    render();
  }

  function bindUIOnce() {
    // quiz interactions
    el.loveQuizOptions.addEventListener("click", onAnswerClick);
    el.loveQuizNextBtn.addEventListener("click", onNext);

    // navigation
    el.loveQuizBackToGamesBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    el.loveQuizContinueBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    el.loveQuizScoreBackBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });
  }

  function open() {
    loveQuizCompleted = loadBool(SESSION_KEYS.loveQuizDone);

    // always hide these on entry
    el.loveQuizContinueBtn.classList.add("hidden");
    el.loveQuizNextBtn.classList.add("hidden");

    if (!didBind) {
      bindUIOnce();
      didBind = true;
    }

    if (loveQuizCompleted) {
      showScoreScreen();
      return;
    }

    showScreen(el.loveQuiz);

    loveQuizIndex = loadJSON(SESSION_KEYS.loveQuizIndex, 0);
    render();
    updateGamesContinue();
  }

  return { open };
})();

//opens love quiz game from games menu
el.loveQuizBtn.addEventListener("click", () => {
  LoveQuiz.open();
});

/***********************
 * 8.4) Piece by Piece (Jigsaw 4x3)
 ***********************/
const JigsawGame = (() => {
  let didBind = false;

  const COLS = 4;
  const ROWS = 3;
  const TOTAL = COLS * ROWS;

  function defaultPlaced() {
    return Array(TOTAL).fill(false);
  }
  function defaultRot() {
    return Array(TOTAL).fill(0); // 0..3 (x 90deg)
  }

  function setCounter(placedArr) {
    const placedCount = placedArr.filter(Boolean).length;
    if (el.jigsawCounter)
      el.jigsawCounter.textContent = `Placed ${placedCount} / ${TOTAL}`;
  }

  function getPieceBgStyle(src, id) {
    const col = id % COLS;
    const row = Math.floor(id / COLS);

    // each piece shows 1/4 by 1/3 of the image
    const sizeX = COLS * 100; // 400%
    const sizeY = ROWS * 100; // 300%
    const posX = (col / (COLS - 1)) * 100;
    const posY = (row / (ROWS - 1)) * 100;

    return `
      background-image: url("${src}");
      background-size: ${sizeX}% ${sizeY}%;
      background-position: ${posX}% ${posY}%;
    `;
  }

  // --- Mobile helpers (tap to rotate, drag to place) ---
  function rotatePiece(id, pieceEl) {
    const rotsNow = loadJSON(SESSION_KEYS.jigsawRot, defaultRot());
    rotsNow[id] = (rotsNow[id] + 1) % 4;
    saveJSON(SESSION_KEYS.jigsawRot, rotsNow);
    pieceEl.style.setProperty("--rot", `${rotsNow[id] * 90}deg`);
  }

  function tryPlacePiece(pieceId, slotEl) {
    if (!slotEl) return false;

    const placed = loadJSON(SESSION_KEYS.jigsawPlaced, defaultPlaced());
    const rots = loadJSON(SESSION_KEYS.jigsawRot, defaultRot());

    // already placed?
    if (placed[pieceId]) return false;

    const slotId = Number(slotEl.dataset.slotId);

    // snap rule: correct slot + correct rotation (0)
    const rotOk = rots[pieceId] % 4 === 0;
    const slotOk = slotId === pieceId;

    if (!slotOk || !rotOk) {
      spawnHearts(2);
      return false;
    }

    // ✅ place it
    placed[pieceId] = true;
    saveJSON(SESSION_KEYS.jigsawPlaced, placed);

    const src = loadJSON(SESSION_KEYS.jigsawPhoto, JIGSAW_PHOTO) || JIGSAW_PHOTO;

    // remove from tray + render into slot
    const pieceEl = el.jigsawTray.querySelector(
      `.jigsaw-piece[data-piece-id="${pieceId}"]`,
    );
    if (pieceEl) pieceEl.remove();

    const placedEl = document.createElement("div");
    placedEl.className = "jigsaw-piece is-placed";
    placedEl.setAttribute("style", getPieceBgStyle(src, pieceId));
    placedEl.style.setProperty("--rot", "0deg");

    slotEl.innerHTML = "";
    slotEl.appendChild(placedEl);

    spawnHearts(6);
    setCounter(placed);

    // win?
    const done = placed.every(Boolean);
    if (done) {
      jigsawGameCompleted = true;
      saveBool(SESSION_KEYS.jigsawDone, true);

      el.jigsawContinueBtn.classList.remove("hidden");
      startConfetti();
      updateGamesContinue();
    }

    return true;
  }

  function enableMobileDrag(pieceEl, pieceId) {
    // Stop page scroll while interacting with puzzle pieces
    pieceEl.style.touchAction = "none";

    let startX = 0,
      startY = 0,
      moved = false,
      dragging = false;

    let isDown = false;
    let ghost = null;

    const makeGhost = () => {
      ghost = pieceEl.cloneNode(true);
      ghost.classList.add("is-drag-ghost");
      ghost.style.position = "fixed";
      ghost.style.left = "0px";
      ghost.style.top = "0px";
      ghost.style.margin = "0";
      ghost.style.zIndex = "9999";
      ghost.style.pointerEvents = "none";
      ghost.style.transform = "translate(-50%, -50%)";
      document.body.appendChild(ghost);
    };

    const moveGhost = (cx, cy) => {
      if (!ghost) return;
      ghost.style.left = `${cx}px`;
      ghost.style.top = `${cy}px`;
    };

    const cleanup = () => {
      dragging = false;
      if (ghost) ghost.remove();
      ghost = null;
      pieceEl.classList.remove("is-dragging");
    };

    pieceEl.addEventListener("pointerdown", (e) => {
      // Only use this system for TOUCH/PEN so desktop mouse hover doesn't trigger.
      if (e.pointerType === "mouse") return;

      // only primary touch/left button
      if (e.button != null && e.button !== 0) return;

      isDown = true;

      startX = e.clientX;
      startY = e.clientY;
      moved = false;
      dragging = false;

      pieceEl.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });

    pieceEl.addEventListener("pointermove", (e) => {
      if (!isDown) return;              // ✅ don’t react unless pressed
      if (e.pointerType === "mouse") return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dist2 = dx * dx + dy * dy;

      // start dragging after small threshold so taps still rotate
      if (!dragging && dist2 > 36) {
        dragging = true;
        moved = true;
        makeGhost();
        pieceEl.classList.add("is-dragging");
      }

      if (dragging) {
        e.preventDefault();
        moveGhost(e.clientX, e.clientY);
      }
    });

    pieceEl.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse") return;

      isDown = false;
      e.preventDefault();

      if (!moved) {
        // tap = rotate
        rotatePiece(pieceId, pieceEl);
        cleanup();
        return;
      }

      const under = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest?.(".jigsaw-slot");

      if (under) tryPlacePiece(pieceId, under);
      cleanup();
    });

    pieceEl.addEventListener("pointercancel", () => {
      isDown = false;
      cleanup();
    });
  }
  

  function buildBoard() {
    el.jigsawBoard.innerHTML = "";

    for (let i = 0; i < TOTAL; i++) {
      const slot = document.createElement("div");
      slot.className = "jigsaw-slot";
      slot.dataset.slotId = String(i);

      slot.addEventListener("dragover", (e) => {
        e.preventDefault();
        slot.classList.add("is-over");
      });

      slot.addEventListener("dragleave", () => {
        slot.classList.remove("is-over");
      });

      slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("is-over");

      const pieceId = Number(e.dataTransfer.getData("text/pieceId"));
      if (!Number.isFinite(pieceId)) return;

      tryPlacePiece(pieceId, slot);
    });
      el.jigsawBoard.appendChild(slot);
    }
  }

  function renderTray() {
    el.jigsawTray.innerHTML = "";

    const src =
      loadJSON(SESSION_KEYS.jigsawPhoto, JIGSAW_PHOTO) || JIGSAW_PHOTO;

    const placed = loadJSON(SESSION_KEYS.jigsawPlaced, defaultPlaced());
    const rots = loadJSON(SESSION_KEYS.jigsawRot, defaultRot());

    // tray order persisted
    let order = loadJSON(SESSION_KEYS.jigsawOrder, null);
    if (!order || !Array.isArray(order) || order.length !== TOTAL) {
      order = shuffle([...Array(TOTAL)].map((_, i) => i));
      saveJSON(SESSION_KEYS.jigsawOrder, order);
    }

    order.forEach((id) => {
      if (placed[id]) return; // already on board

      const piece = document.createElement("div");
      piece.className = "jigsaw-piece";
      piece.draggable = true;
      piece.dataset.pieceId = String(id);

      piece.setAttribute("style", getPieceBgStyle(src, id));
      piece.style.setProperty("--rot", `${rots[id] * 90}deg`);

      enableMobileDrag(piece, id);

      piece.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/pieceId", String(id));
        e.dataTransfer.effectAllowed = "move";
      });

      // rotate 90° on click
      piece.addEventListener("click", () => rotatePiece(id, piece));

      // right click also rotates (and prevents menu)
      piece.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        piece.click();
      });

      el.jigsawTray.appendChild(piece);
    });
  }

  function hydratePlacedOnBoard() {
    const src =
      loadJSON(SESSION_KEYS.jigsawPhoto, JIGSAW_PHOTO) || JIGSAW_PHOTO;
    const placed = loadJSON(SESSION_KEYS.jigsawPlaced, defaultPlaced());

    [...el.jigsawBoard.querySelectorAll(".jigsaw-slot")].forEach((slot) => {
      const slotId = Number(slot.dataset.slotId);
      slot.innerHTML = "";

      if (!placed[slotId]) return;

      const placedEl = document.createElement("div");
      placedEl.className = "jigsaw-piece is-placed";
      placedEl.setAttribute("style", getPieceBgStyle(src, slotId));
      placedEl.style.setProperty("--rot", "0deg");
      slot.appendChild(placedEl);
    });

    setCounter(placed);
  }

  function init() {
    // persist the session photo (so leaving/returning keeps same puzzle)
    if (!loadJSON(SESSION_KEYS.jigsawPhoto, "")) {
      saveJSON(SESSION_KEYS.jigsawPhoto, JIGSAW_PHOTO);
    }

    // init in-progress state
    if (!loadJSON(SESSION_KEYS.jigsawPlaced, null)) {
      saveJSON(SESSION_KEYS.jigsawPlaced, defaultPlaced());
    }
    if (!loadJSON(SESSION_KEYS.jigsawRot, null)) {
      // random rotations so they must rotate to correct
      const r = [...Array(TOTAL)].map(() => Math.floor(Math.random() * 4));
      saveJSON(SESSION_KEYS.jigsawRot, r);
    }

    buildBoard();
    hydratePlacedOnBoard();
    renderTray();

    jigsawGameCompleted = loadBool(SESSION_KEYS.jigsawDone);

    if (jigsawGameCompleted) {
      const placedAll = Array(TOTAL).fill(true);
      saveJSON(SESSION_KEYS.jigsawPlaced, placedAll);
      hydratePlacedOnBoard();
      el.jigsawTray.innerHTML = "";
      setCounter(placedAll);
      el.jigsawContinueBtn.classList.remove("hidden");
    } else {
      el.jigsawContinueBtn.classList.add("hidden");
    }
  }

  function bindUIOnce() {
    el.jigsawBackBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    el.jigsawContinueBtn.addEventListener("click", () => {
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });
  }

  function open() {
    showScreen(el.jigsawGame);

    if (!didBind) {
      bindUIOnce();
      didBind = true;
    }

    init();
    updateGamesContinue();
  }
  return { open };
})();

//opens jigsaw game from games menu
el.jigsawGameBtn.addEventListener("click", () => {
  JigsawGame.open();
});

/***********************
 * 8.5) Pop the Hearts
 ***********************/
const PopHearts = (() => {
  const POP_HEART_COUNT = 8;

  const POP_MESSAGES = [
    "10/10 human 💘",
    "U are so cool 🤧",
    "I love you so much 💗",
    "I enjoy being with u 🧠",
    "U make me laugh 😭💞",
    "Thank you for putting up with me 🫶",
    "U da best 🧍🏾‍♂️💘",
    "Thank you for everything that you do 🥺",
  ];

  let hearts = []; // { id, x, y, vx, vy, el }
  let raf = null;
  let paused = false;
  let didBind = false;

  function loadDeck() {
    const deck = loadJSON(SESSION_KEYS.popDeck, []);
    if (Array.isArray(deck) && deck.length) return deck;

    // fallback (should rarely happen)
    const fallback = [];
    for (let i = 0; i < POP_HEART_COUNT; i++) {
      fallback.push(ALL_PHOTOS[i % ALL_PHOTOS.length]);
    }
    saveJSON(SESSION_KEYS.popDeck, fallback);
    return fallback;
  }

  function loadPoppedSet() {
    const arr = loadJSON(SESSION_KEYS.popPopped, []);
    return new Set(Array.isArray(arr) ? arr : []);
  }

  function savePoppedSet(set) {
    // ✅ FIX: was `[.set]` in your code; it must be an array of ids
    saveJSON(SESSION_KEYS.popPopped, [...set]);
  }

  function loadStickerState() {
    const st = loadJSON(SESSION_KEYS.popStickerState, {});
    return st && typeof st === "object" ? st : {};
  }

  function saveStickerState(state) {
    saveJSON(SESSION_KEYS.popStickerState, state);
  }

  function setStatus(poppedCount) {
    if (!el.popHeartsStatus) return;
    el.popHeartsStatus.textContent = `Popped ${poppedCount} / ${POP_HEART_COUNT}`;
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function startLoop() {
    stopLoop();
    const arena = el.popArena;
    if (!arena) return;

    const step = () => {
      if (paused) {
        raf = requestAnimationFrame(step);
        return;
      }

      const rect = arena.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      for (const b of hearts) {
        if (!b.el) continue;

        b.x += b.vx;
        b.y += b.vy;

        const r = 32; // half of 64px-ish heart size
        if (b.x < r) {
          b.x = r;
          b.vx *= -1;
        }
        if (b.x > w - r) {
          b.x = w - r;
          b.vx *= -1;
        }
        if (b.y < r) {
          b.y = r;
          b.vy *= -1;
        }
        if (b.y > h - r) {
          b.y = h - r;
          b.vy *= -1;
        }

        b.el.style.left = `${b.x}px`;
        b.el.style.top = `${b.y}px`;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
  }

  function showModal(photoSrc, msg) {
    el.popModalImg.src = photoSrc;
    el.popModalMsg.textContent = msg;
    el.popModal.classList.remove("hidden");
    paused = true;
  }

  function hideModal() {
    el.popModal.classList.add("hidden");
    paused = false;

    // if game is finished, keep Continue visible
    if (loadBool(SESSION_KEYS.popDone)) {
      el.popContinueBtn.classList.remove("hidden");
    }
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function makeStickyDraggable(stickyEl, arenaEl, saveKey) {
    let dragging = false;
    let startX = 0,
      startY = 0;
    let startLeft = 0,
      startTop = 0;

    stickyEl.addEventListener("pointerdown", (e) => {
      if (paused) return;

      dragging = true;
      stickyEl.setPointerCapture(e.pointerId);

      startX = e.clientX;
      startY = e.clientY;

      startLeft = parseFloat(stickyEl.style.left || "0");
      startTop = parseFloat(stickyEl.style.top || "0");

      e.preventDefault();
    });

    stickyEl.addEventListener("pointermove", (e) => {
      if (!dragging) return;

      const arenaRect = arenaEl.getBoundingClientRect();
      const stickyRect = stickyEl.getBoundingClientRect();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // left/top is center because of translate(-50%, -50%)
      const halfW = stickyRect.width / 2;
      const halfH = stickyRect.height / 2;

      let left = startLeft + dx;
      let top = startTop + dy;

      left = clamp(left, halfW, arenaRect.width - halfW);
      top = clamp(top, halfH, arenaRect.height - halfH);

      stickyEl.style.left = `${left}px`;
      stickyEl.style.top = `${top}px`;
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;

      if (saveKey) {
        const left = parseFloat(stickyEl.style.left || "0");
        const top = parseFloat(stickyEl.style.top || "0");
        sessionStorage.setItem(saveKey, JSON.stringify({ left, top }));
      }
    };

    stickyEl.addEventListener("pointerup", endDrag);
    stickyEl.addEventListener("pointercancel", endDrag);
  }

  function dropSticker({ id, x, y, photoSrc, msg }) {
    const arena = el.popArena;
    const rect = arena.getBoundingClientRect();

    const padX = 55;
    const padY = 70;
    const cx = clamp(x, padX, rect.width - padX);
    const cy = clamp(y, padY, rect.height - padY);

    const sticker = document.createElement("div");
    sticker.className = "pop-sticker";
    sticker.dataset.id = String(id);

    const rot = (Math.random() * 10 - 5).toFixed(2);

    const saved = sessionStorage.getItem(`popStickyPos_${id}`);
    if (saved) {
      const { left, top } = JSON.parse(saved);
      sticker.style.left = `${left}px`;
      sticker.style.top = `${top}px`;
    } else {
      sticker.style.left = `${cx}px`;
      sticker.style.top = `${cy}px`;
    }

    sticker.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;

    sticker.innerHTML = `
      <div class="paper">
        <img src="${photoSrc}" alt="Photo" />
        <div class="cap">${msg}</div>
      </div>
    `;

    arena.appendChild(sticker);

    makeStickyDraggable(sticker, arena, `popStickyPos_${id}`);
  }

  function finishGame() {
    if (loadBool(SESSION_KEYS.popDone)) return;

    saveBool(SESSION_KEYS.popDone, true);
    popHeartsCompleted = true;

    setStatus(POP_HEART_COUNT);
    el.popContinueBtn.classList.remove("hidden");

    startConfetti();
    updateGamesContinue();
  }

  function init() {
    showScreen(el.popHeartsGame);

    // reset UI
    el.popContinueBtn.classList.add("hidden");
    el.popArena.innerHTML = "";

    const deck = loadDeck();
    const popped = loadPoppedSet();
    const stickerState = loadStickerState();

    // re-render stickers already popped
    for (const idStr of Object.keys(stickerState)) {
      const id = Number(idStr);
      if (!Number.isFinite(id)) continue;
      if (!popped.has(id)) continue;

      const s = stickerState[idStr];
      const msg = POP_MESSAGES[id % POP_MESSAGES.length];
      const photoSrc = deck[id % deck.length];

      dropSticker({ id, x: s.x ?? 60, y: s.y ?? 60, photoSrc, msg });
    }

    // already completed?
    popHeartsCompleted = loadBool(SESSION_KEYS.popDone);
    if (popHeartsCompleted) {
      setStatus(POP_HEART_COUNT);
      el.popContinueBtn.classList.remove("hidden");
      updateGamesContinue();
      stopLoop();
      return;
    }

    // build hearts
    const rect = el.popArena.getBoundingClientRect();
    const w = rect.width || 320;
    const h = rect.height || 400;

    hearts = [];

    for (let i = 0; i < POP_HEART_COUNT; i++) {
      if (popped.has(i)) continue;

      const b = document.createElement("button");
      b.type = "button";
      b.className = "pop-heart";
      b.dataset.id = String(i);
      b.innerHTML = `<span>💗</span>`;

      const x = 40 + Math.random() * (w - 80);
      const y = 40 + Math.random() * (h - 80);

      const speed = 0.6 + Math.random() * 1.2;
      const ang = Math.random() * Math.PI * 2;
      const vx = Math.cos(ang) * speed;
      const vy = Math.sin(ang) * speed;

      const obj = { id: i, x, y, vx, vy, el: b };
      hearts.push(obj);

      b.style.left = `${x}px`;
      b.style.top = `${y}px`;

      b.addEventListener("click", () => {
        if (paused) return;

        const id = Number(b.dataset.id);
        if (!Number.isFinite(id)) return;

        b.classList.add("is-popped");
        setTimeout(() => b.remove(), 220);

        popped.add(id);
        savePoppedSet(popped);
        setStatus(popped.size);

        const msg = POP_MESSAGES[id % POP_MESSAGES.length];
        const heartPhoto = deck[id % deck.length];

        // save sticker "spawn" position for persistence
        stickerState[String(id)] = { x: obj.x, y: obj.y, rot: 0 };
        saveStickerState(stickerState);

        dropSticker({ id, x: obj.x, y: obj.y, photoSrc: heartPhoto, msg });

        showModal(heartPhoto, msg);

        if (popped.size >= POP_HEART_COUNT) finishGame();
      });

      el.popArena.appendChild(b);
    }

    setStatus(popped.size);

    // safety: if popped already complete but flag missing
    if (popped.size >= POP_HEART_COUNT) {
      finishGame();
      return;
    }

    updateGamesContinue();
    paused = false;
    startLoop();
  }

  function bindUIOnce() {
    // modal close
    el.popModalCloseBtn.addEventListener("click", () => {
      hideModal();
    });

    // back/continue
    el.popBackBtn.addEventListener("click", () => {
      hideModal();
      stopLoop();
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    el.popContinueBtn.addEventListener("click", () => {
      hideModal();
      stopLoop();
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });
  }

  function open() {
    if (!didBind) {
      bindUIOnce();
      didBind = true;
    }
    init();
  }

  return { open };
})();

//opens pop hearts game from games menu
el.popHeartsBtn.addEventListener("click", () => {
  PopHearts.open();
});

/***********************
 * 8.6) Love Dash (Runner)
 ***********************/
const LoveDash = (() => {
  let didBind = false;

  // --- Tunables (game feel) ---
  const CFG = {
    gravity: 0.75,
    jumpV: -16.5,
    groundPad: 46,

    obstacleSpeedBase: 3.6,
    obstacleSpeedMax: 7.5,
    speedRampEvery: 250,
    speedRampStep: 0.25,

    spawnEveryMin: 85,
    spawnEveryMax: 130,

    winScore: 10000,

    // sprite sheet settings (dog_run.png)
    runFrames: 2,
    frameSize: 100,
    animFps: 8,
  };

  const BG_IMAGES = [
    "photos/love dash photos/photo1.jpg",
    "photos/love dash photos/photo2.jpg",
    "photos/love dash photos/photo3.jpg",
    "photos/love dash photos/photo4.jpg",
    "photos/love dash photos/photo5.jpg",
    "photos/love dash photos/photo6.jpg",
    "photos/love dash photos/photo7.jpg",
    "photos/love dash photos/photo8.jpg",
    "photos/love dash photos/photo9.jpg",
    "photos/love dash photos/photo10.jpg",
    "photos/love dash photos/photo11.jpg",
  ];

  let dashBgInterval = null;

  function setDashBg(i) {
    const bg = document.getElementById("loveDashBg");
    if (!bg) return;

    // fade out
    bg.style.opacity = 0;

    // swap image after fade-out completes
    setTimeout(() => {
      bg.style.backgroundImage = `url("${BG_IMAGES[i]}")`;
      bg.style.opacity = String(S.bgBaseOpacity);

      // ✅ ensure new image inherits current darkness level
      applyIntensityFX();
    }, 800); // MUST match your CSS transition duration
  }

  function startDashBgShuffle() {
    if (dashBgInterval) return; // prevent duplicates

    setDashBg(S.bgIndex || 0);

    dashBgInterval = setInterval(() => {
      S.bgIndex = ((S.bgIndex || 0) + 1) % BG_IMAGES.length;
      setDashBg(S.bgIndex);
    }, 2500);
  }

  function stopDashBgShuffle() {
    if (!dashBgInterval) return;
    clearInterval(dashBgInterval);
    dashBgInterval = null;
  }

  function clearDashBg() {
    const bg = document.getElementById("loveDashBg");
    if (!bg) return;
    bg.style.opacity = 0;
    bg.style.backgroundImage = "none";
  }

  function showDashBg(i = 0) {
    setDashBg(i); // uses your fade swapper
  }

  // --- Session keys ---
  const BEST_KEY = SESSION_KEYS.loveDashBest;
  const DONE_KEY = SESSION_KEYS.loveDashDone;

  // --- DOM (from your existing el map) ---
  const ui = {
    get canvas() {
      return el.loveDashCanvas;
    },
    get ctx() {
      return el.loveDashCanvas.getContext("2d");
    },

    get game() {
      return el.loveDashGame;
    },
    get overlay() {
      return el.loveDashOverlay;
    },

    get status() {
      return el.loveDashStatus;
    },
    get score() {
      return el.loveDashScore;
    },
    get best() {
      return el.loveDashBest;
    },

    get overTitle() {
      return el.loveDashOverTitle;
    },
    get overMsg() {
      return el.loveDashOverMsg;
    },
    get overScore() {
      return el.loveDashOverScore;
    },

    get btnReplay() {
      return el.loveDashReplayBtn;
    },
    get btnContinue() {
      return el.loveDashContinueBtn;
    },
    get btnBack() {
      return el.loveDashBackBtn;
    },
  };

  // --- Runtime state ---
  const S = {
    raf: null,
    running: false,
    ready: true,
    gameOver: false,
    confettiFired: false,

    frames: 0,
    nextSpawn: 70,

    score: 0,
    best: loadJSON(BEST_KEY, 0),

    cw: 420, // CSS size reference (we also set real canvas pixels)
    ch: 520,

    speed: CFG.obstacleSpeedBase,

    player: { x: 0, y: 0, w: 64, h: 64, vy: 0, onGround: true },
    obstacles: [],

    //background
    bgIndex: 0,
    bgTimer: null,

    // animation
    animFrame: 0,
    animTick: 0,

    // sprites
    spritesReady: false,
    sprites: null,

    // speed streaks
    streaks: [],
    streakSpawnAcc: 0,

    intenVis: 0, // smoothed intensity (0..1)
    bgBaseOpacity: 0.25, // your normal bg opacity
  };

  // --- Helpers ---
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function applyIntensityFX() {
    const bg = document.getElementById("loveDashBg");
    if (!bg) return;

    const e = smoothstep(S.intenVis); // 0..1
    const bright = 1 - e; // 1..0

    // ✅ Don't touch opacity here (opacity is reserved for crossfading photos)
    bg.style.filter = `brightness(${bright})`;

    // Optional: once basically maxed, remove the image entirely
    // (it will already look black due to brightness(0))
    if (S.intenVis >= 0.98) {
      bg.style.backgroundImage = "none";
    }
  }

  function rectHit(a, b) {
    const padA = 14,
      padB = 16;

    const ax = a.x + padA,
      ay = a.y + padA,
      aw = a.w - padA * 2,
      ah = a.h - padA * 2;
    const bx = b.x + padB,
      by = b.y + padB,
      bw = b.w - padB * 2,
      bh = b.h - padB * 2;

    // ignore tiny overlaps near the ground
    const feetTolerance = 6;
    const aBottom = ay + ah;
    const bTop = by;
    if (aBottom - bTop < feetTolerance && aBottom >= bTop) return false;

    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function setOverlayVisible(show) {
    ui.overlay.classList.toggle("hidden", !show);
  }

  function showReadyOverlay() {
    stopDashBgShuffle(); // ✅ pause at beginning/instructions
    clearDashBg();

    S.ready = true;
    S.running = false;
    S.gameOver = false;

    ui.status.textContent = "Click / Space to jump. Dodge the obstacles!";

    const uiUnlocked = loadJSON(DONE_KEY, false);
    // First time: hide buttons. After first run ends: keep visible forever.
    ui.btnReplay.classList.toggle("hidden", !uiUnlocked);
    ui.btnContinue.classList.toggle("hidden", !uiUnlocked);

    if (ui.overTitle) ui.overTitle.textContent = "Love Dash 💘";
    if (ui.overMsg) {
      ui.overMsg.innerHTML =
        "Click or press Space to start! <br> Help Ares jump to dodge the 💔 and angry 💀!";
    }
    if (ui.overScore) ui.overScore.textContent = "";

    setOverlayVisible(true);
    updateHUD();
  }

  function showGameOverOverlay(win) {
    stopDashBgShuffle(); // ✅ stop when game ends

    S.gameOver = true;
    S.running = false;

    const alreadyDone = loadJSON(DONE_KEY, false);

    // ✅ Confetti only once: first time a run ends (win OR lose)
    if (!alreadyDone) startConfetti();

    // ✅ Mark "played once" so replay/continue stay visible next time
    saveBool(DONE_KEY, true);

    // best score persistence
    if (S.score > S.best) {
      S.best = S.score;
      saveJSON(BEST_KEY, S.best);
    }

    // ✅ always show replay + continue after a run ends
    ui.btnContinue.classList.remove("hidden");
    ui.btnReplay.classList.remove("hidden");

    // ✅ mark completion for your games menu (since you want it after one run)
    loveDashCompleted = true;
    saveBool(SESSION_KEYS.loveDashDone, true);
    updateGamesContinue();

    if (win) {
      ui.overTitle.textContent = "You Win 💖";
      ui.overMsg.textContent = "You made it to the finish!";
    } else {
      ui.overTitle.textContent = "Game Over 💔";
      ui.overMsg.textContent = "Press Replay to try again!";
    }

    ui.overScore.textContent = `Score: ${Math.floor(S.score)}  •  Best: ${Math.floor(S.best)}`;
    setOverlayVisible(true);
    updateHUD();
  }

  function updateHUD() {
    ui.score.textContent = Math.floor(S.score);
    ui.best.textContent = Math.floor(S.best);

    if (S.gameOver) ui.status.textContent = "Game Over";
    else if (S.ready)
      ui.status.textContent = "Click / Space to jump. Dodge the obstacles!";
    else ui.status.textContent = "Running";
  }

  // Multi-path sprite loader (helps when your Live Server root is off)
  function loadImageAny(srcCandidates) {
    const img = new Image();

    let i = 0;
    const tryNext = () => {
      if (i >= srcCandidates.length) return;
      img.src = srcCandidates[i++];
    };

    img.onload = () => {};
    img.onerror = () => {
      console.warn("Failed to load:", img.src);
      tryNext();
    };

    tryNext();
    return img;
  }

  function loadSprites() {
    const baseA = "sprites/lovedash/";
    // fallback if you accidentally served from parent folder:
    const baseB = "valentine-site/sprites/lovedash/";

    const sprites = {
      playerIdle: loadImageAny([
        `${baseA}dog_idle.png`,
        `${baseB}dog_idle.png`,
      ]),
      playerRun: loadImageAny([`${baseA}dog_run.png`, `${baseB}dog_run.png`]),
      obstacleBroken: loadImageAny([
        `${baseA}broken_heart.png`,
        `${baseB}broken_heart.png`,
      ]),
      obstacleAngry: loadImageAny([
        `${baseA}angry_skull.png`,
        `${baseB}angry_skull.png`,
      ]),
    };

    // mark ready when all have loaded
    let loaded = 0;
    const total = Object.values(sprites).length;

    Object.values(sprites).forEach((img) => {
      const prevOnload = img.onload;
      img.onload = () => {
        loaded++;
        if (typeof prevOnload === "function") prevOnload();
        if (loaded >= total) {
          S.spritesReady = true;
        }
      };
    });

    S.sprites = sprites;
  }

  function resizeCanvas() {
    const c = ui.canvas;
    const rect = c.getBoundingClientRect();

    // actual pixel size
    c.width = Math.floor(rect.width * devicePixelRatio);
    c.height = Math.floor(rect.height * devicePixelRatio);

    // drawing coordinate system = CSS pixels
    ui.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    S.cw = rect.width;
    S.ch = rect.height;
  }

  // --- Game lifecycle ---
  function reset() {
    // ✅ reset intensity FX
    S.streaks = [];
    S.streakSpawnAcc = 0;

    S.confettiFired = false;
    S.frames = 0;
    S.nextSpawn = 70;
    S.score = 0;
    S.gameOver = false;
    S.speed = CFG.obstacleSpeedBase;
    S.obstacles = [];

    // place player
    S.player.x = Math.max(44, Math.floor(S.cw * 0.18));
    S.player.w = 64;
    S.player.h = 64;
    S.player.vy = 0;
    S.player.onGround = true;

    const groundY = S.ch - CFG.groundPad - S.player.h;
    S.player.y = groundY;

    S.animFrame = 0;
    S.animTick = 0;

    showReadyOverlay();
  }

  function stop() {
    try {
      SFX.bg_music.pause();
      SFX.bg_music.currentTime = 0;
    } catch {}

    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = null;
    S.running = false;

    stopDashBgShuffle(); // ✅ stop when leaving / ending

    updateHUD();
  }

  function start() {
    // stop website main music
    if (window.mainMusic) {
      try { window.mainMusic.pause(); } catch {}
    }

    // start Heart Blaster music
    try {
      SFX.bg_music.currentTime = 0;
      SFX.bg_music.play().catch(() => {});
    } catch {}

    resizeCanvas();
    if (!S.sprites) loadSprites();
    reset(); // shows instructions + overlay
    drawDash(); // draw one frame so the player is visible
    updateHUD();
  }

  function beginRun() {
    if (!S.ready || S.running) return;

    S.ready = false;
    S.running = true;

    S.intenVis = 0;
    const bg = document.getElementById("loveDashBg");
    if (bg) bg.style.opacity = String(S.bgBaseOpacity);

    showDashBg(S.bgIndex || 0); // ✅ load bg only now
    startDashBgShuffle(); // ✅ start ONLY when game starts

    setOverlayVisible(false);
    updateHUD();
    loop();
  }

  function gameOver(win) {
    showGameOverOverlay(win);
  }

  // --- Input ---
  function jump() {
    // First input starts the run
    if (S.ready) {
      beginRun();
    }

    if (!S.running) return;
    if (!S.player.onGround) return;

    S.player.vy = CFG.jumpV;
    S.player.onGround = false;
  }

  // --- Update & Render ---
  function spawnObstacle() {
    const groundY = S.ch - CFG.groundPad;

    const type = Math.random() < 0.55 ? "broken" : "angry";
    const w = type === "broken" ? 54 : 54;
    const h = type === "broken" ? 54 : 54;

    S.obstacles.push({
      type,
      x: S.cw + 40,
      y: groundY - h,
      w,
      h,
    });

    S.nextSpawn = S.frames + randInt(CFG.spawnEveryMin, CFG.spawnEveryMax);
  }

  function updateDash() {
    S.frames++;

    // score + smooth speed ramp (gradual until winScore)
    S.score += 1;

    const tRaw = clamp(S.score / CFG.winScore, 0, 1);
    const t = smoothstep(tRaw);
    S.speed = lerp(CFG.obstacleSpeedBase, CFG.obstacleSpeedMax, t);

    if (S.score >= CFG.winScore) {
      gameOver(true);
      return;
    }

    if (S.frames >= S.nextSpawn) spawnObstacle();

    const groundY = S.ch - CFG.groundPad - S.player.h;

    S.player.vy += CFG.gravity;
    S.player.y += S.player.vy;

    if (S.player.y >= groundY) {
      S.player.y = groundY;
      S.player.vy = 0;
      S.player.onGround = true;
    }

    for (const ob of S.obstacles) ob.x -= S.speed;
    S.obstacles = S.obstacles.filter((ob) => ob.x + ob.w > -40);

    updateStreaks();

    const target = getIntensity();
    S.intenVis = lerp(S.intenVis, target, 0.04);
    applyIntensityFX();

    for (const ob of S.obstacles) {
      if (rectHit(S.player, ob)) {
        gameOver(false);
        return;
      }
    }
  }

  function drawPlaceholder(ctx, x, y, w, h) {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x, y, w, h);
  }

  function loop() {
    if (!S.running) return;

    updateDash();
    drawDash();
    updateHUD();

    S.raf = requestAnimationFrame(loop);
  }

  function getIntensity() {
    // start getting intense after this score
    const start = 2500;
    const full = 5000; // reaches max intensity around here
    const t = (S.score - start) / (full - start);
    return clamp(t, 0, 1);
  }

  function spawnStreak() {
    // streaks fly right-to-left
    const y = Math.random() * S.ch;
    const len = 40 + Math.random() * 120; // line length
    const w = 1 + Math.random() * 2.2; // thickness
    const speed = S.speed * (2.2 + Math.random() * 1.8);
    const alpha = 0.1 + Math.random() * 0.18; // base alpha (we’ll scale later)

    S.streaks.push({
      x: S.cw + 30 + Math.random() * 80,
      y,
      len,
      w,
      speed,
      alpha,
    });
  }

  function updateStreaks() {
    const inten = getIntensity(); // 0..1

    // spawn rate increases with intensity
    // (accumulator makes it frame-rate friendly)
    const spawnPerFrame = 0.05 + inten * 0.35; // 0.05 -> 0.40
    S.streakSpawnAcc += spawnPerFrame;

    while (S.streakSpawnAcc >= 1) {
      spawnStreak();
      S.streakSpawnAcc -= 1;
    }

    // move streaks
    for (const s of S.streaks) s.x -= s.speed;

    // cull off-screen
    S.streaks = S.streaks.filter((s) => s.x + s.len > -60);
  }

  function drawDarkenOverlay(g) {
    // use smoothed intensity, not raw
    const e = smoothstep(S.intenVis);
    if (e <= 0.001) return;

    g.save();
    // 0 -> transparent, 1 -> fully black
    g.globalAlpha = e;
    g.fillStyle = "#000";
    g.fillRect(0, 0, S.cw, S.ch);
    g.restore();
  }

  function drawStreaks(g) {
    const inten = getIntensity();
    if (inten <= 0 || !S.streaks.length) return;

    g.save();
    g.globalCompositeOperation = "lighter";

    for (const s of S.streaks) {
      const glowStrength = 8 + inten * 22; // 🔥 glow size
      const coreAlpha = 0.9 + inten * 0.1;

      // 🌸 Outer soft glow
      g.globalAlpha = s.alpha + inten * 0.25;
      g.lineWidth = s.w * (3.5 + inten * 3);
      g.strokeStyle = "rgba(255, 105, 180, 0.15)";
      g.shadowColor = "rgba(255, 105, 180, 0.9)";
      g.shadowBlur = glowStrength;

      g.beginPath();
      g.moveTo(s.x, s.y);
      g.lineTo(s.x - s.len, s.y);
      g.stroke();

      // 💖 Mid glow layer
      g.globalAlpha = s.alpha + inten * 0.35;
      g.lineWidth = s.w * (2 + inten * 2);
      g.strokeStyle = "rgba(255, 105, 180, 0.45)";
      g.shadowBlur = glowStrength * 0.6;

      g.beginPath();
      g.moveTo(s.x, s.y);
      g.lineTo(s.x - s.len, s.y);
      g.stroke();

      // ✨ Bright core (sharp line)
      g.globalAlpha = coreAlpha;
      g.lineWidth = s.w;
      g.strokeStyle = "rgb(253, 168, 210)";
      g.shadowBlur = 0;

      g.beginPath();
      g.moveTo(s.x, s.y);
      g.lineTo(s.x - s.len, s.y);
      g.stroke();
    }
    g.restore();
  }

  function drawDash() {
    const g = ui.ctx;

    // clear
    g.clearRect(0, 0, S.cw, S.ch);

    // transparent background (photos behind)
    g.fillStyle = "rgba(255, 255, 255, 0)";
    g.fillRect(0, 0, S.cw, S.ch);

    // ✅ darkness overlay should be applied BEFORE sprites
    // (so sprites stay bright / readable)
    drawDarkenOverlay(g);

    // streak FX (optional: keep UNDER overlay so it also gets dark)
    drawStreaks(g);

    // ✅ ground line flips toward white as intensity increases
    const groundY = S.ch - CFG.groundPad;
    const e = smoothstep(S.intenVis); // 0..1
    g.save();
    g.globalAlpha = 0.35 + e * 0.55; // stronger at high intensity
    const c = Math.floor(255 * e); // 0..255
    g.fillStyle = `rgb(${c},${c},${c})`;
    g.fillRect(0, groundY, S.cw, 2);
    g.restore();

    // obstacles (draw ABOVE overlay)
    for (const ob of S.obstacles) {
      const img =
        S.sprites && S.spritesReady
          ? (ob.type === "broken" ? S.sprites.obstacleBroken : S.sprites.obstacleAngry)
          : null;

      if (img && img.complete && img.naturalWidth > 0) {
        g.drawImage(img, ob.x, ob.y, ob.w, ob.h);
      } else {
        drawPlaceholder(g, ob.x, ob.y, ob.w, ob.h);
      }
    }

    // player (draw ABOVE overlay)
    const px = S.player.x, py = S.player.y, pw = S.player.w, ph = S.player.h;

    if (S.sprites && S.spritesReady) {
      if (S.running) {
        const sheet = S.sprites.playerRun;
        const frameW = CFG.frameSize;
        const frameH = CFG.frameSize;

        S.animTick++;
        const ticksPerFrame = Math.max(1, Math.floor(60 / CFG.animFps));
        if (S.animTick >= ticksPerFrame) {
          S.animTick = 0;
          S.animFrame = (S.animFrame + 1) % CFG.runFrames;
        }

        const sx = S.animFrame * frameW;
        g.drawImage(sheet, sx, 0, frameW, frameH, px, py, pw, ph);
      } else {
        g.drawImage(S.sprites.playerIdle, px, py, pw, ph);
      }
    } else {
      drawPlaceholder(g, px, py, pw, ph);
    }
  }

  // --- Hook UI once ---
  function bindUIOnce() {
    // canvas click = jump
    ui.canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      jump();
    });
    // keyboard
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    });

    ui.overlay.addEventListener("pointerdown", (e) => {
      // ignore clicks on buttons so they still work normally
      const btn = e.target.closest("button");
      if (btn) return;

      e.preventDefault();
      jump(); // will call beginRun() when S.ready is true
    });

    ui.btnReplay.addEventListener("click", () => start());

    ui.btnContinue.addEventListener("click", () => {
      stop();
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    ui.btnBack.addEventListener("click", () => {
      stop();
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    // resize safety
    window.addEventListener("resize", () => {
      if (!S.running) return;
      resizeCanvas();
    });
  }

  return {
    open() {
      showScreen(ui.game);

      if (!didBind) {
        bindUIOnce();
        didBind = true;
      }

      S.bgIndex = 0;
      stopDashBgShuffle();
      clearDashBg(); // ✅ no bg shown while instructions are up
      start(); // ✅ shows instructions/ready overlay
    },
    stop,
  };
})();

//opens love dash game from games menu
el.loveDashBtn.addEventListener("click", () => {
  LoveDash.open();
});
//#endregion
/***********************
 * 8.7) Heart Blaster (DOOM-ish)
 ***********************/
/***********************
 * HeartBlaster
 * Sections:
 *  1) Assets (SPR, SFX)
 *  2) Constants (CFG, WEAPONS, MAPS, THEMES)
 *  3) State (S) + Helpers (clamp, shuffle, etc.)
 *  4) Persistence (saveState/loadState/requestSave)
 *  5) Map + Spawning (applyMap, spawnWave, spawnBoss...)
 *  6) Simulation (update, updateMovement, updateBoss...)
 *  7) Rendering (draw + draw helpers)
 *  8) Input/UI (bindUIOnce, pointer lock, overlay buttons)
 *  9) Public API (open/stop)
 ***********************/
const HeartBlaster = (() => {
  let didBind = false;

  //#region 1) Assets / Sprites 
  /*---------------------------------------------------*/
  const SPR_BASE_A = "sprites/heartblaster/";
  const SPR_BASE_B = "valentine-site-public/sprites/heartblaster/"; // fallback if root differs
  const SPR_FRAME = 100;
  const RUN_FRAMES = 2;

  function loadImageAny(srcCandidates) {
    const img = new Image();
    let i = 0;
    const tryNext = () => {
      if (i >= srcCandidates.length) return;
      img.src = srcCandidates[i++];
    };
    img.onerror = tryNext;
    tryNext();
    return img;
  }

  const SPR = {
    crossIdle: loadImageAny([`${SPR_BASE_A}crosshair_idle.png`, `${SPR_BASE_B}crosshair_idle.png`,]),
    crossHit: loadImageAny([`${SPR_BASE_A}crosshair_hit.png`, `${SPR_BASE_B}crosshair_hit.png`,]),

    // ===== Eenemy sheets  =====
    heartIdle: loadImageAny([`${SPR_BASE_A}heart_idle.png`, `${SPR_BASE_B}heart_idle.png`]),
    heartRun:  loadImageAny([`${SPR_BASE_A}heart_run.png`,  `${SPR_BASE_B}heart_run.png`]),
    heartHit:  loadImageAny([`${SPR_BASE_A}heart_hit.png`,  `${SPR_BASE_B}heart_hit.png`]),
    heartDead: loadImageAny([`${SPR_BASE_A}heart_dead.png`, `${SPR_BASE_B}heart_dead.png`]),    

    roseIdle: loadImageAny([`${SPR_BASE_A}rose_idle.png`, `${SPR_BASE_B}rose_idle.png`]),
    roseRun:  loadImageAny([`${SPR_BASE_A}rose_run.png`,  `${SPR_BASE_B}rose_run.png`]),
    roseHit:  loadImageAny([`${SPR_BASE_A}rose_hit.png`,  `${SPR_BASE_B}rose_hit.png`]),
    roseDead: loadImageAny([`${SPR_BASE_A}rose_dead.png`, `${SPR_BASE_B}rose_dead.png`]),

    cupidIdle: loadImageAny([`${SPR_BASE_A}cupid_idle.png`, `${SPR_BASE_B}cupid_idle.png`]),
    cupidRun:  loadImageAny([`${SPR_BASE_A}cupid_run.png`,  `${SPR_BASE_B}cupid_run.png`]),
    cupidHit:  loadImageAny([`${SPR_BASE_A}cupid_hit.png`,  `${SPR_BASE_B}cupid_hit.png`]),
    cupidDead: loadImageAny([`${SPR_BASE_A}cupid_dead.png`, `${SPR_BASE_B}cupid_dead.png`]),

    teddyIdle: loadImageAny([`${SPR_BASE_A}teddy_idle.png`, `${SPR_BASE_B}teddy_idle.png`]),
    teddyRun:  loadImageAny([`${SPR_BASE_A}teddy_run.png`,  `${SPR_BASE_B}teddy_run.png`]),
    teddyHit:  loadImageAny([`${SPR_BASE_A}teddy_hit.png`,  `${SPR_BASE_B}teddy_hit.png`]),
    teddyDead: loadImageAny([`${SPR_BASE_A}teddy_dead.png`, `${SPR_BASE_B}teddy_dead.png`]),

    // ===== Boss Phase 1 / Phase 2 sheets =====
    bossIdle1: loadImageAny([`${SPR_BASE_A}boss_idle.png`,  `${SPR_BASE_B}boss_idle.png`]),
    bossRun1:  loadImageAny([`${SPR_BASE_A}boss_run.png`,   `${SPR_BASE_B}boss_run.png`]),
    bossHit1:  loadImageAny([`${SPR_BASE_A}boss_hit.png`,   `${SPR_BASE_B}boss_hit.png`]),

    bossIdle2: loadImageAny([`${SPR_BASE_A}boss_idle2.png`, `${SPR_BASE_B}boss_idle2.png`]),
    bossRun2:  loadImageAny([`${SPR_BASE_A}boss_run2.png`,  `${SPR_BASE_B}boss_run2.png`]),
    bossHit2:  loadImageAny([`${SPR_BASE_A}boss_hit2.png`,  `${SPR_BASE_B}boss_hit2.png`]),
    bossDead:  loadImageAny([`${SPR_BASE_A}boss_dead.png`,  `${SPR_BASE_B}boss_dead.png`]),

    gunIdle: loadImageAny([`${SPR_BASE_A}gun_idle.png`,     `${SPR_BASE_B}gun_idle.png`]),
    gunFire: loadImageAny([`${SPR_BASE_A}gun_fire.png`,     `${SPR_BASE_B}gun_fire.png`]),
    gunReload: loadImageAny([`${SPR_BASE_A}gun_reload.png`, `${SPR_BASE_B}gun_reload.png`]),

    minigunIdle: loadImageAny([`${SPR_BASE_A}minigun_idle.png`, `${SPR_BASE_B}minigun_idle.png`]),
    minigunFire: loadImageAny([`${SPR_BASE_A}minigun_fire.png`, `${SPR_BASE_B}minigun_fire.png`]),

    opIdle: loadImageAny([`${SPR_BASE_A}op_idle.png`,       `${SPR_BASE_B}op_idle.png`]),
    opHit: loadImageAny([`${SPR_BASE_A}op_hit.png`,         `${SPR_BASE_B}op_hit.png`]),

    // ===== Pickups =====
    ammo:       loadImageAny([`${SPR_BASE_A}ammo.png`,        `${SPR_BASE_B}ammo.png`]),
    ammoBoost:  loadImageAny([`${SPR_BASE_A}ammo_boost.png`,  `${SPR_BASE_B}ammo_boost.png`]),
    heartnade:  loadImageAny([`${SPR_BASE_A}heartnade.png`,   `${SPR_BASE_B}heartnade.png`]),
    health:     loadImageAny([`${SPR_BASE_A}health.png`,      `${SPR_BASE_B}health.png`]),

    // ===== Wall Textures =====
    wall1: loadImageAny([`${SPR_BASE_A}wall_1.png`, `${SPR_BASE_B}wall_1.png`]),
    wall2: loadImageAny([`${SPR_BASE_A}wall_2.png`, `${SPR_BASE_B}wall_2.png`]),
    wall3: loadImageAny([`${SPR_BASE_A}wall_3.png`, `${SPR_BASE_B}wall_3.png`]),
    wall4: loadImageAny([`${SPR_BASE_A}wall_4.png`, `${SPR_BASE_B}wall_4.png`]),
    wall5: loadImageAny([`${SPR_BASE_A}wall_5.png`, `${SPR_BASE_B}wall_5.png`]),
    wallBoss: loadImageAny([`${SPR_BASE_A}wall_boss.png`, `${SPR_BASE_B}wall_boss.png`]),

    // ===== Floor Textures =====
    floor:      loadImageAny([`${SPR_BASE_A}floor.png`,      `${SPR_BASE_B}floor.png`]),
    floor4:     loadImageAny([`${SPR_BASE_A}floor_4.png`,    `${SPR_BASE_B}floor_4.png`]),
    floor5:     loadImageAny([`${SPR_BASE_A}floor_5.png`,    `${SPR_BASE_B}floor_5.png`]),
    floorBoss:  loadImageAny([`${SPR_BASE_A}floor_boss.png`, `${SPR_BASE_B}floor_boss.png`]),
  };

  const SFX = {
    // Weapons
    pistol_shoot: new Audio("sprites/heartblaster/SFX/pistol_shoot.mp3"),
    minigun_shoot: new Audio("sprites/heartblaster/SFX/minigun_shoot.mp3"),
    reload_pickupammo: new Audio("sprites/heartblaster/SFX/reload_pickupammo.mp3"),
    power_ups: new Audio("sprites/heartblaster/SFX/power_ups.mp3"),

    // Enemy (non-boss)
    enemy_hit: new Audio("sprites/heartblaster/SFX/enemy_hit.mp3"),
    enemy_dead: new Audio("sprites/heartblaster/SFX/enemy_dead.mp3"),

    // Boss
    boss_hit: new Audio("sprites/heartblaster/SFX/boss_hit.mp3"),
    boss_death: new Audio("sprites/heartblaster/SFX/boss_death.mp3"),
    boss_run: new Audio("sprites/heartblaster/SFX/boss_run.mp3"),
    boss_roar: new Audio("sprites/heartblaster/SFX/boss_roar.mp3"),

    // Player
    player_pain: new Audio("sprites/heartblaster/SFX/player_pain.mp3"),
    player_death: new Audio("sprites/heartblaster/SFX/player_death.mp3"),

    // Explosions
    grenade_explode: new Audio("sprites/heartblaster/SFX/grenade_explode.mp3"),

    // BG music
    bg_music: new Audio("sprites/heartblaster/SFX/bg_musicHB.mp3"),
  };

  SFX.bg_music.loop = true;
  SFX.bg_music.volume = 0.5; // adjust to taste

  function playSfx(a) {
    try {
      if (!a) return;
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch {}
  }

  function stopSiteMusic() {
    const site = document.getElementById("bgMusicAfter");
    if (!site) return;
    try { site.pause(); } catch {}
  }

  function resumeSiteMusic() {
    const site = document.getElementById("bgMusicAfter");
    if (!site) return;
    try { site.play().catch(() => {}); } catch {}
  }

  function startHBMusic() {
    try {
      SFX.bg_music.loop = true;
      if (SFX.bg_music.paused) {
        SFX.bg_music.play().catch(() => {});
      }
    } catch {}
  }

  function stopHBMusic() {
    try {
      SFX.bg_music.pause();
      SFX.bg_music.currentTime = 0;
    } catch {}
  }

  //#endregion
  //#region 2) Constants (CFG, WEAPONS, MAPS, THEMES) 
  /*---------------------------------------------------*/
  const CFG = {
    debug: {
      miniMap: true,
      devSkipBoss: true, // set true only when debugging
      saveThrottleMs: 250,
      godMode: false,   // 👈 add this
    },

    waves: [
      { normal: 6, tank: 0, fast: 0, sniper: 0 },
      { normal: 3, tank: 0, fast: 3, sniper: 0 },
      { normal: 3, tank: 0, fast: 2, sniper: 1 },
      { normal: 3, tank: 1, fast: 3, sniper: 1 },
      { normal: 2, tank: 2, fast: 2, sniper: 2 },
    ],
    hpStart: 100,
    hpMax: 100,
    fireCooldownMs: 220,
    waveAmmoStart: 15,

    // Pickups / Grenades 
    pickups: {
      ammoAmount: 10,
      pickupTTLms: 20000,        // despawn after 20s
      pickupRadius: 0.65,        // player collection radius
      minDistFromPlayer: 3.0,    // spawn away from player

      // health
      healthAmount: 10,
      healthSpawnEveryMs: 26000,        // boss wave cadence
      healthSpawnEveryNormal: 22000,    // normal wave cadence

      // timers
      ammoSpawnEveryMs: 14000,   // general ammo cadence (boss wave only by default below)
      grenadeSpawnEveryMs: 18000,

      // normal wave ammo cadence
      ammoSpawnEveryNormal: 22000,

      // boosted ammo (boss phase 2+ only)
      boostDamageMult: 0.10,     // shots deal more while boosted ammo is loaded
    },

    grenade: {
      speed: 0.016,      // world units per ms
      lifeMs: 1200,
      explodeRadius: 2.15,
      bossDamage: 10,    // significant boss chunk
      enemyDamage: 10,    // optional splash on minions
    },

    // aim sensitivity
    sensMouse: 0.0022,
    sensTouch: 0.006,

    // hit window at crosshair (pixels)
    hitRadiusPx: 32,

    // enemy motion
    zStart: 1.6, // "depth" start (bigger = further)
    zEnd: 0.18, // reaches player when <= this
    speedNormal: 0.0012,
    speedTank: 0.001,
    speedFast: 0.003,
    speedSniper: 0.00095,

    // enemy health
    enemyHP: {
      normal: 3,
      fast: 2,
      tank: 5,
      sniper: 2,
    },

    sniper: {
      projSpeed: 0.010,      // world units per ms (tweak)
      projLifeMs: 1400,
      projDamage: 1,
    },

    enemyDamage: {
      normal: 10,   // Corrupted Heart
      fast: 10,     // Toxic Rose
      sniper: 20,   // Broken Cupid
      tank: 30,     // Jealous Teddy
    },

    bossDamage: 50, // Heart Breaker boss

    // movement
    moveSpeed: 0.0032, // units per ms (tweak)
    sprintMult: 1.35,

    //map
    debugMiniMap: true, 

    // raycasting (Option C)
    ray: {
      fov: 1.25, // radians (~72°) match your projection
      maxDist: 30, // how far rays can go
      wallHeight: 1.0, // world height of walls
      numRays: 320, // quality/perf (try 240–480)
    },

    // --- Boss (Final Wave) ---
    boss: {
      // overall tuning
      hp: 150, // base boss HP
      gunDamageScale: 0.25, // normal gun damage vs boss (intentionally weak)
      sizeMult: 2.00, // boss sprite bigger than normal enemies
      radius: 0.32, // collision radius (bigger body)
      touchDamageDist: 0.72, // distance threshold to damage player

      // movement / behavior
      speedBase: 0.00155, // base chase speed (scaled with dt like enemies)
      speedPhase2: 0.00195, // faster below ~60% HP
      speedPhase3: 0.00235, // faster below ~25% HP

      strafeChance: 0.35, // chance to strafe instead of direct chase (per update tick)
      strafeStrength: 0.55, // how strong the strafe is relative to forward chase
      retargetMs: 650, // how often to change strafe direction
      hurtFlashMs: 140,
      deathHoldMs: 700,

      //boss minions
      minionsStart: 3, // spawn up to 3 at the start
      minionsAtHalf: 3, // spawn up to 3 again when boss hits <= 50%
      faceLockMs: 140, // prevents rapid flipping ("twirl")
      maxStrafeFrac: 0.45, // strafe capped to % of forward step (lower = slower strafe)
      minionCap: 10,
    },

    waveSpawnDelayMs: 3000,     // normal waves: time before enemies spawn

    ui: {
      opFaceInHud: true, // move operator face out of canvas and into the DOM HUD
    },
  };

  const SPR_VISUAL_SCALE = {
    normal: 0.8,
    fast: 0.78,     // rose smaller
    tank: 3,     // teddy bigger
    sniper: 1.5,
  };

  const VIEW_FOV = CFG.ray?.fov ?? 1.25; 

  const WEAPONS = {
    pistol: {
      id: "pistol",
      name: "Pistol",
      fireCooldownMs: 220,
      damage: 1,
      bossDamageScale: 0.25,
      ammoMax: 50,      // optional: lower max so ammo matters more
      ammoStart: 15,     // ✅ start 
      infiniteAmmo: false, // ✅ turn OFF infinite ammo
      gunSpriteIdle: "gunIdle",
      gunSpriteFire: "gunFire",
    },

    minigun: {
      id: "minigun",
      name: "Minigun",
      fireCooldownMs: 100,
      damage: 5,
      bossDamageScale: 3.0,
      ammoMax: 100,   
      ammoStart: 20,  
      infiniteAmmo: false,
      gunSpriteIdle: "minigunIdle",
      gunSpriteFire: "minigunFire",
      gunFrames: 2,
      gunIdleFps: 10,
      gunFireFps: 14,
    },
  };

  function getWeaponDef(id) {
    return WEAPONS[id] || WEAPONS.pistol;
  }

  // Backwards compat: keep your old flag but prefer CFG.debug.miniMap
  CFG.debugMiniMap = CFG.debug?.miniMap ?? CFG.debugMiniMap;

  // Boss happens AFTER the configured normal waves
  const BOSS_WAVE = CFG.waves.length + 1;

  // Tilemap (walls) 
  const TILE = 1.0;

  // One map per wave 
  const MAPS = [
    // Wave 1 (15x15)
    [
      "111111111111111",
      "100000000000001",
      "10S000000000S01",
      "100000000000001",
      "100010000010001",
      "100000000000001",
      "100000000000001",
      "100000000000001",
      "100000000000001",
      "100000000000001",
      "100010000010001",
      "100000000000001",
      "10S000000000S01",
      "100000000000001",
      "111111111111111",
    ],

    // Wave 2 (15x15)
    [
      "111111111111111",
      "1S00001110000S1",
      "100000000000001",
      "100100000001001",
      "100110000011001",
      "1000110S0110001",
      "110001111100011",
      "110000000000011",
      "110000000000011",
      "100010000010001",
      "100000000000001",
      "101000000000101",
      "101100111001101",
      "1S00001110000S1",
      "111111111111111",
    ],

    // Wave 3 (15x15)
    [
      "111111111111111",
      "110000000000011",
      "100000000000001",
      "100111000111001",
      "100011000110001",
      "1S00000000000S1",
      "111000010000111",
      "111000111000111",
      "111001111100111",
      "110001111100011",
      "100000111000001",
      "100000111000001",
      "100100010001001",
      "1S0000S1S0000S1",
      "111111111111111",
    ],

    // Wave 4 (17x17)
    [
      "11111111111111111",
      "110S000010000S011",
      "10000000000000001",
      "10011110001111001",
      "10011000000011001",
      "10010000000001001",
      "1S0100100010010S1",
      "10000000000000001",
      "11000000100000011",
      "10000000000000001",
      "1S0100100010010S1",
      "10010000000001001",
      "10011000000011001",
      "10011110001111001",
      "10000000000000001",
      "110000S010S000011",
      "11111111111111111",
    ],

    // Wave 5 (18x18)
    [
      "11111111111111111",
      "1S0000001000000S1",
      "10110000100001101",
      "10110011111001101",
      "10000000000000001",
      "10000000000000001",
      "10010011S11001001",
      "10010011111001001",
      "11110001110001111",
      "10010000100001001",
      "10011000000011001",
      "10000000000000001",
      "10000000000000001",
      "10110011111001101",
      "10110000100001101",
      "1S0000001000000S1",
      "11111111111111111",
    ],

    // Boss Arena (23x19) 
    [
      "11111111111111111111111",
      "11110000000000000001111",
      "11100000000000000000111",
      "11000S11000000011S00011",
      "00000110000000001100000",
      "00000000000000000000000",
      "00000000011S11000000000",
      "00011100111111100100100",
      "00001000111111100100100",
      "000S100001111100010S100",
      "00011100001110000011000",
      "00000000000100000000000",
      "00000000000000000000000",
      "00000110000000001100000",
      "00000S11000000011S00000",
      "11000000000000000000011",
      "11100000000000000000111",
      "11110000000000000001111",
      "11111111111111111111111",
    ],
  ];

  const THEMES = [
    { skyTop: "rgba(40,10,20,0.85)", skyBot: "rgba(255,255,255,0.0)", wall: "rgba(255,160,200,0.75)" }, // wave 1
    { skyTop: "rgba(12,14,34,0.90)", skyBot: "rgba(255,255,255,0.0)", wall: "rgba(170,200,255,0.75)" }, // wave 2
    { skyTop: "rgba(30,10,10,0.92)", skyBot: "rgba(255,255,255,0.0)", wall: "rgba(255,180,140,0.75)" }, // wave 3
    { skyTop: "rgba(10,28,18,0.92)", skyBot: "rgba(255,255,255,0.0)", wall: "rgba(160,255,200,0.70)" }, // wave 4
    { skyTop: "rgba(22,6,26,0.92)",  skyBot: "rgba(255,255,255,0.0)", wall: "rgba(230,150,255,0.70)" }, // wave 5
    { skyTop: "rgba(5,0,0,0.95)",    skyBot: "rgba(255,255,255,0.0)", wall: "rgba(255,90,140,0.75)" },  // boss
  ];

  function themeForWave(waveNum) {
    const idx = U.clamp(waveNum - 1, 0, THEMES.length - 1);
    return THEMES[idx] || THEMES[0];
  }

  // ✅ Current map pointer + derived dims (must be updated when switching maps)
  let MAP = MAPS[0];
  let MAP_H = MAP.length;
  let MAP_W = MAP[0].length;

  let MAP_MIN_X = 0;
  let MAP_MIN_Z = 0;
  let MAP_MAX_X = MAP_W * TILE;
  let MAP_MAX_Z = MAP_H * TILE;

  // Map switching helpers 
  function mapIndexForWave(waveNum) {
    return U.clamp(waveNum - 1, 0, MAPS.length - 1);
  }

  function isBossWave(waveNum) {
    return waveNum === BOSS_WAVE;
  }

  const BOSS_MAP_INDEX = MAPS.length - 1; // last map is boss arena

  function applyMap(mapIndex) {
    MAP = MAPS[mapIndex] || MAPS[0];

    MAP_H = MAP.length;
    MAP_W = MAP[0].length;

    MAP_MIN_X = 0;
    MAP_MIN_Z = 0;
    MAP_MAX_X = MAP_W * TILE;
    MAP_MAX_Z = MAP_H * TILE;

    // keep player inside the new bounds safely
    const pad = TILE * 0.5; // half-tile
    S.px = U.clamp(S.px, MAP_MIN_X + pad, MAP_MAX_X - pad);
    S.pz = U.clamp(S.pz, MAP_MIN_Z + pad, MAP_MAX_Z - pad);
  }

  function switchMapForWave(waveNum) {
    const mi = isBossWave(waveNum) ? BOSS_MAP_INDEX : mapIndexForWave(waveNum);

    // apply map + update derived dims
    S.mapIndex = mi;
    applyMap(mi);

    // ✅ reposition player using marker-first safe spawn
    placePlayerAtSafeSpawn();

    // ✅ clear enemies between maps (fresh wave spawns)
    S.enemies = [];
    S.boss = null;
  }

  // Pop-out arena state
  let arenaHomeParent = null;
  let arenaHomeNextSibling = null;
  let isPoppedOut = false;

  function getArenaWrap() {
    return document.getElementById("hbArenaWrap");
  }

  function popOut() {
    if (isPoppedOut) return;

    const wrap = getArenaWrap();
    if (!wrap) return;

    arenaHomeParent = wrap.parentElement;
    arenaHomeNextSibling = wrap.nextSibling;

    el.hbModal.classList.remove("hidden");
    el.hbModalStage.appendChild(wrap);

    isPoppedOut = true;

    // wait a frame so layout is real, then resize
    requestAnimationFrame(() => {
      resizeCanvas();
      draw();
    });
  }

  function popIn() {
    if (!isPoppedOut) return;

    const wrap = getArenaWrap();
    if (!wrap) return;

    el.hbModal.classList.add("hidden");

    if (arenaHomeParent) {
      if (arenaHomeNextSibling) {
        arenaHomeParent.insertBefore(wrap, arenaHomeNextSibling);
      } else {
        arenaHomeParent.appendChild(wrap);
      }
    }

    isPoppedOut = false;

    requestAnimationFrame(() => {
      resizeCanvas();
      draw();
    });
  }

  function hardCloseModal() {
    // ensure modal is hidden + wrap is back in place
    try { document.exitPointerLock?.(); } catch {}

    // if popped out, restore
    if (isPoppedOut) popIn();

    // even if state got out-of-sync, force hidden
    el.hbModal?.classList.add("hidden");
    isPoppedOut = false;
  }

  // --- Wave/Boss overlay copy ---
  const WAVE_INTROS = {
    1: {
      title: "WAVE 1 💔 CORRUPTION BEGINS",
      lines: [
        "The corruption spreads…",
        "",
        "Eliminate all hostile hearts.",
        "Keep moving. Don't let them surround you.",
        "",
        "Full Ammo.",
        "Survive.",
      ],
    },

    2: {
      title: "WAVE 2 🌹 PETALS TURN POISON",
      lines: [
        "The roses have turned toxic…",
        "",
        "Faster enemies detected.",
        "Control space. Don't get cornered.",
        "",
        "Ammo refilled.",
        "Stay sharp.",
      ],
    },

    3: {
      title: "WAVE 3 🏹 LOVE BERTAYS",
      lines: [
        "Cupid has fallen.",
        "",
        "Ranged attacks incoming.",
        "Strafe constantly.",
        "Use walls wisely.",
        "",
        "Ammo refilled.",
        "Make every shot count.",
      ],
    },

    4: {
      title: "WAVE 4 🧸 JEALOUSY AWAKENS",
      lines: [
        "Something heavier approaches…",
        "",
        "High-damage threats detected.",
        "Keep distance.",
        "Prioritize threats wisely.",
        "",
        "Ammo refilled.",
        "Stay alive.",
      ],
    },

    5: {
      title: "WAVE 5 💀 TOTAL CORRUPTION",
      lines: [
        "Love has fully collapsed…",
        "Total corruption unleashed.",
        "",
        "Multiple enemy types detected.",
        "Close range. Swarm. Ranged. Heavy.",
        "",
        "Adapt fast. Control chaos.",
        "",
        "Ammo refilled.",
      ],
    },

    boss: {
      title: "BOSS WAVE 👁️ HEARTBREAKER",
      lines: [
        "Something ancient awakens…",
        "",
        "This entity has multiple phases.",
        "Expect transformation midway.",
        "",
        "Clear minions quickly.",
        "Watch your health.",
        "",
        "Ammo refilled.",
        "Watch out for special pickups (grenades).",
        "Finish this.",
      ],
    },
  };

  function overlayLinesToHTML(lines) {
    // Empty string = blank line
    return lines.map((l) => (l === "" ? "&nbsp;" : escapeHTML(l))).join("<br>");
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  //#endregion
  //#region 3) State (S) + Helpers 
  /*---------------------------------------------------*/ 
  const S = {
    // Loop
    raf: null,
    lastT: 0,

    // Run Flags
    running: false,
    ready: true,
    over: false,
    won: false,
    hasSave: false,

    // Canvas size in CSS pixels
    cw: 420,
    ch: 520,
    depth: null,

    // Player View/Controls
    yaw: 0,
    pitch: 0,
    touchActive: false,
    lastTouchX: 0,
    lastTouchY: 0,

    // Player World
    px: 0,
    pz: 0,
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
      up: false,
      left: false,
      down: false,
      right: false,
      shift: false,
    },

    // Gameplay Stats
    wave: 1,
    hp: CFG.hpStart,
    kills: 0,
    shots: 0,
    hits: 0,

    // Damage i-frames / cooldown
    lastDamageAt: 0,
    damageCooldownMs: 650,

    // Weapons
    weaponId: "pistol",
    ammo: 30,
    ammoMax: 60,
    pickup: null,

    //Entities
    enemies: [],
    boss: null, // { hp, hpMax, x, z, hurtUntil, deadUntil, strafeSign, nextRetargetAt }
    projectiles: [], // { x,z, vx,vz, lifeUntil, damage, from:"player" }

    // Pickups (generic)
    nextAmmoPickupAt: 0,
    nextGrenadePickupAt: 0,
    nextHealthPickupAt: 0,

    // Ammo type (normal | boost). "boost" only matters during boss wave.
    ammoType: "normal",

    // Grenades (boss wave only)
    grenades: 0,
    grenadeCooldownUntil: 0,

    // Simple explosion FX (visual only)
    explosions: [], // { x,z, bornAt, lifeMs }

    // Timers (visual/ui)
    nextFireAt: 0,
    crossHitUntil: 0,
    gunFireUntil: 0,
    opHitUntil: 0,
    flashUntil: 0,
    gunAnimFrame: 0,
    gunAnimTick: 0,

    // Map
    mapIndex: 0,

    // floor render buffer (low-res)
    floorCan: null,
    floorCtx: null,
    floorW: 0,
    floorH: 0,

    // Wave flow
    waveIntroUntil: 0,
    waveEnemiesSpawned: false,
    pendingWaveDelayMs: 0,  
  };

  const U = {
    clamp(v,a,b){ return Math.max(a, Math.min(b, v)); },
  };

  // Build a list of safe world positions centered in open tiles.
  // We also reject tiles too close to walls (radius check), so enemies never spawn “clipping”.
  function buildSpawnPointsForMap(mapIndex) {
    const m = MAPS[mapIndex] || MAPS[0];
    const h = m.length;
    const w = m[0].length;

    function isWallAtMap(wx, wz) {
      const tx = Math.floor(wx / TILE);
      const tz = Math.floor(wz / TILE);
      if (tz < 0 || tz >= h || tx < 0 || tx >= w) return true;
      return m[tz][tx] === "1";
    }

    function isFreeForRadiusMap(x, z, r) {
      return (
        !isWallAtMap(x, z) &&
        !isWallAtMap(x + r, z) &&
        !isWallAtMap(x - r, z) &&
        !isWallAtMap(x, z + r) &&
        !isWallAtMap(x, z - r)
      );
    }

    const pts = [];
    for (let tz = 0; tz < h; tz++) {
      for (let tx = 0; tx < w; tx++) {
        if (m[tz][tx] === "1") continue;

        const x = (tx + 0.5) * TILE;
        const z = (tz + 0.5) * TILE;

        if (!isFreeForRadiusMap(x, z, 0.26)) continue;
        pts.push({ x, z, tx, tz });
      }
    }

    return pts;
  }

  // Cache spawn points per map index
  const MAP_SPAWNS = MAPS.map((_, i) => buildSpawnPointsForMap(i));

  function tryMoveWithCollision(dx, dz) {
    const r = 0.18; // player radius (tweak: 0.14–0.25)

    // proposed next
    const nx = S.px + dx;
    const nz = S.pz + dz;

    // X move (check in 3 points vertically to reduce corner snag)
    if (
      !isWallAt(nx + r, S.pz) &&
      !isWallAt(nx - r, S.pz) &&
      !isWallAt(nx, S.pz + r) &&
      !isWallAt(nx, S.pz - r)
    ) {
      S.px = nx;
    }

    // Z move
    if (
      !isWallAt(S.px, nz + r) &&
      !isWallAt(S.px, nz - r) &&
      !isWallAt(S.px + r, nz) &&
      !isWallAt(S.px - r, nz)
    ) {
      S.pz = nz;
    }

    // keep player inside map bounds (small padding)
    S.px = U.clamp(S.px, MAP_MIN_X + r, MAP_MAX_X - r);
    S.pz = U.clamp(S.pz, MAP_MIN_Z + r, MAP_MAX_Z - r);
  }

  function moveEnemyWithCollision(e, dx, dz) {
    const r = enemyRadius(e.type);

    const nx = e.x + dx;
    const nz = e.z + dz;

    // X slide
    if (
      !isWallAt(nx + r, e.z) &&
      !isWallAt(nx - r, e.z) &&
      !isWallAt(nx, e.z + r) &&
      !isWallAt(nx, e.z - r)
    ) {
      e.x = nx;
    }

    // Z slide
    if (
      !isWallAt(e.x, nz + r) &&
      !isWallAt(e.x, nz - r) &&
      !isWallAt(e.x + r, nz) &&
      !isWallAt(e.x - r, nz)
    ) {
      e.z = nz;
    }

    // keep inside map
    e.x = U.clamp(e.x, MAP_MIN_X + r, MAP_MAX_X - r);
    e.z = U.clamp(e.z, MAP_MIN_Z + r, MAP_MAX_Z - r);
  }

  function moveBossWithCollision(b, dx, dz) {
    const r = CFG.boss.radius;

    const nx = b.x + dx;
    const nz = b.z + dz;

    if (
      !isWallAt(nx + r, b.z) &&
      !isWallAt(nx - r, b.z) &&
      !isWallAt(nx, b.z + r) &&
      !isWallAt(nx, b.z - r)
    ) {
      b.x = nx;
    }

    if (
      !isWallAt(b.x, nz + r) &&
      !isWallAt(b.x, nz - r) &&
      !isWallAt(b.x + r, nz) &&
      !isWallAt(b.x - r, nz)
    ) {
      b.z = nz;
    }

    b.x = U.clamp(b.x, MAP_MIN_X + r, MAP_MAX_X - r);
    b.z = U.clamp(b.z, MAP_MIN_Z + r, MAP_MAX_Z - r);
  }

  function isFreeForRadius(x, z, r) {
    return (
      !isWallAt(x, z) &&
      !isWallAt(x + r, z) &&
      !isWallAt(x - r, z) &&
      !isWallAt(x, z + r) &&
      !isWallAt(x, z - r)
    );
  }

  function enemyRadius(type) {
    if (type === "tank") return 0.22;
    if (type === "fast") return 0.16;
    if (type === "sniper") return 0.17; 
    return 0.18; 
  }

  function isFreeForEnemySpawn(x, z, type, existing) {
    const r = enemyRadius(type);

    // wall-safe
    if (!isFreeForRadius(x, z, r)) return false;

    // don't spawn too close to player
    if (Math.hypot(x - S.px, z - S.pz) < 3.0) return false;

    // check against enemies being spawned this wave
    for (const o of existing) {
      const or = enemyRadius(o.type);
      if (Math.hypot(x - o.x, z - o.z) < r + or + 0.15) return false;
    }

    // ✅ NEW: check against ALL current enemies
    for (const o of S.enemies) {
      if (o.hp <= 0) continue;
      const or = enemyRadius(o.type);
      if (Math.hypot(x - o.x, z - o.z) < r + or + 0.15) return false;
    }

    return true;
  }

  function clearContinueMode() {
    ui.btnContinue.dataset.mode = "";
    if (el.hbModalContinueBtn) el.hbModalContinueBtn.dataset.mode = "";
  }

  function resizeCanvas() {
    const c = ui.canvas;
    const rect = c.getBoundingClientRect();
    c.width = Math.floor(rect.width * devicePixelRatio);
    c.height = Math.floor(rect.height * devicePixelRatio);
    ui.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    S.cw = rect.width;
    S.ch = rect.height;
    ensureFloorBuffer();
  }

  function ensureFloorBuffer() {
    // scale factor: higher = faster but blurrier/pixelier
    const scale = 2; // try 3 or 4 (4 is very fast)

    const w = Math.max(120, (S.cw / scale) | 0);
    const h = Math.max(90,  (S.ch / scale) | 0);

    if (S.floorCan && S.floorW === w && S.floorH === h) return;

    S.floorCan = document.createElement("canvas");
    S.floorCan.width = w;
    S.floorCan.height = h;
    S.floorCtx = S.floorCan.getContext("2d", { alpha: true });

    // keep it crisp when scaled up
    S.floorCtx.imageSmoothingEnabled = false;

    S.floorW = w;
    S.floorH = h;
  }
  //#endregion
  //#region 4) Persistence
  /*---------------------------------------------------*/ 
  // Session persistence key 
  const DONE_KEY = SESSION_KEYS.heartBlasterDone;
  const STATE_KEY = SESSION_KEYS.heartBlasterState;
 
  function saveState() {
    const state = {
      ready: S.ready,
      running: S.running,
      over: S.over,
      won: S.won,
      yaw: S.yaw,
      pitch: S.pitch,
      wave: S.wave,
      hp: S.hp,
      kills: S.kills,
      shots: S.shots,
      projectiles: S.projectiles.map(p => ({
        x: p.x, z: p.z, vx: p.vx, vz: p.vz,
        lifeUntil: p.lifeUntil, damage: p.damage, from: p.from
      })),
      hits: S.hits,
      px: S.px,
      pz: S.pz,
      enemies: S.enemies.map((e) => ({
        type: e.type,
        hp: e.hp,
        x: e.x,
        z: e.z,
        hurtUntil: e.hurtUntil,
        deadUntil: e.deadUntil,
      })),
      mapIndex: S.mapIndex,
      boss: S.boss
        ? {
            hp: S.boss.hp,
            hpMax: S.boss.hpMax,
            x: S.boss.x,
            z: S.boss.z,
            hurtUntil: S.boss.hurtUntil,
            deadUntil: S.boss.deadUntil,
            strafeSign: S.boss.strafeSign,
            nextRetargetAt: S.boss.nextRetargetAt,
            face: S.boss.face,
            faceLockUntil: S.boss.faceLockUntil,
            minionsStartDone: !!S.boss.minionsStartDone,
            minionsHalfDone: !!S.boss.minionsHalfDone,
            minionMilestonesDone: S.boss.minionMilestonesDone || {},
            staggerUntil: S.boss.staggerUntil,
          }
        : null,
      weaponId: S.weaponId,
      ammo: S.ammo,
      ammoMax: S.ammoMax,
      pickup: S.pickup ? { ...S.pickup } : null,
      ammoType: S.ammoType,
      grenades: S.grenades,
      nextAmmoPickupAt: S.nextAmmoPickupAt,
      nextGrenadePickupAt: S.nextGrenadePickupAt,
      nextHealthPickupAt: S.nextHealthPickupAt,
      explosions: (S.explosions || []).map(ex => ({ x: ex.x, z: ex.z, bornAt: ex.bornAt, lifeMs: ex.lifeMs })),
    };
    saveJSON(STATE_KEY, state);
  }

  function loadState() {
    const state = loadJSON(STATE_KEY, null);
    if (!state) return false;

    S.ready = !!state.ready;
    S.running = !!state.running;
    S.over = !!state.over;
    S.won = !!state.won;

    S.yaw = Number(state.yaw || 0);
    S.pitch = Number(state.pitch || 0);

    S.wave = Number(state.wave || 1);
    S.hp = Number(state.hp || CFG.hpStart);
    S.kills = Number(state.kills || 0);
    S.shots = Number(state.shots || 0);
    S.hits = Number(state.hits || 0);

    S.projectiles = Array.isArray(state.projectiles) ? state.projectiles.map(p => ({
      x: Number(p.x||0), z: Number(p.z||0),
      vx: Number(p.vx||0), vz: Number(p.vz||0),
      lifeUntil: Number(p.lifeUntil||0),
      damage: Number(p.damage||1),
      from: p.from || "player",
    })) : [];

    S.weaponId = state.weaponId || "pistol";
    S.ammo = Number.isFinite(state.ammo) ? state.ammo : WEAPONS.pistol.ammoStart;
    S.ammoMax = Number.isFinite(state.ammoMax) ? state.ammoMax : WEAPONS.pistol.ammoMax;
    S.pickup = state.pickup || null;

    S.ammoType = state.ammoType || "normal";
    S.grenades = Number.isFinite(state.grenades) ? state.grenades : 0;
    S.nextAmmoPickupAt = Number.isFinite(state.nextAmmoPickupAt) ? state.nextAmmoPickupAt : 0;
    S.nextGrenadePickupAt = Number.isFinite(state.nextGrenadePickupAt) ? state.nextGrenadePickupAt : 0;
    S.nextHealthPickupAt = Number.isFinite(state.nextHealthPickupAt) ? state.nextHealthPickupAt : 0;

    S.explosions = Array.isArray(state.explosions)
      ? state.explosions.map(ex => ({
          x: Number(ex.x || 0),
          z: Number(ex.z || 0),
          bornAt: Number(ex.bornAt || performance.now()),
          lifeMs: Number(ex.lifeMs || 260),
        }))
      : [];

    // ✅ restore map FIRST (before px/pz and enemies)
    S.mapIndex = U.clamp(Number(state.mapIndex || 0), 0, MAPS.length - 1);
    applyMap(S.mapIndex);

    // then restore player pos (applyMap will clamp safely if needed)
    S.px = Number(state.px || 0);
    S.pz = Number(state.pz || 0);
    S.px = U.clamp(S.px, MAP_MIN_X + 0.5, MAP_MAX_X - 0.5);
    S.pz = U.clamp(S.pz, MAP_MIN_Z + 0.5, MAP_MAX_Z - 0.5);

    const now = performance.now();
    S.enemies = Array.isArray(state.enemies)
      ? state.enemies.map((e) => ({
          type: e.type || "normal",
          hp: Number(e.hp || 1),
          x: Number(e.x || 0),
          z: Number(e.z || 0),
          animSeed: Math.random() * 1000,
          lastX: Number(e.x || 0),
          lastZ: Number(e.z || 0),
          hurtUntil: Math.min(Number(e.hurtUntil || 0), now + 120),
          deadUntil: 0,
        }))
      : [];

    S.boss = state.boss
      ? {
          hp: Number(state.boss.hp || CFG.boss.hp),
          hpMax: Number(state.boss.hpMax || CFG.boss.hp),
          x: Number(state.boss.x || 0),
          z: Number(state.boss.z || 0),
          hurtUntil: Math.min(Number(state.boss.hurtUntil || 0), now + 120),
          deadUntil: Number(state.boss.deadUntil || 0),
          strafeSign: Number(state.boss.strafeSign || 1),
          nextRetargetAt: Number(
            state.boss.nextRetargetAt || now + CFG.boss.retargetMs,
          ),
          face: state.boss.face || "R",
          faceLockUntil: Number(state.boss.faceLockUntil || 0),
          minionsStartDone: !!state.boss.minionsStartDone,
          minionsHalfDone: !!state.boss.minionsHalfDone,
          minionMilestonesDone: state.boss.minionMilestonesDone || {},
          staggerUntil: Number(state.boss.staggerUntil || 0),
        }
      : null;

    return true;
  }

  let _lastSaveAt = 0;
  function requestSave(force = false) {
    const now = performance.now();
    if (force || now - _lastSaveAt >= (CFG.debug?.saveThrottleMs ?? 250)) {
      _lastSaveAt = now;
      saveState();
    }
  }

  function clearState() {
    sessionStorage.removeItem(STATE_KEY);
  }

  //DEV HOT KEY 
  function devSkipToBoss() {
    // stop any running loop safely
    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = null;

    // ✅ IMPORTANT: clear any "game over / win" lockouts
    S.over = false;
    S.won = false;

    // clear movement
    clearMoveKeys();

    // (optional) hide continue buttons so you don't land in a weird UI state
    ui.btnContinue?.classList.add("hidden");
    el.hbModalContinueBtn?.classList.add("hidden");

    // set wave to boss wave
    S.wave = BOSS_WAVE;

    // switch to boss arena map + clear entities
    switchMapForWave(S.wave);

    // spawn boss + any minions for that wave
    startWave(S.wave, 2000);

    // show the "FINAL BOSS" overlay and wait for click to start
    updateHUD();
    pauseForWaveIntro(S.wave, { keepPointerLock: true });

    saveState();
    draw();
  }

  function devSkipToBossPhase2() {
    S.over = false;
    S.won = false;

    if (!CFG.debug?.devSkipBoss) return;     // reuse your dev flag
    if (S.wave !== BOSS_WAVE) return;        // only in boss wave
    if (!S.boss) return;

    // Force boss into phase 2 (<= 50% HP)
    const targetFrac = 0.49; // below 0.5 to guarantee phase2
    S.boss.hp = Math.max(1, Math.floor(S.boss.hpMax * targetFrac));

    // Optional: trigger a quick hurt flash so it’s obvious
    const now = performance.now();
    S.boss.hurtUntil = now + (CFG.boss?.hurtFlashMs ?? 140);

    // Make sure half-phase minions/pickup will still trigger once
    S.boss.minionsHalfDone = false;

    updateHUD();
    requestSave(true);
  }
  //#endregion
  //#region 5) Map + Spawning
  /*---------------------------------------------------*/ 
  //Smarter Player Spawn (Markers + Safe Spawn Fallback)
  CFG.spawn = Object.assign({
    markerChar: "S",      // put 'S' in your map strings
    playerRadius: 0.18,   // match tryMoveWithCollision radius
    wallClear: 0.12,      // extra clearance beyond radius
    enemyClear: 2.0,      // prefer farther from enemies if any exist
    debug: false,
  }, CFG.spawn || {});

  S.debugSpawn = S.debugSpawn || { chosen: null, candidates: [] };

  function mapCharAt(tx, tz) {
    if (tz < 0 || tz >= MAP_H || tx < 0 || tx >= MAP_W) return "1";
    const row = MAP[tz];
    return row ? row[tx] : "1";
  }

  function isOpenTileForSpawn(tx, tz) {
    return mapCharAt(tx, tz) !== "1";
  }

  function tileCenterWorld(tx, tz) {
    return { x: (tx + 0.5) * TILE, z: (tz + 0.5) * TILE };
  }

  function isWallNearWorld(x, z, r) {
    // Circle sampling for clearance
    const steps = 12;
    if (isWallAt(x, z)) return true;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const sx = x + Math.cos(a) * r;
      const sz = z + Math.sin(a) * r;
      if (isWallAt(sx, sz)) return true;
    }
    return false;
  }

  function scoreSpawnPoint(x, z) {
    // Prefer more wall clearance + more distance from enemies (if present)
    let wallClear = 0;
    const maxProbe = 3.0;
    const step = 0.25;
    for (let r = step; r <= maxProbe; r += step) {
      if (isWallNearWorld(x, z, r)) break;
      wallClear = r;
    }

    let enemyMin = 1.5; // if no enemies yet
    if (S.enemies && S.enemies.length) {
      enemyMin = Infinity;
      for (const e of S.enemies) {
        if (e.hp <= 0) continue;
        const d = Math.hypot(e.x - x, e.z - z);
        if (d < enemyMin) enemyMin = d;
      }
      enemyMin = Math.min(4.0, enemyMin);
    }

    return wallClear * 2.0 + enemyMin * 1.0;
  }

  function findMarkerSpawns(markerChar = CFG.spawn.markerChar) {
    const out = [];
    for (let tz = 0; tz < MAP_H; tz++) {
      const row = MAP[tz];
      if (!row) continue;
      for (let tx = 0; tx < MAP_W; tx++) {
        if (row[tx] === markerChar) out.push(tileCenterWorld(tx, tz));
      }
    }
    return out;
  }

  function chooseSafeSpawn() {
    S.debugSpawn.candidates = [];
    S.debugSpawn.chosen = null;

    const safeR = (CFG.spawn.playerRadius ?? 0.18) + (CFG.spawn.wallClear ?? 0.12);

    // 1) marker preference (MULTI-S SUPPORT: randomize among valid markers)
    const markers = findMarkerSpawns();
    if (markers.length) {
      const valid = [];
      let bestScore = -Infinity;

      for (const p of markers) {
        if (isWallNearWorld(p.x, p.z, safeR)) continue;

        const sc = scoreSpawnPoint(p.x, p.z);
        valid.push({ x: p.x, z: p.z, score: sc });

        S.debugSpawn.candidates.push({ x: p.x, z: p.z, score: sc, kind: "marker" });
        if (sc > bestScore) bestScore = sc;
      }

      if (valid.length) {
        // Keep randomness but avoid awful picks:
        // choose randomly among the top tier (within 85% of best score)
        const cutoff = bestScore * 0.85;
        const top = valid.filter(v => v.score >= cutoff);

        const pickFrom = top.length ? top : valid;
        const pick = pickFrom[(Math.random() * pickFrom.length) | 0];

        S.debugSpawn.chosen = { x: pick.x, z: pick.z, reason: "marker-rand" };
        return pick;
      }
      // if all markers invalid, fall through to scan
    }


    // 2) fallback scan of open tiles
    let best = null, bestScore = -Infinity;

    for (let tz = 0; tz < MAP_H; tz++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        if (!isOpenTileForSpawn(tx, tz)) continue;

        const p = tileCenterWorld(tx, tz);
        if (isWallNearWorld(p.x, p.z, safeR)) continue;

        const sc = scoreSpawnPoint(p.x, p.z);
        S.debugSpawn.candidates.push({ x: p.x, z: p.z, score: sc, kind: "scan" });

        if (sc > bestScore) { bestScore = sc; best = p; }
      }
    }

    if (best) {
      S.debugSpawn.chosen = { x: best.x, z: best.z, reason: "scan" };
      return best;
    }

    // 3) last resort
    const fb = { x: 1.5 * TILE, z: 1.5 * TILE };
    S.debugSpawn.chosen = { x: fb.x, z: fb.z, reason: "fallback" };
    return fb;
  }

  function placePlayerAtSafeSpawn() {
    const p = chooseSafeSpawn();
    S.px = p.x;
    S.pz = p.z;

    // pick a yaw that doesn't immediately face a wall (deterministic)
    const dirs = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    for (const a of dirs) {
      const fx = S.px + Math.cos(a) * 0.8;
      const fz = S.pz + Math.sin(a) * 0.8;
      if (!isWallAt(fx, fz)) { S.yaw = a; break; }
    }
  }
  
  function spawnBossForFinalWave() {
    const spawns = MAP_SPAWNS[S.mapIndex] || [];

    // pick a spawn far from player
    let pick = spawns[0];
    let bestD = -1;
    for (const p of spawns) {
      const d = Math.hypot(p.x - S.px, p.z - S.pz);
      if (d > bestD) {
        bestD = d;
        pick = p;
      }
    }

    const hpMax = CFG.boss?.hp ?? 140;

    S.boss = {
      hp: hpMax,
      hpMax,
      x: pick ? pick.x : MAP_W * TILE * 0.5,
      z: pick ? pick.z : MAP_H * TILE * 0.5,
      hurtUntil: 0,
      deadUntil: 0,

      // facing support (optional but recommended)
      lastX: pick ? pick.x : MAP_W * TILE * 0.5,
      lastZ: pick ? pick.z : MAP_H * TILE * 0.5,
      face: "R",
      faceLockUntil: 0,
      faceXAcc: 0,
      strafeSign: Math.random() < 0.5 ? -1 : 1,
      nextRetargetAt: performance.now() + (CFG.boss?.retargetMs ?? 420),

      minionsStartDone: false,
      minionsHalfDone: false,

      minionMilestonesDone: {}, 

      staggerUntil: 0,

      roamUntil: 0,
      roamX: 0,
      roamZ: 0,

      stuckSince: 0,
      stuckLastX: pick ? pick.x : MAP_W * TILE * 0.5,
      stuckLastZ: pick ? pick.z : MAP_H * TILE * 0.5,
    };
  }

  // Compatibility helper: old calls expect spawnBossMinions(count)
  // We'll interpret it as "spawn N normal minions"
  function spawnBossMinions(count = 3) {
    spawnBossMinionsMix({ normal: count | 0 });
  }

  function spawnBossMinionsMix(wantsByType = {}) {
    if (S.wave !== BOSS_WAVE) return;

    // Alive minions right now
    const alive = S.enemies.filter(e => e.hp > 0).length;

    const cap = Number.isFinite(CFG.boss?.minionCap) ? CFG.boss.minionCap : 10;
    const room = Math.max(0, cap - alive);
    if (room <= 0) return;

    // Expand wants into a spawn queue: ["normal","normal","fast"...]
    const queue = [];
    for (const [type, n] of Object.entries(wantsByType)) {
      for (let i = 0; i < (n | 0); i++) queue.push(type);
    }

    if (!queue.length) return;

    // If cap would be exceeded, trim
    queue.length = Math.min(queue.length, room);

    const list = []; // new spawns this call (for spacing)
    const spawns = MAP_SPAWNS[S.mapIndex] || [];

    for (const type of queue) {
      let x, z;
      let spawned = false;

      for (let tries = 0; tries < 250; tries++) {
        if (!spawns.length) break;
        const pick = spawns[(Math.random() * spawns.length) | 0];
        x = pick.x; z = pick.z;

        if (isFreeForEnemySpawn(x, z, type, list)) {
          spawned = true;
          break;
        }
      }

      if (!spawned) {
        const sp = spawns[0];
        x = sp ? sp.x : S.px;
        z = sp ? sp.z : S.pz;
      }

      const hp = CFG.enemyHP?.[type] ?? 1;

      list.push({
        type,
        hp,
        x,
        z,
        hurtUntil: 0,
        deadUntil: 0,
        animSeed: Math.random() * 1000,
        lastX: x,
        lastZ: z,
      });
    }

    S.enemies.push(...list);
  }

  function canSpawnPickupHere(x, z) {
    const r = 0.22;               // pickup “body” radius
    const extra = 0.06;           // tiny buffer so it never looks like it clips
    if (isWallNearWorld(x, z, r + extra)) return false;

    // not too close to player
    if (Math.hypot(x - S.px, z - S.pz) < (CFG.pickups?.minDistFromPlayer ?? 3.0)) return false;

    // avoid boss/enemies so it doesn't spawn inside bodies
    if (S.boss && S.boss.hp > 0 && Math.hypot(x - S.boss.x, z - S.boss.z) < 1.25) return false;
    for (const e of S.enemies) {
      if (e.hp <= 0) continue;
      if (Math.hypot(x - e.x, z - e.z) < 0.9) return false;
    }
    return true;
  }

  function pickSpawnPointFar() {
    const spawns = MAP_SPAWNS[S.mapIndex] || [];
    if (!spawns.length) return null;

    // pick the best among a few random tries (fast and stable)
    let best = null;
    let bestD = -1;

    const tries = Math.min(24, spawns.length);
    for (let i = 0; i < tries; i++) {
      const p = spawns[(Math.random() * spawns.length) | 0];
      if (!canSpawnPickupHere(p.x, p.z)) continue;
      const d = Math.hypot(p.x - S.px, p.z - S.pz);
      if (d > bestD) { bestD = d; best = p; }
    }

    // fallback: linear scan
    if (!best) {
      for (const p of spawns) {
        if (!canSpawnPickupHere(p.x, p.z)) continue;
        const d = Math.hypot(p.x - S.px, p.z - S.pz);
        if (d > bestD) { bestD = d; best = p; }
      }
    }

    return best;
  }

  function spawnAmmoPickup(kind = "ammo") {
    if (S.pickup) return; // only one pickup at a time
    const p = pickSpawnPointFar();
    if (!p) return;

    S.pickup = {
      type: kind, // "ammo" | "ammoBoost"
      x: p.x,
      z: p.z,
      ttlUntil: performance.now() + (CFG.pickups?.pickupTTLms ?? 20000),
    };
  }

  function spawnGrenadePickup() {
    if (S.pickup) return;
    const p = pickSpawnPointFar();
    if (!p) return;

    S.pickup = {
      type: "grenade",
      x: p.x,
      z: p.z,
      ttlUntil: performance.now() + (CFG.pickups?.pickupTTLms ?? 20000),
    };
  }

  function spawnHealthPickup() {
    if (S.pickup) return;
    const p = pickSpawnPointFar();
    if (!p) return;

    S.pickup = {
      type: "health",
      x: p.x,
      z: p.z,
      ttlUntil: performance.now() + (CFG.pickups?.pickupTTLms ?? 20000),
    };
  }

  function schedulePickupSpawns(now) {
    // If a pickup exists, don't spawn another
    if (S.pickup) return;

    const inBoss = (S.wave === BOSS_WAVE);
    const hpFrac = (S.boss && S.boss.hpMax) ? (S.boss.hp / S.boss.hpMax) : 1;

    // ---- Ammo pickup: ALL waves ----
    // boss wave can use ammoBoost in phase 2+ (<= 50%)
    const wantBoost = inBoss && S.boss && S.boss.hp > 0 && hpFrac <= 0.5;

    if (now >= (S.nextAmmoPickupAt || 0)) {
      spawnAmmoPickup(wantBoost ? "ammoBoost" : "ammo");

      const cd = inBoss
        ? (CFG.pickups?.ammoSpawnEveryMs ?? 14000)
        : (CFG.pickups?.ammoSpawnEveryNormal ?? 22000);

      S.nextAmmoPickupAt = now + cd;
      requestSave(false);
      return;
    }

    // ---- Health pickup: ALL waves ----
    if (now >= (S.nextHealthPickupAt || 0)) {
      spawnHealthPickup();

      const cd = inBoss
        ? (CFG.pickups?.healthSpawnEveryMs ?? 26000)
        : (CFG.pickups?.healthSpawnEveryNormal ?? 32000);

      S.nextHealthPickupAt = now + cd;
      requestSave(false);
      return;
    }

    // ---- Grenade pickup: boss wave only ----
    if (inBoss && now >= (S.nextGrenadePickupAt || 0)) {
      spawnGrenadePickup();
      S.nextGrenadePickupAt = now + (CFG.pickups?.grenadeSpawnEveryMs ?? 18000);
      requestSave(false);
      return;
    }
  }

  function startWave(waveNum, delayMs = 2000) {
    // mark wave and arm the delay
    S.wave = waveNum;
    S.waveEnemiesSpawned = false;
    S.waveIntroUntil = performance.now() + (delayMs || 0);

    // ✅ start/refresh pickup timers when a wave starts (keep your current behavior)
    const now = performance.now();
    S.nextAmmoPickupAt = now + 1200;
    S.nextGrenadePickupAt = now + 2200;
    S.nextHealthPickupAt = now + 5200;

    // ✅ refill ammo at the start of each new wave
    const WPN = getWeaponDef(S.weaponId);
    const start = CFG.waveAmmoStart ?? 10;
    S.ammoMax = WPN.ammoMax;
    S.ammo = Math.min(start, S.ammoMax);

    // Boss wave: spawn boss immediately, but delay minions if you want (optional)
    if (waveNum === BOSS_WAVE) {
      if (!S.boss) spawnBossForFinalWave();
      // We'll still delay the minions spawn via update() (see below)
    }
  }

  function spawnWave(waveNum) {
    const w = CFG.waves[waveNum - 1] || CFG.waves[CFG.waves.length - 1];
    const list = [];
    // ✅ start/refresh pickup timers when a wave spawns
    const now = performance.now();
    S.nextAmmoPickupAt = now + 1200; // first ammo appears shortly after wave starts
    S.nextGrenadePickupAt = now + 2200; // (grenades still boss-only below)
    S.nextHealthPickupAt = now + 5200; // first health appears a bit later
    // ✅ refill ammo at the start of each new wave
    {
      const WPN = getWeaponDef(S.weaponId);
      const start = CFG.waveAmmoStart ?? 10;

      // keep within that weapon’s max
      S.ammoMax = WPN.ammoMax;
      S.ammo = Math.min(start, S.ammoMax);
    }

    // --- Boss wave (Wave 6) ---
    if (waveNum === BOSS_WAVE) {
      // If boss doesn't exist, create it (only once)
      if (!S.boss) spawnBossForFinalWave();

      // Start-of-fight minions (only once)
      if (S.boss && !S.boss.minionsStartDone) {
        spawnBossMinions(CFG.boss.minionsStart ?? 3);
        S.boss.minionsStartDone = true;
      }

      return;
    }

    function push(type, n) {
      for (let i = 0; i < n; i++) {
        // ✅ fixed HP per enemy type (no wave scaling)
        const hp = CFG.enemyHP[type] ?? 1;

        let x, z;
        let spawned = false;

        const spawns = MAP_SPAWNS[S.mapIndex] || [];

        for (let tries = 0; tries < 250; tries++) {
          if (!spawns.length) break;

          const pick = spawns[Math.floor(Math.random() * spawns.length)];
          x = pick.x;
          z = pick.z;

          if (isFreeForEnemySpawn(x, z, type, list)) {
            spawned = true;
            break;
          }
        }

        if (!spawned) {
          const sp = (MAP_SPAWNS[S.mapIndex] || [])[0];
          if (sp) {
            x = sp.x;
            z = sp.z;
          } else {
            x = S.px;
            z = S.pz;
          }
        }

        list.push({
          type,
          hp,
          x,
          z,
          hurtUntil: 0,
          deadUntil: 0,
          // animation helpers (not persisted, safe defaults)
          animSeed: Math.random() * 1000,
          lastX: x,
          lastZ: z,
        });
      }
    }

    push("normal", w.normal);
    push("tank", w.tank);
    push("fast", w.fast);
    push("sniper", w.sniper || 0);

    S.enemies = list;
  }

  function enemySpeed(type) {
    if (type === "fast") return CFG.speedFast;
    if (type === "tank") return CFG.speedTank;
    if (type === "sniper") return CFG.speedSniper;
    return CFG.speedNormal;
  }

  function projectEnemy(e) {
    // world delta
    const dx = e.x - S.px;
    const dz = e.z - S.pz;

    // distance
    const dist = Math.hypot(dx, dz);
    const z = Math.max(0.001, dist);

    // angle from player to enemy
    const angTo = Math.atan2(dz, dx);

    // relative to where player is looking (yaw)
    let rel = angTo - S.yaw;

    // wrap to [-PI, PI]
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;

    // FOV handling
    const FOV = VIEW_FOV;
    const half = FOV / 2;

    // if behind or far outside view, skip
    if (Math.abs(rel) > half) return null;

    // screen x from relative angle
    const nx = rel / half; // -1..1
    const x = S.cw / 2 + nx * (S.cw / 2);

    // simple vertical placement (you can later use pitch)
    const y = S.ch / 2 + S.pitch * (S.ch * 0.28);

    // size scales with distance
    const minDim = Math.min(S.cw, S.ch);
    const base = minDim * 0.26;
    const typeScale = SPR_VISUAL_SCALE[e.type] || 1.0;
    const size = U.clamp((base * typeScale) / (z * 0.55), 22, minDim * 0.62);

    return { x, y, size, dist: z, rel };
  }

  function projectWorldPoint(wx, wz) {
    const dx = wx - S.px;
    const dz = wz - S.pz;

    const dist = Math.hypot(dx, dz);
    const z = Math.max(0.001, dist);

    const angTo = Math.atan2(dz, dx);
    let rel = angTo - S.yaw;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;

    const half = VIEW_FOV / 2;
    if (Math.abs(rel) > half) return null;

    const nx = rel / half;
    const x = S.cw / 2 + nx * (S.cw / 2);

    // keep same vertical rule as enemies so it “sits” in the world consistently
    const y = S.ch / 2 + S.pitch * (S.ch * 0.28);

    return { x, y, dist: z, rel };
  }

  function projectBoss(b) {
    const dx = b.x - S.px;
    const dz = b.z - S.pz;

    const dist = Math.hypot(dx, dz);
    const z = Math.max(0.001, dist);

    const angTo = Math.atan2(dz, dx);
    let rel = angTo - S.yaw;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;

    const FOV = VIEW_FOV;
    const half = FOV / 2;
    if (Math.abs(rel) > half) return null;

    const nx = rel / half;
    const x = S.cw / 2 + nx * (S.cw / 2);
    const y = S.ch / 2 + S.pitch * (S.ch * 0.28);

    const minDim = Math.min(S.cw, S.ch);
    const base = minDim * 0.45 * CFG.boss.sizeMult;
    const size = U.clamp(base / (z * 0.55), 44, minDim * 0.82);

    return { x, y, size, dist: z, rel };
  }

  function takeDamage(amount = 10) {
    if (CFG.debug.godMode) return;

    const now = performance.now();
    if (now - S.lastDamageAt < S.damageCooldownMs) return;

    S.lastDamageAt = now;

    S.hp = Math.max(0, S.hp - amount);
    playSfx(SFX.player_pain);
    S.opHitUntil = now + 160;

    triggerHitFlash(120);

    updateHUD();

    if (S.hp <= 0) {
      playSfx(SFX.player_death);
      setGameOverOverlay(false);
    }
  }

  function applyEnemySeparation(dt) {
    const ents = S.enemies;
    const n = ents.length;
    if (n < 2) return;

    // tuning
    const strength = 0.0016; // separation push strength (tweak 0.0012–0.0024)
    const buffer = 0.08; // extra spacing beyond radii
    const maxPush = 0.03; // cap per frame so it doesn't jitter

    for (let i = 0; i < n; i++) {
      const a = ents[i];
      if (a.hp <= 0) continue;

      for (let j = i + 1; j < n; j++) {
        const b = ents[j];
        if (b.hp <= 0) continue;

        const ar = enemyRadius(a.type);
        const br = enemyRadius(b.type);

        const dx = b.x - a.x;
        const dz = b.z - a.z;

        const dist = Math.hypot(dx, dz) || 1e-6;
        const minD = ar + br + buffer;

        // only push if overlapping / too close
        if (dist >= minD) continue;

        // penetration amount (0..)
        const overlap = minD - dist;

        // direction from A to B
        const nx = dx / dist;
        const nz = dz / dist;

        // push half each (scaled by overlap + dt)
        let push = overlap * strength * (dt / 16);
        push = Math.min(push, maxPush);

        // move away from each other, respecting walls via your collision mover
        moveEnemyWithCollision(a, -nx * push, -nz * push);
        moveEnemyWithCollision(b, nx * push, nz * push);
      }
    }
  }

  function shoot() {
    if (S.over) return;
    const now = performance.now();
    const WPN = getWeaponDef(S.weaponId);

    if (now < S.nextFireAt) return;
    S.nextFireAt = now + WPN.fireCooldownMs;

    // if overlay is up, first click starts
    if (S.ready) {
      beginRun();
      return;
    }
    if (!S.running) return;

    // Ammo check/consume
    if (!WPN.infiniteAmmo) {
      if (S.ammo <= 0) return; // empty click later if you want
      S.ammo = Math.max(0, S.ammo - 1);

      // ✅ If minigun runs out, auto-swap back to pistol
      if (S.ammo <= 0 && S.weaponId === "minigun") {
        const p = getWeaponDef("pistol");
        S.weaponId = p.id;
        S.ammoMax = p.ammoMax;
        // start pistol with 0 (or 5 if you prefer). I’d do 0 so they must pick up ammo.
        S.ammo = 0;
        S.ammoType = "normal";
        updateHUD();
        requestSave(true);
        return; // stop this shot chain cleanly
      }

      // if any weapon hits 0 ammo, clear boost flag
      if (S.ammo <= 0) {
        S.ammoType = "normal";
      }
      // ✅ make sure HUD ammo updates even if you miss
      updateHUD();
    }

    S.shots++;
    S.gunFireUntil = now + 110;

    if (S.weaponId === "minigun") {
      playSfx(SFX.minigun_shoot);
    } else {
      playSfx(SFX.pistol_shoot);
    }

    // find best target near crosshair
    const cx = S.cw / 2;
    const cy = S.ch / 2;

    let best = null;
    let bestD = 1e9;

    // --- Boss targeting (final wave) ---
    if (S.boss && S.boss.hp > 0) {
      const bp = projectBoss(S.boss);
      if (bp) {
        const d = Math.hypot(bp.x - cx, bp.y - cy);
        // "best" shape matches enemy path, but tagged as boss
        best = { boss: true, b: S.boss, p: bp, d };
        bestD = d;
      }
    }

    for (const e of S.enemies) {
      if (e.hp <= 0) continue;
      const p = projectEnemy(e);
      if (!p) continue;
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d < bestD) {
        bestD = d;
        best = { e, p, d };
      }
    }

    if (!best) return;

    // ✅ Hit if crosshair is inside enemy's screen-rectangle (with padding)
    const half = best.p.size * 0.5;
    const pad = Math.max(10, best.p.size * 0.1); // extra forgiveness

    const inside =
      Math.abs(best.p.x - cx) <= half + pad &&
      Math.abs(best.p.y - cy) <= half + pad;

    if (inside) {
      S.hits++;
      S.crossHitUntil = now + 90;
      
      // --- Boss hit ---
      if (best.boss && best.b && best.b.hp > 0) {
        playSfx(SFX.boss_hit);
        best.b.hurtUntil = now + CFG.boss.hurtFlashMs;

        // intentionally weak gun vs boss, but boosted ammo hits harder (boss wave phase 2+)
        let dmg = WPN.damage * (WPN.bossDamageScale ?? 1);
        if (S.wave === BOSS_WAVE && S.ammoType === "boost" && !WPN.infiniteAmmo) {
          dmg *= (CFG.pickups?.boostDamageMult ?? 2.25);
        }

        // ✅ APPLY DAMAGE
        best.b.hp = Math.max(0, best.b.hp - dmg);

        // ✅ death hold AFTER damage
        if (best.b.hp <= 0) {
          best.b.deadUntil = now + CFG.boss.deathHoldMs;
          playSfx(SFX.boss_death);

          // stop boss run loop immediately
          try { SFX.boss_run.pause(); SFX.boss_run.currentTime = 0; } catch {}
          best.b.runSoundPlaying = false;
        }
        updateHUD();
        requestSave(false);
        return; // IMPORTANT: don't continue into enemy logic
      }

      // --- Normal enemy hit ---
      playSfx(SFX.enemy_hit);
      best.e.hurtUntil = now + 180;

      // use weapon damage (and optional boost multiplier if you want it to affect minions too)
      let dmg = WPN.damage; 

      best.e.hp = Math.max(0, best.e.hp - dmg);

      if (best.e.hp <= 0) {
        playSfx(SFX.enemy_dead);
        S.kills++;
        best.e.deadUntil = now + 160;
      }

      updateHUD();
      requestSave(true);
      return;
    }
  }

  function throwGrenade() {
    if (S.over || S.ready || !S.running) return;
    if (S.wave !== BOSS_WAVE) return;
    if (!S.grenades || S.grenades <= 0) return;

    const now = performance.now();
    if (now < (S.grenadeCooldownUntil || 0)) return;
    S.grenadeCooldownUntil = now + 420;

    S.grenades--;

    // Spawn grenade projectile from player, forward direction
    const dirX = Math.cos(S.yaw);
    const dirZ = Math.sin(S.yaw);

    S.projectiles.push({
      type: "grenade",
      from: "player",
      x: S.px + dirX * 0.35,
      z: S.pz + dirZ * 0.35,
      lastX: S.px,
      lastZ: S.pz,
      vx: dirX * (CFG.grenade?.speed ?? 0.016),
      vz: dirZ * (CFG.grenade?.speed ?? 0.016),
      bornAt: now,
      lifeUntil: now + (CFG.grenade?.lifeMs ?? 1200),
    });

    updateHUD();
    requestSave(false);
  }

  function grenadeExplode(wx, wz) {
    playSfx(SFX.grenade_explode);
    const now = performance.now();
    triggerFlash(90); // quick white pop

    // visual FX only
    S.explosions = S.explosions || [];
    S.explosions.push({ x: wx, z: wz, bornAt: now, lifeMs: 260 });

    // ===== BOSS: ALWAYS HIT =====
    if (S.boss && S.boss.hp > 0) {
      S.boss.hurtUntil = now + (CFG.boss?.hurtFlashMs ?? 140);

      // boss stagger + stronger hurt flash so boss shows hit sheet
      S.boss.hurtUntil = now + 220;     // longer than normal so it’s obvious
      S.boss.staggerUntil = now + 260;  // freeze movement briefly

      S.boss.hp = Math.max(
        0,
        S.boss.hp - (CFG.grenade?.bossDamage ?? 60)
      );

      if (S.boss.hp <= 0) {
        S.boss.deadUntil = now + (CFG.boss?.deathHoldMs ?? 700);
      }
    }

    // ===== ALL ENEMIES: ALWAYS HIT =====
    const eDmg = CFG.grenade?.enemyDamage ?? 4;

    for (const e of S.enemies) {
      if (e.hp <= 0) continue;

      e.hurtUntil = now + 180;
      e.hp -= eDmg;

      if (e.hp <= 0) {
        S.kills++;
        e.deadUntil = now + 160;
      }
    }

    updateHUD();
    requestSave(false);
  }

  //#endregion
  //#region 6) Simulation 
  /*---------------------------------------------------*/ 
  function pickBossRoamTarget(b) {
    const spawns = MAP_SPAWNS[S.mapIndex] || [];
    if (!spawns.length) return { x: b.x, z: b.z };

    // Try a few random points; prefer ones that are NOT too close to player,
    // and are wall-safe for boss radius
    let best = null;
    let bestScore = -1;

    for (let i = 0; i < 40; i++) {
      const p = spawns[(Math.random() * spawns.length) | 0];

      // boss radius safety
      if (!isFreeForRadius(p.x, p.z, CFG.boss.radius + 0.08)) continue;

      const dp = Math.hypot(p.x - S.px, p.z - S.pz);
      const db = Math.hypot(p.x - b.x, p.z - b.z);

      // prefer: not right on top of player, and not too close to current boss position
      const score = Math.min(dp, 8) + Math.min(db, 6) * 0.6;

      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }

    if (!best) best = spawns[0];
    return { x: best.x, z: best.z };
  }

  function updateBoss(dt) {
    const b = S.boss;
    if (!b) return;

    // stop loop if boss is dead
    if (b.hp <= 0) {
      try { SFX.boss_run.pause(); SFX.boss_run.currentTime = 0; } catch {}
      b.runSoundPlaying = false;
    }

    const now = performance.now();

    // ✅ stagger: boss is “stunned” briefly (still drawable, still hurts if touching)
    if (now < (b.staggerUntil || 0)) {
      // optional: still allow contact damage if close
      const distNow = Math.hypot(S.px - b.x, S.pz - b.z);
      if (distNow <= CFG.boss.touchDamageDist) takeDamage(CFG.bossDamage ?? 50);
      return;
    }

    // dead handling
    if (b.hp <= 0) {
      // ✅ stop looping boss walk the moment boss is dead
      if (b.runSoundPlaying) {
        try {
          SFX.boss_run.pause();
          SFX.boss_run.currentTime = 0;
        } catch {}
        b.runSoundPlaying = false;
      }

      if (!b.deadUntil) b.deadUntil = now + CFG.boss.deathHoldMs;
      if (now >= b.deadUntil) {
        S.boss = null; // fully gone
      }
      return;
    }

    if (!b.runSoundPlaying) {
      SFX.boss_run.loop = true;
      playSfx(SFX.boss_run);
      b.runSoundPlaying = true;
    }

    // remember previous position for facing
    const prevX = b.x;
    const prevZ = b.z;

    // phase speed
    const hpFrac = b.hp / (b.hpMax || 1);

    // --- Phase change detection (for one-time phase 2 transform FX) ---
    const newPhase =
      (hpFrac <= 0.25) ? 3 :
      (hpFrac <= 0.50) ? 2 :
      1;

    if (b.phase == null) b.phase = 1;

    if (newPhase !== b.phase) {
      // ONLY once: when entering phase 2
      if (b.phase === 1 && newPhase === 2) {
        startShake(420, 12);
        playSfx(SFX.boss_roar);
      }
      b.phase = newPhase;
    }

    // ----- Boss minion milestone spawns (one-time each) -----
    function doMilestone(key, atOrBelowFrac, wants) {
      if (hpFrac > atOrBelowFrac) return;
      b.minionMilestonesDone = b.minionMilestonesDone || {};
      if (b.minionMilestonesDone[key]) return;

      spawnBossMinionsMix(wants);
      b.minionMilestonesDone[key] = true;
      requestSave(false);
    }

    // Your requested milestones:
    doMilestone("1.00", 1.00, { normal: 3 });
    doMilestone("0.80", 0.80, { fast: 2 });
    doMilestone("0.60", 0.60, { sniper: 1 });
    doMilestone("0.50", 0.50, { normal: 3 });
    doMilestone("0.40", 0.40, { tank: 1 });
    doMilestone("0.20", 0.20, { tank: 2 });

    // spawn a second (max 3) minion wave at 50% HP (only once)
    if (hpFrac <= 0.5 && b.minionsHalfDone === false) {
      spawnBossMinions(CFG.boss.minionsAtHalf ?? 3);
      b.minionsHalfDone = true;
    }

    let spBase = CFG.boss.speedBase;
    if (hpFrac <= 0.25) spBase = CFG.boss.speedPhase3;
    else if (hpFrac <= 0.6) spBase = CFG.boss.speedPhase2;

    // retarget strafe direction periodically
    if (now >= b.nextRetargetAt) {
      b.strafeSign = Math.random() < 0.5 ? -1 : 1;
      b.nextRetargetAt = now + CFG.boss.retargetMs;
    }

    // ------------------------------------
    // ROAM / UNSTUCK when LOS blocked or stuck
    // ------------------------------------
    const canSeePlayer = hasLineOfSight(b.x, b.z, S.px, S.pz);

    // initialize stuck trackers if missing
    if (b.stuckLastX == null) { b.stuckLastX = b.x; b.stuckLastZ = b.z; }

    const movedAmt = Math.hypot(b.x - b.stuckLastX, b.z - b.stuckLastZ);
    b.stuckLastX = b.x;
    b.stuckLastZ = b.z;

    if (movedAmt < 0.003) {
      if (!b.stuckSince) b.stuckSince = now;
    } else {
      b.stuckSince = 0;
    }

    const isStuck = b.stuckSince && (now - b.stuckSince) > 550; // ~0.55s

    // enter roam if LOS blocked or stuck (and not already roaming)
    if ((!canSeePlayer || isStuck) && now >= (b.roamUntil || 0)) {
      const t = pickBossRoamTarget(b);
      b.roamX = t.x;
      b.roamZ = t.z;
      b.roamUntil = now + (700 + Math.random() * 800); // 0.7–1.5s
      b.stuckSince = 0;
    }

    // choose target: roam target if active, else player
    let targetX = S.px;
    let targetZ = S.pz;

    if (now < (b.roamUntil || 0)) {
      targetX = b.roamX;
      targetZ = b.roamZ;
    }

    // ------------------------------------
    // MOVE toward target + limited strafe
    // ------------------------------------
    const dx = targetX - b.x;
    const dz = targetZ - b.z;
    const dist = Math.hypot(dx, dz) || 0.0001;

    const step = spBase * (dt * 0.35);
    const fwdX = (dx / dist) * step;
    const fwdZ = (dz / dist) * step;

    // perpendicular strafe vector
    const perpX = -fwdZ;
    const perpZ = fwdX;

    // roam = more lateral motion to get around pillars
    const strafeChance = (now < (b.roamUntil || 0)) ? 0.75 : CFG.boss.strafeChance;
    const strafeStrength = (now < (b.roamUntil || 0)) ? (CFG.boss.strafeStrength * 1.05) : CFG.boss.strafeStrength;

    const doStrafe = Math.random() < strafeChance;

    let sx = doStrafe ? perpX * strafeStrength * b.strafeSign : 0;
    let sz = doStrafe ? perpZ * strafeStrength * b.strafeSign : 0;

    // ✅ cap strafe so it never "zooms sideways"
    const strafeMax = step * (CFG.boss.maxStrafeFrac ?? 0.45);
    const smag = Math.hypot(sx, sz);
    if (smag > strafeMax && smag > 1e-9) {
      const k = strafeMax / smag;
      sx *= k;
      sz *= k;
    }

    const beforeX = b.x, beforeZ = b.z;
    moveBossWithCollision(b, fwdX + sx, fwdZ + sz);

    // stuck nudge + force roam if wedged hard
    const moved = Math.abs(b.x - beforeX) + Math.abs(b.z - beforeZ) > 1e-5;
    if (!moved) {
      // flip strafe + nudge
      b.strafeSign *= -1;
      moveBossWithCollision(b, perpX * 0.95, perpZ * 0.95);

      // if still blocked, immediately pick a new roam target
      if (now >= (b.roamUntil || 0)) {
        const t = pickBossRoamTarget(b);
        b.roamX = t.x;
        b.roamZ = t.z;
        b.roamUntil = now + (600 + Math.random() * 700);
      }
    }

    // ✅ Face based on movement direction, but rate-limited to avoid "twirl"
    const vx = b.x - prevX;
    const vz = b.z - prevZ;

    if (Math.abs(vx) + Math.abs(vz) > 1e-6) {
      const wantFace = vx >= 0 ? "R" : "L"; // flip based on x-velocity
      if (now >= (b.faceLockUntil || 0) && wantFace !== b.face) {
        b.face = wantFace;
        b.faceLockUntil = now + (CFG.boss.faceLockMs ?? 140);
      }
    }

    // touch damage
    const distNow = Math.hypot(S.px - b.x, S.pz - b.z);
    if (distNow <= CFG.boss.touchDamageDist) takeDamage(CFG.bossDamage ?? 50);
  }

  // ===== Sniper LOS + ranged poke (minimal) =====
  function hasLineOfSight(ax, az, bx, bz, maxSteps = 220) {
    // DDA from A->B through the grid (wall blocks)
    const dx = bx - ax;
    const dz = bz - az;
    const dist = Math.hypot(dx, dz) || 1e-6;

    const dirX = dx / dist;
    const dirZ = dz / dist;

    let { tx, tz } = tileAtWorld(ax, az);

    const deltaDistX = Math.abs(1 / (dirX || 1e-9));
    const deltaDistZ = Math.abs(1 / (dirZ || 1e-9));

    const fx = (ax / TILE) - Math.floor(ax / TILE);
    const fz = (az / TILE) - Math.floor(az / TILE);

    let stepX, stepZ, sideDistX, sideDistZ;
    if (dirX < 0) { stepX = -1; sideDistX = fx * deltaDistX; }
    else { stepX = 1; sideDistX = (1 - fx) * deltaDistX; }

    if (dirZ < 0) { stepZ = -1; sideDistZ = fz * deltaDistZ; }
    else { stepZ = 1; sideDistZ = (1 - fz) * deltaDistZ; }

    // walk until we either hit a wall or reach the target tile
    const end = tileAtWorld(bx, bz);

    for (let i = 0; i < maxSteps; i++) {
      if (tx === end.tx && tz === end.tz) return true;

      if (sideDistX < sideDistZ) {
        sideDistX += deltaDistX;
        tx += stepX;
      } else {
        sideDistZ += deltaDistZ;
        tz += stepZ;
      }

      if (isWallTile(tx, tz)) return false;
    }
    return false;
  }

  function updateSniper(e, dt, now) {
    // behavior: keep distance + occasional poke if LOS
    const desired = 6.2;         // wants to stay around this far
    const tooClose = 4.2;        // back off if closer
    const shootRange = 10.5;     // only shoot within this
    const shootCd = 900;         // ms between shots (tweak)

    e.nextShotAt = e.nextShotAt || (now + 350 + Math.random() * 500);

    const dx = S.px - e.x;
    const dz = S.pz - e.z;
    const dist = Math.hypot(dx, dz) || 0.0001;

    // move logic
    const sp = enemySpeed(e.type) * (dt * 0.35);

    // if too close: move away; if too far: move closer a bit; else: light strafe
    let moveX = 0, moveZ = 0;

    if (dist < tooClose) {
      moveX = (-dx / dist) * sp;
      moveZ = (-dz / dist) * sp;
    } else if (dist > desired + 1.2) {
      moveX = (dx / dist) * sp * 0.85;
      moveZ = (dz / dist) * sp * 0.85;
    } else {
      // strafe in place
      const perpX = -(dz / dist) * sp * 0.75;
      const perpZ = (dx / dist) * sp * 0.75;
      const sign = (e.strafeSign = e.strafeSign || (Math.random() < 0.5 ? -1 : 1));
      moveX = perpX * sign;
      moveZ = perpZ * sign;
    }

    // apply movement
    const beforeX = e.x, beforeZ = e.z;
    moveEnemyWithCollision(e, moveX, moveZ);
    const moved = Math.abs(e.x - beforeX) + Math.abs(e.z - beforeZ) > 1e-5;
    if (!moved) {
      // tiny nudge to avoid stuck corners
      moveEnemyWithCollision(e, -moveZ * 0.6, moveX * 0.6);
    }

    // shoot logic (hitscan poke to player hp)
    if (dist <= shootRange && now >= e.nextShotAt) {
      if (hasLineOfSight(e.x, e.z, S.px, S.pz)) {
        e.fireUntil = now + 120;   
        spawnEnemyProjectile(e.x, e.z, S.px, S.pz);
      }
      e.nextShotAt = now + shootCd;
    }
  }

  function spawnEnemyProjectile(ax, az, bx, bz) {
    const now = performance.now();

    const dx = bx - ax;
    const dz = bz - az;
    const dist = Math.hypot(dx, dz) || 1e-6;

    const sp = CFG.sniper?.projSpeed ?? 0.010;

    S.projectiles.push({
      x: ax,
      z: az,
      lastX: ax,
      lastZ: az,
      vx: (dx / dist) * sp,
      vz: (dz / dist) * sp,
      bornAt: now,
      lifeUntil: now + (CFG.sniper?.projLifeMs ?? 1400),
      damage: CFG.sniper?.projDamage ?? 1,
      from: "enemy",
    });
  }

  function update() {
    if (!S.running) return;

    const now = performance.now();
    const dt = S.lastT ? now - S.lastT : 16;
    S.lastT = now;

    if (now >= (S.waveIntroUntil || 0)) updateMovement(dt);

    // spawn enemies ONCE per wave, after intro delay ends
    if (!S.waveEnemiesSpawned && now >= (S.waveIntroUntil || 0)) {
      spawnWave(S.wave);
      S.waveEnemiesSpawned = true;
    }
    // move enemies toward player; if reach player => damage + remove
    const next = [];
    for (const e of S.enemies) {
      if (e.hp <= 0) {
        if (now < e.deadUntil) next.push(e);
        continue;
      }

      if (e.type === "sniper") {
        updateSniper(e, dt, now);
      } else {
        const dx = S.px - e.x;
        const dz = S.pz - e.z;
        const dist = Math.hypot(dx, dz) || 0.0001;

        const sp = enemySpeed(e.type) * (dt * 0.35);
        const stepX = (dx / dist) * sp;
        const stepZ = (dz / dist) * sp;

        const beforeX = e.x,
          beforeZ = e.z;
        moveEnemyWithCollision(e, stepX, stepZ);

        const moved = Math.abs(e.x - beforeX) + Math.abs(e.z - beforeZ) > 1e-5;
        if (!moved) {
          const perpX = -stepZ;
          const perpZ = stepX;
          moveEnemyWithCollision(e, perpX * 0.6, perpZ * 0.6);
        }
      }

      // reached player?
      const distNow = Math.hypot(S.px - e.x, S.pz - e.z);
      if (distNow <= 0.55) {
        takeDamage(CFG.enemyDamage?.[e.type] ?? 10);
        continue;
      }
      next.push(e);
    }

    S.enemies = next;
    applyEnemySeparation(dt);
    updateBoss(dt);
    updatePickup();
    updateProjectiles(dt);
    schedulePickupSpawns(now);

    // wave clear? (ONLY after the wave has actually spawned enemies/boss)
    if (S.waveEnemiesSpawned) {
      const enemiesAlive = S.enemies.some((e) => e.hp > 0);
      const bossAlive = !!(S.boss && S.boss.hp > 0);

      if (!enemiesAlive && !bossAlive) {
        if (S.wave >= BOSS_WAVE) {
          setGameOverOverlay(true);
          return;
        }

        S.wave++;

        switchMapForWave(S.wave);

        // don't startWave yet — wait for click, then delay-spawn
        S.pendingWaveDelayMs = 4000;
        S.waveEnemiesSpawned = false;
        S.waveIntroUntil = 0;

        updateHUD();
        pauseForWaveIntro(S.wave);
        return;
      }
    }
    requestSave(false);
  }

  function updateMovement(dt) {
    // only move during active play
    if (!S.running) return;

    const forward = S.keys.w || S.keys.up ? 1 : 0;
    const back = S.keys.s || S.keys.down ? 1 : 0;
    const left = S.keys.a || S.keys.left ? 1 : 0;
    const right = S.keys.d || S.keys.right ? 1 : 0;

    // mvF = forward/back, mvS = strafe
    let mvF = forward - back; // W/S
    let mvS = right - left; // A/D

    // normalize diagonals
    const mag = Math.hypot(mvF, mvS) || 1;
    mvF /= mag;
    mvS /= mag;

    // speed
    const sp = CFG.moveSpeed * dt * (S.keys.shift ? CFG.sprintMult : 1);

    const cy = Math.cos(S.yaw);
    const sy = Math.sin(S.yaw);

    // Forward = facing direction (+X at yaw=0)
    // Strafe  = perpendicular
    const dx = (mvF * cy - mvS * sy) * sp;
    const dz = (mvF * sy + mvS * cy) * sp;

    tryMoveWithCollision(dx, dz);
  }

  function updatePickup() {
    if (!S.pickup) return;

    const now = performance.now();
    if (now >= (S.pickup.ttlUntil || 0)) {
      S.pickup = null;
      return;
    }

    // pick up when player is close
    const d = Math.hypot(S.pickup.x - S.px, S.pickup.z - S.pz);
    if (d > (CFG.pickups?.pickupRadius ?? 0.65)) return;

    // --- Ammo pickup ---
    if (S.pickup.type === "ammo" || S.pickup.type === "ammoBoost") {
    // ✅ ammoBoost = force minigun equip + give ammo
    if (S.pickup.type === "ammoBoost") {
      const mg = getWeaponDef("minigun");
      S.weaponId = mg.id;
      S.ammoMax = mg.ammoMax;

      // give minigun ammo (you wanted 10)
      const add = 10;
      S.ammo = U.clamp((S.ammo || 0) + add, 0, S.ammoMax);

      // optional: mark boosted state (not required if minigun itself is the “boost”)
      S.ammoType = "boost";

      // ✅ ADD THIS
      playSfx(SFX.reload_pickupammo);

      S.pickup = null;
      updateHUD();
      requestSave(true);
      return;
    }

    // ✅ regular ammo pickup behavior
    const add = (S.weaponId === "minigun") ? 10 : (CFG.pickups?.ammoAmount ?? 5);
    S.ammo = U.clamp((S.ammo || 0) + add, 0, S.ammoMax);

    playSfx(SFX.reload_pickupammo);

    S.pickup = null;
    updateHUD();
    requestSave(true);
    return;
    }

    // --- Health pickup ---
    if (S.pickup.type === "health") {
      const add = CFG.pickups?.healthAmount ?? 10;
      S.hp = U.clamp(S.hp + add, 0, CFG.hpMax);

      playSfx(SFX.power_ups);

      S.pickup = null;
      updateHUD();
      requestSave(true);
      return;
    }

    // --- Grenade pickup ---
    if (S.pickup.type === "grenade") {
      if (S.wave === BOSS_WAVE) {
        S.grenades = (S.grenades || 0) + 1;
      }
      S.pickup = null;

      playSfx(SFX.power_ups);      

      updateHUD();
      requestSave(true);
      return;
    }
  }

  function updateProjectiles(dt) {
    const now = performance.now();
    const next = [];

    for (const p of S.projectiles) {
      if (now >= p.lifeUntil) {
        if (p.type === "grenade" && p.from === "player") {
          grenadeExplode(p.x, p.z);
        }
        continue;
      }

      // remember previous position for tracer
      p.lastX = p.x;
      p.lastZ = p.z;

      // move
      const nx = p.x + p.vx * dt;
      const nz = p.z + p.vz * dt;

      // wall hit
      if (isWallAt(nx, nz)) {
        if (p.type === "grenade" && p.from === "player") {
          grenadeExplode(p.x, p.z);
        }
        continue;
      }

      p.x = nx;
      p.z = nz;

      if (p.from === "enemy") {
        // hit player?
        const d = Math.hypot(p.x - S.px, p.z - S.pz);
        if (d <= 0.22) {
          takeDamage(CFG.enemyDamage?.sniper ?? 20);
          continue;
        }
      }

      next.push(p);
    }

    S.projectiles = next;
  }

  //#endregion
  //#region 7) Rendering 
  /*---------------------------------------------------*/
  function castRay(rayAng) {
    // Ray origin
    const ox = S.px;
    const oz = S.pz;

    // Ray direction
    const dx = Math.cos(rayAng);
    const dz = Math.sin(rayAng);

    // Current tile
    let { tx, tz } = tileAtWorld(ox, oz);

    // Length of ray from one x or z-side to next x or z-side
    const deltaDistX = Math.abs(1 / (dx || 1e-9));
    const deltaDistZ = Math.abs(1 / (dz || 1e-9));

    // Step direction and initial side distances
    let stepX, stepZ;
    let sideDistX, sideDistZ;

    // position within tile (0..1 since TILE=1)
    const fx = ox / TILE - Math.floor(ox / TILE);
    const fz = oz / TILE - Math.floor(oz / TILE);

    if (dx < 0) {
      stepX = -1;
      sideDistX = fx * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (1 - fx) * deltaDistX;
    }

    if (dz < 0) {
      stepZ = -1;
      sideDistZ = fz * deltaDistZ;
    } else {
      stepZ = 1;
      sideDistZ = (1 - fz) * deltaDistZ;
    }

    let hit = false;
    let side = 0; // 0 = hit vertical wall (x-side), 1 = hit horizontal wall (z-side)

    const maxSteps = 200;
    for (let i = 0; i < maxSteps; i++) {
      if (sideDistX < sideDistZ) {
        sideDistX += deltaDistX;
        tx += stepX;
        side = 0;
      } else {
        sideDistZ += deltaDistZ;
        tz += stepZ;
        side = 1;
      }

      if (isWallTile(tx, tz)) {
        hit = true;
        break;
      }
    }

    if (!hit) return null;

    // Perpendicular distance to avoid fish-eye
    let perpDist;
    if (side === 0) {
      perpDist = (tx - ox / TILE + (1 - stepX) / 2) / (dx || 1e-9);
    } else {
      perpDist = (tz - oz / TILE + (1 - stepZ) / 2) / (dz || 1e-9);
    }

    perpDist = Math.abs(perpDist);

    // Hit point (for texture x later if you want)
    const hitX = ox + dx * perpDist;
    const hitZ = oz + dz * perpDist;

    return { perpDist, side, hitX, hitZ, tx, tz };
  }

  function tileAtWorld(wx, wz) {
    const tx = Math.floor(wx / TILE);
    const tz = Math.floor(wz / TILE);
    return { tx, tz };
  }

  function isWallTile(tx, tz) {
    if (tz < 0 || tz >= MAP_H || tx < 0 || tx >= MAP_W) return true;
    return MAP[tz][tx] === "1";
  }
  
  function isWallAt(wx, wz) {
    const tx = Math.floor((wx - MAP_MIN_X) / TILE);
    const tz = Math.floor((wz - MAP_MIN_Z) / TILE);

    // outside map counts as wall
    if (tz < 0 || tz >= MAP_H || tx < 0 || tx >= MAP_W) return true;

    return MAP[tz][tx] === "1";
  }

  function drawSheetFrame(g, img, frameIndex, x, y, w, h, flipX = false) {
    if (!img || !img.complete) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const frames = Math.max(1, Math.floor(iw / SPR_FRAME));
    const fi = Math.max(0, Math.min(frames - 1, frameIndex | 0));

    const sx = fi * SPR_FRAME;
    const sy = 0;
    const sw = SPR_FRAME;
    const sh = Math.min(SPR_FRAME, ih);

    if (!flipX) {
      g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      return;
    }

    // mirror around the draw rect center
    g.save();
    g.translate(x + w / 2, y + h / 2);
    g.scale(-1, 1);
    g.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
    g.restore();
  }

  function drawGunFrameContain(g, img, frameIndex, x, y, boxW, boxH) {
    if (!img || !img.complete) return;

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    // how many frames across?
    const frames = Math.max(1, Math.floor(iw / SPR_FRAME));
    const fi = Math.max(0, Math.min(frames - 1, frameIndex | 0));

    // source frame rect
    const sw = Math.floor(iw / frames);
    const sh = ih;
    const sx = fi * sw;
    const sy = 0;

    // fit that source frame into the destination box (preserve aspect)
    const scale = Math.min(boxW / sw, boxH / sh);
    const dw = sw * scale;
    const dh = sh * scale;

    const dx = x + (boxW - dw) / 2;
    const dy = y + (boxH - dh) / 2;

    g.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  function enemySheetsForType(type) {
    // Map your gameplay types -> art sets
    // normal => Corrupted Heart
    // fast   => Toxic Rose
    // tank   => Jealous Teddy
    // sniper => Broken Cupid
    if (type === "fast") {
      return { idle: SPR.roseIdle, run: SPR.roseRun, hit: SPR.roseHit, dead: SPR.roseDead };
    }
    if (type === "tank") {
      return { idle: SPR.teddyIdle, run: SPR.teddyRun, hit: SPR.teddyHit, dead: SPR.teddyDead };
    }
    if (type === "sniper") {
      return { idle: SPR.cupidIdle, run: SPR.cupidRun, hit: SPR.cupidHit, dead: SPR.cupidDead };
    }
    return { idle: SPR.heartIdle, run: SPR.heartRun, hit: SPR.heartHit, dead: SPR.heartDead };
  }

  function runFrameIndex(nowMs, seed = 0) {
    const frameDur = 140; // ms per frame (tweak)
    return Math.floor((nowMs + seed * 1000) / frameDur) % RUN_FRAMES;
  }

  function gunFrameIndex(nowMs, fps = 14, frames = 2) {
    const frameDur = 1000 / fps;
    return Math.floor(nowMs / frameDur) % frames;
  }

  function wallTextureForWave(waveNum) {
    // Boss arena
    if (waveNum === BOSS_WAVE) return SPR.wallBoss;

    // Wave-specific textures
    if (waveNum === 5) return SPR.wall5;
    if (waveNum === 4) return SPR.wall4;
    if (waveNum === 3) return SPR.wall3;
    if (waveNum === 2) return SPR.wall2;

    // Default (Wave 1)
    return SPR.wall1;
  }

  function floorTextureForWave(waveNum) {
    if (waveNum === BOSS_WAVE) return SPR.floorBoss;
    if (waveNum === 5) return SPR.floor5;
    if (waveNum === 4) return SPR.floor4;
    return SPR.floor; // waves 1–3
  }

  function drawWallsRaycast(g) {
    const W = S.cw,
      H = S.ch;

    // floor/ceiling base
    // (you already draw a gradient background; keep it if you like)
    const fov = CFG.ray.fov;
    const numRays = CFG.ray.numRays;

    if (!S.depth || S.depth.length !== numRays) {
      S.depth = new Float32Array(numRays);
    }

    const startAng = S.yaw - fov / 2;
    const stepAng = fov / numRays;
    // precompute projection plane distance
    const projPlane = W / 2 / Math.tan(fov / 2);

    for (let i = 0; i < numRays; i++) {
      const ang = startAng + i * stepAng;
      const hit = castRay(ang);
      if (!hit) {
        S.depth[i] = 1e9;
        continue;
      }

      const dist = Math.max(0.001, hit.perpDist);
      S.depth[i] = dist;

      // wall slice height in pixels
      const sliceH = (CFG.ray.wallHeight * projPlane) / dist;

      // vertical placement (use pitch slightly)
      const yCenter = H / 2 + S.pitch * (H * 0.28);
      const y0 = yCenter - sliceH / 2;

      // slice width
      const sliceW = W / numRays + 1;

      // simple shading (darker on one side)
      const sideShade = hit.side === 1 ? 0.65 : 0.88;

      // optional distance fog (keeps depth feel when textures are busy)
      const fogStart = 6.0;
      const fogEnd = 18.0;
      const fogT = U.clamp((dist - fogStart) / (fogEnd - fogStart), 0, 1);
      const fogMul = 1 - fogT * 0.55; // farther = darker

      const tex = wallTextureForWave(S.wave);

      // Fallback to your old solid wall color if texture not ready
      if (!tex || !tex.complete || !(tex.naturalWidth || tex.width)) {
        g.globalAlpha = 1;
        const T = themeForWave(S.wave);
        const shade = sideShade * fogMul;
        g.fillStyle = T.wall.replace(/[\d.]+\)\s*$/, `${shade})`);
        g.fillRect(i * (W / numRays), y0, sliceW, sliceH);
      } else {
        const tw = tex.naturalWidth || tex.width;
        const th = tex.naturalHeight || tex.height;

        // Texture coordinate (0..1) based on which wall side we hit
        // If we hit an x-side (side===0), use hitZ fractional. If z-side, use hitX fractional.
        let u = (hit.side === 0 ? (hit.hitZ / TILE) : (hit.hitX / TILE));
        u = u - Math.floor(u); // frac 0..1

        const sx = Math.max(0, Math.min(tw - 1, (u * tw) | 0));

        const dx = i * (W / numRays);

        // Draw a 1px vertical column from the texture, stretched to slice
        g.save();
        g.globalAlpha = 1;

        // draw texture strip
        g.drawImage(tex, sx, 0, 1, th, dx, y0, sliceW, sliceH);

        // apply shading + fog as a translucent black overlay (fast, simple, consistent)
        const dark = 1 - (sideShade * fogMul);
        if (dark > 0.001) {
          g.globalAlpha = U.clamp(dark, 0, 0.85);
          g.fillStyle = "black";
          g.fillRect(dx, y0, sliceW, sliceH);
        }

        g.restore();
      }
    }
  }

  function drawImageCover(g, img, x, y, w, h) {
    if (!img || !img.complete) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;
    g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawImageContain(g, img, x, y, w, h) {
    if (!img || !img.complete) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    const scale = Math.min(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;

    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;

    g.drawImage(img, dx, dy, dw, dh);
  }

  function minimapEnemyColor(type) {
    if (type === "tank") return "rgba(130, 251, 255, 0.95)"; // tank = blue/cyan
    if (type === "fast") return "rgba(253, 255, 120, 0.95)"; // fast = yellow/gold
    if (type === "sniper") return "rgba(210, 170, 255, 0.95)"; // sniper = lilac
    return "rgba(250, 156, 184, 0.95)"; // normal = pink
  }

  function minimapPickupColor(type) {
    if (type === "grenade")   return "rgba(255, 60, 60, 0.98)";     // deep red
    if (type === "ammo")      return "rgba(80, 255, 120, 0.98)";    // lime green
    if (type === "ammoBoost") return "rgba(255, 170, 60, 0.98)";    // orange
    if (type === "health")    return "rgba(255, 255, 255, 0.95)";   // white
    return "rgba(255, 200, 200, 0.95)";
  }

  function drawHeartShape(g, cx, cy, size, fillStyle, strokeStyle, strokeWidth = 1) {
    const s = size;

    g.beginPath();

    g.moveTo(cx, cy + s * 0.35);

    g.bezierCurveTo(
      cx - s, cy - s * 0.2,
      cx - s * 0.4, cy - s * 0.9,
      cx, cy - s * 0.35
    );

    g.bezierCurveTo(
      cx + s * 0.4, cy - s * 0.9,
      cx + s, cy - s * 0.2,
      cx, cy + s * 0.35
    );

    g.closePath();

    if (fillStyle) {
      g.fillStyle = fillStyle;
      g.fill();
    }

    if (strokeStyle && strokeWidth > 0) {
      g.lineWidth = strokeWidth;
      g.strokeStyle = strokeStyle;
      g.stroke();
    }
  }

  function drawMiniMap(g) {
    if (!CFG.debugMiniMap) return;

    // minimap box size and placement
    const pad = 12;

    // one size for both dimensions (square)
    const mmSize = Math.min(170, S.cw * 0.28, S.ch * 0.28);
    const mmW = mmSize;
    const mmH = mmSize;

    const x0 = S.cw - mmW - pad;
    const y0 = pad;

    // cell size based on map dims
    const cellW = mmW / MAP_W;
    const cellH = mmH / MAP_H;

    g.save();

    // panel background
    g.globalAlpha = 0.7;
    g.fillStyle = "rgba(0,0,0,0.55)";
    g.fillRect(x0, y0, mmW, mmH);

    // walls
    g.globalAlpha = 0.85;
    g.fillStyle = "rgba(255,255,255,0.60)";
    for (let z = 0; z < MAP_H; z++) {
      const row = MAP[z];
      for (let x = 0; x < MAP_W; x++) {
        if (row[x] !== "1") continue;
        g.fillRect(x0 + x * cellW, y0 + z * cellH, cellW, cellH);
      }
    }

    // convert world -> minimap coords
    const toMMX = (wx) => x0 + ((wx - MAP_MIN_X) / (MAP_W * TILE)) * mmW;
    const toMMZ = (wz) => y0 + ((wz - MAP_MIN_Z) / (MAP_H * TILE)) * mmH;

    // enemies
    for (const e of S.enemies) {
      if (e.hp <= 0) continue;
      const ex = toMMX(e.x);
      const ez = toMMZ(e.z);

      const r = e.type === "tank" ? 3.6 : e.type === "fast" ? 2.1 : 2.8;
      g.globalAlpha = 0.95;
      g.fillStyle = minimapEnemyColor(e.type);
      g.beginPath();
      g.arc(ex, ez, r, 0, Math.PI * 2);
      g.fill();
    }

    // boss
    if (S.boss && S.boss.hp > 0) {
      const bx = toMMX(S.boss.x);
      const bz = toMMZ(S.boss.z);
      g.globalAlpha = 0.98;
      g.fillStyle = "rgba(255, 90, 140, 0.98)";
      g.beginPath();
      g.arc(bx, bz, 5.2, 0, Math.PI * 2);
      g.fill();

      g.globalAlpha = 0.6;
      g.strokeStyle = "rgba(255,255,255,0.55)";
      g.lineWidth = 1;
      g.beginPath();
      g.arc(bx, bz, 8.0, 0, Math.PI * 2);
      g.stroke();
    }

    // pickup indicator (ammo / grenade / boost) as a HEART on the minimap
    if (S.pickup) {
      const ix = toMMX(S.pickup.x);
      const iz = toMMZ(S.pickup.z);

      const fill = minimapPickupColor(S.pickup.type);

      // slightly bigger than enemies so it reads as "important"
      const s = 7.5;

      g.save();
      g.globalAlpha = 1;

      // little glow
      g.shadowBlur = 10;
      g.shadowColor = fill;

      // use your existing heart shape helper
      drawHeartShape(
        g,
        ix,
        iz,
        s,
        fill,
        "rgba(0,0,0,0.70)",
        1.2
      );

      g.restore();
    }

    // player dot
    const px = toMMX(S.px);
    const pz = toMMZ(S.pz);

    g.globalAlpha = 1;
    g.fillStyle = "rgba(80,255,200,0.95)";
    g.beginPath();
    g.arc(px, pz, 3.2, 0, Math.PI * 2);
    g.fill();

    // facing line
    const len = 10;
    g.strokeStyle = "rgba(80,255,200,0.95)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(px, pz);
    g.lineTo(px + Math.cos(S.yaw) * len, pz + Math.sin(S.yaw) * len);
    g.stroke();

    // border
    g.globalAlpha = 0.85;
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 1;
    g.strokeRect(x0 + 0.5, y0 + 0.5, mmW - 1, mmH - 1);

    // debug: draw tiny ring for each enemy so overlaps are obvious
    g.strokeStyle = "rgba(255,255,255,0.35)";
    for (const e of S.enemies) {
      const ex = toMMX(e.x);
      const ez = toMMZ(e.z);
      g.beginPath();
      g.arc(ex, ez, 6, 0, Math.PI * 2);
      g.stroke();
    }

    g.restore();
  }

  function drawBossHpBar(g, b) {
    if (!b || b.hp <= 0) return;

    const frac = U.clamp(b.hp / (b.hpMax || 1), 0, 1);

    const barW = Math.min(360, S.cw * 0.7);
    const barH = 12;
    const bx = (S.cw - barW) / 2;
    const by = 14;

    g.save();
    g.globalAlpha = 0.85;
    g.fillStyle = "rgba(0,0,0,0.55)";
    g.fillRect(bx, by, barW, barH);

    g.globalAlpha = 0.95;
    g.fillStyle = "rgba(255,120,170,0.95)";
    g.fillRect(bx, by, barW * frac, barH);

    g.globalAlpha = 0.95;
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 1;
    g.strokeRect(bx + 0.5, by + 0.5, barW - 1, barH - 1);

    g.globalAlpha = 0.95;
    g.fillStyle = "rgba(255,255,255,0.92)";
    g.font = "600 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    g.textAlign = "center";
    g.textBaseline = "top";
    g.fillText("BOSS", S.cw / 2, by + barH + 6);
    g.restore();
  }

  function drawFloorCastFast(g) {
    ensureFloorBuffer();

    const tex = floorTextureForWave(S.wave);
    const W = S.floorW, H = S.floorH;        // low-res floor buffer
    const outW = S.cw, outH = S.ch;          // screen size

    const fg = S.floorCtx;
    fg.clearRect(0, 0, W, H);

    // horizon in buffer space
    const horizon = ((H / 2) + (S.pitch * (H * 0.28))) | 0;

    // fallback
    if (!tex || !tex.complete || !(tex.naturalWidth || tex.width)) {
      fg.fillStyle = "rgba(0,0,0,0.25)";
      fg.fillRect(0, horizon, W, H - horizon);
      g.save();
      g.imageSmoothingEnabled = false;
      g.drawImage(S.floorCan, 0, 0, outW, outH);
      g.restore();
      return;
    }

    const tw = tex.naturalWidth || tex.width;
    const th = tex.naturalHeight || tex.height;

    const fov = CFG.ray.fov;
    const halfFov = fov / 2;
    const projPlane = (W / 2) / Math.tan(halfFov);

    const angL = S.yaw - halfFov;
    const angR = S.yaw + halfFov;

    const dirLX = Math.cos(angL), dirLZ = Math.sin(angL);
    const dirRX = Math.cos(angR), dirRZ = Math.sin(angR);

    // bigger step = faster
    const yStep = 2; // in buffer pixels
    const xStep = 2;

    // fog
    const fogStart = 6.0;
    const fogEnd = 18.0;

    for (let y = Math.max(horizon, 0); y < H; y += yStep) {
      const p = (y - horizon);
      if (p < 1) continue;

      const rowDist = (projPlane * CFG.ray.wallHeight) / p;

      let worldX = S.px + dirLX * rowDist;
      let worldZ = S.pz + dirLZ * rowDist;

      const stepXw = (dirRX - dirLX) * rowDist / W;
      const stepZw = (dirRZ - dirLZ) * rowDist / W;

      // fog overlay (one rect per row)
      const fogT = U.clamp((rowDist - fogStart) / (fogEnd - fogStart), 0, 1);
      const darkA = fogT * 0.65;

      for (let x = 0; x < W; x += xStep) {
        let u = worldX - Math.floor(worldX);
        let v = worldZ - Math.floor(worldZ);

        const sx = (u * tw) | 0;
        const sy = (v * th) | 0;

        fg.drawImage(tex, sx, sy, 1, 1, x, y, xStep, yStep);

        worldX += stepXw * xStep;
        worldZ += stepZw * xStep;
      }

      if (darkA > 0.001) {
        fg.globalAlpha = darkA;
        fg.fillStyle = "black";
        fg.fillRect(0, y, W, yStep);
        fg.globalAlpha = 1;
      }
    }

    // draw buffer scaled up to screen (pixel-crisp)
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(S.floorCan, 0, 0, outW, outH);
    g.restore();
  }

  function drawWaveCountdown(g) {
    if (!S.running) return;

    const now = performance.now();
    if (S.waveEnemiesSpawned) return;
    if (!S.waveIntroUntil || now >= S.waveIntroUntil) return;

    const msLeft = Math.max(0, S.waveIntroUntil - now);
    const sec = Math.ceil(msLeft / 1000);

    g.save();
    g.globalAlpha = 0.95;
    g.fillStyle = "rgba(0,0,0,0.55)";
    const w = 180, h = 34;
    const x = (S.cw - w) / 2;
    const y = 52;
    g.fillRect(x, y, w, h);

    g.fillStyle = "white";
    g.font = "700 16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(`Spawning in ${sec}…`, S.cw / 2, y + h / 2);
    g.restore();
  }

  function triggerFlash(ms = 90) {
    S.flashUntil = performance.now() + ms;
  }

  // --- Screen red flash (player hit) ---
  function triggerHitFlash(ms = 110) {
    S.hitFlashUntil = performance.now() + ms;
  }

  // --- Screen shake ---
  function startShake(ms = 320, mag = 10) {
    const now = performance.now();
    S.shakeUntil = now + ms;
    S.shakeMag = mag;
  }

  function draw() {
    const g = ui.ctx;

    // clear
    g.clearRect(0, 0, S.cw, S.ch);

    // --- Apply screen shake transform (whole frame) ---
    g.save();
    {
      const nowS = performance.now();
      if (nowS < (S.shakeUntil || 0)) {
        const mag = S.shakeMag || 10;
        // decay to 0 as it ends
        const k = (S.shakeUntil - nowS) / Math.max(1, (S.shakeUntil - (nowS - 16)));
        const dx = (Math.random() * 2 - 1) * mag * 0.6 * k;
        const dy = (Math.random() * 2 - 1) * mag * 0.6 * k;
        g.translate(dx, dy);
      }
    }

    // background
    const T = themeForWave(S.wave);
    const grad = g.createLinearGradient(0, 0, 0, S.ch);
    grad.addColorStop(0, T.skyTop);
    grad.addColorStop(1, T.skyBot);
    g.fillStyle = grad;
    g.fillRect(0, 0, S.cw, S.ch);

    // ✅ floor first (behind walls)
    drawFloorCastFast(g);
    // raycast walls
    drawWallsRaycast(g);

    // --- Pickup (ammo/grenade/health) ---
    if (S.pickup) {
      const pp = projectWorldPoint(S.pickup.x, S.pickup.z);
      if (pp) {
        // depth occlusion like enemies
        const numRays = CFG.ray.numRays;
        let ok = true;
        if (S.depth && S.depth.length === numRays) {
          const col = Math.max(0, Math.min(numRays - 1, Math.floor((pp.x / S.cw) * numRays)));
          const perp = pp.dist * Math.cos(pp.rel);
          if (perp > S.depth[col] + 0.05) ok = false;
        }

        if (ok) {
          const minDim = Math.min(S.cw, S.ch);
          const size = U.clamp((minDim * 0.16) / (pp.dist * 0.55), 18, 72);

          let img = null;
          if (S.pickup.type === "ammo") img = SPR.ammo;
          if (S.pickup.type === "ammoBoost") img = SPR.ammoBoost;
          if (S.pickup.type === "grenade") img = SPR.heartnade;
          if (S.pickup.type === "health") img = SPR.health;

          if (img) {
            g.save();
            g.shadowBlur = 16;
            g.shadowColor = "rgba(255,150,210,1)";
            drawImageContain(g, img, pp.x - size / 2, pp.y - size / 2, size, size);
            g.restore();
          }
        }
      }
    }

    // enemies (sort by distance so nearer draws last)
    const enemiesSorted = S.enemies.slice().sort((a, b) => {
      const da = Math.hypot(a.x - S.px, a.z - S.pz);
      const db = Math.hypot(b.x - S.px, b.z - S.pz);
      return db - da; // far -> near
    });

    for (const e of enemiesSorted) {
      const p = projectEnemy(e);
      if (!p) continue; // ✅ enemy outside FOV

      // ----- depth occlusion vs raycast walls -----
      const numRays = CFG.ray.numRays;
      if (S.depth && S.depth.length === numRays) {
        // map screen x -> ray column
        const col = Math.max(
          0,
          Math.min(numRays - 1, Math.floor((p.x / S.cw) * numRays)),
        );

        // convert enemy distance to "perpendicular to view" distance (matches ray perpDist)
        const enemyPerp = p.dist * Math.cos(p.rel);

        // small fudge so enemies don't vanish when exactly touching a wall
        const EPS = 0.05;

        if (enemyPerp > S.depth[col] + EPS) {
          continue; // enemy is behind wall at this column
        }
      }

      const x = p.x - p.size / 2;
      const y = p.y - p.size / 2;

      const now = performance.now();
      const useDead = e.hp <= 0 && now < e.deadUntil;
      const useHurt = e.hp > 0 && now < e.hurtUntil;

      const sh = enemySheetsForType(e.type);

      // detect movement since last draw (cheap + stable enough)
      const moved = Math.abs(e.x - (e.lastX ?? e.x)) + Math.abs(e.z - (e.lastZ ?? e.z)) > 1e-5;
      e.lastX = e.x;
      e.lastZ = e.z;

      const firing = e.fireUntil && now < e.fireUntil;
      if (firing) {
        g.save();
        g.shadowBlur = 18;
        g.shadowColor = "rgba(255,190,220,1)";
      }

      if (useDead) {
        drawSheetFrame(g, sh.dead, 0, x, y, p.size, p.size);
      } else if (useHurt) {
        drawSheetFrame(g, sh.hit, 0, x, y, p.size, p.size);
      } else if (moved) {
        drawSheetFrame(g, sh.run, runFrameIndex(now, e.animSeed || 0), x, y, p.size, p.size);
      } else {
        drawSheetFrame(g, sh.idle, 0, x, y, p.size, p.size);
      }
      if (firing) g.restore();
    }

    // --- Boss draw (separate from enemies) ---
    if (S.boss) {
      const b = S.boss;
      const bp = projectBoss(b);

      if (bp) {
        // depth occlusion like enemies
        const numRays = CFG.ray.numRays;
        if (S.depth && S.depth.length === numRays) {
          const col = Math.max(
            0,
            Math.min(numRays - 1, Math.floor((bp.x / S.cw) * numRays)),
          );
          const bossPerp = bp.dist * Math.cos(bp.rel);
          const EPS = 0.05;
          if (bossPerp > S.depth[col] + EPS) {
            // behind wall
          } else {
            const x = bp.x - bp.size / 2;
            const y = bp.y - bp.size / 2;

            const now2 = performance.now();
            const useDead = b.hp <= 0 && now2 < (b.deadUntil || 0);
            const useHurt = b.hp > 0 && now2 < (b.hurtUntil || 0);

            const faceR = b.face !== "L";
            const hpFrac = b.hpMax ? b.hp / b.hpMax : 1;

            const phase2 = hpFrac <= 0.5; // swap visuals at 50%
            const idleSheet = phase2 ? SPR.bossIdle2 : SPR.bossIdle1;
            const runSheet  = phase2 ? SPR.bossRun2  : SPR.bossRun1;
            const hitSheet  = phase2 ? SPR.bossHit2  : SPR.bossHit1;

            // very simple “moving?” check for run anim (uses prevX/prevZ already tracked in updateBoss)
            const movedBoss = Math.abs(b.x - (b.lastX ?? b.x)) + Math.abs(b.z - (b.lastZ ?? b.z)) > 1e-5;
            b.lastX = b.x;
            b.lastZ = b.z;

            const sheet = useDead ? SPR.bossDead : (useHurt ? hitSheet : (movedBoss ? runSheet : idleSheet));
            const frame = (sheet === runSheet) ? runFrameIndex(now2, 133.7) : 0;

            // phase tuning
            let blur = 10;
            let alpha = 0.45;
            let pulseSpd = 0.0045; // radians-ish per ms
            let glowCol = "rgba(255,140,190,1)"; // default (phase 1)

            if (hpFrac <= 0.25) {
              // Phase 3: enraged
              blur = 26;
              alpha = 0.92;
              pulseSpd = 0.012;
              glowCol = "rgba(255,70,140,1)";
            } else if (hpFrac <= 0.6) {
              // Phase 2: angry
              blur = 18;
              alpha = 0.72;
              pulseSpd = 0.008;
              glowCol = "rgba(255,110,220,1)";
            }

            // pulse 0..1
            const pulse = 0.5 + 0.5 * Math.sin(now2 * pulseSpd);

            // apply glow only for this sprite draw
            g.save();
            g.globalAlpha = 1;
            g.shadowBlur = blur * (0.75 + pulse * 0.85);
            g.shadowColor = glowCol;

            // draw slightly “hotter” by double-drawing with low alpha
            drawSheetFrame(g, sheet, frame, x, y, bp.size, bp.size, !faceR);
            g.globalAlpha = alpha * (0.55 + pulse * 0.45);
            drawSheetFrame(g, sheet, frame, x, y, bp.size, bp.size, !faceR);

            g.restore();
          }
        }
      }
    }

    // Boss HP bar 
    if (S.boss && S.boss.hp > 0) {
      drawBossHpBar(g, S.boss);
    }

    // projectiles (sniper tracer + bolt)
    for (const p of S.projectiles) {
      const now3 = performance.now();

      // --- Player grenade sprite ---
      if (p.type === "grenade" && p.from === "player") {
        const gp = projectWorldPoint(p.x, p.z);
        if (!gp) continue;

        // depth occlusion
        const numRays = CFG.ray.numRays;
        if (S.depth && S.depth.length === numRays) {
          const col = Math.max(0, Math.min(numRays - 1, Math.floor((gp.x / S.cw) * numRays)));
          const perp = gp.dist * Math.cos(gp.rel);
          if (perp > S.depth[col] + 0.05) continue;
        }

        const minDim = Math.min(S.cw, S.ch);
        const size = U.clamp((minDim * 0.14) / (gp.dist * 0.55), 10, 56);

        g.save();
        g.shadowBlur = 18;
        g.shadowColor = "rgba(255,90,140,1)";
        drawImageContain(g, SPR.heartnade, gp.x - size / 2, gp.y - size / 2, size, size);
        g.restore();
        continue;
      }

      const a = projectWorldPoint(p.lastX ?? p.x, p.lastZ ?? p.z);
      const b = projectWorldPoint(p.x, p.z);
      if (!b) continue;

      const minDim = Math.min(S.cw, S.ch);
      // 🔥 stronger perspective scaling so "coming at you" is obvious
      const boltSize = U.clamp((minDim * 0.085) / (b.dist * 0.6), 3.5, 26);

      const age = (now3 - (p.bornAt || now3));
      const tracerAlpha = age < 140 ? (1 - age / 140) : 0;

      const prevDist = a ? a.dist : b.dist + 0.001;
      const approach = U.clamp((prevDist - b.dist) * 3.0, 0, 1.2);

      const heartSize = boltSize * (1 + 0.18 * approach);

      g.save();

      // ✅ "coming at you" ring (very noticeable when projectile is centered)
      const ringR = boltSize * (1.2 + approach * 0.9);
      g.globalAlpha = 0.22 + 0.25 * approach;
      g.lineWidth = Math.max(1, boltSize * 0.18);
      g.shadowBlur = 10 + 14 * approach;
      g.shadowColor = "rgba(220,40,80,1)";
      g.strokeStyle = "rgba(0,0,0,0.55)"; // dark ring edge
      g.beginPath();
      g.arc(b.x, b.y, ringR, 0, Math.PI * 2);
      g.stroke();

      // 🎨 NEW palette
      const coreFill = "rgba(235, 70, 110, 0.95)";   // reddish pink core
      const glowCol  = "rgba(255, 85, 140, 1)";      // glow tint
      const tracerCol = "rgba(235, 70, 110, 0.9)";   // tracer color
      const outlineCol = "rgba(0,0,0,0.85)";         // black outline
      
      // ✅ tracer line
      if (tracerAlpha > 0 && a) {
        g.globalAlpha = 0.55 * tracerAlpha;

        // soft glow tracer behind
        g.lineWidth = Math.max(1, boltSize * 0.75);
        g.shadowBlur = 14;
        g.shadowColor = glowCol;
        g.strokeStyle = tracerCol;
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.stroke();

        // optional: crisp dark core line on top (makes it read better)
        g.globalAlpha = 0.35 * tracerAlpha;
        g.shadowBlur = 0;
        g.lineWidth = Math.max(1, boltSize * 0.35);
        g.strokeStyle = "rgba(0,0,0,0.55)";
        g.beginPath();
        g.moveTo(a.x, a.y);
        g.lineTo(b.x, b.y);
        g.stroke();
      }

      // 💘 HEART PROJECTILE
      g.globalAlpha = 0.95;
      g.shadowBlur = 18;
      g.shadowColor = "rgba(220,40,80,1)"; // glow

      drawHeartShape(
        g,
        b.x,
        b.y,
        heartSize,
        "rgba(200,35,70,0.95)",  // darker red core
        "rgba(0,0,0,0.85)",      // black outline
        Math.max(1, boltSize * 0.25)
      );

      // ✅ tiny highlight dot (optional, helps “projectile” read)
      g.globalAlpha = 0.55;
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.beginPath();
      g.arc(b.x - boltSize * 0.25, b.y - boltSize * 0.25, Math.max(0.8, boltSize * 0.18), 0, Math.PI * 2);
      g.fill();

      g.restore();
    }

    // explosions (simple ring FX)
    if (S.explosions && S.explosions.length) {
      const alive = [];
      const nowFx = performance.now();

      for (const ex of S.explosions) {
        const t = (nowFx - ex.bornAt) / (ex.lifeMs || 260);
        if (t >= 1) continue;

        const ep = projectWorldPoint(ex.x, ex.z);
        if (!ep) { alive.push(ex); continue; }

        const minDim = Math.min(S.cw, S.ch);
        const base = U.clamp((minDim * 0.26) / (ep.dist * 0.55), 24, 140);
        const r = base * (0.55 + t * 0.95);

        g.save();
        g.globalAlpha = 0.55 * (1 - t);
        g.lineWidth = Math.max(2, base * 0.07);
        g.shadowBlur = 22;
        g.shadowColor = "rgba(255,70,140,1)";
        g.strokeStyle = "rgba(0,0,0,0.65)";
        g.beginPath();
        g.arc(ep.x, ep.y, r, 0, Math.PI * 2);
        g.stroke();
        g.restore();

        alive.push(ex);
      }

      S.explosions = alive;
    }

    // operator face (moved to DOM HUD by default)
    const now = performance.now();
    if (!(CFG.ui && CFG.ui.opFaceInHud)) {
      const opImg = now < S.opHitUntil ? SPR.opHit : SPR.opIdle;
      const opS = U.clamp(Math.min(S.cw, S.ch) * 0.11, 44, 62);
      drawImageCover(g, opImg, 12, S.ch - (opS + 12), opS, opS);
    }

    // gun sprite (supports sprite sheets like minigun_idle.png with 2 frames)
    const WPN = getWeaponDef(S.weaponId);

    const gunIdleKey = WPN.gunSpriteIdle || "gunIdle";
    const gunFireKey = WPN.gunSpriteFire || "gunFire";

    const firing = now < S.gunFireUntil;
    const gunImg = firing ? SPR[gunFireKey] : SPR[gunIdleKey];

    // detect frames from image width using SPR_FRAME=100 (so 200x100 => 2 frames)
    const iw = gunImg?.naturalWidth || gunImg?.width || 0;
    const framesInImg = iw ? Math.max(1, Math.floor(iw / SPR_FRAME)) : 1;

    // prefer weapon settings if you added them; otherwise use detected frames
    const frames = Math.max(1, Math.min(WPN.gunFrames || framesInImg, framesInImg));

    // animate sheets (idle can animate too if it has >1 frame)
    const idleFps = WPN.gunIdleFps ?? WPN.gunFps ?? 10;
    const fireFps = WPN.gunFireFps ?? WPN.gunFps ?? 14;

    const gunFrame = gunFrameIndex(
      now,
      firing ? fireFps : idleFps,
      frames,
      0
    );

    const minDim2 = Math.min(S.cw, S.ch);
    const gw = Math.min(S.cw * 0.58, minDim2 * 0.95);
    const gh = Math.min(S.ch * 0.4, minDim2 * 0.65);

    drawGunFrameContain(g, gunImg, gunFrame, (S.cw - gw) / 2, S.ch - gh + 18, gw, gh);

    // crosshair
    const cross = now < S.crossHitUntil ? SPR.crossHit : SPR.crossIdle;
    const cs = U.clamp(Math.min(S.cw, S.ch) * 0.07, 28, 42);
    drawImageCover(g, cross, (S.cw - cs) / 2, (S.ch - cs) / 2, cs, cs);

    // minimap
    drawMiniMap(g);

    drawWaveCountdown(g);

    // --- White flash (grenade explode) ---
    {
      const nowF = performance.now();
      if (nowF < (S.flashUntil || 0)) {
        const dur = 120;
        const t = 1 - (S.flashUntil - nowF) / dur; // 0..1
        const a = Math.max(0, 0.85 * (1 - t) * (1 - t)); // stronger so you actually see it
        g.save();
        g.globalAlpha = a;
        g.fillStyle = "white";
        g.fillRect(0, 0, S.cw, S.ch);
        g.restore();
      }
    }

    // --- Red flash (player hit) ---
    {
      const nowH = performance.now();
      if (nowH < (S.hitFlashUntil || 0)) {
        const dur = 160;
        const t = 1 - (S.hitFlashUntil - nowH) / dur; // 0..1
        const a = Math.max(0, 0.55 * (1 - t) * (1 - t)); // clearly visible
        g.save();
        g.globalAlpha = a;
        g.fillStyle = "rgb(220, 30, 60)";
        g.fillRect(0, 0, S.cw, S.ch);
        g.restore();
      }
    }

    // restore after shake transform
    g.restore();
  }

  function loop() {
    if (!S.running) return;
    update();
    draw();
    S.raf = requestAnimationFrame(loop);
  }

  function beginRun() {
    if (!S.ready) return;

    stopSiteMusic();
    startHBMusic();

    S.ready = false;
    S.paused = false;
    S.over = false;
    S.won = false;

    showOverlay(false);

    // ✅ resume loop
    S.running = true;
    S.lastT = 0;

    // ✅ apply the “after click” delay (defaulting to CFG)
    let delay = Number.isFinite(S.pendingWaveDelayMs) ? S.pendingWaveDelayMs : (CFG.waveSpawnDelayMs ?? 2000);
    S.pendingWaveDelayMs = 0;

    // optional: boss gets a longer delay
    if (S.wave === BOSS_WAVE) delay = (CFG.bossSpawnDelayMs ?? delay);

    startWave(S.wave, delay);


    saveState();
    loop();
  }

  //#endregion
  //#region 8) Input/UI
  /*---------------------------------------------------*/
  // Overlays
  function showOverlay(show) {
    ui.overlay.classList.toggle("hidden", !show);
  }

  function updateHUD() {
    const WPN = getWeaponDef(S.weaponId);

    // HUD block (bottom-right)
    ui.wave.textContent = hudWaveLabel(S.wave);
    ui.hp.textContent = String(S.hp);
    ui.ammo.textContent = WPN.infiniteAmmo ? "∞" : String(S.ammo);
    ui.kills.textContent = String(S.kills); // kept in DOM (hidden in CSS)

    // Operator face in HUD (idle vs hit)
    if (ui.opFace) {
      const now = performance.now();
      const opImg = now < S.opHitUntil ? SPR.opHit : SPR.opIdle;
      ui.opFace.src = opImg?.src || ui.opFace.src;
    }

    // Status line (text under the title)
    const ammoTxt = WPN.infiniteAmmo ? "∞" : `${S.ammo}/${S.ammoMax}`;
    ui.status.textContent = `${waveLabel(S.wave)} • HP ${S.hp} • Kills ${S.kills} • Weapon ${WPN.name} ${ammoTxt}`;
  }

  function hudWaveLabel(n) {
    // HUD wants only the current wave number (no “/3”). Boss can be a label.
    if (n === BOSS_WAVE) return "BOSS";
    return `WAVE ${n}`;
  }

  function waveLabel(n) {
    // Used for overlay/status copy
    if (n === BOSS_WAVE) return "BOSS WAVE";
    return `WAVE ${n}`;
  }

  function setOverlayTitle(text, pulsing = false) {
    ui.oTitle.textContent = text;
    ui.oTitle.classList.toggle("hb-wave-title", pulsing);
  }

  function showWaveIntroOverlay(waveNum) {
    const isBoss = waveNum === BOSS_WAVE;

    const intro = isBoss ? WAVE_INTROS.boss : WAVE_INTROS[waveNum];

    const title = intro?.title || (isBoss ? "BOSS WAVE" : `WAVE ${waveNum}`);
    const lines = (intro?.lines || ["Get ready…"]).slice();

    setOverlayTitle(title, true);

    // Main wave copy
    const mainCopy = overlayLinesToHTML(lines);

    // ✅ Styled controls reminder block
    const controlsBlock = `
      <div class="hb-controlsReminder">
        <div>INSTRUCTIONS: <br> Click to start <br> WASD keys to move <br> Shift to run <br> Mouse to aim</div> G for grenade (only in boss wave after pickup)
      </div>
    `;

    ui.oMsg.innerHTML = mainCopy + controlsBlock;

    ui.oScore.textContent = "";
    showOverlay(true);
  }

  function pauseForWaveIntro(waveNum, opts = {}) {
    const keepPointerLock = !!opts.keepPointerLock;
    try { SFX.boss_run.pause(); SFX.boss_run.currentTime = 0; } catch {}

    // stop sim safely
    clearMoveKeys();
    S.ready = true;
    S.paused = true;

    // ✅ CRITICAL: stop update loop so it can't auto-advance waves
    S.running = false;

    S.lastT = 0;

    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = null;

    // only exit pointer lock if we are NOT keeping it
    if (!keepPointerLock) {
      try {
        if (document.pointerLockElement === ui.canvas)
          document.exitPointerLock?.();
      } catch {}
    }

    showWaveIntroOverlay(waveNum);
    saveState();
    draw();
  }

  function setGameOverOverlay(win) {
    S.over = true;
    S.running = false;
    S.ready = false;
    S.won = !!win;

    // ✅ hard-stop boss loop on overlay
    try {
      SFX.boss_run.pause();
      SFX.boss_run.currentTime = 0;
    } catch {}
    if (S.boss) S.boss.runSoundPlaying = false;

    // release pointer lock if active
    try {
      document.exitPointerLock?.();
    } catch {}

    const acc = S.shots ? Math.round((S.hits / S.shots) * 100) : 0;
    ui.oTitle.textContent = win ? "You Win 💖" : "Game Over 💔";
    ui.oMsg.textContent = win
      ? `All ${CFG.waves.length} waves cleared! Press Continue 💘`
      : "A broken heart got you… Press Restart to try again!";

    ui.oScore.textContent = `Kills: ${S.kills} • Accuracy: ${acc}%`;

    if (win) {
      heartBlasterCompleted = true;
      saveBool(DONE_KEY, true);
      ui.btnContinue.classList.remove("hidden");
      el.hbModalContinueBtn.classList.remove("hidden");

      // ✅ continue exits to menu after wi
      setContinueMode("menu", "Continue 💘");

      // completion confetti (your existing function)
      startConfetti();
      spawnHearts(18);
      updateGamesContinue();
    } else {
      ui.btnContinue.classList.add("hidden");
      el.hbModalContinueBtn.classList.add("hidden");
      playSfx(SFX.over);
    }

    showOverlay(true);
    saveState();
  }

  function setReadyOverlay() {
    showWaveIntroOverlay(S.wave || 1);
  }

  function resetRun(newGame = true) {
    try { SFX.boss_run.pause(); SFX.boss_run.currentTime = 0; } catch {}
    resizeCanvas();

    // ✅ HARD RESET FLAGS so overlay can be clicked again
    S.over = false;
    S.won = false;
    S.running = false;
    S.ready = true;
    try {
      document.exitPointerLock?.();
    } catch {}

    S.yaw = 0;
    S.pitch = 0;

    if (newGame) {
      S.wave = 1;
      S.hp = CFG.hpStart;
      S.kills = 0;
      S.shots = 0;
      S.hits = 0;
      S.enemies = [];

      S.weaponId = "pistol";
      S.ammo = WEAPONS.pistol.ammoStart;
      S.ammoMax = WEAPONS.pistol.ammoMax;
      S.pickup = null;
      S.projectiles = [];

      S.mapIndex = 0;
      applyMap(0);
      switchMapForWave(1);

      S.lastT = 0;
      clearState();
    }
    updateHUD();
    setReadyOverlay();
    draw(); // show one frame
  }

  function clearMoveKeys() {
    if (!S.keys) return;
    for (const k of Object.keys(S.keys)) S.keys[k] = false;
  }

  function setContinueMode(mode, label) {
    // mode: "resume" | "menu"
    ui.btnContinue.dataset.mode = mode;
    ui.btnContinue.textContent = label;

    // keep modal continue in sync too (if it exists)
    if (el.hbModalContinueBtn) {
      el.hbModalContinueBtn.dataset.mode = mode;
      el.hbModalContinueBtn.textContent = label;
    }
  }

  // DOM
  const ui = {
    get game() {
      return el.heartBlasterGame;
    },
    get canvas() {
      return el.heartBlasterCanvas;
    },
    get ctx() {
      return el.heartBlasterCanvas.getContext("2d");
    },

    get status() {
      return el.heartBlasterStatus;
    },
    get wave() {
      return el.hbWave;
    },
    get kills() {
      return el.hbKills;
    },
    get hp() {
      return el.hbHp;
    },

    get ammo() {
      return el.hbAmmo;
    },
    get opFace() {
      return el.hbOpFace;
    },

    get overlay() {
      return el.hbOverlay;
    },
    get oTitle() {
      return el.hbOverlayTitle;
    },
    get oMsg() {
      return el.hbOverlayMsg;
    },
    get oScore() {
      return el.hbOverlayScore;
    },

    get btnBack() {
      return el.heartBlasterBackBtn;
    },
    get btnRestart() {
      return el.heartBlasterRestartBtn;
    },
    get btnContinue() {
      return el.heartBlasterContinueBtn;
    },
  };
  
  // Pointer Lock mouse look
  function onMouseMove(e) {
    if (!S.running) return;
    if (document.pointerLockElement !== ui.canvas) return;

    S.yaw += e.movementX * CFG.sensMouse;
    S.pitch -= e.movementY * CFG.sensMouse;

    S.pitch = U.clamp(S.pitch, -0.55, 0.55);

    // allow full rotation (wrap to [-PI, PI])
    while (S.yaw > Math.PI) S.yaw -= Math.PI * 2;
    while (S.yaw < -Math.PI) S.yaw += Math.PI * 2;

    requestSave(false);
  }

  function requestLock() {
    try {
      ui.canvas.requestPointerLock?.();
    } catch {}
  }

  // Mobile drag aiming
  function onTouchStart(e) {
    if (!e.touches || !e.touches.length) return;
    S.touchActive = true;
    S.lastTouchX = e.touches[0].clientX;
    S.lastTouchY = e.touches[0].clientY;

    // first touch can start
    if (S.ready) beginRun();
  }
  function onTouchMove(e) {
    if (!S.touchActive || !e.touches || !e.touches.length) return;
    const t = e.touches[0];
    const dx = t.clientX - S.lastTouchX;
    const dy = t.clientY - S.lastTouchY;
    S.lastTouchX = t.clientX;
    S.lastTouchY = t.clientY;

    if (!S.running) return;

    S.yaw += dx * CFG.sensTouch;
    S.pitch -= dy * CFG.sensTouch;

    S.pitch = U.clamp(S.pitch, -0.55, 0.55);
    while (S.yaw > Math.PI) S.yaw -= Math.PI * 2;
    while (S.yaw < -Math.PI) S.yaw += Math.PI * 2;

    requestSave(false);
  }
  function onTouchEnd() {
    S.touchActive = false;
  }

  function bindUIOnce() {
    // mouse move
    window.addEventListener("mousemove", onMouseMove);

    // click to lock + shoot
    ui.canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();

      // ✅ if game over, ignore ALL clicks until Restart
      if (S.over) return;

      // If overlay is visible, treat canvas click as "start" (fixes pointer-lock trapping)
      if (!ui.overlay.classList.contains("hidden")) {
        if (!S.over && S.ready) {
          if (ui.canvas.requestPointerLock) requestLock();
          beginRun();
        }
        return;
      }

      // If pointer lock supported, lock first so aiming feels right
      if (
        document.pointerLockElement !== ui.canvas &&
        ui.canvas.requestPointerLock
      ) {
        requestLock();
      }

      shoot();
    });

    // touch controls
    ui.canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    ui.canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    ui.canvas.addEventListener("touchend", onTouchEnd, { passive: true });

    // overlay click starts
    ui.overlay.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest("button");
      if (btn) return;

      e.preventDefault();

      // ✅ If game over, do NOT allow clicking overlay to restart
      // user must press Restart button
      if (S.over) return;

      if (ui.canvas.requestPointerLock) requestLock();
      beginRun();
    });

    // back / restart / continue
    ui.btnBack.addEventListener("click", () => {
      popIn();
      stop();
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    ui.btnRestart.addEventListener("click", () => {
      // full restart of this mini-game (but only affects this mini-game)
      saveBool(DONE_KEY, false);
      heartBlasterCompleted = false;
      clearState();
      S.hasSave = false;
      clearContinueMode();
      resetRun(true);
      updateGamesContinue();
    });

    ui.btnContinue.addEventListener("click", () => {
      const mode = ui.btnContinue.dataset.mode;

      // Resume in-progress run
      if (mode === "resume" && S.hasSave && !S.over) {
        if (ui.canvas.requestPointerLock) requestLock();
        beginRun();
        return;
      }

      // Normal continue (go back to games menu)
      popIn();
      stop();
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    // resize safety
    window.addEventListener("resize", () => {
      if (!ui.game || ui.game.classList.contains("hidden")) return;
      resizeCanvas();
      draw();
    });

    // ===== Pop-out arena controls =====
    el.heartBlasterPopBtn.addEventListener("click", () => {
      popOut();
    });

    // close via X button
    el.hbModalCloseBtn.addEventListener("click", () => {
      try {
        document.exitPointerLock?.();
      } catch {}
      popIn();
    });

    // close by clicking backdrop (outside arena)
    el.hbModal.addEventListener("pointerdown", (e) => {
      if (e.target === el.hbModal) {
        try {
          document.exitPointerLock?.();
        } catch {}
        popIn();
      }
    });

    el.hbModalBackBtn.addEventListener("click", () => {
      popIn();
      stop();
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    el.hbModalRestartBtn.addEventListener("click", () => {
      // restart but stay popped out (your choice)
      saveBool(DONE_KEY, false);
      heartBlasterCompleted = false;
      clearState();
      S.hasSave = false;
      clearContinueMode();
      resetRun(true);
      updateGamesContinue();
    });

    el.hbModalContinueBtn.addEventListener("click", () => {
      const mode = el.hbModalContinueBtn.dataset.mode;

      if (mode === "resume" && S.hasSave && !S.over) {
        if (ui.canvas.requestPointerLock) requestLock();
        beginRun();
        return;
      }

      popIn();
      stop();
      showScreen(el.gamesMenu);
      updateGamesContinue();
    });

    //  WASD / Arrow Key Movement
    function setKey(e, isDown) {
      const k = e.key.toLowerCase();

      // ✅ Toggle minimap with "M" (only on keydown)
      if (k === "m" && isDown) {
        CFG.debugMiniMap = !CFG.debugMiniMap;
        draw();
        return;
      }

      // ✅ Throw grenade (boss wave only)
      if (k === "g" && isDown) {
        throwGrenade();
        return;
      }

      // ✅ DEV: skip to boss (only on keydown)
      if (k === "b" && isDown && CFG.debug.devSkipBoss) {
        devSkipToBoss();
        return;
      }

      // ✅ DEV: skip boss to phase 2 (only on keydown)
      if (k === "n" && isDown && CFG.debug.devSkipBoss) {
        devSkipToBossPhase2();
        return;
      }

      if (k === "w") S.keys.w = isDown;
      if (k === "a") S.keys.a = isDown;
      if (k === "s") S.keys.s = isDown;
      if (k === "d") S.keys.d = isDown;

      if (e.code === "ArrowUp") S.keys.up = isDown;
      if (e.code === "ArrowLeft") S.keys.left = isDown;
      if (e.code === "ArrowDown") S.keys.down = isDown;
      if (e.code === "ArrowRight") S.keys.right = isDown;

      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        S.keys.shift = isDown;
      }
    }

    document.addEventListener("keydown", (e) => {
      if (!ui.game || ui.game.classList.contains("hidden")) return;

      const k = (e.key || "").toLowerCase();

      // ✅ Always hard-block these keys while HB is open
      if (
        e.code === "Space" ||
        e.code.startsWith("Arrow") ||
        k === "m" || k === "g" || k === "n" || k === "b"
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();   // ✅ stronger than stopPropagation
      }

      // ✅ DEV: skip to boss
      if (k === "b" && CFG.debug.devSkipBoss) {
        devSkipToBoss();
        return;
      }

      // ✅ DEV: skip boss to phase 2
      if (k === "n" && CFG.debug.devSkipBoss) {
        devSkipToBossPhase2();
        return;
      }

      setKey(e, true);
    }, true);

    document.addEventListener("keyup", (e) => {
      if (!ui.game || ui.game.classList.contains("hidden")) return;
      setKey(e, false);
    }, true);
  }
  //#endregion
  //#region  9) Public API
  /*---------------------------------------------------*/
  function stop() {
    try { SFX.boss_run.pause(); SFX.boss_run.currentTime = 0; } catch {}
    popIn();

    stopHBMusic();
    resumeSiteMusic();

    if (S.raf) cancelAnimationFrame(S.raf);
    S.raf = null;
    S.running = false;

    // release lock
    try {
      document.exitPointerLock?.();
    } catch {}

    saveState();
    draw();
  }

  return {
    open() {
      hardCloseModal(); 
      showScreen(ui.game);

      // Safety: ensure the popout modal isn't blocking clicks
      el.hbModal?.classList.add("hidden");

      if (!didBind) {
        bindUIOnce();
        didBind = true;
      }

      heartBlasterCompleted = loadBool(DONE_KEY);

      // If already completed -> show “win” overlay but allow replay
      if (heartBlasterCompleted) {
        // minimal state: show results and Continue
        resizeCanvas();
        S.wave = BOSS_WAVE;
        S.mapIndex = BOSS_MAP_INDEX;
        applyMap(S.mapIndex);

        S.hp = Math.max(1, S.hp || CFG.hpStart);
        S.ready = false;
        S.running = false;
        S.over = true;
        S.won = true;

        ui.btnContinue.classList.remove("hidden");
        ui.oTitle.textContent = "Already completed ✅";
        ui.oMsg.textContent = "Restart to play again, or Continue!";
        ui.oScore.textContent = "";

        showOverlay(true);
        updateHUD();
        draw();
        return;
      }

      // restore in-progress state if exists; otherwise fresh
      const hadState = loadState();
      resizeCanvas();

      if (!hadState) {
        resetRun(true);
      } else {
        // ✅ They have a saved in-progress state → show Resume button
        S.running = false;
        S.over = false;
        S.ready = true; // allow beginRun() flow
        S.won = false;

        S.hasSave = true;

        ui.btnContinue.classList.remove("hidden");
        if (el.hbModalContinueBtn)
          el.hbModalContinueBtn.classList.remove("hidden");

        setContinueMode("resume", "Resume ▷");

        ui.oTitle.textContent = "Heart Blaster 💘";
        ui.oMsg.textContent = "Progress saved ✅ Press Resume to continue";
        ui.oScore.textContent = "";

        showOverlay(true);
        updateHUD();
        draw();
      }
    },
    stop,
  };
  //#endregion
})();

//opens heart blaster game from games menu
el.heartBlasterBtn.addEventListener("click", () => {
  HeartBlaster.open();
});

//#region End stuff
/***********************
 * 9) Floating hearts
 ***********************/
function randomHeartColor() {
  const colors = ["#ff4d6d", "#ff7aa2", "#ff2d55", "#ff5ea8", "#ff9bd1"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function spawnHearts(count = 10) {
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.style.color = randomHeartColor();

    const size = 10 + Math.random() * 18;
    heart.style.setProperty("--s", `${size}px`);

    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.bottom = "-5vh";

    const duration = 3 + Math.random() * 4;
    heart.style.animationDuration = `${duration}s`;
    heart.style.opacity = `${0.5 + Math.random() * 0.5}`;

    el.heartsLayer.appendChild(heart);

    setTimeout(() => heart.remove(), duration * 1000);
  }
}

// Ambient hearts
setInterval(() => spawnHearts(2), 650);

/***********************
 * 6) Confetti (simple)
 ***********************/
let confettiPieces = [];
let confettiRunning = false;
let confettiEmitting = false;
let rafId = null;
let confettiStopTimer = null;
let confettiBurstId = 0;

function resizeCanvas() {
  el.confettiCanvas.width = window.innerWidth * devicePixelRatio;
  el.confettiCanvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function makeConfettiPiece() {
  return {
    x: Math.random() * window.innerWidth,
    y: -20,
    r: 3 + Math.random() * 5,
    vx: -2 + Math.random() * 4,
    vy: 2 + Math.random() * 5,
    rot: Math.random() * Math.PI,
    vrot: -0.1 + Math.random() * 0.2,
    color: `hsl(${Math.floor(Math.random() * 360)}, 90%, 65%)`,
  };
}

function startConfetti() {
  resizeCanvas();
  confettiBurstId++;

  // ensure canvas visible
  el.confettiCanvas.classList.remove("hidden");
  el.confettiCanvas.style.display = "block";

  // ✅ arm emitting + add burst BEFORE starting the loop
  confettiEmitting = true;
  confettiPieces.push(...Array.from({ length: 90 }, makeConfettiPiece));

  // ✅ start loop if needed (after we have pieces/emitting)
  if (!confettiRunning) {
    confettiRunning = true;
    loopConfetti();
  }

  // stop emitting after a bit (only if latest burst)
  const myBurst = confettiBurstId;
  if (confettiStopTimer) clearTimeout(confettiStopTimer);

  confettiStopTimer = setTimeout(() => {
    if (confettiBurstId !== myBurst) return;
    confettiEmitting = false;
    confettiStopTimer = null;
  }, 1400);
}

function stopConfetti() {
  // hard stop (used on restart)
  confettiRunning = false;
  confettiEmitting = false;
  confettiPieces = [];
  if (rafId) cancelAnimationFrame(rafId);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function loopConfetti() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // if still emitting, drip a few new ones per frame (nice “producing” feel)
  if (confettiEmitting) {
    confettiPieces.push(...Array.from({ length: 6 }, makeConfettiPiece));
  }

  // update + draw + remove offscreen pieces
  for (let i = confettiPieces.length - 1; i >= 0; i--) {
    const p = confettiPieces[i];
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;

    // remove once it has fallen off screen
    if (p.y > window.innerHeight + 60) {
      confettiPieces.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.r, -p.r, p.r * 2.2, p.r * 1.2);
    ctx.restore();
  }

  // if not emitting and nothing left, stop naturally
  if (!confettiEmitting && confettiPieces.length === 0) {
    confettiRunning = false;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    return;
  }

  rafId = requestAnimationFrame(loopConfetti);
}

/***********************
 * 11) Restart
 ***********************/
el.restartBtn.addEventListener("click", () => {
  // 🔄 Reset session game progress (only on Replay)
  sessionStorage.removeItem(SESSION_KEYS.photoDone);
  sessionStorage.removeItem(SESSION_KEYS.photoUnlocked);
  sessionStorage.removeItem(SESSION_KEYS.photoIndex);
  sessionStorage.removeItem(SESSION_KEYS.photoLocked);

  sessionStorage.removeItem(SESSION_KEYS.scratchDone);

  sessionStorage.removeItem(SESSION_KEYS.memoryDone);
  sessionStorage.removeItem(SESSION_KEYS.memoryDeck);
  sessionStorage.removeItem(SESSION_KEYS.memoryMatchedIds);

  sessionStorage.removeItem(SESSION_KEYS.loveQuizDone);
  sessionStorage.removeItem(SESSION_KEYS.loveQuizIndex);
  sessionStorage.removeItem(SESSION_KEYS.loveQuizSelected);
  sessionStorage.removeItem(SESSION_KEYS.loveQuizSolved);
  sessionStorage.removeItem(SESSION_KEYS.loveQuizWrongTotal);

  sessionStorage.removeItem(SESSION_KEYS.jigsawDone);
  sessionStorage.removeItem(SESSION_KEYS.jigsawPhoto);
  sessionStorage.removeItem(SESSION_KEYS.jigsawPlaced);
  sessionStorage.removeItem(SESSION_KEYS.jigsawRot);
  sessionStorage.removeItem(SESSION_KEYS.jigsawOrder);

  sessionStorage.removeItem(SESSION_KEYS.popDone);
  sessionStorage.removeItem(SESSION_KEYS.popDeck);
  sessionStorage.removeItem(SESSION_KEYS.popPopped);
  sessionStorage.removeItem(SESSION_KEYS.popStickerState);

  sessionStorage.removeItem(SESSION_KEYS.loveDashDone);
  sessionStorage.removeItem(SESSION_KEYS.loveDashBest);

  sessionStorage.removeItem(SESSION_KEYS.heartBlasterDone);
  sessionStorage.removeItem(SESSION_KEYS.heartBlasterState);

  photoGameCompleted = false;
  scratchGameCompleted = false;
  memoryGameCompleted = false;
  loveQuizCompleted = false;
  jigsawGameCompleted = false;
  popHeartsCompleted = false;
  loveDashCompleted = false;
  heartBlasterCompleted = false;

  // reset game-specific UI
  el.scratchContinueBtn.classList.add("hidden");

  // existing reset logic ↓↓↓
  noCount = 0;
  yesScale = 1;

  el.btnRow.insertBefore(el.yesBtn, el.btnRow.firstChild);

  if (yesOverlayEl) {
    yesOverlayEl.remove();
    yesOverlayEl = null;
  }

  el.yesBtn.removeAttribute("style");
  el.noBtn.style.position = "relative";
  el.noBtn.style.left = "";
  el.noBtn.style.top = "";

  el.hint.textContent = "Tip: Don't you fkn dare press NO.";
  showStart();

  selectedActivity = null;
  plans = safeLoadPlans();
  renderActivityPicker();
  updatePlannerActions();

  stopConfetti();
});

el.replayBackBtn.addEventListener("click", () => {
  showScreen(el.gamesMenu);

  // ensure YES/NO never reappear
  el.btnRow.classList.add("hidden");
  el.hint.classList.add("hidden");

  updateGamesContinue();
});
//#endregion