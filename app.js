const lostButton = document.querySelector("#lost-button");
const lostGuide = document.querySelector("#lost-guide");
const currentTimeOutput = document.querySelector("#current-time");
const nextReminderOutput = document.querySelector("#next-reminder");
const navigatorMessage = document.querySelector("#navigator-message");
const catSlime = document.querySelector(".cat-slime");
const catSlimeImage = catSlime?.matches("img") ? catSlime : catSlime?.querySelector(".slime-body");
const timeline = document.querySelector("#timeline");
const achievementPercent = document.querySelector("#achievement-percent");
const achievementBlocks = document.querySelector("#achievement-blocks");
const achievementCount = document.querySelector("#achievement-count");
const startHome = document.querySelector("#start-home");
const startWork = document.querySelector("#start-work");
const startCurrent = document.querySelector("#start-current");
const currentLocationNote = document.querySelector("#current-location-note");
const routeSearchButton = document.querySelector("#route-search-button");
const calculateButton = document.querySelector("#calculate-button");
const resultArea = document.querySelector("#result-area");
const finalSchedule = document.querySelector("#final-schedule");
const bufferHelpButton = document.querySelector("#buffer-help-button");
const bufferHelp = document.querySelector("#buffer-help");
const bufferDecrease = document.querySelector("#buffer-decrease");
const bufferIncrease = document.querySelector("#buffer-increase");
const bufferMinutesOutput = document.querySelector("#buffer-minutes");
const arrivalComplete = document.querySelector("#arrival-complete");
const moodSlider = document.querySelector("#mood-slider");
const moodOptions = document.querySelectorAll(".mood-option");
const settingDecisionButton = document.querySelector("#setting-decision-button");
const goalChatLog = document.querySelector("#goal-chat-log");
const goalChatForm = document.querySelector("#goal-chat-form");
const goalChatInput = document.querySelector("#goal-chat-input");
const goalChatActions = document.querySelector("#goal-chat-actions");

const fields = {
  goalPlace: document.querySelector("#goal-place"),
  arrivalHour: document.querySelector("#arrival-hour"),
  arrivalMinute: document.querySelector("#arrival-minute"),
  trainTime: document.querySelector("#train-time"),
  trainHour: document.querySelector("#train-hour"),
  trainMinute: document.querySelector("#train-minute"),
  trainDuration: document.querySelector("#train-duration"),
  destination: document.querySelector("#destination"),
  startTime: document.querySelector("#start-time"),
  arrivalBuffer: document.querySelector("#arrival-buffer"),
  distance: document.querySelector("#distance"),
  walkingSpeed: document.querySelector("#walking-speed"),
  prepTime: document.querySelector("#prep-time"),
  breakfastTime: document.querySelector("#breakfast-time"),
  extraTime: document.querySelector("#extra-time")
};
const todayButton = document.querySelector("#today-button");
const tomorrowButton = document.querySelector("#tomorrow-button");

const output = {
  summary: document.querySelector("#summary")
};

const storageKey = "yasashisugNaviPlan";
let savedValues = {};
let startType = "home";
let recommendedBufferMinutes = 25;

const userRouteSettings = {
  preparationMinutes: 30,
  starts: {
    home: {
      label: "家",
      station: "東京",
      stationMinutes: 10
    },
    work: {
      label: "職場",
      station: "渋谷",
      stationMinutes: 8
    },
    current: {
      label: "現在地",
      station: "現在地の最寄り駅（仮）",
      stationMinutes: 12
    }
  }
};

const stepComments = {
  wake: "起きられたね、えらい！",
  leave: "出発できたね、いい感じ！",
  train: "電車に乗れたね、順調だよ！",
  station: "あと少しだよ！",
  arrive: "到着おつかれさま、よくできたね！"
};

const stepState = {
  wake: { completed: false, alarm: true },
  leave: { completed: false, alarm: true },
  train: { completed: false, alarm: true },
  station: { completed: false, alarm: false },
  arrive: { completed: false, alarm: false }
};

let currentPlan = [];
let currentGoalChatStep = 0;
let goalChatAnswers = {};
let goalChatEditKey = "";
let catSlimeIdleTimerId;
let catSlimeSleepTimerId;
let catSlimeHappyTimerId;
let catSlimeSleepClockId;
let catSlimeIsHappy = false;
let catSlimeLastInteractionAt = Date.now();
let catSlimeDragState;

function isCatSlimeSleepTime() {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 5;
}

function setCatSlimeImage(src) {
  if (!catSlimeImage || catSlimeImage.getAttribute("src") === src) {
    return;
  }

  catSlimeImage.setAttribute("src", src);
}

function setCatSlimeRestingImage() {
  setCatSlimeImage("nomal.png");
}

function scheduleCatSlimeIdleImages() {
  if (!catSlime) {
    return;
  }

  window.clearTimeout(catSlimeIdleTimerId);
  window.clearTimeout(catSlimeSleepTimerId);

  catSlimeIdleTimerId = window.setTimeout(() => {
    setCatSlimeImage("utatane1.png");
  }, 60000);

  catSlimeSleepTimerId = window.setTimeout(() => {
    setCatSlimeImage("sleep.png");
  }, 300000);
}

function resetCatSlimeState() {
  if (!catSlime) {
    return;
  }

  if (catSlimeDragState?.isDragging) {
    return;
  }

  catSlimeLastInteractionAt = Date.now();
  window.clearTimeout(catSlimeHappyTimerId);
  catSlimeIsHappy = false;
  setCatSlimeRestingImage();
  scheduleCatSlimeIdleImages();
}

