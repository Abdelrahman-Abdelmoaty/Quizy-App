// Elements
let categoryBtn = document.querySelector(".category-btn");
let categoriesList = document.querySelector(".categories-list");
let levelBtn = document.querySelector(".level-btn");
let resetBtn = document.querySelector(".reset-btn");
let levelsList = document.querySelector(".levels-list");
let quizStart = document.querySelector(".quiz-start");
let quizContainer = document.querySelector(".quiz-container");
let startBtn = document.querySelector(".quiz-start-btn");
let nextBtn = document.querySelector(".next-question-btn");
let endBtn = document.querySelector(".quiz-end-btn");
let quizEnd = document.querySelector(".quiz-end");
let answerBtns = Array.from(document.getElementsByName("answer-btn"));
// ./Elements
// Filter
class Filter {
  static category = null;
  static level = null;
  static async loadFilter() {
    try {
      let categories = await fetch("questions-answers/categories.json");
      let levels = await fetch("questions-answers/levels.json");
      categories = await categories.json();
      levels = await levels.json();
      categories.forEach((category) => {
        let newCategory = document.createElement("li");
        newCategory.textContent = `> ${category}`;
        categoriesList.appendChild(newCategory);
      });
      levels.forEach((level) => {
        let newLevel = document.createElement("li");
        newLevel.textContent = `> ${level}`;
        levelsList.appendChild(newLevel);
      });
    } catch {
      throw "Error with fetching filter data";
    }
  }
  static addEventListeners() {
    categoriesList.addEventListener("click", (e) => {
      let selectedCategory = e.target.textContent.split(" ")[1];
      categoryBtn.textContent = `${selectedCategory} ▾`;
      this.category = selectedCategory;
      quizStart.style.display = "block";
      quizContainer.style.display = "none";
      quizEnd.style.display = "none";
      levelBtn.classList.remove("disabled-btn");
      if (this.level) startBtn.classList.remove("disabled-btn");
      if (window.innerWidth < 1024) categoriesList.style.display = "none";
    });
    levelsList.addEventListener("click", (e) => {
      let selectedLevel = e.target.textContent.split(" ")[1];
      levelBtn.textContent = `${selectedLevel} ▾`;
      this.level = selectedLevel;
      quizStart.style.display = "block";
      quizContainer.style.display = "none";
      quizEnd.style.display = "none";
      startBtn.classList.remove("disabled-btn");
      if (window.innerWidth < 1024) levelsList.style.display = "none";
    });
  }
}

if (window.innerWidth < 1024) {
  categoryBtn.addEventListener("click", () => {
    categoriesList.style.display = "block";
  });
  levelBtn.addEventListener("click", () => {
    levelsList.style.display = "block";
  });
}

// ./Filter

class Quiz {
  questions = [];
  userAnswers = [];
  currentAnswer = "false";
  category = 0;
  level = 0;
  questionSettings = {
    index: 0,
    timerIntervalId: 0,
    timer: {
      timeoutId: 0,
      seconds: 0,
      minutes: 3,
    },
  };

