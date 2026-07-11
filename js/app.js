const $ = (id) => document.getElementById(id);

const pages = {
  home: $("homePage"),
  intro: $("introPage"),
  quiz: $("quizPage"),
  loading: $("loadingPage"),
  result: $("resultPage")
};

const elements = {
  startButton: $("startButton"),
  backButton: $("backButton"),
  beginQuizButton: $("beginQuizButton"),
  quizBackButton: $("quizBackButton"),
  previousButton: $("previousButton"),
  nextButton: $("nextButton"),
  restartButton: $("restartButton"),
  homeButton: $("homeButton"),
  questionNumber: $("questionNumber"),
  questionText: $("questionText"),
  optionsContainer: $("optionsContainer"),
  progressFill: $("progressFill"),
  loadingFill: $("loadingFill"),
  loadingText: $("loadingText"),
  personalityIcon: $("personalityIcon"),
  personalityTitle: $("personalityTitle"),
  personalitySubtitle: $("personalitySubtitle"),
  personalityDescription: $("personalityDescription"),
  personalityStrengths: $("personalityStrengths"),
  personalityWeaknesses: $("personalityWeaknesses"),
  personalityGrowth: $("personalityGrowth"),
  personalityVerse: $("personalityVerse"),
  abilityResults: $("abilityResults"),
  ministryResults: $("ministryResults"),
  topAbilityScore: $("topAbilityScore"),
  topMinistryScore: $("topMinistryScore"),
  resultClarity: $("resultClarity"),
  personalAnalysis: $("personalAnalysis"),
  growthPath: $("growthPath"),
  fullRanking: $("fullRanking"),
  toggleRankingButton: $("toggleRankingButton"),
  ministryModal: $("ministryModal"),
  modalCloseButton: $("modalCloseButton"),
  modalMinistryName: $("modalMinistryName"),
  modalMinistryScore: $("modalMinistryScore"),
  modalMinistryDescription: $("modalMinistryDescription"),
  modalReasons: $("modalReasons"),
  modalSkills: $("modalSkills"),
  modalBeginner: $("modalBeginner")
};

const abilityIds = ["C", "L", "T", "CR", "CM", "W", "M", "S"];
const abilityNames = {
  C: "溫暖牧養者",
  L: "團隊建造者",
  T: "專業守護者",
  CR: "創意傳遞者",
  CM: "影響溝通者",
  W: "敬拜藝術者",
  M: "福音拓展者",
  S: "忠心服事者"
};

let questions = [];
let ministries = [];
let personalities = [];
let selectedAnswers = [];
let currentQuestionIndex = 0;
let latestMinistryScores = [];
let rankingExpanded = false;

async function loadData() {
  try {
    const responses = await Promise.all([
      fetch("./data/questions.json"),
      fetch("./data/ministries.json"),
      fetch("./data/personality.json")
    ]);

    responses.forEach((response) => {
      if (!response.ok) throw new Error(`資料讀取失敗：${response.status}`);
    });

    [questions, ministries, personalities] = await Promise.all(
      responses.map((response) => response.json())
    );

    if (![questions, ministries, personalities].every(Array.isArray)) {
      throw new Error("JSON 最外層必須是陣列");
    }

    selectedAnswers = new Array(questions.length).fill(null);
    console.log(`資料讀取成功：${questions.length} 題、${ministries.length} 項服事、${personalities.length} 種人格`);
  } catch (error) {
    console.error(error);
    alert("資料載入失敗，請重新整理頁面。");
  }
}

function showPage(page) {
  document.querySelectorAll(".page").forEach((item) => item.classList.remove("active"));
  page.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function displayQuestion() {
  const question = questions[currentQuestionIndex];
  elements.questionNumber.textContent = `第 ${currentQuestionIndex + 1} 題／共 ${questions.length} 題`;
  elements.questionText.textContent = question.question;
  elements.progressFill.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
  elements.optionsContainer.innerHTML = "";

  question.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.textContent = option.text;
    if (selectedAnswers[currentQuestionIndex] === optionIndex) button.classList.add("selected");

    button.addEventListener("click", () => {
      selectedAnswers[currentQuestionIndex] = optionIndex;
      displayQuestion();
    });
    elements.optionsContainer.appendChild(button);
  });

  elements.previousButton.disabled = currentQuestionIndex === 0;
  elements.nextButton.disabled = selectedAnswers[currentQuestionIndex] === null;
  elements.nextButton.textContent = currentQuestionIndex === questions.length - 1 ? "查看結果" : "下一題";
}

