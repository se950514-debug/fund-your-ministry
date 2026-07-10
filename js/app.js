const homePage =
    document.getElementById("homePage");

const introPage =
    document.getElementById("introPage");

const quizPage =
    document.getElementById("quizPage");

const resultPage =
    document.getElementById("resultPage");


const startButton =
    document.getElementById("startButton");

const backButton =
    document.getElementById("backButton");

const beginQuizButton =
    document.getElementById("beginQuizButton");

const quizBackButton =
    document.getElementById("quizBackButton");

const previousButton =
    document.getElementById("previousButton");

const nextButton =
    document.getElementById("nextButton");


const questionNumber =
    document.getElementById("questionNumber");

const questionText =
    document.getElementById("questionText");

const optionsContainer =
    document.getElementById("optionsContainer");

const progressFill =
    document.getElementById("progressFill");


const abilityResults =
    document.getElementById("abilityResults");

const ministryResults =
    document.getElementById("ministryResults");

const personalityIcon =
    document.getElementById("personalityIcon");

const personalityTitle =
    document.getElementById("personalityTitle");

const personalitySubtitle =
    document.getElementById("personalitySubtitle");

const personalityDescription =
    document.getElementById("personalityDescription");

const personalityStrengths =
    document.getElementById("personalityStrengths");

const personalityWeaknesses =
    document.getElementById("personalityWeaknesses");

const personalityGrowth =
    document.getElementById("personalityGrowth");

const personalityVerse =
    document.getElementById("personalityVerse");

const restartButton =
    document.getElementById("restartButton");

const homeButton =
    document.getElementById("homeButton");


let testQuestions = [];

let ministries = [];

let personalities = [];

let selectedAnswers = [];

let currentQuestionIndex = 0;


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


const abilityIds = [
    "C",
    "L",
    "T",
    "CR",
    "CM",
    "W",
    "M",
    "S"
];


/* 同時讀取題目與服事資料 */
async function loadData() {

    try {

        const responses =
            await Promise.all([
                fetch("./data/questions.json"),
                fetch("./data/ministries.json")
            ]);


        const questionResponse =
            responses[0];

        const ministryResponse =
            responses[1];


        if (!questionResponse.ok) {

            throw new Error(
                `題目讀取失敗：${questionResponse.status}`
            );
        }


        if (!ministryResponse.ok) {

            throw new Error(
                `服事資料讀取失敗：${ministryResponse.status}`
            );
        }


        testQuestions =
            await questionResponse.json();

        ministries =
            await ministryResponse.json();


        if (!Array.isArray(testQuestions)) {

            throw new Error(
                "questions.json 最外層必須是陣列"
            );
        }


        if (!Array.isArray(ministries)) {

            throw new Error(
                "ministries.json 最外層必須是陣列"
            );
        }


        selectedAnswers =
            new Array(testQuestions.length)
                .fill(null);


        console.log(
            `資料讀取成功：${testQuestions.length} 題、${ministries.length} 項服事`
        );

    } catch (error) {

        console.error(
            "資料載入失敗：",
            error
        );

        alert(
            "資料載入失敗，請按 F12 查看 Console。"
        );
    }
}