function showCatSlimeHappy() {
  if (!catSlime) {
    return;
  }

  if (catSlimeDragState?.isDragging) {
    return;
  }

  catSlimeIsHappy = true;
  catSlimeLastInteractionAt = Date.now();
  window.clearTimeout(catSlimeHappyTimerId);
  window.clearTimeout(catSlimeIdleTimerId);
  window.clearTimeout(catSlimeSleepTimerId);
  setCatSlimeImage("happy.png");

  catSlimeHappyTimerId = window.setTimeout(() => {
    catSlimeIsHappy = false;
    setCatSlimeImage("nomal.png");
    scheduleCatSlimeIdleImages();
  }, 500);
}

function watchCatSlimeSleepTime() {
  if (!catSlime || catSlimeSleepClockId) {
    return;
  }

  catSlimeSleepClockId = window.setInterval(() => {
    const idleMilliseconds = Date.now() - catSlimeLastInteractionAt;
    if (isCatSlimeSleepTime() && idleMilliseconds >= 300000 && !catSlimeIsHappy) {
      setCatSlimeImage("sleep.png");
    }
  }, 60000);
}

function initializeCatSlimeIdleState() {
  if (!catSlime) {
    return;
  }

  ["keydown", "scroll", "mousemove"].forEach((eventName) => {
    window.addEventListener(eventName, resetCatSlimeState, { passive: true });
  });

  window.addEventListener("pointerdown", showCatSlimeHappy, { passive: true });
  resetCatSlimeState();
  watchCatSlimeSleepTime();
  initializeCatSlimeDrag();
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getDragPoint(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  return {
    x: touch ? touch.clientX : event.clientX,
    y: touch ? touch.clientY : event.clientY
  };
}

function applyCatSlimeDragTransform() {
  if (!catSlimeDragState?.isDragging) {
    return;
  }

  const { dx, dy } = catSlimeDragState;
  const limitedX = clampNumber(dx, -42, 42);
  const limitedY = clampNumber(dy, -42, 42);
  const scaleX = 1 + clampNumber(Math.abs(dx) / 120, 0, 0.35);
  const scaleY = 1 + clampNumber(Math.abs(dy) / 120, 0, 0.35);
  const rotate = clampNumber(dx / 34, -4, 4);
  const lagX = clampNumber(catSlimeDragState.earX + ((-limitedX * 0.14) - catSlimeDragState.earX) * 0.22, -6, 6);
  const lagY = clampNumber(catSlimeDragState.earY + ((-limitedY * 0.14) - catSlimeDragState.earY) * 0.22, -6, 6);

  catSlimeDragState.earX = lagX;
  catSlimeDragState.earY = lagY;

  catSlime.style.setProperty("--slime-x", `${limitedX}px`);
  catSlime.style.setProperty("--slime-y", `${limitedY}px`);
  catSlime.style.setProperty("--slime-scale-x", scaleX.toFixed(3));
  catSlime.style.setProperty("--slime-scale-y", scaleY.toFixed(3));
  catSlime.style.setProperty("--slime-rotate", `${rotate.toFixed(2)}deg`);
  catSlime.style.setProperty("--slime-ear-x", `${lagX.toFixed(2)}px`);
  catSlime.style.setProperty("--slime-ear-y", `${lagY.toFixed(2)}px`);
  catSlime.style.setProperty("--slime-ear-rotate-left", `${(-7 + lagX * -0.8).toFixed(2)}deg`);
  catSlime.style.setProperty("--slime-ear-rotate-right", `${(7 + lagX * -0.8).toFixed(2)}deg`);

  catSlimeDragState.frameId = window.requestAnimationFrame(applyCatSlimeDragTransform);
}

function startCatSlimeDrag(event) {
  if (!catSlime || event.target.closest?.("input, textarea, select, button, a")) {
    return;
  }

  const point = getDragPoint(event);
  catSlimeLastInteractionAt = Date.now();
  window.clearTimeout(catSlimeHappyTimerId);
  window.clearTimeout(catSlimeIdleTimerId);
  window.clearTimeout(catSlimeSleepTimerId);
  catSlime.classList.remove("is-releasing");
  catSlime.classList.add("is-pressing");

  catSlimeDragState = {
    isDragging: false,
    startX: point.x,
    startY: point.y,
    dx: 0,
    dy: 0,
    earX: 0,
    earY: 0,
    frameId: 0
  };

  window.setTimeout(() => {
    catSlime?.classList.remove("is-pressing");
  }, 110);
}

function moveCatSlimeDrag(event) {
  if (!catSlimeDragState) {
    return;
  }

  const point = getDragPoint(event);
  catSlimeDragState.dx = point.x - catSlimeDragState.startX;
  catSlimeDragState.dy = point.y - catSlimeDragState.startY;

  if (Math.abs(catSlimeDragState.dx) > 3 || Math.abs(catSlimeDragState.dy) > 3) {
    event.preventDefault();
    catSlime.classList.remove("is-pressing");
    catSlime.classList.add("is-dragging");

    if (!catSlimeDragState.isDragging) {
      catSlimeDragState.isDragging = true;
      catSlimeDragState.frameId = window.requestAnimationFrame(applyCatSlimeDragTransform);
    }
  }
}

function endCatSlimeDrag() {
  if (!catSlimeDragState) {
    return;
  }

  window.cancelAnimationFrame(catSlimeDragState.frameId);
  catSlime.classList.remove("is-pressing", "is-dragging");
  catSlime.classList.add("is-releasing");
  catSlimeDragState = null;

  window.setTimeout(() => {
    if (!catSlime) {
      return;
    }

    catSlime.classList.remove("is-releasing");
    catSlime.style.removeProperty("--slime-x");
    catSlime.style.removeProperty("--slime-y");
    catSlime.style.removeProperty("--slime-scale-x");
    catSlime.style.removeProperty("--slime-scale-y");
    catSlime.style.removeProperty("--slime-rotate");
    catSlime.style.removeProperty("--slime-ear-x");
    catSlime.style.removeProperty("--slime-ear-y");
    catSlime.style.removeProperty("--slime-ear-rotate-left");
    catSlime.style.removeProperty("--slime-ear-rotate-right");
    scheduleCatSlimeIdleImages();
  }, 580);
}

function initializeCatSlimeDrag() {
  if (!catSlime) {
    return;
  }

  catSlime.addEventListener("touchstart", startCatSlimeDrag, { passive: true });
  catSlime.addEventListener("touchmove", moveCatSlimeDrag, { passive: false });
  window.addEventListener("touchend", endCatSlimeDrag, { passive: true });
  catSlime.addEventListener("mousedown", startCatSlimeDrag);
  window.addEventListener("mousemove", moveCatSlimeDrag);
  window.addEventListener("mouseup", endCatSlimeDrag);
}

function normalizeInputText(value) {
  return value
    .trim()
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/：/g, ":")
    .replace(/\s+/g, "");
}

