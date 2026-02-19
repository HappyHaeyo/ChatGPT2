const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/thumbs/svg?seed=healthmate";

const els = {
  avatarPreview: document.getElementById("avatarPreview"),
  characterForm: document.getElementById("characterForm"),
  characterName: document.getElementById("characterName"),
  characterTone: document.getElementById("characterTone"),
  characterImage: document.getElementById("characterImage"),
  chatTitle: document.getElementById("chatTitle"),
  medBtn: document.getElementById("medBtn"),
  workoutBtn: document.getElementById("workoutBtn"),
  waterCount: document.getElementById("waterCount"),
  waterMinus: document.getElementById("waterMinus"),
  waterPlus: document.getElementById("waterPlus"),
  breakfastInput: document.getElementById("breakfastInput"),
  lunchInput: document.getElementById("lunchInput"),
  dinnerInput: document.getElementById("dinnerInput"),
  mealForm: document.getElementById("mealForm"),
  chatLog: document.getElementById("chatLog"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput")
};

const state = {
  profile: {
    name: "헬스메이트",
    tone: "다정하고 꾸준하게 관리해주는 건강 코치",
    avatar: DEFAULT_AVATAR
  },
  daily: {
    medication: false,
    workout: false,
    water: 0,
    meals: {
      breakfast: "",
      lunch: "",
      dinner: ""
    }
  }
};

function loadState() {
  const saved = localStorage.getItem("health-chat-state");
  if (!saved) return;
  const parsed = JSON.parse(saved);
  Object.assign(state.profile, parsed.profile || {});
  Object.assign(state.daily, parsed.daily || {});
  state.daily.meals = { ...state.daily.meals, ...(parsed.daily?.meals || {}) };
}

function saveState() {
  localStorage.setItem("health-chat-state", JSON.stringify(state));
}

function syncProfileUI() {
  els.characterName.value = state.profile.name;
  els.characterTone.value = state.profile.tone;
  els.avatarPreview.src = state.profile.avatar || DEFAULT_AVATAR;
  els.chatTitle.textContent = `${state.profile.name}와 대화`;
}

function syncDailyUI() {
  els.medBtn.classList.toggle("active", state.daily.medication);
  els.workoutBtn.classList.toggle("active", state.daily.workout);
  els.waterCount.textContent = String(state.daily.water);
  els.breakfastInput.value = state.daily.meals.breakfast;
  els.lunchInput.value = state.daily.meals.lunch;
  els.dinnerInput.value = state.daily.meals.dinner;
}

function addMessage(role, text) {
  const row = document.createElement("div");
  row.className = `msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  if (role === "char") {
    const miniAvatar = document.createElement("img");
    miniAvatar.className = "avatar-mini";
    miniAvatar.src = state.profile.avatar || DEFAULT_AVATAR;
    miniAvatar.alt = `${state.profile.name} avatar`;
    row.append(miniAvatar, bubble);
  } else {
    row.appendChild(bubble);
  }

  els.chatLog.appendChild(row);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function getHealthSummary() {
  return `약:${state.daily.medication ? "완료" : "미완료"}, 운동:${state.daily.workout ? "완료" : "미완료"}, 물:${state.daily.water}컵`;
}

function createReply(userInput) {
  const tonePrefix = `${state.profile.name} (${state.profile.tone})`;

  if (userInput.includes("뭐 먹") || userInput.includes("식단")) {
    const { breakfast, lunch, dinner } = state.daily.meals;
    return `${tonePrefix} 오늘 식단은 아침(${breakfast || "미입력"}), 점심(${lunch || "미입력"}), 저녁(${dinner || "미입력"})으로 기록돼 있어요.`;
  }

  if (userInput.includes("체크") || userInput.includes("오늘")) {
    return `${tonePrefix} 현재 루틴은 ${getHealthSummary()} 상태예요. 하나만 더 완료해도 오늘은 성공이에요!`;
  }

  if (userInput.includes("물") || userInput.includes("약") || userInput.includes("운동")) {
    return `${tonePrefix} 좋아요, ${getHealthSummary()} 상태를 보면서 부족한 항목 하나를 지금 해봐요.`;
  }

  return `${tonePrefix} ${getHealthSummary()}로 잘 관리 중이에요. 지금 기분 한 줄 남기고 루틴 이어가요!`;
}

els.characterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = els.characterName.value.trim();
  const tone = els.characterTone.value.trim();
  const file = els.characterImage.files[0];

  if (name) state.profile.name = name;
  if (tone) state.profile.tone = tone;

  if (file) {
    const imageData = await fileToDataUrl(file);
    state.profile.avatar = imageData;
    els.characterImage.value = "";
  }

  saveState();
  syncProfileUI();
  addMessage("char", `${state.profile.name} 프로필 저장 완료! 오늘 루틴을 같이 이어가요.`);
});

els.medBtn.addEventListener("click", () => {
  state.daily.medication = !state.daily.medication;
  saveState();
  syncDailyUI();
});

els.workoutBtn.addEventListener("click", () => {
  state.daily.workout = !state.daily.workout;
  saveState();
  syncDailyUI();
});

els.waterPlus.addEventListener("click", () => {
  state.daily.water += 1;
  saveState();
  syncDailyUI();
});

els.waterMinus.addEventListener("click", () => {
  state.daily.water = Math.max(0, state.daily.water - 1);
  saveState();
  syncDailyUI();
});

els.mealForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.daily.meals.breakfast = els.breakfastInput.value.trim();
  state.daily.meals.lunch = els.lunchInput.value.trim();
  state.daily.meals.dinner = els.dinnerInput.value.trim();
  saveState();
  addMessage("char", `${state.profile.name}: 식단 저장했어요. 균형 있게 아주 좋아요!`);
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
    reader.onerror = () => reject(new Error("이미지 변환 실패"));
    reader.readAsDataURL(file);
  });
}

loadState();
syncProfileUI();
syncDailyUI();
addMessage("char", `${state.profile.name}: 안녕! 오늘 약/물/운동/식단을 같이 체크해보자.`);
