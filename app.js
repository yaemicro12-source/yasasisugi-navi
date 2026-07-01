const form = document.querySelector("#navi-form");

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
  wakeTime: document.querySelector("#wake-time"),
  leaveTime: document.querySelector("#leave-time"),
  targetArrivalTime: document.querySelector("#target-arrival-time"),
  travelTime: document.querySelector("#travel-time"),
  summary: document.querySelector("#summary")
};

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

function calculatePlan() {
  const startTime = fields.startTime.value || "10:00";
  const destination = fields.destination.value.trim() || "目的地";
  const arrivalBuffer = Math.max(0, getNumber(fields.arrivalBuffer));
  const distance = Math.max(0, getNumber(fields.distance));
  const walkingSpeed = Math.max(0.1, getNumber(fields.walkingSpeed, 4));
  const prepTime = Math.max(0, getNumber(fields.prepTime));
  const breakfastTime = Math.max(0, getNumber(fields.breakfastTime));
  const extraTime = Math.max(0, getNumber(fields.extraTime));

  const travelTime = Math.ceil((distance / walkingSpeed) * 60);
  const startMinutes = toMinutes(startTime);
  const targetArrival = startMinutes - arrivalBuffer;
  const leaveTime = targetArrival - travelTime - extraTime;
  const wakeTime = leaveTime - prepTime - breakfastTime;

  output.wakeTime.textContent = formatTime(wakeTime);
  output.leaveTime.textContent = formatTime(leaveTime);
  output.targetArrivalTime.textContent = formatTime(targetArrival);
  output.travelTime.textContent = `${travelTime}分`;

  output.summary.textContent =
    `${destination}には${formatTime(targetArrival)}ごろ到着を目指します。` +
    ` 移動は約${travelTime}分、迷った時の予備として${extraTime}分を入れています。` +
    ` 家を出る目安は${formatTime(leaveTime)}、起きる目安は${formatTime(wakeTime)}です。`;
}

form.addEventListener("input", calculatePlan);
calculatePlan();