function calculateRawAbilityScores() {
  const scores = Object.fromEntries(abilityIds.map((id) => [id, 0]));
  selectedAnswers.forEach((selectedIndex, questionIndex) => {
    if (selectedIndex === null) return;
    Object.entries(questions[questionIndex].options[selectedIndex].scores).forEach(([id, score]) => {
      scores[id] += score;
    });
  });
  return scores;
}

function calculateAbilityMaximums() {
  const maximums = Object.fromEntries(abilityIds.map((id) => [id, 0]));
  questions.forEach((question) => {
    abilityIds.forEach((id) => {
      maximums[id] += Math.max(...question.options.map((option) => option.scores[id] || 0));
    });
  });
  return maximums;
}

function calculateAbilityIndexes() {
  const raw = calculateRawAbilityScores();
  const maximums = calculateAbilityMaximums();
  return Object.fromEntries(
    abilityIds.map((id) => [id, maximums[id] ? Math.round((raw[id] / maximums[id]) * 100) : 0])
  );
}

function calculateMinistryScores(abilityIndexes) {
  return ministries.map((ministry) => {
    const baseScore = abilityIds.reduce(
      (total, id) => total + abilityIndexes[id] * ((ministry.weights[id] || 0) / 100),
      0
    );
    const coreAverage = ministry.coreAbilities.length
      ? ministry.coreAbilities.reduce((total, id) => total + abilityIndexes[id], 0) / ministry.coreAbilities.length
      : 0;

    return { ...ministry, score: Math.round(baseScore * 0.75 + coreAverage * 0.25) };
  }).sort((a, b) => b.score - a.score);
}

function getMatchLabel(score) {
  if (score >= 80) return "高度契合";
  if (score >= 70) return "很有潛力";
  if (score >= 60) return "值得嘗試";
  if (score >= 50) return "可作為輔助服事";
  return "可繼續探索";
}

function displayPersonalityResult(abilityIndexes) {
  const highestAbilityId = Object.entries(abilityIndexes).sort((a, b) => b[1] - a[1])[0][0];
  const personality = personalities.find((item) => item.id === highestAbilityId);
  if (!personality) return;

  elements.personalityIcon.textContent = personality.icon;
  elements.personalityTitle.textContent = personality.title;
  elements.personalitySubtitle.textContent = personality.subtitle;
  elements.personalityDescription.textContent = personality.description;
  elements.personalityGrowth.textContent = personality.growth;
  elements.personalityVerse.textContent = personality.verse;
  elements.personalityStrengths.innerHTML = personality.strengths.map((item) => `<li>${item}</li>`).join("");
  elements.personalityWeaknesses.innerHTML = personality.weaknesses.map((item) => `<li>${item}</li>`).join("");
}

function displayAbilityResults(abilityIndexes) {
  elements.abilityResults.innerHTML = "";
  Object.entries(abilityIndexes).sort((a, b) => b[1] - a[1]).forEach(([id, score], index) => {
    const row = document.createElement("div");
    row.className = "ability-row reveal-item";
    row.style.setProperty("--delay", `${index * 70}ms`);
    row.innerHTML = `
      <div class="ability-header">
        <span class="ability-name">${abilityNames[id]}</span>
        <span class="ability-score">${score} 分</span>
      </div>
      <div class="ability-bar"><div class="ability-bar-fill" data-width="${score}"></div></div>
    `;
    elements.abilityResults.appendChild(row);
  });

  requestAnimationFrame(() => {
    document.querySelectorAll(".ability-bar-fill").forEach((bar) => {
      bar.style.width = `${bar.dataset.width}%`;
    });
  });
}