/* 切換頁面 */
function showPage(pageToShow) {

    const pages =
        document.querySelectorAll(".page");


    pages.forEach(function (page) {

        page.classList.remove("active");
    });


    pageToShow.classList.add("active");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* 顯示目前題目 */
function displayQuestion() {

    const currentQuestion =
        testQuestions[currentQuestionIndex];


    questionNumber.textContent =
        `第 ${currentQuestionIndex + 1} 題／共 ${testQuestions.length} 題`;


    questionText.textContent =
        currentQuestion.question;


    const progress =
        (
            (currentQuestionIndex + 1) /
            testQuestions.length
        ) * 100;


    progressFill.style.width =
        `${progress}%`;


    optionsContainer.innerHTML = "";


    currentQuestion.options.forEach(
        function (option, optionIndex) {

            const optionButton =
                document.createElement("button");


            optionButton.className =
                "option-button";


            optionButton.textContent =
                option.text;


            if (
                selectedAnswers[
                currentQuestionIndex
                ] === optionIndex
            ) {

                optionButton.classList.add(
                    "selected"
                );
            }


            optionButton.addEventListener(
                "click",
                function () {

                    selectedAnswers[
                        currentQuestionIndex
                    ] = optionIndex;


                    displayQuestion();
                }
            );


            optionsContainer.appendChild(
                optionButton
            );
        }
    );


    previousButton.disabled =
        currentQuestionIndex === 0;


    nextButton.disabled =
        selectedAnswers[
        currentQuestionIndex
        ] === null;


    if (
        currentQuestionIndex ===
        testQuestions.length - 1
    ) {

        nextButton.textContent =
            "查看結果";

    } else {

        nextButton.textContent =
            "下一題";
    }
}


/* 計算八大能力原始分數 */
function calculateRawAbilityScores() {

    const scores = {
        C: 0,
        L: 0,
        T: 0,
        CR: 0,
        CM: 0,
        W: 0,
        M: 0,
        S: 0
    };


    selectedAnswers.forEach(
        function (
            selectedOptionIndex,
            questionIndex
        ) {

            if (
                selectedOptionIndex === null
            ) {

                return;
            }


            const selectedOption =
                testQuestions[
                    questionIndex
                ].options[
                selectedOptionIndex
                ];


            Object.entries(
                selectedOption.scores
            ).forEach(
                function ([abilityId, score]) {

                    scores[abilityId] +=
                        score;
                }
            );
        }
    );


    return scores;
}


/* 計算每項能力的理論最高分 */
function calculateAbilityMaximums() {

    const maximums = {
        C: 0,
        L: 0,
        T: 0,
        CR: 0,
        CM: 0,
        W: 0,
        M: 0,
        S: 0
    };


    testQuestions.forEach(
        function (question) {

            abilityIds.forEach(
                function (abilityId) {

                    let questionMaximum = 0;


                    question.options.forEach(
                        function (option) {

                            const optionScore =
                                option.scores[
                                abilityId
                                ] || 0;


                            if (
                                optionScore >
                                questionMaximum
                            ) {

                                questionMaximum =
                                    optionScore;
                            }
                        }
                    );


                    maximums[abilityId] +=
                        questionMaximum;
                }
            );
        }
    );


    return maximums;
}


/* 將能力原始分數換成 0～100 */
function calculateAbilityIndexes() {

    const rawScores =
        calculateRawAbilityScores();


    const maximums =
        calculateAbilityMaximums();


    const indexes = {};


    abilityIds.forEach(
        function (abilityId) {

            const maximum =
                maximums[abilityId];


            if (maximum === 0) {

                indexes[abilityId] = 0;

                return;
            }


            const index =
                (
                    rawScores[abilityId] /
                    maximum
                ) * 100;


            indexes[abilityId] =
                Math.round(index);
        }
    );


    return indexes;
}


/* 計算每一項服事的適配度 */
function calculateMinistryScores(
    abilityIndexes
) {

    return ministries.map(
        function (ministry) {

            let baseScore = 0;


            abilityIds.forEach(
                function (abilityId) {

                    const weight =
                        ministry.weights[
                        abilityId
                        ] || 0;


                    baseScore +=
                        abilityIndexes[
                        abilityId
                        ] *
                        (weight / 100);
                }
            );


            let coreTotal = 0;


            ministry.coreAbilities.forEach(
                function (abilityId) {

                    coreTotal +=
                        abilityIndexes[
                        abilityId
                        ];
                }
            );


            const coreAverage =
                coreTotal /
                ministry.coreAbilities.length;


            const finalScore =
                baseScore * 0.75 +
                coreAverage * 0.25;


            return {
                ...ministry,
                score: Math.round(finalScore)
            };
        }
    ).sort(
        function (a, b) {

            return b.score - a.score;
        }
    );
}


/* 顯示八大能力 */
function displayPersonalityResult(
    abilityIndexes
) {

    const sortedAbilities =
        Object.entries(abilityIndexes)
            .sort(
                function (a, b) {
                    return b[1] - a[1];
                }
            );


    const highestAbilityId =
        sortedAbilities[0][0];


    const personality =
        personalities.find(
            function (item) {
                return item.id ===
                    highestAbilityId;
            }
        );


    if (!personality) {

        console.error(
            "找不到對應的人格資料：",
            highestAbilityId
        );

        return;
    }


    personalityIcon.textContent =
        personality.icon;


    personalityTitle.textContent =
        personality.title;


    personalitySubtitle.textContent =
        personality.subtitle;


    personalityDescription.textContent =
        personality.description;


    personalityGrowth.textContent =
        personality.growth;


    personalityVerse.textContent =
        personality.verse;


    personalityStrengths.innerHTML = "";

    personality.strengths.forEach(
        function (strength) {

            const listItem =
                document.createElement("li");

            listItem.textContent =
                strength;

            personalityStrengths.appendChild(
                listItem
            );
        }
    );


    personalityWeaknesses.innerHTML = "";

    personality.weaknesses.forEach(
        function (weakness) {

            const listItem =
                document.createElement("li");

            listItem.textContent =
                weakness;

            personalityWeaknesses.appendChild(
                listItem
            );
        }
    );
}
function displayAbilityResults(
    abilityIndexes
) {

    abilityResults.innerHTML = "";


    const sortedAbilities =
        Object.entries(
            abilityIndexes
        ).sort(
            function (a, b) {

                return b[1] - a[1];
            }
        );


    sortedAbilities.forEach(
        function ([abilityId, score]) {

            const row =
                document.createElement("div");


            row.className =
                "ability-row";


            row.innerHTML = `
                <div class="ability-header">

                    <span class="ability-name">
                        ${abilityNames[abilityId]}
                    </span>

                    <span class="ability-score">
                        ${score} 分
                    </span>

                </div>

                <div class="ability-bar">

                    <div
                        class="ability-bar-fill"
                        style="width: ${score}%">
                    </div>

                </div>
            `;


            abilityResults.appendChild(
                row
            );
        }
    );
}


/* 顯示前三名服事 */
function displayMinistryResults(
    ministryScores
) {

    ministryResults.innerHTML = "";


    const topThree =
        ministryScores.slice(0, 3);


    const rankIcons = [
        "🥇",
        "🥈",
        "🥉"
    ];


    topThree.forEach(
        function (ministry, index) {

            const card =
                document.createElement("article");


            card.className =
                "ministry-card";


            const reasons =
                ministry.strengthReasons
                    .slice(0, 3)
                    .map(
                        function (reason) {

                            return `
                                <li>
                                    ${reason}
                                </li>
                            `;
                        }
                    )
                    .join("");


            card.innerHTML = `
                <div class="ministry-rank">
                    ${rankIcons[index]}
                </div>

                <h3 class="ministry-name">
                    ${ministry.name}
                </h3>

                <p class="ministry-score">
                    適配度 ${ministry.score} 分
                </p>

                <p class="ministry-description">
                    ${ministry.description}
                </p>

                <ul class="ministry-reasons">
                    ${reasons}
                </ul>
            `;


            ministryResults.appendChild(
                card
            );
        }
    );
}


/* 顯示完整結果頁 */

function displayResults() {

    const abilityIndexes =
        calculateAbilityIndexes();


    const ministryScores =
        calculateMinistryScores(
            abilityIndexes
        );


    displayAbilityResults(
        abilityIndexes
    );


    displayMinistryResults(
        ministryScores
    );
}
    function wait(milliseconds) {
        return new Promise(function (resolve) {
            setTimeout(resolve, milliseconds);
        });
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
    console.log(
        "八大能力：",
        abilityIndexes
    );


    console.log(
        "服事排名：",
        ministryScores
    );


    showPage(resultPage);



/* 首頁 → 說明頁 */
startButton.addEventListener(
    "click",
    function () {

        showPage(introPage);
    }
);


/* 說明頁 → 首頁 */
backButton.addEventListener(
    "click",
    function () {

        showPage(homePage);
    }
);


/* 說明頁 → 測驗頁 */
beginQuizButton.addEventListener(
    "click",
    function () {

        if (
            testQuestions.length === 0 ||
            ministries.length === 0
        ) {

            alert(
                "資料正在載入，請稍後再試。"
            );

            return;
        }


        currentQuestionIndex = 0;


        showPage(quizPage);


        displayQuestion();
    }
);


/* 測驗頁 → 說明頁 */
quizBackButton.addEventListener(
    "click",
    function () {

        showPage(introPage);
    }
);


/* 上一題 */
previousButton.addEventListener(
    "click",
    function () {

        if (
            currentQuestionIndex > 0
        ) {

            currentQuestionIndex--;


            displayQuestion();
        }
    }
);


/* 下一題或查看結果 */
nextButton.addEventListener(
    "click",
    function () {

        if (
            selectedAnswers[
            currentQuestionIndex
            ] === null
        ) {

            return;
        }


        if (
            currentQuestionIndex <
            testQuestions.length - 1
        ) {

            currentQuestionIndex++;


            displayQuestion();

        } else {
            startAnalysis();
        }
    }
);


/* 重新測驗 */
if (restartButton) {

    restartButton.addEventListener(
        "click",
        function () {

            selectedAnswers =
                new Array(
                    testQuestions.length
                ).fill(null);


            currentQuestionIndex = 0;


            showPage(quizPage);


            displayQuestion();
        }
    );
}


/* 回到首頁 */
if (homeButton) {

    homeButton.addEventListener(
        "click",
        function () {

            selectedAnswers =
                new Array(
                    testQuestions.length
                ).fill(null);


            currentQuestionIndex = 0;


            showPage(homePage);
        }
    );
}


/* 啟動網站 */
loadData();