function normalizeTimeInput(value) {
  const text = normalizeInputText(value);
  const meridiem = text.includes("午後") ? "pm" : text.includes("午前") ? "am" : "";
  const timeText = text.replace(/午前|午後/g, "");
  let hours;
  let minutes = 0;

  const colonMatch = timeText.match(/^(\d{1,2}):(\d{1,2})$/);
  const japaneseMatch = timeText.match(/^(\d{1,2})時(?:(\d{1,2})分?)?$/);

  if (colonMatch) {
    hours = Number(colonMatch[1]);
    minutes = Number(colonMatch[2]);
  } else if (japaneseMatch) {
    hours = Number(japaneseMatch[1]);
    minutes = japaneseMatch[2] === undefined ? 0 : Number(japaneseMatch[2]);
  } else {
    return null;
  }

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  }

  if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeDurationInput(value) {
  const text = normalizeInputText(value);
  const hourMinuteMatch = text.match(/^(?:(\d+)時間)?(?:(\d+)分?)?$/);

  if (!hourMinuteMatch || (!hourMinuteMatch[1] && !hourMinuteMatch[2])) {
    return null;
  }

  const hours = Number(hourMinuteMatch[1] || 0);
  const minutes = Number(hourMinuteMatch[2] || 0);
  const totalMinutes = hours * 60 + minutes;

  return totalMinutes > 0 ? totalMinutes : null;
}

function validateDestination(value) {
  const destination = value.trim();
  return destination ? { value: destination } : { error: "行き先を教えてね" };
}

function validateArrivalTime(value) {
  const time = normalizeTimeInput(value);
  return time ? { value: time } : { error: "『10:00』や『10時30分』みたいに教えてね" };
}

function validateTrainTime(value) {
  const time = normalizeTimeInput(value);
  return time ? { value: time } : { error: "『9:20』みたいに教えてね" };
}

function validateTrainDuration(value) {
  const minutes = normalizeDurationInput(value);
  return minutes ? { value: minutes } : { error: "『20分』みたいに教えてね" };
}

const goalChatSteps = [
  {
    key: "destination",
    question: "今日はどこへ行く？",
    placeholder: "例：新宿",
    validate: validateDestination
  },
  {
    key: "arrivalTime",
    question: "何時までに着きたい？",
    placeholder: "例：10:00",
    validate: validateArrivalTime
  },
  {
    key: "trainTime",
    question: "何時の電車に乗る？",
    placeholder: "例：9:20",
    validate: validateTrainTime
  },
  {
    key: "trainDuration",
    question: "電車には何分くらい乗る？",
    placeholder: "例：20分",
    validate: validateTrainDuration
  }
];

const arrivalBufferChoices = [5, 10, 15, 20, 30];
const moodBufferChoices = [30, 25, 20, 15, 5];
const customBufferChoices = [0, 5, 10, 15, 20, 25, 30];