function createMinistryCard(ministry, index) {
  const card = document.createElement("article");
  card.className = "ministry-card reveal-item";
  card.style.setProperty("--delay", `${index * 110}ms`);
  const medals = ["🥇", "🥈", "🥉"];
  const reasons = ministry.strengthReasons.slice(0, 3).map((reason) => `<li>${reason}</li>`).join("");
  card.innerHTML = `
    <div class="ministry-card-top">
      <div class="ministry-rank">${medals[index]}</div>
      <span class="match-label">${getMatchLabel(ministry.score)}</span>
    </div>
    <h3 class="ministry-name">${ministry.name}</h3>
    <div class="score-ring" style="--score:${ministry.score}"><strong>${ministry.score}</strong><span>分</span></div>
    <p class="ministry-description">${ministry.description}</p>
    <ul class="ministry-reasons">${reasons}</ul>
    <button class="detail-button" type="button">查看詳細介紹</button>
  `;
  card.querySelector(".detail-button").addEventListener("click", () => openMinistryModal(ministry));
  return card;
}

function displayMinistryResults(ministryScores) {
  elements.ministryResults.innerHTML = "";
  ministryScores.slice(0, 3).forEach((ministry, index) => {
    elements.ministryResults.appendChild(createMinistryCard(ministry, index));
  });
}

function displayFullRanking(ministryScores) {
  elements.fullRanking.innerHTML = ministryScores.map((ministry, index) => `
    <button class="ranking-row" type="button" data-ministry-id="${ministry.id}">
      <span class="ranking-number">${index + 1}</span>
      <span class="ranking-name">${ministry.name}</span>
      <span class="ranking-label">${getMatchLabel(ministry.score)}</span>
      <span class="ranking-score">${ministry.score}</span>
    </button>
  `).join("");

  elements.fullRanking.querySelectorAll(".ranking-row").forEach((row) => {
    row.addEventListener("click", () => {
      const ministry = ministryScores.find((item) => item.id === row.dataset.ministryId);
      if (ministry) openMinistryModal(ministry);
    });
  });
}

function displaySummary(abilityIndexes, ministryScores) {
  const sortedAbilities = Object.entries(abilityIndexes).sort((a, b) => b[1] - a[1]);
  elements.topAbilityScore.textContent = `${sortedAbilities[0][1]}`;
  elements.topMinistryScore.textContent = `${ministryScores[0].score}`;
  const gap = ministryScores[0].score - ministryScores[1].score;
  elements.resultClarity.textContent = gap >= 8 ? "方向明確" : gap >= 4 ? "主要方向" : "多元型";
}


function getGrowthStageLabel(difficulty) {
  const labels = {
    1: "現在可以開始",
    2: "累積基礎經驗",
    3: "進一步挑戰",
    4: "成熟後投入"
  };

  return labels[difficulty] || "持續發展";
}

function calculateGrowthPath(ministryScores) {
  if (!Array.isArray(ministryScores) || ministryScores.length === 0) {
    return [];
  }

  const path = [];

  [1, 2, 3, 4].forEach((difficulty) => {
    const bestMatch = ministryScores
      .filter((ministry) => ministry.difficulty === difficulty)
      .sort((a, b) => b.score - a.score)[0];

    if (bestMatch) {
      path.push(bestMatch);
    }
  });

  return path;
}

function displayPersonalAnalysis(abilityIndexes, ministryScores) {
  const topAbilities = Object.entries(abilityIndexes).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const first = abilityNames[topAbilities[0][0]];
  const second = abilityNames[topAbilities[1][0]];
  const third = abilityNames[topAbilities[2][0]];
  const topNames = ministryScores.slice(0, 3).map((item) => item.name).join("、");

  elements.personalAnalysis.textContent =
    `你的能力組合以「${first}」為核心，同時帶有「${second}」與「${third}」的特質。` +
    `你在服事中較容易從自然反應出發，而不是勉強自己扮演不熟悉的角色。` +
    `目前最值得優先探索的方向是 ${topNames}。建議先從短期協助或觀摩開始，再透過實際經驗確認是否能長期投入。`;

  const path = calculateGrowthPath(ministryScores);

  elements.growthPath.innerHTML = path.map((ministry, index) => `
    <div class="growth-step">
      <span>${index + 1}</span>
      <small>${getGrowthStageLabel(ministry.difficulty)}</small>
      <strong>${ministry.name}</strong>
      <em>難度 ${ministry.difficulty}・適配度 ${ministry.score}</em>
    </div>
    ${index < path.length - 1 ? '<div class="growth-arrow">→</div>' : ''}
  `).join("");
}

