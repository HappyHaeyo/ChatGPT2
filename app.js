const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/thumbs/svg?seed=healthmate";

const els = {
  menuBtns: [...document.querySelectorAll(".menu-btn")],
  pages: [...document.querySelectorAll(".page")],
  avatarPreview: document.getElementById("avatarPreview"),
  characterForm: document.getElementById("characterForm"),
  characterName: document.getElementById("characterName"),
  characterTone: document.getElementById("characterTone"),
  characterImage: document.getElementById("characterImage"),
  chatTitle: document.getElementById("chatTitle"),
  chatLog: document.getElementById("chatLog"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  medBtn: document.getElementById("medBtn"),
  workoutBtn: document.getElementById("workoutBtn"),
  waterMinus: document.getElementById("waterMinus"),
  waterPlus: document.getElementById("waterPlus"),
  waterCount: document.getElementById("waterCount"),
  mealForm: document.getElementById("mealForm"),
  breakfastInput: document.getElementById("breakfastInput"),
  lunchInput: document.getElementById("lunchInput"),
  dinnerInput: document.getElementById("dinnerInput"),
  todaySummary: document.getElementById("todaySummary"),
  currentDateLabel: document.getElementById("currentDateLabel"),
  historyList: document.getElementById("historyList")
};

const state = {
  profile: { name: "헬스메이트", tone: "따뜻하게 코칭하는 트레이너", avatar: DEFAULT_AVATAR },
  daily: {
    date: getDateKey(),
    medication: false,
    workout: false,
    water: 0,
    meals: { breakfast: "", lunch: "", dinner: "" }
  },
  history: []
};

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  const raw = localStorage.getItem("health-chat-state-v2");
  if (!raw) return;
  const parsed = JSON.parse(raw);
  Object.assign(state.profile, parsed.profile || {});
  Object.assign(state.daily, parsed.daily || {});
  state.daily.meals = { ...state.daily.meals, ...(parsed.daily?.meals || {}) };
  state.history = Array.isArray(parsed.history) ? parsed.history : [];
}

function saveState() {
  localStorage.setItem("health-chat-state-v2", JSON.stringify(state));
}

function rollDailyIfNeeded() {
  const today = getDateKey();
  if (state.daily.date === today) return;

  state.history.unshift({ date: state.daily.date, summary: makeSummaryText(state.daily) });
  state.history = state.history.slice(0, 14);
  state.daily = {
    date: today,
    medication: false,
    workout: false,
    water: 0,
    meals: { breakfast: "", lunch: "", dinner: "" }
  };
  saveState();
}

function makeSummaryText(targetDaily) {
  const { meals, medication, workout, water } = targetDaily;
  return `약:${medication ? "완료" : "미완료"}, 운동:${workout ? "완료" : "미완료"}, 물:${water}컵, 식단(아침:${meals.breakfast || "-"}/점심:${meals.lunch || "-"}/저녁:${meals.dinner || "-"})`;
}

function syncUI() {
  els.characterName.value = state.profile.name;
  els.characterTone.value = state.profile.tone;
  els.avatarPreview.src = state.profile.avatar || DEFAULT_AVATAR;
  els.chatTitle.textContent = `${state.profile.name}와 대화`;

  els.medBtn.classList.toggle("active", state.daily.medication);
  els.workoutBtn.classList.toggle("active", state.daily.workout);
  els.waterCount.textContent = String(state.daily.water);
  els.breakfastInput.value = state.daily.meals.breakfast;
  els.lunchInput.value = state.daily.meals.lunch;
  els.dinnerInput.value = state.daily.meals.dinner;
  els.todaySummary.textContent = makeSummaryText(state.daily);
  els.currentDateLabel.textContent = `기준일: ${state.daily.date} (24시간 자동 정산)`;

  els.historyList.innerHTML = "";
  if (state.history.length === 0) {
    const li = document.createElement("li");
    li.textContent = "아직 정산 기록이 없어요.";
    els.historyList.appendChild(li);
  } else {
    state.history.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.date} - ${item.summary}`;
      els.historyList.appendChild(li);
    });
  }
}

function showPage(pageName) {
  els.pages.forEach((p) => p.classList.toggle("hidden", p.dataset.page !== pageName));
  els.menuBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.page === pageName));
}

function addMessage(role, text) {
  const row = document.createElement("div");
  row.className = `msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  if (role === "char") {
    const avatar = document.createElement("img");
    avatar.className = "avatar-mini";
    avatar.src = state.profile.avatar || DEFAULT_AVATAR;
    row.append(avatar, bubble);
  } else {
    row.appendChild(bubble);
  }

  els.chatLog.appendChild(row);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function createReply(input) {
  const prefix = `${state.profile.name} (${state.profile.tone})`;
  if (input.includes("정산") || input.includes("결과")) return `${prefix} 오늘 정산은 ${makeSummaryText(state.daily)}예요.`;
  if (input.includes("물") || input.includes("약") || input.includes("운동")) return `${prefix} 지금 루틴은 ${makeSummaryText(state.daily)} 상태예요.`;
  if (input.includes("식단") || input.includes("뭐 먹")) return `${prefix} 아침:${state.daily.meals.breakfast || "-"}, 점심:${state.daily.meals.lunch || "-"}, 저녁:${state.daily.meals.dinner || "-"}로 기록했어요.`;
  return `${prefix} 잘하고 있어요! 오늘 루틴 중 하나만 더 완료해볼까요?`;
}

els.menuBtns.forEach((btn) => btn.addEventListener("click", () => showPage(btn.dataset.page)));

els.characterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = els.characterImage.files[0];
  state.profile.name = els.characterName.value.trim();
  state.profile.tone = els.characterTone.value.trim();
  if (file) {
    state.profile.avatar = await fileToDataUrl(file);
    els.characterImage.value = "";
  }
  saveState();
  syncUI();
});

els.medBtn.addEventListener("click", () => {
  state.daily.medication = !state.daily.medication;
  saveState();
  syncUI();
});

els.workoutBtn.addEventListener("click", () => {
  state.daily.workout = !state.daily.workout;
  saveState();
  syncUI();
});

els.waterPlus.addEventListener("click", () => {
  state.daily.water += 1;
  saveState();
  syncUI();
});

els.waterMinus.addEventListener("click", () => {
  state.daily.water = Math.max(0, state.daily.water - 1);
  saveState();
  syncUI();
});

els.mealForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.daily.meals.breakfast = els.breakfastInput.value.trim();
  state.daily.meals.lunch = els.lunchInput.value.trim();
  state.daily.meals.dinner = els.dinnerInput.value.trim();
  saveState();
  syncUI();
});

els.chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = els.chatInput.value.trim();
  if (!input) return;
  addMessage("user", input);
  addMessage("char", createReply(input));
  els.chatInput.value = "";
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("파일 변환 실패"));
    reader.readAsDataURL(file);
  });
}

loadState();
rollDailyIfNeeded();
syncUI();
showPage("character");
addMessage("char", `${state.profile.name}: 메뉴에서 캐릭터/채팅/루틴/결과표를 자유롭게 오가며 관리해요.`);
