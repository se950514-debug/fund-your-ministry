const homePage = document.getElementById("homePage");
const introPage = document.getElementById("introPage");
const quizPage = document.getElementById("quizPage");
const loadingPage = document.getElementById("loadingPage");
const resultPage = document.getElementById("resultPage");

const startButton = document.getElementById("startButton");
const backButton = document.getElementById("backButton");
const beginQuizButton = document.getElementById("beginQuizButton");
const quizBackButton = document.getElementById("quizBackButton");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const restartButton = document.getElementById("restartButton");
const homeButton = document.getElementById("homeButton");

const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const progressFill = document.getElementById("progressFill");
const loadingFill = document.getElementById("loadingFill");
const loadingText = document.getElementById("loadingText");

const personalityIcon = document.getElementById("personalityIcon");
const personalityTitle = document.getElementById("personalityTitle");
const personalitySubtitle = document.getElementById("personalitySubtitle");
const personalityDescription = document.getElementById("personalityDescription");
const personalityStrengths = document.getElementById("personalityStrengths");
const personalityWeaknesses = document.getElementById("personalityWeaknesses");
const personalityGrowth = document.getElementById("personalityGrowth");
const personalityVerse = document.getElementById("personalityVerse");
const abilityResults = document.getElementById("abilityResults");
const ministryResults = document.getElementById("ministryResults");

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

async function loadData() {
  try {
    const [questionResponse, ministryResponse, personalityResponse] = await Promise.all([
      fetch("./data/questions.json"),
      fetch("./data/ministries.json"),
      fetch("./data/personality.json")
    ]);

    if (!questionResponse.ok) throw new Error(`題目讀取失敗：${questionResponse.status}`);
    if (!ministryResponse.ok) throw new Error(`服事資料讀取失敗：${ministryResponse.status}`);
    if (!personalityResponse.ok) throw new Error(`人格資料讀取失敗：${personalityResponse.status}`);

    questions = await questionResponse.json();
    ministries = await ministryResponse.json();
    personalities = await personalityResponse.json();

    if (!Array.isArray(questions) || !Array.isArray(ministries) || !Array.isArray(personalities)) {
      throw new Error("JSON 最外層必須是陣列");
    }

    selectedAnswers = new Array(questions.length).fill(null);
    console.log(`資料讀取成功：${questions.length} 題、${ministries.length} 項服事、${personalities.length} 種人格`);
  } catch (error) {
    console.error("資料載入失敗：", error);
    alert("資料載入失敗，請重新整理頁面或查看 Console。");
  }
}

function showPage(page) {
  document.querySelectorAll(".page").forEach((item) => item.classList.remove("active"));
  page.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function displayQuestion() {
  const currentQuestion = questions[currentQuestionIndex];
  questionNumber.textContent = `第 ${currentQuestionIndex + 1} 題／共 ${questions.length} 題`;
  questionText.textContent = currentQuestion.question;
  progressFill.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
  optionsContainer.innerHTML = "";

  currentQuestion.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option.text;

    if (selectedAnswers[currentQuestionIndex] === optionIndex) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      selectedAnswers[currentQuestionIndex] = optionIndex;
      displayQuestion();
    });

    optionsContainer.appendChild(button);
  });

  previousButton.disabled = currentQuestionIndex === 0;
  nextButton.disabled = selectedAnswers[currentQuestionIndex] === null;
  nextButton.textContent = currentQuestionIndex === questions.length - 1 ? "查看結果" : "下一題";
}

function calculateRawAbilityScores() {
  const scores = Object.fromEntries(abilityIds.map((id) => [id, 0]));

  selectedAnswers.forEach((selectedOptionIndex, questionIndex) => {
    if (selectedOptionIndex === null) return;
    const selectedOption = questions[questionIndex].options[selectedOptionIndex];
    Object.entries(selectedOption.scores).forEach(([abilityId, score]) => {
      scores[abilityId] += score;
    });
  });

  return scores;
}

function calculateAbilityMaximums() {
  const maximums = Object.fromEntries(abilityIds.map((id) => [id, 0]));

  questions.forEach((question) => {
    abilityIds.forEach((abilityId) => {
      const maxForQuestion = Math.max(...question.options.map((option) => option.scores[abilityId] || 0));
      maximums[abilityId] += maxForQuestion;
    });
  });

  return maximums;
}

function calculateAbilityIndexes() {
  const rawScores = calculateRawAbilityScores();
  const maximums = calculateAbilityMaximums();
  const indexes = {};

  abilityIds.forEach((abilityId) => {
    indexes[abilityId] = maximums[abilityId] === 0
      ? 0
      : Math.round((rawScores[abilityId] / maximums[abilityId]) * 100);
  });

  return indexes;
}

