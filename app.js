const lostButton = document.querySelector("#lost-button");
const lostGuide = document.querySelector("#lost-guide");
const currentTimeOutput = document.querySelector("#current-time");
const nextReminderOutput = document.querySelector("#next-reminder");
const navigatorMessage = document.querySelector("#navigator-message");
const timeline = document.querySelector("#timeline");
const achievementPercent = document.querySelector("#achievement-percent");
const achievementBlocks = document.querySelector("#achievement-blocks");
const achievementCount = document.querySelector("#achievement-count");

const fields = {
  destination: document.querySelector("#destination"),
  startTime: document.querySelector("#start-time"),
  arrivalBuffer: document.querySelector("#arrival-buffer"),
  distance: document.querySelector("#distance"),
  walkingSpeed: document.querySelector("#walking-speed"),
  prepTime: document.querySelector("#prep-time"),
  breakfastTime: document.querySelector("#breakfast-time"),
  extraTime: document.querySelector("#extra-time")
};

const output = {
  summary: document.querySelector("#summary")
};

const storageKey = "yasashisugNaviPlan";
let savedValues = {};

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

function getAvailableFields() {
  return Object.values(fields).filter(Boolean);
}

function loadSavedPlan() {
  savedValues = JSON.parse(localStorage.getItem(storageKey) || "{}");

  Object.entries(fields).forEach(([key, field]) => {
    if (field && savedValues[key] !== undefined) {
      field.value = savedValues[key];
    }
  });
}

function savePlan() {
  const nextPlan = { ...savedValues };

  Object.entries(fields).forEach(([key, field]) => {
    if (field) {
      nextPlan[key] = field.value;
    }
  });

  savedValues = nextPlan;
  localStorage.setItem(storageKey, JSON.stringify(nextPlan));
}

function getValue(key, fallback = "") {
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

  if (!currentPlan.length) {
    nextReminderOutput.textContent = "最初の予定の5分前 --:--";
    return;
  }

  nextReminderOutput.textContent = `最初の予定の5分前 ${formatTime(currentPlan[0].time - 5)}`;
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

if (lostButton && lostGuide) {
  lostButton.addEventListener("click", () => {
    lostGuide.hidden = false;

    if (navigatorMessage) {
      navigatorMessage.textContent = "迷ったら、見えるものを一つずつ確認しよう。";
    }

    lostGuide.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

loadSavedPlan();

getAvailableFields().forEach((field) => {
  field.addEventListener("input", calculatePlan);
});

updateClock();
calculatePlan();
setInterval(updateClock, 1000);