  reset(c, l) {
    document
      .querySelectorAll(".question-bullet")
      .forEach((e) => e.classList.remove("passed-question"));
    this.questions.length = 0;
    this.userAnswers.length = 0;
    this.currentAnswer = 0;
    this.questionSettings.index = 0;
    clearInterval(this.questionSettings.timerIntervalId);
    clearTimeout(this.questionSettings.timer.timeoutId);
    this.questionSettings.timer.timeoutId = 0;
    this.questionSettings.timer.seconds = 0;
    this.questionSettings.timer.minutes = 3;
    this.category = c;
    this.level = l;
  }
  async getData() {
    try {
      let response = await fetch(
        `questions-answers/${this.category}/${this.category}-${this.level}.json`
      );
      let data = await response.json();
      let randomNumbers = new Set();
      while (randomNumbers.size < 10) {
        let randomNumber = Math.floor(Math.random() * data.length);
        randomNumbers.add(randomNumber);
      }
      randomNumbers.forEach((n) => {
        this.questions.push(data[n]);
      });
      sessionStorage.setItem("questions", JSON.stringify(this.questions));
    } catch {
      throw "Error with fetching quiz data";
    }
  }
  callQuestions() {
    this.applyQuestionContent(this.questions[this.questionSettings.index]);
    if (this.questionSettings.index > 0) {
      document
        .querySelector(`.question-bullet-${this.questionSettings.index}`)
        .classList.add("passed-question");
    }
    if (this.questionSettings.index++ === 9) {
      nextBtn.style.display = "none";
      endBtn.style.display = "block";
      return;
    }
    this.questionSettings.timer.timeoutId = setTimeout(
      () => this.callQuestions(),
      this.questionSettings.timer.seconds * 1000 +
        this.questionSettings.timer.minutes * 60 * 1000 +
        1000
    );
  }
  applyQuestionContent(question) {
    this.resetTimer();
    document.querySelector(".question-category").textContent =
      question.category;
    document.querySelector(".question-level").textContent = question.level;
    document.querySelector(".question").textContent = `Q${
      this.questionSettings.index + 1
    }: ${question.question}`;
    let random4numbers = new Set();
    while (random4numbers.size < 4)
      random4numbers.add(Math.floor(Math.random() * 4) + 1);
    random4numbers = Array.from(random4numbers);
    question.answers.forEach((answer, index) => {
      document.querySelector(`.answer-${random4numbers[index]}`).textContent =
        answer;
    });
    answerBtns.forEach((answerBtn) => {
      answerBtn.checked = false;
    });
    nextBtn.style.display = "block";
    endBtn.style.display = "none";
  }
  resetTimer() {
    let timer = document.querySelector(".timer");
    clearInterval(this.questionSettings.timerIntervalId);
    let time;
    const updateTimer = () => {
      if (this.questionSettings.timer.seconds < 10) {
        time = `0${this.questionSettings.timer.minutes}:0${this.questionSettings.timer.seconds}`;
      } else {
        time = `0${this.questionSettings.timer.minutes}:${this.questionSettings.timer.seconds}`;
      }
      if (time === "00:00") {
        clearInterval(this.questionSettings.timerIntervalId);
        this.questionSettings.timer.seconds = 0;
        this.questionSettings.timer.minutes = 3;
        this.userAnswers.push(this.currentAnswer);
        this.currentAnswer = "false";
        if (this.questionSettings.index === 9) {
          timer.textContent = "QUIZ IS OVER";
          timer.style.color = "red";
          timer.style.animation = "shake 0.5s ease-in-out";
          this.userAnswers.push(this.currentAnswer);
          this.currentAnswer = "false";
          setTimeout(() => {
            timer.style.animation = "none";
          }, 500);
          setTimeout(() => this.handleQuizEnd(), 2000);
        }
      }
      if (
        this.questionSettings.timer.minutes === 0 &&
        this.questionSettings.timer.seconds <= 30
      ) {
        timer.style.color = "red";
      } else {
        timer.style.color = "black";
      }
      timer.textContent = time;
      saveQuizState(this);
      if (this.questionSettings.timer.seconds === 0)
        this.questionSettings.timer.minutes--,
          (this.questionSettings.timer.seconds = 60);
      this.questionSettings.timer.seconds--;
    };
    updateTimer();
    this.questionSettings.timerIntervalId = setInterval(updateTimer, 1000);
  }
  handleQuizEnd() {
    saveQuizState(this);
    document
      .querySelector(".question-bullet-10")
      .classList.add("passed-question");
    quizContainer.style.display = "none";
    quizEnd.style.display = "block";
    quizEnd.querySelector(
      "p"
    ).textContent = `You got ${this.calculateGrade()} out of 10`;
    this.handleAnswers();
  }
  handleAnswers() {
    this.questions.forEach((q, index) => {
      const li = document.createElement("li");
      const question = document.createElement("p");
      question.innerHTML = `Q${index + 1}: ${q.question}`;
      li.appendChild(question);
      const correct = document.createElement("p");
      correct.innerHTML = `Correct answer: ${q.correctAnswer}`;
      li.appendChild(correct);
      if (q.correctAnswer !== this.userAnswers[index]) {
        const user = document.createElement("p");
        user.innerHTML = `Your answer: ${this.userAnswers[index]}`;
        li.appendChild(user);
        question.innerHTML += "<span class='minus-point'>-1</span>";
      } else {
        question.innerHTML += "<span class='plus-point'>+1</span>";
      }
      quizEnd.querySelector("ul").appendChild(li);
    });
  }
  handleNextQuestion() {
    if (answerBtns.every((e) => !e.checked)) {
      document.querySelectorAll(".answer-container").forEach((e) => {
        e.style.cssText =
          "animation: shake 0.5s ease-in-out; background-color: red;";
        setTimeout(() => {
          e.style.cssText = "animation: none; background-color: inherit;";
        }, 500);
      });
    } else {
      this.userAnswers.push(this.currentAnswer);
      this.currentAnswer = "false";
      clearTimeout(this.questionSettings.timer.timeoutId);
      clearInterval(this.questionSettings.timerIntervalId);
      this.questionSettings.timer.seconds = 0;
      this.questionSettings.timer.minutes = 3;
      if (this.questionSettings.index > 9) this.handleQuizEnd();
      else this.callQuestions();
    }
  }
  addInstanceEventListeners() {
    nextBtn.addEventListener("click", this.handleNextQuestion.bind(this));
    answerBtns.forEach((answerBtn) => {
      answerBtn.addEventListener("click", (e) => {
        this.currentAnswer = document.querySelector(
          `.answer-${e.target.id.split("-")[1]}`
        ).textContent;
      });
    });
    endBtn.addEventListener("click", this.handleNextQuestion.bind(this));
    resetBtn.addEventListener("click", () => {
      sessionStorage.clear();
      this.reset(0, 0);
      quizStart.style.display = "block";
      quizContainer.style.display = "none";
      quizEnd.style.display = "none";
      categoryBtn.textContent = "category ▾";
      levelBtn.textContent = "level ▾";
      startBtn.classList.add("disabled-btn");
      levelBtn.classList.add("disabled-btn");
      quizEnd.querySelector("ul").innerHTML = "";
    });
  }
  calculateGrade() {
    let res = 0;
    let i = 0;
    this.userAnswers.forEach((answer) => {
      if (answer === this.questions[i++].correctAnswer) res++;
    });
    return res;
  }
}
Filter.loadFilter();
Filter.addEventListeners();
let quiz;