function appendChatBubble(text, type = "slime") {
  if (!goalChatLog) {
    return;
  }

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble chat-bubble--${type}`;
  bubble.textContent = text;
  goalChatLog.append(bubble);
}

function clearGoalChatLog() {
  if (goalChatLog) {
    goalChatLog.replaceChildren();
  }
}

function appendTrainTimeQuestionBubble(question, prefix = "") {
  if (!goalChatLog) {
    return;
  }

  const startSetting = getStartSetting();
  const destination = goalChatAnswers.destination || "目的地";
  const arrivalTime = goalChatAnswers.arrivalTime || "10:00";
  const query = `${startSetting.station} から ${destination} 乗換 到着 ${arrivalTime}`;
  const bubble = document.createElement("div");
  const questionText = document.createElement("span");
  const routeLink = document.createElement("a");

  bubble.className = "chat-bubble chat-bubble--slime";
  questionText.textContent = prefix ? `${prefix}\n${question}` : question;
  routeLink.className = "chat-route-link";
  routeLink.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  routeLink.target = "_blank";
  routeLink.rel = "noopener";
  routeLink.textContent = "乗換案内で調べる";

  bubble.append(questionText, document.createElement("br"), routeLink);
  goalChatLog.append(bubble);
}

function removeGoalChatActionBubbles() {
  if (!goalChatLog) {
    return;
  }

  goalChatLog.querySelectorAll(".chat-action-bubble").forEach((bubble) => bubble.remove());
}

function appendGoalChatButtonBubble(buttons) {
  if (!goalChatLog) {
    return;
  }

  const bubble = document.createElement("div");
  const buttonGroup = document.createElement("div");

  bubble.className = "chat-bubble chat-bubble--slime chat-action-bubble";
  buttonGroup.className = "chat-button-row";

  buttons.forEach(({ label, onClick, variant = "primary" }) => {
    const button = document.createElement("button");
    button.className = `chat-choice-button chat-choice-button--${variant}`;
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    buttonGroup.append(button);
  });

  bubble.append(buttonGroup);
  goalChatLog.append(bubble);
}

function appendGoalChatMoodBubble() {
  if (!goalChatLog) {
    return;
  }

  const bubble = document.createElement("div");
  const moodWrap = document.createElement("div");
  const buttonGroup = document.createElement("div");
  const leftLabel = document.createElement("span");
  const rightLabel = document.createElement("span");

  bubble.className = "chat-bubble chat-bubble--slime chat-action-bubble";
  moodWrap.className = "chat-mood-wrap";
  leftLabel.className = "chat-mood-label";
  rightLabel.className = "chat-mood-label";
  leftLabel.textContent = "不安";
  rightLabel.textContent = "ばっちり！";
  buttonGroup.className = "chat-mood-options";

  moodBufferChoices.forEach((minutes) => {
    const button = document.createElement("button");
    button.className = "chat-mood-option";
    button.type = "button";
    button.setAttribute("aria-label", `予備時間${minutes}分`);
    button.addEventListener("click", () => selectGoalChatBuffer(minutes));
    buttonGroup.append(button);
  });

  moodWrap.append(leftLabel, buttonGroup, rightLabel);
  bubble.append(moodWrap);
  goalChatLog.append(bubble);
}

function getGoalChatCurrentValueText(key) {
  const values = {
    destination: goalChatAnswers.destination,
    arrivalTime: goalChatAnswers.arrivalTime,
    trainTime: goalChatAnswers.trainTime,
    trainDuration: goalChatAnswers.trainDuration ? `${goalChatAnswers.trainDuration}分` : "",
    arrivalBuffer: goalChatAnswers.arrivalBuffer ? `${goalChatAnswers.arrivalBuffer}分前` : "",
    recommendedBufferMinutes: `${goalChatAnswers.recommendedBufferMinutes ?? recommendedBufferMinutes}分`
  };

  return values[key] || "未入力";
}

function askCurrentGoalQuestion(options = {}) {
  const step = goalChatSteps[currentGoalChatStep];
  const prefix = options.prefix || "";

  if (!step) {
    showGoalChatArrivalBufferQuestion();
    return;
  }

  clearGoalChatLog();

  if (step.key === "trainTime") {
    appendTrainTimeQuestionBubble(step.question, prefix);
  } else {
    appendChatBubble(prefix ? `${prefix}\n${step.question}` : step.question, "slime");
  }

  if (goalChatInput) {
    goalChatInput.value = "";
    goalChatInput.placeholder = step.placeholder;
    goalChatInput.focus();
  }
}

function showGoalChatArrivalBufferQuestion() {
  clearGoalChatLog();
  appendChatBubble("何分前につきたい？", "slime");
  appendGoalChatButtonBubble(
    arrivalBufferChoices.map((minutes) => ({
      label: `${minutes}分前`,
      onClick: () => {
        goalChatAnswers.arrivalBuffer = minutes;
        showGoalChatMoodQuestion();
      }
    }))
  );

  if (goalChatForm) {
    goalChatForm.hidden = true;
  }
}

function showGoalChatMoodQuestion() {
  clearGoalChatLog();
  appendChatBubble("じかん通りにつけそう？", "slime");
  appendGoalChatMoodBubble();
}

function selectGoalChatBuffer(minutes) {
  goalChatAnswers.recommendedBufferMinutes = minutes;
  recommendedBufferMinutes = minutes;
  showGoalChatBufferConfirmation();
}

function showGoalChatBufferConfirmation() {
  const minutes = goalChatAnswers.recommendedBufferMinutes ?? recommendedBufferMinutes;

  clearGoalChatLog();
  appendChatBubble(
    `入力内容を確認してね\nもくてきち：${getGoalChatCurrentValueText("destination")}\n到着じかん：${getGoalChatCurrentValueText("arrivalTime")}\n電車にのる時間：${getGoalChatCurrentValueText("trainTime")}\n電車での移動時間：${getGoalChatCurrentValueText("trainDuration")}\n何分前につく：${getGoalChatCurrentValueText("arrivalBuffer")}\n予備時間：${minutes}分`,
    "slime"
  );
  appendChatBubble(`予備時間：${minutes}分の余裕をもってスケジュールをたてていいかな？`, "slime");
  appendGoalChatButtonBubble([
    {
      label: "予定をたてる",
      onClick: createGoalChatSchedule
    },
    {
      label: "変更",
      variant: "secondary",
      onClick: showGoalChatChangeChoices
    }
  ]);
}

function showGoalChatChangeChoices() {
  clearGoalChatLog();
  appendChatBubble("どこを変更する？", "slime");
  appendGoalChatButtonBubble([
    { label: `もくてきち：${getGoalChatCurrentValueText("destination")}`, onClick: () => editGoalChatAnswer("destination") },
    { label: `到着じかん：${getGoalChatCurrentValueText("arrivalTime")}`, onClick: () => editGoalChatAnswer("arrivalTime") },
    { label: `電車にのる時間：${getGoalChatCurrentValueText("trainTime")}`, onClick: () => editGoalChatAnswer("trainTime") },
    { label: `電車での移動時間：${getGoalChatCurrentValueText("trainDuration")}`, onClick: () => editGoalChatAnswer("trainDuration") },
    { label: `予備時間：${getGoalChatCurrentValueText("recommendedBufferMinutes")}`, onClick: showGoalChatBufferChoices }
  ]);
}

function showGoalChatBufferChoices() {
  clearGoalChatLog();
  appendChatBubble("予備時間を選んでね", "slime");
  appendGoalChatButtonBubble(
    customBufferChoices.map((minutes) => ({
      label: `${minutes}分`,
      onClick: () => selectGoalChatBuffer(minutes)
    }))
  );
}

function createGoalChatSchedule() {
  applyGoalChatAnswersToFields();
  savePlan();
  window.location.href = "schedule.html";
}

function applyGoalChatAnswersToFields() {
  const [arrivalHour, arrivalMinute] = goalChatAnswers.arrivalTime.split(":");

  if (fields.goalPlace) {
    fields.goalPlace.value = goalChatAnswers.destination;
  }

  if (fields.arrivalHour) {
    fields.arrivalHour.value = arrivalHour;
  }

  if (fields.arrivalMinute) {
    fields.arrivalMinute.value = arrivalMinute;
  }

  if (fields.trainTime) {
    fields.trainTime.value = goalChatAnswers.trainTime;
  }

  if (fields.trainDuration) {
    fields.trainDuration.value = String(goalChatAnswers.trainDuration);
  }

  if (fields.arrivalBuffer) {
    fields.arrivalBuffer.value = String(goalChatAnswers.arrivalBuffer || 10);
  }

  recommendedBufferMinutes = Number(goalChatAnswers.recommendedBufferMinutes ?? recommendedBufferMinutes);
}

function editGoalChatAnswer(key) {
  const stepIndex = goalChatSteps.findIndex((step) => step.key === key);

  if (stepIndex < 0) {
    return;
  }

  goalChatEditKey = key;
  currentGoalChatStep = stepIndex;

  if (goalChatForm) {
    goalChatForm.hidden = false;
  }

  askCurrentGoalQuestion({
    prefix: `今は「${getGoalChatCurrentValueText(key)}」だよ`
  });
}

function resetGoalChat() {
  currentGoalChatStep = 0;
  goalChatAnswers = {};
  goalChatEditKey = "";

  if (goalChatLog) {
    goalChatLog.replaceChildren();
  }

  recommendedBufferMinutes = 25;

  if (goalChatActions) {
    goalChatActions.hidden = true;
    goalChatActions.replaceChildren();
  }

  if (goalChatForm) {
    goalChatForm.hidden = false;
  }

  askCurrentGoalQuestion();
}

function initializeGoalChat() {
  if (!goalChatForm || !goalChatInput || !goalChatLog) {
    return;
  }

  goalChatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    showCatSlimeHappy();

    const step = goalChatSteps[currentGoalChatStep];
    const inputValue = goalChatInput.value;
    const result = step.validate(inputValue);

    if (result.error) {
      askCurrentGoalQuestion({ prefix: result.error });
      return;
    }

    if (step.key === "trainTime" && toMinutes(result.value) >= toMinutes(goalChatAnswers.arrivalTime)) {
      askCurrentGoalQuestion({ prefix: "到着時間より早い時間を入力してね" });
      return;
    }

    goalChatAnswers[step.key] = result.value;

    if (goalChatEditKey) {
      goalChatEditKey = "";
      if (goalChatAnswers.recommendedBufferMinutes !== undefined) {
        showGoalChatBufferConfirmation();
      } else {
        showGoalChatArrivalBufferQuestion();
      }
      return;
    }

    currentGoalChatStep += 1;
    askCurrentGoalQuestion();
  });

  resetGoalChat();
}

function serializeStepState() {
  return Object.fromEntries(
    Object.entries(stepState).map(([id, state]) => [id, { ...state }])
  );
}

function restoreStepState(nextStepState = {}) {
  Object.entries(nextStepState).forEach(([id, state]) => {
    if (stepState[id]) {
      stepState[id] = { ...stepState[id], ...state };
    }
  });
}

function getAvailableFields() {
  return Object.values(fields).filter(Boolean);
}

function loadSavedPlan() {
  savedValues = JSON.parse(localStorage.getItem(storageKey) || "{}");
  restoreStepState(savedValues.stepState);

  Object.entries(fields).forEach(([key, field]) => {
    if (field && savedValues[key] !== undefined) {
      field.value = savedValues[key];
    }
  });

  if (fields.destination && savedValues.goalPlace) {
    fields.destination.value = savedValues.goalPlace;
  }

  if (fields.startTime && savedValues.arrivalHour && savedValues.arrivalMinute) {
    fields.startTime.value = `${savedValues.arrivalHour}:${savedValues.arrivalMinute}`;
  }

  if (savedValues.trainTime) {
    const [trainHour, trainMinute] = savedValues.trainTime.split(":");

    if (fields.trainHour && trainHour) {
      fields.trainHour.value = trainHour;
    }

    if (fields.trainMinute && trainMinute) {
      fields.trainMinute.value = trainMinute;
    }
  }

  syncTrainTime();

  setStartType(savedValues.startType || "home", { shouldSave: false });
  setRecommendedBuffer(getSavedNumber("recommendedBufferMinutes", 25), { shouldSave: false });
  updateDateButtons(savedValues.arrivalDay || "today");
  renderScheduleTimeline();
}

function hasGoalPlace() {
  return Boolean((savedValues.goalPlace || savedValues.destination || "").trim());
}

function redirectScheduleWithoutGoal() {
  if ((timeline || moodSlider || moodOptions.length || settingDecisionButton) && !hasGoalPlace()) {
    window.location.replace("index.html#goal-section");
  }
}

function savePlan() {
  const nextPlan = { ...savedValues };

  Object.entries(fields).forEach(([key, field]) => {
    if (field) {
      nextPlan[key] = field.value;
    }
  });

  if (fields.goalPlace) {
    nextPlan.destination = fields.goalPlace.value;
  }

  if (fields.arrivalHour && fields.arrivalMinute) {
    nextPlan.startTime = `${fields.arrivalHour.value}:${fields.arrivalMinute.value}`;
  }

  if (fields.trainHour && fields.trainMinute) {
    nextPlan.trainTime = fields.trainHour.value && fields.trainMinute.value
      ? `${fields.trainHour.value}:${fields.trainMinute.value}`
      : "";
  }

  if (startHome || startWork || startCurrent) {
    nextPlan.startType = startType;
  }

  nextPlan.recommendedBufferMinutes = recommendedBufferMinutes;

  nextPlan.stepState = serializeStepState();

  savedValues = nextPlan;
  localStorage.setItem(storageKey, JSON.stringify(nextPlan));
}

function getValue(key, fallback = "") {
  if (key === "destination") {
    return fields.destination?.value ?? savedValues.destination ?? savedValues.goalPlace ?? fallback;
  }

  if (key === "startTime" && savedValues.arrivalHour && savedValues.arrivalMinute) {
    return fields.startTime?.value ?? savedValues.startTime ?? `${savedValues.arrivalHour}:${savedValues.arrivalMinute}`;
  }

  return fields[key]?.value ?? savedValues[key] ?? fallback;
}

function toMinutes(timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeMinutes(totalMinutes) {
  const minutesPerDay = 24 * 60;
  return ((Math.round(totalMinutes) % minutesPerDay) + minutesPerDay) % minutesPerDay;
}

function formatTime(totalMinutes) {
  const normalized = normalizeMinutes(totalMinutes);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getNumber(field, fallback = 0) {
  const value = Number(field.value);
  return Number.isFinite(value) ? value : fallback;
}

function getNumberValue(key, fallback = 0) {
  const value = Number(getValue(key, fallback));
  return Number.isFinite(value) ? value : fallback;
}

function getSavedNumber(key, fallback = 0) {
  const value = Number(savedValues[key]);
  return Number.isFinite(value) ? value : fallback;
}

function setStartType(nextStartType, options = {}) {
  startType = nextStartType;

  if (startHome) {
    startHome.checked = startType === "home";
  }

  if (startWork) {
    startWork.checked = startType === "work";
  }

  if (startCurrent) {
    startCurrent.checked = startType === "current";
  }

  if (currentLocationNote) {
    currentLocationNote.hidden = startType !== "current";
  }

  if (options.shouldSave !== false) {
    savePlan();
  }
}

function getStartSetting() {
  if (startType === "current") {
    return resolveCurrentLocationStation();
  }

  return userRouteSettings.starts[startType] || userRouteSettings.starts.home;
}

function resolveCurrentLocationStation() {
  // Later, navigator.geolocation.getCurrentPosition() can replace this placeholder.
  return userRouteSettings.starts.current;
}

function getArrivalTimeText() {
  const hour = fields.arrivalHour?.value || savedValues.arrivalHour || "10";
  const minute = fields.arrivalMinute?.value || savedValues.arrivalMinute || "00";
  return `${hour}:${minute}`;
}

function getTrainTimeText() {
  if (fields.trainHour && fields.trainMinute) {
    return fields.trainHour.value && fields.trainMinute.value
      ? `${fields.trainHour.value}:${fields.trainMinute.value}`
      : "";
  }

  return fields.trainTime?.value || savedValues.trainTime || "";
}

function syncTrainTime() {
  if (!fields.trainTime || !fields.trainHour || !fields.trainMinute) {
    return;
  }

  fields.trainTime.value = fields.trainHour.value && fields.trainMinute.value
    ? `${fields.trainHour.value}:${fields.trainMinute.value}`
    : "";
}

function openRouteSearch() {
  savePlan();

  const startSetting = getStartSetting();
  const goalPlace = getValue("goalPlace", "渋谷").trim() || "渋谷";
  const query = `${startSetting.station} から ${goalPlace} 乗換 到着 ${getArrivalTimeText()}`;
  window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "noopener");
}

function renderRouteResult() {
  if (!resultArea) {
    return;
  }

  savePlan();

  const trainTime = fields.trainTime?.value;
  if (!trainTime) {
    resultArea.innerHTML = "<p>電車に乗る時間を入れると、出る時間を逆算できます。</p>";
    return;
  }

  const startSetting = getStartSetting();
  const trainMinutes = toMinutes(trainTime);
  const leaveMinutes = trainMinutes - startSetting.stationMinutes;
  const preparationStartMinutes = leaveMinutes - userRouteSettings.preparationMinutes;

  resultArea.innerHTML = `
    <h2>やさしい逆算</h2>
    <dl class="route-result-list">
      <div>
        <dt>出発場所</dt>
        <dd>${startSetting.label}</dd>
      </div>
      <div>
        <dt>利用する駅</dt>
        <dd>${startSetting.station}</dd>
      </div>
      <div>
        <dt>駅まで</dt>
        <dd>${startSetting.stationMinutes}分</dd>
      </div>
      <div>
        <dt>電車に乗る時間</dt>
        <dd>${formatTime(trainMinutes)}</dd>
      </div>
      <div>
        <dt>${startSetting.label}を出る時間</dt>
        <dd>${formatTime(leaveMinutes)}</dd>
      </div>
      <div>
        <dt>支度開始時間</dt>
        <dd>${formatTime(preparationStartMinutes)}</dd>
      </div>
    </dl>
  `;
}

function moveToSchedulePage() {
  savePlan();
  window.location.href = "schedule.html";
}

function setRecommendedBuffer(nextMinutes, options = {}) {
  recommendedBufferMinutes = Math.min(30, Math.max(0, Math.round(nextMinutes / 5) * 5));

  if (bufferMinutesOutput) {
    bufferMinutesOutput.textContent = String(recommendedBufferMinutes);
  }

  if (moodSlider) {
    const moodValueByBuffer = {
      30: "1",
      25: "2",
      20: "3",
      15: "4",
      5: "5"
    };
    moodSlider.value = moodValueByBuffer[recommendedBufferMinutes] || "2";
  }

  moodOptions.forEach((option) => {
    option.classList.toggle("is-selected", Number(option.dataset.buffer) === recommendedBufferMinutes);
    option.setAttribute("aria-checked", String(Number(option.dataset.buffer) === recommendedBufferMinutes));
  });

  if (options.shouldSave !== false) {
    savePlan();
  }

  renderScheduleTimeline();
}

function getBufferFromMood(moodValue) {
  const buffers = {
    1: 30,
    2: 25,
    3: 20,
    4: 15,
    5: 5
  };
  return buffers[Number(moodValue)] || 25;
}

function renderFinalSchedule() {
  if (!finalSchedule) {
    return;
  }

  const trainTime = getTrainTimeText();
  if (!trainTime) {
    finalSchedule.innerHTML = "<p>もくてきちページで、電車に乗る時間を入れると予定を表示できます。</p>";
    return;
  }

  const startSetting = getStartSetting();
  const arrivalBuffer = Math.max(0, getNumberValue("arrivalBuffer", 10));
  const trainMinutes = toMinutes(trainTime);
  const leaveMinutes = trainMinutes - startSetting.stationMinutes - recommendedBufferMinutes;
  const preparationStartMinutes = leaveMinutes - userRouteSettings.preparationMinutes;

  finalSchedule.innerHTML = `
    <h2>最終スケジュール</h2>
    <dl class="route-result-list">
      <div>
        <dt>到着希望時間</dt>
        <dd>${getArrivalTimeText()}</dd>
      </div>
      <div>
        <dt>何分前につく予定か</dt>
        <dd>${arrivalBuffer}分前</dd>
      </div>
      <div>
        <dt>電車に乗る時間</dt>
        <dd>${formatTime(trainMinutes)}</dd>
      </div>
      <div>
        <dt>${startSetting.label}を出る時間</dt>
        <dd>${formatTime(leaveMinutes)}</dd>
      </div>
      <div>
        <dt>支度開始時間</dt>
        <dd>${formatTime(preparationStartMinutes)}</dd>
      </div>
      <div>
        <dt>予備時間</dt>
        <dd>${recommendedBufferMinutes}分</dd>
      </div>
    </dl>
  `;
}

function clearPlanAndStartNew() {
  localStorage.removeItem(storageKey);
  savedValues = {};
  window.location.href = "index.html#goal-section";
}

function getRouteScheduleSteps() {
  const startSetting = getStartSetting();
  const arrivalTime = toMinutes(getArrivalTimeText());
  const arrivalBuffer = Math.max(0, getNumberValue("arrivalBuffer", 10));
  const targetArrival = arrivalTime - arrivalBuffer;
  const savedTrainTime = getTrainTimeText();
  const trainTime = savedTrainTime ? toMinutes(savedTrainTime) : targetArrival - recommendedBufferMinutes;
  const trainDuration = Math.max(1, getNumberValue("trainDuration", 1));
  const trainExitTime = trainTime + trainDuration;
  const destinationArrival = Math.max(trainExitTime, targetArrival);
  const leaveTime = trainTime - startSetting.stationMinutes - recommendedBufferMinutes;
  const wakeTime = leaveTime - userRouteSettings.preparationMinutes;

  return [
    { id: "wake", time: wakeTime, label: "起きる" },
    { id: "leave", time: leaveTime, label: `${startSetting.label}を出る` },
    { id: "train", time: trainTime, label: "電車に乗る" },
    { id: "station", time: trainExitTime, label: "電車を降りる" },
    { id: "arrive", time: destinationArrival, label: "目的地到着" }
  ];
}

function renderScheduleTimeline() {
  if (!timeline) {
    return;
  }

  currentPlan = getRouteScheduleSteps();
  if (output.summary) {
    output.summary.textContent = `${getValue("destination", "目的地")}へ向かう予定です。`;
  }

  renderTimeline();
}

function calculatePlan() {
  if (!getAvailableFields().length && !Object.keys(savedValues).length) {
    updateNextReminder();
    return;
  }

  if (!timeline && getAvailableFields().length) {
    savePlan();
  }

  const startTime = getValue("startTime", "10:00") || "10:00";
  const destination = getValue("destination", "目的地").trim() || "目的地";
  const arrivalBuffer = Math.max(0, getNumberValue("arrivalBuffer"));
  const distance = Math.max(0, getNumberValue("distance"));
  const walkingSpeed = Math.max(0.1, getNumberValue("walkingSpeed", 4));
  const prepTime = Math.max(0, getNumberValue("prepTime"));
  const breakfastTime = Math.max(0, getNumberValue("breakfastTime"));
  const extraTime = Math.max(0, getNumberValue("extraTime"));

  const travelTime = Math.ceil((distance / walkingSpeed) * 60);
  const startMinutes = toMinutes(startTime);
  const targetArrival = startMinutes - arrivalBuffer;
  const leaveTime = targetArrival - travelTime - extraTime;
  const wakeTime = leaveTime - prepTime - breakfastTime;
  const trainTime = leaveTime + Math.max(5, Math.round(travelTime * 0.35));
  const stationTime = targetArrival - Math.max(3, Math.min(10, Math.round(travelTime * 0.25)));

  currentPlan = [
    { id: "wake", time: wakeTime, label: "起きる" },
    { id: "leave", time: leaveTime, label: "家を出る" },
    { id: "train", time: trainTime, label: "電車に乗る" },
    { id: "station", time: stationTime, label: "駅に着く" },
    { id: "arrive", time: targetArrival, label: "目的地に到着" }
  ];

  if (output.summary) {
    output.summary.textContent =
      `${destination}には${formatTime(targetArrival)}ごろ到着を目指します。` +
      ` 移動は約${travelTime}分、予備時間は${extraTime}分です。`;
  }

  if (getAvailableFields().length) {
    savePlan();
  }

  updateNextReminder();
  renderTimeline();
  renderScheduleTimeline();
}

function updateClock() {
  if (!currentTimeOutput) {
    return;
  }

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  currentTimeOutput.textContent = `${hours}:${minutes}`;
}

function updateNextReminder() {
  if (!nextReminderOutput) {
    return;
  }

  if (!hasGoalPlace()) {
    nextReminderOutput.textContent = "もくてきちから予定を入力しよう";
    return;
  }

  const reminderPlan = getRouteScheduleSteps();
  const nextStep = reminderPlan
    .filter((step) => !stepState[step.id]?.completed)
    .sort((first, second) => first.time - second.time)[0];

  if (!nextStep) {
    nextReminderOutput.textContent = "最初の予定の5分前 --:--";
    return;
  }

  nextReminderOutput.textContent = `最初の予定の5分前 ${formatTime(nextStep.time - 5)}`;
}

function renderTimeline() {
  if (!timeline) {
    return;
  }

  timeline.replaceChildren();

  currentPlan.forEach((step) => {
    const state = stepState[step.id];
    const item = document.createElement("article");
    item.className = "timeline-item";
    item.classList.toggle("is-completed", state.completed);
    item.dataset.step = step.id;

    const checkbox = document.createElement("button");
    checkbox.type = "button";
    checkbox.className = "timeline-check";
    checkbox.setAttribute("aria-label", `${step.label}を完了にする`);
    checkbox.setAttribute("aria-pressed", String(state.completed));
    checkbox.textContent = state.completed ? "✓" : "";
    checkbox.addEventListener("click", () => toggleComplete(step.id));

    const body = document.createElement("div");
    body.className = "timeline-body";

    const time = document.createElement("time");
    time.className = "timeline-time";
    time.textContent = formatTime(step.time);

    const label = document.createElement("span");
    label.className = "timeline-label";
    label.textContent = step.label;

    body.append(time, label);

    const alarm = document.createElement("button");
    alarm.type = "button";
    alarm.className = "alarm-toggle";
    alarm.setAttribute("aria-pressed", String(state.alarm));
    alarm.textContent = state.alarm ? "ON" : "OFF";
    alarm.addEventListener("click", () => toggleAlarm(step.id));

    item.append(checkbox, body, alarm);
    timeline.append(item);
  });

  updateAchievement();
}

function toggleComplete(stepId) {
  stepState[stepId].completed = !stepState[stepId].completed;
  savePlan();

  if (!navigatorMessage) {
    renderTimeline();
    return;
  }

  if (stepState[stepId].completed) {
    navigatorMessage.textContent = stepComments[stepId];
  } else {
    navigatorMessage.textContent = "ゆっくりで大丈夫。一緒に確認しよう。";
  }

  renderTimeline();
}

function toggleAlarm(stepId) {
  stepState[stepId].alarm = !stepState[stepId].alarm;
  savePlan();
  renderTimeline();
}

function updateAchievement() {
  if (!achievementPercent || !achievementCount || !achievementBlocks) {
    return;
  }

  const total = currentPlan.length;
  const completed = currentPlan.filter((step) => stepState[step.id].completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const filledBlocks = Math.round(percent / 10);

  achievementPercent.textContent = `${percent}%`;
  achievementCount.textContent = `${completed} / ${total} 完了`;
  achievementBlocks.replaceChildren();

  for (let index = 0; index < 10; index += 1) {
    const block = document.createElement("span");
    block.className = index < filledBlocks ? "is-filled" : "";
    achievementBlocks.append(block);
  }
}

function updateDateButtons(nextDay) {
  if (!todayButton || !tomorrowButton) {
    return;
  }

  savedValues.arrivalDay = nextDay;
  todayButton.classList.toggle("is-selected", nextDay === "today");
  tomorrowButton.classList.toggle("is-selected", nextDay === "tomorrow");
}

function selectArrivalDay(nextDay) {
  updateDateButtons(nextDay);
  savePlan();
}

if (lostButton && lostGuide) {
  lostButton.addEventListener("click", () => {
    lostGuide.hidden = false;

    if (navigatorMessage) {
      navigatorMessage.textContent = "迷ったら、見えるものを一つずつ確認しよう。";
    }

    lostGuide.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

if (todayButton) {
  todayButton.addEventListener("click", () => selectArrivalDay("today"));
}

if (tomorrowButton) {
  tomorrowButton.addEventListener("click", () => selectArrivalDay("tomorrow"));
}

if (startHome) {
  startHome.addEventListener("change", () => setStartType("home"));
}

if (startWork) {
  startWork.addEventListener("change", () => setStartType("work"));
}

if (startCurrent) {
  startCurrent.addEventListener("change", () => setStartType("current"));
}

if (routeSearchButton) {
  routeSearchButton.addEventListener("click", openRouteSearch);
}

if (calculateButton) {
  calculateButton.addEventListener("click", moveToSchedulePage);
}

if (settingDecisionButton) {
  settingDecisionButton.addEventListener("click", () => {
    savePlan();
    window.location.href = "schedule.html";
  });
}

if (bufferHelpButton && bufferHelp) {
  bufferHelpButton.addEventListener("click", () => {
    const nextHidden = !bufferHelp.hidden;
    bufferHelp.hidden = nextHidden;
    bufferHelpButton.setAttribute("aria-expanded", String(!nextHidden));
  });
}

if (bufferDecrease) {
  bufferDecrease.addEventListener("click", () => setRecommendedBuffer(recommendedBufferMinutes - 5));
}

if (bufferIncrease) {
  bufferIncrease.addEventListener("click", () => setRecommendedBuffer(recommendedBufferMinutes + 5));
}

if (moodSlider) {
  moodSlider.addEventListener("input", () => {
    setRecommendedBuffer(getBufferFromMood(moodSlider.value));
  });
}

moodOptions.forEach((option) => {
  option.addEventListener("click", () => {
    setRecommendedBuffer(Number(option.dataset.buffer));
  });
});

if (arrivalComplete) {
  arrivalComplete.addEventListener("change", () => {
    if (arrivalComplete.checked) {
      clearPlanAndStartNew();
    }
  });
}

loadSavedPlan();
redirectScheduleWithoutGoal();
initializeCatSlimeIdleState();
initializeGoalChat();

getAvailableFields().forEach((field) => {
  field.addEventListener("input", calculatePlan);
  field.addEventListener("change", () => {
    syncTrainTime();
    calculatePlan();
  });
});

updateClock();
calculatePlan();
setInterval(updateClock, 1000);