function calculateMinistryScores(abilityIndexes) {
  return ministries
    .map((ministry) => {
      const baseScore = abilityIds.reduce((total, abilityId) => {
        return total + abilityIndexes[abilityId] * ((ministry.weights[abilityId] || 0) / 100);
      }, 0);

      const coreAverage = ministry.coreAbilities.length
        ? ministry.coreAbilities.reduce((total, abilityId) => total + abilityIndexes[abilityId], 0) / ministry.coreAbilities.length
        : 0;

      return {
        ...ministry,
        score: Math.round(baseScore * 0.75 + coreAverage * 0.25)
      };
    })
    .sort((a, b) => b.score - a.score);
}

function displayPersonalityResult(abilityIndexes) {
  const highestAbilityId = Object.entries(abilityIndexes).sort((a, b) => b[1] - a[1])[0][0];
  const personality = personalities.find((item) => item.id === highestAbilityId);
  if (!personality) return;

  personalityIcon.textContent = personality.icon;
  personalityTitle.textContent = personality.title;
  personalitySubtitle.textContent = personality.subtitle;
  personalityDescription.textContent = personality.description;
  personalityGrowth.textContent = personality.growth;
  personalityVerse.textContent = personality.verse;

  personalityStrengths.innerHTML = personality.strengths.map((item) => `<li>${item}</li>`).join("");
  personalityWeaknesses.innerHTML = personality.weaknesses.map((item) => `<li>${item}</li>`).join("");
}

function displayAbilityResults(abilityIndexes) {
  abilityResults.innerHTML = "";

  Object.entries(abilityIndexes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([abilityId, score]) => {
      const row = document.createElement("div");
      row.className = "ability-row";
      row.innerHTML = `
        <div class="ability-header">
          <span class="ability-name">${abilityNames[abilityId]}</span>
          <span class="ability-score">${score} 分</span>
        </div>
        <div class="ability-bar">
          <div class="ability-bar-fill" style="width:${score}%"></div>
        </div>
      `;
      abilityResults.appendChild(row);
    });
}

function displayMinistryResults(ministryScores) {
  ministryResults.innerHTML = "";
  const medals = ["🥇", "🥈", "🥉"];

  ministryScores.slice(0, 3).forEach((ministry, index) => {
    const card = document.createElement("article");
    card.className = "ministry-card";
    const reasons = ministry.strengthReasons.slice(0, 3).map((reason) => `<li>${reason}</li>`).join("");

    card.innerHTML = `
      <div class="ministry-rank">${medals[index]}</div>
      <h3 class="ministry-name">${ministry.name}</h3>
      <p class="ministry-score">適配度 ${ministry.score} 分</p>
      <p class="ministry-description">${ministry.description}</p>
      <ul class="ministry-reasons">${reasons}</ul>
    `;

    ministryResults.appendChild(card);
  });
}

function displayResults() {
  const abilityIndexes = calculateAbilityIndexes();
  const ministryScores = calculateMinistryScores(abilityIndexes);

  displayPersonalityResult(abilityIndexes);
  displayAbilityResults(abilityIndexes);
  displayMinistryResults(ministryScores);

  console.log("八大能力：", abilityIndexes);
  console.log("服事排名：", ministryScores);
  showPage(resultPage);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function startAnalysis() {
  showPage(loadingPage);
  loadingFill.style.width = "0%";
  loadingText.textContent = "準備分析...";

  await wait(300);
  loadingFill.style.width = "25%";
  loadingText.textContent = "正在分析你的核心服事人格...";

  await wait(500);
  loadingFill.style.width = "50%";
  loadingText.textContent = "正在計算八大能力傾向...";

  await wait(500);
  loadingFill.style.width = "75%";
  loadingText.textContent = "正在比對 18 項服事...";

  await wait(500);
  loadingFill.style.width = "100%";
  loadingText.textContent = "分析完成，正在產生結果...";

  await wait(500);
  displayResults();
}

startButton.addEventListener("click", () => showPage(introPage));
backButton.addEventListener("click", () => showPage(homePage));
quizBackButton.addEventListener("click", () => showPage(introPage));

beginQuizButton.addEventListener("click", () => {
  if (!questions.length || !ministries.length || !personalities.length) {
    alert("資料正在載入，請稍後再試。");
    return;
  }

  currentQuestionIndex = 0;
  showPage(quizPage);
  displayQuestion();
});

previousButton.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex -= 1;
    displayQuestion();
  }
});

nextButton.addEventListener("click", () => {
  if (selectedAnswers[currentQuestionIndex] === null) return;

  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex += 1;
    displayQuestion();
  } else {
    startAnalysis();
  }
});

restartButton.addEventListener("click", () => {
  selectedAnswers = new Array(questions.length).fill(null);
  currentQuestionIndex = 0;
  showPage(quizPage);
  displayQuestion();
});

homeButton.addEventListener("click", () => {
  selectedAnswers = new Array(questions.length).fill(null);
  currentQuestionIndex = 0;
  showPage(homePage);
});

loadData();