startBtn.addEventListener("click", function () {
  logic();
});
function logic() {
  if (Filter.category && Filter.level) {
    quiz.reset(Filter.category, Filter.level);
    quiz.getData().then(() => {
      quiz.callQuestions();
      quizStart.style.display = "none";
      quizContainer.style.display = "flex";
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  quiz = loadQuizState();
  if (quiz) {
    quizStart.style.display = "none";
    quizContainer.style.display = "flex";
    categoryBtn.textContent = `${quiz.category} ▾`;
    levelBtn.textContent = `${quiz.level} ▾`;
    levelBtn.classList.remove("disabled-btn");
    if (quiz.userAnswers.length !== 10) {
      quiz.callQuestions();
      for (let i = 1; i < quiz.userAnswers.length; i++) {
        document
          .querySelector(`.question-bullet-${i}`)
          .classList.add("passed-question");
      }
    } else {
      quiz.handleQuizEnd();
    }
  } else {
    quiz = new Quiz();
  }
  quiz.addInstanceEventListeners();
});

function saveQuizState(quiz) {
  const quizState = {
    category: quiz.category,
    level: quiz.level,
    userAnswers: quiz.userAnswers,
    currentAnswer: quiz.currentAnswer,
    questionSettings: {
      index: quiz.questionSettings.index - 1,
      timerIntervalId: quiz.questionSettings.timerIntervalId,
      timer: {
        timeoutId: quiz.questionSettings.timer.timeoutId,
        seconds: quiz.questionSettings.timer.seconds,
        minutes: quiz.questionSettings.timer.minutes,
      },
    },
  };
  sessionStorage.setItem("quizState", JSON.stringify(quizState));
}

function loadQuizState() {
  const quizState = sessionStorage.getItem("quizState");
  if (quizState) {
    const parsedState = JSON.parse(quizState);
    const loadedQuiz = new Quiz();
    loadedQuiz.questions = JSON.parse(sessionStorage.getItem("questions"));
    loadedQuiz.category = parsedState.category;
    loadedQuiz.level = parsedState.level;
    loadedQuiz.userAnswers = parsedState.userAnswers;
    loadedQuiz.currentAnswer = parsedState.currentAnswer;
    loadedQuiz.questionSettings.index = parsedState.questionSettings.index;
    loadedQuiz.questionSettings.timer.timeoutId =
      parsedState.questionSettings.timer.timeoutId;
    loadedQuiz.questionSettings.timerIntervalId =
      parsedState.questionSettings.timerIntervalId;
    loadedQuiz.questionSettings.timer.seconds =
      parsedState.questionSettings.timer.seconds;
    loadedQuiz.questionSettings.timer.minutes =
      parsedState.questionSettings.timer.minutes;
    return loadedQuiz;
  }
  return null;
}