function openMinistryModal(ministry) {
  elements.modalMinistryName.textContent = ministry.name;
  elements.modalMinistryScore.textContent = `適配度 ${ministry.score} 分・${getMatchLabel(ministry.score)}`;
  elements.modalMinistryDescription.textContent = ministry.description;
  elements.modalReasons.innerHTML = ministry.strengthReasons.map((item) => `<li>${item}</li>`).join("");
  elements.modalSkills.innerHTML = ministry.requiredSkills.map((item) => `<li>${item}</li>`).join("");
  elements.modalBeginner.textContent = ministry.beginnerFriendly ? "適合新手從協助開始" : "建議先接受訓練或跟隨有經驗同工";
  elements.ministryModal.classList.add("open");
  elements.ministryModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeMinistryModal() {
  elements.ministryModal.classList.remove("open");
  elements.ministryModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function displayResults() {
  const abilityIndexes = calculateAbilityIndexes();
  latestMinistryScores = calculateMinistryScores(abilityIndexes);
  displaySummary(abilityIndexes, latestMinistryScores);
  displayPersonalityResult(abilityIndexes);
  displayAbilityResults(abilityIndexes);
  displayMinistryResults(latestMinistryScores);
  displayPersonalAnalysis(abilityIndexes, latestMinistryScores);
  displayFullRanking(latestMinistryScores);
  rankingExpanded = false;
  elements.fullRanking.classList.add("collapsed");
  elements.toggleRankingButton.textContent = "展開全部 18 項";
  showPage(pages.result);
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function startAnalysis() {
  showPage(pages.loading);
  const stages = [
    [0, "準備分析...", 300],
    [25, "正在分析你的核心服事人格...", 450],
    [50, "正在計算八大能力傾向...", 450],
    [75, "正在比對 18 項服事...", 450],
    [100, "分析完成，正在產生結果...", 450]
  ];
  for (const [width, text, delay] of stages) {
    elements.loadingFill.style.width = `${width}%`;
    elements.loadingText.textContent = text;
    await wait(delay);
  }
  displayResults();
}

function resetQuiz() {
  selectedAnswers = new Array(questions.length).fill(null);
  currentQuestionIndex = 0;
}

elements.startButton.addEventListener("click", () => showPage(pages.intro));
elements.backButton.addEventListener("click", () => showPage(pages.home));
elements.quizBackButton.addEventListener("click", () => showPage(pages.intro));

elements.beginQuizButton.addEventListener("click", () => {
  if (!questions.length || !ministries.length || !personalities.length) {
    alert("資料正在載入，請稍後再試。");
    return;
  }
  currentQuestionIndex = 0;
  showPage(pages.quiz);
  displayQuestion();
});

elements.previousButton.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex -= 1;
    displayQuestion();
  }
});

elements.nextButton.addEventListener("click", () => {
  if (selectedAnswers[currentQuestionIndex] === null) return;
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex += 1;
    displayQuestion();
  } else {
    startAnalysis();
  }
});

elements.restartButton.addEventListener("click", () => {
  resetQuiz();
  showPage(pages.quiz);
  displayQuestion();
});

elements.homeButton.addEventListener("click", () => {
  resetQuiz();
  showPage(pages.home);
});

elements.toggleRankingButton.addEventListener("click", () => {
  rankingExpanded = !rankingExpanded;
  elements.fullRanking.classList.toggle("collapsed", !rankingExpanded);
  elements.toggleRankingButton.textContent = rankingExpanded ? "收合排行榜" : "展開全部 18 項";
});

elements.modalCloseButton.addEventListener("click", closeMinistryModal);
elements.ministryModal.querySelector("[data-close-modal]").addEventListener("click", closeMinistryModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMinistryModal();
});

loadData();
