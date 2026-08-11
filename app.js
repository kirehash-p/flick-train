(() => {
  "use strict";

  const SESSION_LENGTH = 20;
  const WORD_SESSION_LENGTH = 6;
  const TRANSITION_MS = 180;
  const ATTACK_TRANSITION_MS = 100;

  const DIRECTIONS = {
    center: { label: "タップ", short: "中央", arrow: "•" },
    left: { label: "左フリック", short: "左", arrow: "←" },
    up: { label: "上フリック", short: "上", arrow: "↑" },
    right: { label: "右フリック", short: "右", arrow: "→" },
    down: { label: "下フリック", short: "下", arrow: "↓" },
  };

  const MODE_CONFIG = {
    character: {
      goal: `${SESSION_LENGTH}問`,
      instruction: "キーの表示を見て入力",
    },
    words: {
      goal: `${WORD_SESSION_LENGTH}問`,
      instruction: "表示された順に入力",
    },
  };

  const TIME_ATTACK = {
    maxGauge: 100,
    baseDrainPerSecond: 3.4,
    increasePerCorrect: 0.18,
    penaltyPerMistake: 3,
    wordCharacterRecovery: 1.4,
  };

  const KANA_KEYS = [
    { id: "a-row", label: "あ", subLabel: "あ行", map: { center: "あ", left: "い", up: "う", right: "え", down: "お" } },
    { id: "ka-row", label: "か", subLabel: "か行", map: { center: "か", left: "き", up: "く", right: "け", down: "こ" } },
    { id: "sa-row", label: "さ", subLabel: "さ行", map: { center: "さ", left: "し", up: "す", right: "せ", down: "そ" } },
    { id: "ta-row", label: "た", subLabel: "た行", map: { center: "た", left: "ち", up: "つ", right: "て", down: "と" } },
    { id: "na-row", label: "な", subLabel: "な行", map: { center: "な", left: "に", up: "ぬ", right: "ね", down: "の" } },
    { id: "ha-row", label: "は", subLabel: "は行", map: { center: "は", left: "ひ", up: "ふ", right: "へ", down: "ほ" } },
    { id: "ma-row", label: "ま", subLabel: "ま行", map: { center: "ま", left: "み", up: "む", right: "め", down: "も" } },
    { id: "ya-row", label: "や", subLabel: "や行", map: { center: "や", left: "ゆ", right: "よ" } },
    { id: "ra-row", label: "ら", subLabel: "ら行", map: { center: "ら", left: "り", up: "る", right: "れ", down: "ろ" } },
    { id: "dakuten", label: "゛゜", subLabel: "大⇔小", action: "transform", map: { center: "", left: "゛", up: "小", right: "゜" } },
    { id: "wa-row", label: "わ", subLabel: "わ行", map: { center: "わ", left: "を", up: "ん", right: "ー" } },
    { id: "punctuation", label: "、", subLabel: "", map: { center: "、", left: "。", up: "？", right: "！", down: "…" } },
  ];

  const DELETE_KEY = { id: "delete", label: "", subLabel: "", action: "delete", type: "delete" };
  const SHIFT_KEY = { id: "shift", label: "a⇔A", subLabel: "", action: "shift", type: "shift", practice: false };
  const SYMBOL_TOGGLE_KEY = { id: "symbols", label: "?123", subLabel: "数字・記号", action: "switchSymbols", type: "symbol-toggle", practice: false };
  const LETTER_TOGGLE_KEY = { id: "letters", label: "ABC", subLabel: "文字", action: "switchLetters", type: "symbol-toggle", practice: false };

  // Gboardの英字12キー配列。
  // キー面にはグループ、押下中のポップアップには各方向の1文字を表示する。
  const ALPHABET_GROUP_KEYS = [
    { id: "alphabet-symbols", label: "@ - _ /", subLabel: "1", map: { center: "@", left: "-", up: "_", right: "/", down: "1" }, practice: false, alphabetGroup: true },
    { id: "alphabet-abc", label: "ABC", subLabel: "2", map: { center: "a", left: "b", up: "c", down: "2" }, letter: true, alphabetGroup: true },
    { id: "alphabet-def", label: "DEF", subLabel: "3", map: { center: "d", left: "e", up: "f", down: "3" }, letter: true, alphabetGroup: true },
    { id: "alphabet-ghi", label: "GHI", subLabel: "4", map: { center: "g", left: "h", up: "i", down: "4" }, letter: true, alphabetGroup: true },
    { id: "alphabet-jkl", label: "JKL", subLabel: "5", map: { center: "j", left: "k", up: "l", down: "5" }, letter: true, alphabetGroup: true },
    { id: "alphabet-mno", label: "MNO", subLabel: "6", map: { center: "m", left: "n", up: "o", down: "6" }, letter: true, alphabetGroup: true },
    { id: "alphabet-pqrs", label: "PQRS", subLabel: "7", map: { center: "p", left: "q", up: "r", right: "s", down: "7" }, letter: true, alphabetGroup: true },
    { id: "alphabet-tuv", label: "TUV", subLabel: "8", map: { center: "t", left: "u", up: "v", down: "8" }, letter: true, alphabetGroup: true },
    { id: "alphabet-wxyz", label: "WXYZ", subLabel: "9", map: { center: "w", left: "x", up: "y", right: "z", down: "9" }, letter: true, alphabetGroup: true },
  ];

  const ALPHABET_QUOTES = { id: "alphabet-quotes", label: "'\";:", subLabel: "0", map: { center: "'", left: "\"", up: ";", right: ":", down: "0" }, practice: false, alphabetGroup: true };
  const ALPHABET_PUNCTUATION = { id: "alphabet-punctuation", label: ".,?!", subLabel: "", map: { center: ".", left: ",", up: "?", right: "!" }, practice: false, alphabetGroup: true };

  const ALPHABET_SYMBOL_GROUPS = [
    { id: "symbol-numbers-a", label: "123", subLabel: "", map: { center: "1", left: "2", up: "3", right: "4", down: "5" }, practice: false },
    { id: "symbol-numbers-b", label: "678", subLabel: "", map: { center: "6", left: "7", up: "8", right: "9", down: "0" }, practice: false },
    { id: "symbol-marks-a", label: "@#$%&", subLabel: "", map: { center: "@", left: "#", up: "$", right: "%", down: "&" }, practice: false },
    { id: "symbol-marks-b", label: "-+*/=", subLabel: "", map: { center: "-", left: "+", up: "*", right: "/", down: "=" }, practice: false },
    { id: "symbol-brackets", label: "()[]{}", subLabel: "", map: { center: "(", left: ")", up: "[", right: "]", down: "{" }, practice: false },
    { id: "symbol-quotes", label: "'\"`~", subLabel: "", map: { center: "'", left: "\"", up: "`", right: "~", down: "}" }, practice: false },
    { id: "symbol-punct-a", label: ":;!?", subLabel: "", map: { center: ":", left: ";", up: "!", right: "?", down: "\\" }, practice: false },
    { id: "symbol-punct-b", label: ".,<>", subLabel: "", map: { center: ".", left: ",", up: "<", right: ">", down: "|" }, practice: false },
    { id: "symbol-percent", label: "%^&", subLabel: "", map: { center: "%", left: "^", up: "&", right: "_", down: "=" }, practice: false },
    { id: "symbol-bracket-b", label: "[]{}", subLabel: "", map: { center: "[", left: "]", up: "{", right: "}", down: "\\" }, practice: false },
    { id: "symbol-backslash", label: "\\|", subLabel: "", map: { center: "\\", left: "|", up: "/", right: "~", down: "`" }, practice: false },
    { id: "symbol-extra", label: "…·", subLabel: "", map: { center: "…", left: "·", up: "–", right: "—", down: "©" }, practice: false },
  ];

  const KEY_DEFINITIONS = {
    kana: [...KANA_KEYS],
    alphabet: [...ALPHABET_GROUP_KEYS, ALPHABET_QUOTES, ALPHABET_PUNCTUATION, ...ALPHABET_SYMBOL_GROUPS, SHIFT_KEY, SYMBOL_TOGGLE_KEY, LETTER_TOGGLE_KEY, DELETE_KEY],
  };

  const KANA_ROWS = [
    KANA_KEYS.slice(0, 3),
    KANA_KEYS.slice(3, 6),
    KANA_KEYS.slice(6, 9),
    KANA_KEYS.slice(9, 12),
  ];

  function alphabetRows() {
    if (state.alphabetSymbols) {
      const symbolRows = [
        ALPHABET_SYMBOL_GROUPS.slice(0, 3),
        ALPHABET_SYMBOL_GROUPS.slice(3, 6),
        ALPHABET_SYMBOL_GROUPS.slice(6, 9),
        ALPHABET_SYMBOL_GROUPS.slice(9, 12),
        [LETTER_TOGGLE_KEY, DELETE_KEY],
      ];
      return symbolRows;
    }
    return [
      ALPHABET_GROUP_KEYS.slice(0, 3),
      ALPHABET_GROUP_KEYS.slice(3, 6),
      ALPHABET_GROUP_KEYS.slice(6, 9),
      [SHIFT_KEY, ALPHABET_QUOTES, ALPHABET_PUNCTUATION],
      [SYMBOL_TOGGLE_KEY, DELETE_KEY],
    ];
  }

  const WORDS = {
    kana: ["あさ", "いえ", "かお", "さかな", "たまご", "はな", "みず", "やま", "そら", "こころ", "おはよう", "だいすき", "にほん", "でんしゃ", "がっこう", "あいさつ"],
    alphabet: ["hello", "flick", "steps", "practice", "coffee", "typing", "good job", "focus", "smooth", "well done", "keep going"],
  };

  const VOICED_TO_BASE = {
    "が": "か", "ぎ": "き", "ぐ": "く", "げ": "け", "ご": "こ",
    "ざ": "さ", "じ": "し", "ず": "す", "ぜ": "せ", "ぞ": "そ",
    "だ": "た", "ぢ": "ち", "づ": "つ", "で": "て", "ど": "と",
    "ば": "は", "び": "ひ", "ぶ": "ふ", "べ": "へ", "ぼ": "ほ",
    "ヴ": "う",
  };
  const SEMI_VOICED_TO_BASE = { "ぱ": "は", "ぴ": "ひ", "ぷ": "ふ", "ぺ": "へ", "ぽ": "ほ" };
  const SMALL_TO_BASE = { "ぁ": "あ", "ぃ": "い", "ぅ": "う", "ぇ": "え", "ぉ": "お", "ゃ": "や", "ゅ": "ゆ", "ょ": "よ", "っ": "つ", "ゎ": "わ" };
  const BASE_TO_VOICED = Object.fromEntries(Object.entries(VOICED_TO_BASE).map(([voiced, base]) => [`${base}|゛`, voiced]));
  const BASE_TO_SEMI_VOICED = Object.fromEntries(Object.entries(SEMI_VOICED_TO_BASE).map(([voiced, base]) => [`${base}|゜`, voiced]));
  const BASE_TO_SMALL = Object.fromEntries(Object.entries(SMALL_TO_BASE).map(([small, base]) => [base, small]));

  const state = {
    language: "kana",
    mode: "character",
    alphabetSymbols: false,
    alphabetShift: false,
    timeAttackEnabled: false,
    settings: {
      showGuide: true,
      showKeyboardLabels: true,
    },
    words: {
      kana: [...WORDS.kana],
      alphabet: [...WORDS.alphabet],
    },
    corpusReady: false,
    sequence: [],
    targetIndex: 0,
    target: null,
    typedTokens: [],
    pointer: null,
    lastPointerCommit: null,
    lastFocus: null,
    session: null,
    sessionToken: 0,
    characterIndexes: { kana: {}, alphabet: {} },
    timeAttack: {
      started: false,
      gameOver: false,
      gauge: TIME_ATTACK.maxGauge,
      elapsedMs: 0,
      lastTick: 0,
      correctCount: 0,
    },
    timers: { transition: null, clock: null, attack: null, toast: null },
  };

  const elements = {};

  function getElements() {
    const ids = [
      "timeAttackToggle", "settingsButton", "settingsPanel", "settingsCloseButton", "headerCorrect", "headerMistakes", "restartButton",
      "sessionGoal",
      "sessionProgressCount", "sessionProgressLabel", "sessionAccuracy", "sessionStreak", "sessionTime",
      "normalProgressTrack", "progressBar", "timeAttackStrip", "attackLevel", "attackGaugeFill", "attackCorrect", "attackRate", "attackStartButton",
      "promptArea", "promptKicker", "focusBadge", "promptText", "wordTarget", "promptSub", "directionCard", "directionArrow", "directionLabel",
      "previewText", "feedbackLine", "feedbackIcon", "feedbackText", "keyboardInstruction", "keyboard",
      "sessionOverlay", "closeSummaryButton", "summaryEyebrow", "summaryCheck", "summaryTitle", "summaryMessage", "summaryAccuracy", "summaryInputs", "summaryInputsLabel", "summaryTime", "summaryRestartButton", "toast",
    ];
    ids.forEach((id) => { elements[id] = document.getElementById(id); });
    elements.modeButtons = [...document.querySelectorAll(".mode-button")];
    elements.languageButtons = [...document.querySelectorAll(".language-button")];
    elements.settingRows = [...document.querySelectorAll("[data-setting]")];
  }

  function syncViewportHeight() {
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    if (viewportHeight > 0) document.documentElement.style.setProperty("--viewport-height", `${Math.round(viewportHeight)}px`);
  }

  function isTimeAttack() {
    return state.timeAttackEnabled;
  }

  function buildCharacterIndex(language) {
    const index = {};
    KEY_DEFINITIONS[language].forEach((definition) => {
      if (!definition.map) return;
      Object.entries(definition.map).forEach(([direction, value]) => {
        if (!value || index[value]) return;
        index[value] = { value, keyId: definition.id, direction };
      });
    });
    return index;
  }

  function getDefinition(keyId, language = state.language) {
    return KEY_DEFINITIONS[language].find((definition) => definition.id === keyId) || null;
  }

  function expandCharacter(character) {
    if (VOICED_TO_BASE[character]) return [VOICED_TO_BASE[character], "゛"];
    if (SEMI_VOICED_TO_BASE[character]) return [SEMI_VOICED_TO_BASE[character], "゜"];
    if (SMALL_TO_BASE[character]) return [SMALL_TO_BASE[character], "小"];
    return [character];
  }

  function createTarget(text, language = state.language, kind = null) {
    const normalizedText = language === "alphabet" ? text.toLowerCase() : text;
    const tokens = [];
    const charRanges = [];
    let hasUnsupportedCharacter = false;
    [...normalizedText].forEach((character) => {
      const start = tokens.length;
      expandCharacter(character).forEach((token) => {
        const action = state.characterIndexes[language][token];
        if (action) tokens.push({ ...action });
        else hasUnsupportedCharacter = true;
      });
      charRanges.push({ start, end: tokens.length });
    });
    if (!tokens.length || hasUnsupportedCharacter) return null;
    return {
      text: normalizedText,
      kind: kind || ([...normalizedText].length > 1 ? "word" : "char"),
      tokens,
      charRanges,
    };
  }

  function normalizeCorpusList(value, language) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value
      .filter((word) => typeof word === "string")
      .map((word) => language === "alphabet" ? word.replace(/\s+/g, "") : word.trim())
      .filter((word) => word && createTarget(word, language, "word")))]
      .slice(0, 500);
  }

  async function loadWordCorpus() {
    try {
      const response = await fetch("data/words.json", { cache: "no-store" });
      if (!response.ok) throw new Error("corpus unavailable");
      const payload = await response.json();
      const kana = normalizeCorpusList(payload.kana, "kana");
      const alphabet = normalizeCorpusList(payload.alphabet, "alphabet");
      if (kana.length) state.words.kana = kana;
      if (alphabet.length) state.words.alphabet = alphabet;
      state.corpusReady = kana.length > 0 || alphabet.length > 0;
    } catch (error) {
      state.corpusReady = false;
    }
  }

  function createActionTarget(action) {
    if (!action) return null;
    return {
      text: action.value,
      kind: "char",
      tokens: [{ ...action }],
      charRanges: [{ start: 0, end: 1 }],
    };
  }

  function validEntries(language) {
    return Object.values(state.characterIndexes[language]).filter((action) => {
      const definition = getDefinition(action.keyId, language);
      const isAlphabetLetter = language === "alphabet" && definition?.letter && /^[a-z]$/.test(action.value);
      const isKanaCharacter = language === "kana" && !["dakuten", "punctuation"].includes(action.keyId);
      return definition && definition.practice !== false && (isAlphabetLetter || isKanaCharacter);
    });
  }

  function randomEntry(language, previousValue = "") {
    const entries = validEntries(language);
    const available = entries.filter((entry) => entry.value !== previousValue);
    return (available.length ? available : entries)[Math.floor(Math.random() * (available.length ? available.length : entries.length))];
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
    }
    return items;
  }

  function buildSequence(mode, language) {
    if (mode === "character") {
      const sequence = [];
      let previous = "";
      for (let index = 0; index < SESSION_LENGTH; index += 1) {
        const action = randomEntry(language, previous);
        if (!action) continue;
        sequence.push(createActionTarget(action));
        previous = action.value;
      }
      return sequence.filter(Boolean);
    }

    const maxLength = language === "kana" ? 10 : 16;
    const sourceWords = (state.words[language] || WORDS[language])
      .map((word) => language === "alphabet" ? word.replace(/\s+/g, "") : word)
      .filter((word) => [...word].length <= maxLength);
    const usableWords = sourceWords.length ? sourceWords : WORDS[language];
    const words = shuffle([...usableWords]);
    return Array.from({ length: WORD_SESSION_LENGTH }, (_, index) => createTarget(words[index % words.length], language, "word")).filter(Boolean);
  }

  function resetTimeAttack() {
    state.timeAttack.started = false;
    state.timeAttack.gameOver = false;
    state.timeAttack.gauge = TIME_ATTACK.maxGauge;
    state.timeAttack.elapsedMs = 0;
    state.timeAttack.lastTick = 0;
    state.timeAttack.correctCount = 0;
  }

  function clearTimers() {
    window.clearTimeout(state.timers.transition);
    window.clearInterval(state.timers.clock);
    window.clearInterval(state.timers.attack);
    state.timers.transition = null;
    state.timers.clock = null;
    state.timers.attack = null;
  }

  function startSession(mode = state.mode, timeAttack = state.timeAttackEnabled, language = state.language) {
    state.mode = MODE_CONFIG[mode] ? mode : "character";
    state.language = language === "alphabet" ? "alphabet" : "kana";
    state.alphabetSymbols = false;
    state.alphabetShift = false;
    state.timeAttackEnabled = Boolean(timeAttack);
    state.sessionToken += 1;
    state.lastFocus = null;
    state.pointer = null;
    state.lastPointerCommit = null;
    clearTimers();
    resetTimeAttack();
    state.sequence = buildSequence(state.mode, state.language);
    if (!state.sequence.length) state.sequence = buildSequence("character", state.language);
    state.targetIndex = 0;
    state.target = state.sequence[0];
    state.typedTokens = [];
    state.session = {
      startedAt: isTimeAttack() ? null : Date.now(),
      attempts: 0,
      correct: 0,
      mistakes: 0,
      streak: 0,
      completed: 0,
      transitioning: false,
      ended: false,
    };

    elements.sessionOverlay.hidden = true;
    document.body.classList.remove("is-modal");
    updateModeUI();
    renderKeyboard();
    renderPrompt();
    updateSessionUI();
    renderTimeAttack();
    updateSessionClock();

    state.timers.clock = window.setInterval(updateSessionClock, 250);
    if (isTimeAttack()) state.timers.attack = window.setInterval(updateTimeAttack, 100);
  }

  function updateModeUI() {
    const config = MODE_CONFIG[state.mode];
    elements.modeButtons.forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.languageButtons.forEach((button) => {
      const active = button.dataset.language === state.language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.timeAttackToggle.classList.toggle("is-active", isTimeAttack());
    elements.timeAttackToggle.setAttribute("aria-pressed", String(isTimeAttack()));
    elements.sessionGoal.textContent = isTimeAttack() ? "ゲージがなくなるまで" : config.goal;
    elements.keyboardInstruction.textContent = state.settings.showKeyboardLabels
      ? (isTimeAttack() ? "正確さを保って続ける" : config.instruction)
      : "キーを使って入力";
    elements.normalProgressTrack.hidden = isTimeAttack();
    elements.timeAttackStrip.hidden = !isTimeAttack();
  }

  function renderKeyboard() {
    elements.keyboard.replaceChildren();
    elements.keyboard.dataset.labels = state.settings.showKeyboardLabels ? "shown" : "hidden";
    elements.keyboard.dataset.language = state.language;
    elements.keyboard.classList.toggle("is-alphabet-flick", state.language === "alphabet");
    if (state.language === "alphabet") {
      const rows = alphabetRows();
      rows.forEach((definitions, rowIndex) => {
        const row = document.createElement("div");
        const utility = rowIndex === rows.length - 1;
        row.className = `keyboard-row keyboard-row--${utility ? "utility" : rowIndex + 1}`;
        definitions.forEach((definition) => row.appendChild(createKeyElement(definition)));
        elements.keyboard.appendChild(row);
      });
    } else {
      KANA_ROWS.forEach((definitions, rowIndex) => {
        const row = document.createElement("div");
        row.className = `keyboard-row keyboard-row--kana keyboard-row--${rowIndex + 1}`;
        definitions.forEach((definition) => row.appendChild(createKeyElement(definition)));
        elements.keyboard.appendChild(row);
      });
    }
    updateTargetKey();
  }

  function updateSettingsUI() {
    elements.settingRows.forEach((row) => {
      const enabled = Boolean(state.settings[row.dataset.setting]);
      row.classList.toggle("is-on", enabled);
      row.setAttribute("aria-pressed", String(enabled));
      const stateLabel = row.querySelector(".setting-state");
      if (stateLabel) stateLabel.textContent = enabled ? "表示" : "非表示";
    });
    elements.keyboard.dataset.labels = state.settings.showKeyboardLabels ? "shown" : "hidden";
    elements.settingsButton.setAttribute("aria-expanded", String(!elements.settingsPanel.hidden));
    elements.settingsButton.setAttribute("aria-label", elements.settingsPanel.hidden ? "設定を開く" : "設定を閉じる");
    updateModeUI();
  }

  function toggleSettingsPanel(forceOpen = null) {
    const open = forceOpen === null ? elements.settingsPanel.hidden : Boolean(forceOpen);
    elements.settingsPanel.hidden = !open;
    updateSettingsUI();
    if (open) {
      const firstSetting = elements.settingRows[0];
      if (firstSetting) window.requestAnimationFrame(() => firstSetting.focus());
    }
  }

  function toggleSetting(setting) {
    if (!(setting in state.settings)) return;
    state.settings[setting] = !state.settings[setting];
    updateSettingsUI();
    renderPrompt();
  }

  function createKeyElement(definition) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flick-key";
    button.dataset.keyId = definition.id;
    button.dataset.language = state.language;
    button.dataset.layout = state.language === "alphabet" ? "alphabet-flick" : "flick";
    if (definition.type) button.classList.add(`flick-key--${definition.type}`);
    if (definition.action === "delete") button.classList.add("flick-key--delete", "flick-key--utility");
    if (["shift", "switchSymbols", "switchLetters", "enter"].includes(definition.action)) button.classList.add("flick-key--utility");
    if (definition.action === "shift" && state.alphabetShift) button.classList.add("is-active");

    const descriptionId = `key-description-${state.language}-${definition.id}`;
    button.setAttribute("aria-describedby", descriptionId);
    if (definition.map) {
      ["up", "left", "right", "down"].forEach((direction) => {
        const label = document.createElement("span");
        label.className = `key-side-label key-side-label--${direction}`;
        if (definition.alphabetGroup && direction === "down") label.classList.add("key-side-label--idle-hidden");
        label.dataset.direction = direction;
        label.textContent = definition.map[direction] || "";
        if (!definition.map[direction]) label.setAttribute("aria-hidden", "true");
        button.appendChild(label);
      });
      const centerDot = document.createElement("span");
      centerDot.className = "key-center-dot";
      centerDot.dataset.direction = "center";
      button.appendChild(centerDot);
    }

    const content = document.createElement("span");
    content.className = "key-content";
    if (definition.action === "delete") {
      const icon = document.createElement("span");
      icon.className = "utility-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "⌫";
      content.appendChild(icon);
    }
    const main = document.createElement("span");
    main.className = "key-main";
    main.textContent = definition.letter && state.alphabetShift ? definition.label.toUpperCase() : definition.label;
    content.appendChild(main);
    const sub = document.createElement("span");
    sub.className = "key-sub";
    sub.textContent = definition.subLabel;
    content.appendChild(sub);
    button.appendChild(content);

    const popover = document.createElement("span");
    popover.className = "key-popover";
    popover.setAttribute("aria-hidden", "true");
    ["up", "left", "center", "right", "down"].forEach((direction) => {
      const value = document.createElement("span");
      value.className = `key-popover-value key-popover-value--${direction}`;
      value.dataset.direction = direction;
      popover.appendChild(value);
    });
    button.appendChild(popover);

    const description = document.createElement("span");
    description.className = "sr-only";
    description.id = descriptionId;
    description.textContent = ariaLabelForKey(definition);
    button.appendChild(description);

    button.addEventListener("pointerdown", onPointerDown);
    button.addEventListener("pointermove", onPointerMove);
    button.addEventListener("pointerup", onPointerUp);
    button.addEventListener("pointercancel", onPointerCancel);
    button.addEventListener("click", onKeyClick);
    return button;
  }

  function ariaLabelForKey(definition) {
    if (definition.action === "delete") return "削除。タップで直前の入力を1つ戻す";
    if (definition.action === "shift") return "シフト。タップで大文字と小文字を切り替える";
    if (definition.action === "switchSymbols") return "数字と記号。タップで数字・記号キーボードへ切り替える";
    if (definition.action === "switchLetters") return "ABC。タップでアルファベットキーボードへ戻る";
    if (definition.action === "enter") return "確定。タップで入力を確定する";
    if (definition.action === "transform") return "゛・゜・小文字。フリックまたはタップで変換する";
    const center = definition.map?.center || definition.label;
    const parts = [`${definition.label}。${definition.subLabel || ""}キー。タップで${center}`];
    ["left", "up", "right", "down"].forEach((direction) => {
      if (definition.map?.[direction]) parts.push(`${DIRECTIONS[direction].short}フリックで${definition.map[direction]}`);
    });
    return parts.join("。 ");
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (state.pointer || !state.session || state.session.ended || state.session.transitioning) {
      event.preventDefault();
      return;
    }
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    state.pointer = {
      keyId: button.dataset.keyId,
      pointerId: event.pointerId,
      button,
      rect,
      startX: event.clientX,
      startY: event.clientY,
    };
    state.lastPointerCommit = null;
    try { button.setPointerCapture(event.pointerId); } catch (error) { /* optional */ }
    updateGesturePreview(state.pointer, "center");
    event.preventDefault();
  }

  function onPointerMove(event) {
    const pointer = state.pointer;
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    updateGesturePreview(pointer, directionForPointer(pointer, event.clientX, event.clientY));
    event.preventDefault();
  }

  function onPointerUp(event) {
    const pointer = state.pointer;
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    const keyId = pointer.keyId;
    const button = pointer.button;
    const direction = directionForPointer(pointer, event.clientX, event.clientY);
    state.pointer = null;
    state.lastPointerCommit = { keyId, at: performance.now() };
    window.setTimeout(() => {
      if (state.lastPointerCommit && state.lastPointerCommit.keyId === keyId && performance.now() - state.lastPointerCommit.at >= 850) state.lastPointerCommit = null;
    }, 900);
    clearGesturePreview();
    try { button.releasePointerCapture(event.pointerId); } catch (error) { /* optional */ }
    activateKey(keyId, direction);
    event.preventDefault();
  }

  function onPointerCancel(event) {
    const pointer = state.pointer;
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    state.pointer = null;
    clearGesturePreview();
    try { pointer.button.releasePointerCapture(event.pointerId); } catch (error) { /* optional */ }
  }

  function onKeyClick(event) {
    const keyId = event.currentTarget.dataset.keyId;
    if (state.lastPointerCommit && state.lastPointerCommit.keyId === keyId && performance.now() - state.lastPointerCommit.at < 850) {
      state.lastPointerCommit = null;
      return;
    }
    activateKey(keyId, "center");
  }

  function directionForPointer(pointer, x, y) {
    const dx = x - pointer.startX;
    const dy = y - pointer.startY;
    const distance = Math.hypot(dx, dy);
    const threshold = Math.max(22, Math.min(pointer.rect.width, pointer.rect.height) * 0.28);
    if (distance < threshold) return "center";
    const horizontal = Math.abs(dx);
    const vertical = Math.abs(dy);
    if (horizontal > vertical * 1.1) return dx < 0 ? "left" : "right";
    if (vertical > horizontal * 1.1) return dy < 0 ? "up" : "down";
    return horizontal >= vertical ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
  }

  function updateGesturePreview(pointer, direction) {
    clearGesturePreview();
    pointer.button.classList.add("is-pressing");
    const side = pointer.button.querySelector(`[data-direction="${direction}"]`);
    if (side) side.classList.add("is-current");
    const center = pointer.button.querySelector(".key-center-dot");
    if (direction === "center" && center) center.classList.add("is-current");
    updateKeyPopover(pointer.button, direction);
  }

  function clearGesturePreview() {
    document.querySelectorAll(".flick-key.is-pressing").forEach((button) => button.classList.remove("is-pressing"));
    document.querySelectorAll(".key-side-label.is-current, .key-center-dot.is-current").forEach((label) => label.classList.remove("is-current"));
    document.querySelectorAll(".key-popover-value").forEach((value) => value.classList.remove("is-selected"));
  }

  function updateKeyPopover(button, direction) {
    const popover = button.querySelector(".key-popover");
    if (!popover) return;
    const definition = getDefinition(button.dataset.keyId);
    [...popover.querySelectorAll(".key-popover-value")].forEach((value) => {
      const valueDirection = value.dataset.direction;
      value.textContent = !definition?.map && valueDirection !== "center"
        ? ""
        : gesturePreviewValue(button, valueDirection);
      value.classList.toggle("is-empty", !value.textContent);
      value.classList.toggle("is-selected", valueDirection === direction);
    });
  }

  function gesturePreviewValue(button, direction) {
    const definition = getDefinition(button.dataset.keyId);
    if (!definition) return "";
    if (definition.action === "delete") return "⌫";
    if (definition.action === "shift") return state.alphabetShift ? "a" : "A";
    if (definition.action === "switchSymbols") return "?123";
    if (definition.action === "switchLetters") return "ABC";
    if (definition.action === "enter") return "↵";
    if (definition.action === "transform" && direction === "center") return transformPreviewValue();
    const value = definition.map?.[direction] || "";
    return definition.letter && state.alphabetShift ? value.toUpperCase() : value;
  }

  function transformPreviewValue() {
    const expected = state.target?.tokens[state.typedTokens.length];
    if (expected?.keyId === "dakuten" && ["left", "right", "up"].includes(expected.direction)) {
      return getDefinition("dakuten")?.map?.[expected.direction] || "゛゜";
    }
    return getDefinition("dakuten")?.label || "゛゜";
  }

  function activateKey(keyId, direction) {
    if (!state.session || state.session.ended || state.session.transitioning || state.timeAttack.gameOver) return;
    if (isTimeAttack() && !state.timeAttack.started) startTimeAttack(true);
    const definition = getDefinition(keyId);
    if (!definition) return;

    if (definition.action === "switchKana") {
      if (direction !== "center") return handleWrongInput(`かなへの切替は中央をタップします`, keyId);
      setLanguage("kana");
      return;
    }
    if (definition.action === "switchSymbols") {
      if (direction !== "center") return handleWrongInput("数字と記号は中央をタップします", keyId);
      state.alphabetSymbols = true;
      state.alphabetShift = false;
      renderKeyboard();
      renderPrompt();
      return;
    }
    if (definition.action === "switchLetters") {
      if (direction !== "center") return handleWrongInput("ABCは中央をタップします", keyId);
      state.alphabetSymbols = false;
      renderKeyboard();
      renderPrompt();
      return;
    }
    if (definition.action === "shift") {
      if (direction !== "center") return handleWrongInput("大文字切替は中央をタップします", keyId);
      state.alphabetShift = !state.alphabetShift;
      renderKeyboard();
      renderPrompt();
      return;
    }
    if (definition.action === "transform") {
      if (direction === "center") return transformPreviousCharacter();
      const value = definition.map?.[direction];
      if (!value) return handleWrongInput("このキーの動きは使いません", keyId);
      attemptAction({ value, keyId, direction });
      return;
    }
    if (definition.action === "enter") {
      if (direction !== "center") return handleWrongInput("確定は中央をタップします", keyId);
      return handleWrongInput("この練習では確定操作は使いません", keyId);
    }
    if (definition.action === "delete") {
      if (direction !== "center") return handleWrongInput("削除は中央をタップします", keyId);
      if (deleteLastInput()) flashKey(keyId, "correct");
      return;
    }
    const value = definition.map?.[direction];
    if (!value) return handleWrongInput(`このキーの${DIRECTIONS[direction].label}は使いません`, keyId);
    const outputValue = definition.letter && state.alphabetShift ? value.toUpperCase() : value;
    attemptAction({ value: outputValue, keyId, direction });
  }

  function transformPreviousCharacter() {
    const expected = state.target?.tokens[state.typedTokens.length];
    if (!expected || expected.keyId !== "dakuten") {
      return handleWrongInput("変換する文字がありません", "dakuten");
    }
    const direction = ["left", "right", "up"].includes(expected.direction) ? expected.direction : "center";
    const value = expected.direction === "left" ? "゛" : expected.direction === "right" ? "゜" : "小";
    attemptAction({ value, keyId: "dakuten", direction });
  }

  function attemptAction(action) {
    const expected = state.target?.tokens[state.typedTokens.length];
    if (!expected) return;
    state.session.attempts += 1;
    const isTransformTap = expected.keyId === "dakuten"
      && action.keyId === "dakuten"
      && action.direction === "center"
      && ["left", "right", "up"].includes(expected.direction);
    const valueMatches = expected.value === action.value
      || (state.language === "alphabet"
        && typeof expected.value === "string"
        && typeof action.value === "string"
        && expected.value.toLowerCase() === action.value.toLowerCase());
    if (expected.keyId === action.keyId && (expected.direction === action.direction || isTransformTap) && valueMatches) {
      state.typedTokens.push(action.value);
      state.session.correct += 1;
      state.session.streak += 1;
      if (isTimeAttack() && isWordCharacterComplete()) recoverWordCharacterGauge();
      setFeedback("good", state.typedTokens.length === state.target.tokens.length ? "ぴったり。次へ" : "いい動き");
      flashKey(action.keyId, "correct");
      maybeVibrate(8);
      renderPrompt();
      updateSessionUI();
      renderTimeAttack();
      if (state.typedTokens.length === state.target.tokens.length) completeTarget();
      return;
    }
    registerWrong(action.keyId, `おしい。${readableValue(expected.value)}を入力する動きです`);
  }

  function isWordCharacterComplete() {
    if (state.mode !== "words" || state.target?.kind !== "word") return false;
    const typedLength = state.typedTokens.length;
    return state.target.charRanges.some((range) => range.end === typedLength);
  }

  function recoverWordCharacterGauge() {
    state.timeAttack.gauge = Math.min(
      TIME_ATTACK.maxGauge,
      state.timeAttack.gauge + TIME_ATTACK.wordCharacterRecovery,
    );
  }

  function handleWrongInput(message, keyId) {
    if (!state.session) return;
    state.session.attempts += 1;
    registerWrong(keyId, message);
  }

  function registerWrong(keyId, message) {
    state.session.mistakes += 1;
    state.session.streak = 0;
    if (isTimeAttack()) {
      state.timeAttack.gauge = Math.max(0, state.timeAttack.gauge - TIME_ATTACK.penaltyPerMistake);
      if (state.timeAttack.gauge === 0) return gameOver();
    }
    setFeedback("wrong", message);
    flashKey(keyId, "wrong");
    updateSessionUI();
    renderTimeAttack();
  }

  function deleteLastInput() {
    if (!state.typedTokens.length) {
      setFeedback("normal", "まだ戻せる入力はありません");
      return false;
    }
    state.typedTokens.pop();
    setFeedback("normal", "ひとつ戻しました");
    renderPrompt();
    updateSessionUI();
    return true;
  }

  function completeTarget() {
    if (state.session.transitioning) return;
    state.session.transitioning = true;
    state.session.completed += 1;
    state.targetIndex += 1;
    if (isTimeAttack()) state.timeAttack.correctCount += 1;
    updateSessionUI();
    const sessionToken = state.sessionToken;
    state.timers.transition = window.setTimeout(() => {
      if (sessionToken !== state.sessionToken || !state.session || state.session.ended) return;
      if (!isTimeAttack() && state.targetIndex >= state.sequence.length) return finishSession();
      if (state.targetIndex >= state.sequence.length) {
        state.sequence = buildSequence(state.mode, state.language);
        state.targetIndex = 0;
      }
      state.target = state.sequence[state.targetIndex];
      state.typedTokens = [];
      state.session.transitioning = false;
      renderPrompt();
      updateSessionUI();
    }, isTimeAttack() ? ATTACK_TRANSITION_MS : TRANSITION_MS);
  }

  function timeAttackRate() {
    return TIME_ATTACK.baseDrainPerSecond + state.timeAttack.correctCount * TIME_ATTACK.increasePerCorrect;
  }

  function startTimeAttack(silent = false) {
    if (!isTimeAttack() || state.timeAttack.started || state.timeAttack.gameOver || !state.session) return;
    state.timeAttack.started = true;
    state.session.startedAt = Date.now();
    state.timeAttack.lastTick = Date.now();
    if (!silent) setFeedback("normal", "タイムアタック開始");
    renderTimeAttack();
    updateSessionClock();
  }

  function updateTimeAttack() {
    if (!isTimeAttack() || !state.session || state.session.ended || !state.timeAttack.started || state.timeAttack.gameOver) return;
    if (document.hidden) {
      state.timeAttack.lastTick = Date.now();
      return;
    }
    const now = Date.now();
    const delta = Math.max(0, now - state.timeAttack.lastTick);
    state.timeAttack.lastTick = now;
    state.timeAttack.elapsedMs = now - state.session.startedAt;
    state.timeAttack.gauge = Math.max(0, state.timeAttack.gauge - (delta / 1000) * timeAttackRate());
    if (state.timeAttack.gauge <= 0) return gameOver();
    renderTimeAttack();
    updateSessionClock();
  }

  function gameOver() {
    if (!state.session || state.session.ended) return;
    state.timeAttack.gauge = 0;
    state.timeAttack.gameOver = true;
    state.session.ended = true;
    clearTimers();
    renderTimeAttack();
    showSummary(true);
  }

  function finishSession() {
    if (!state.session || state.session.ended) return;
    state.session.ended = true;
    clearTimers();
    showSummary(false);
  }

  function showSummary(gameOverState) {
    const attempts = state.session.attempts;
    const accuracy = attempts ? Math.round((state.session.correct / attempts) * 100) : 0;
    const attack = isTimeAttack();
    elements.summaryEyebrow.textContent = gameOverState ? "GAME OVER" : "RESULT";
    elements.summaryCheck.textContent = gameOverState ? "×" : "✓";
    elements.summaryCheck.classList.toggle("is-game-over", gameOverState);
    elements.summaryTitle.textContent = gameOverState ? "ゲームオーバー" : "練習完了";
    elements.summaryMessage.textContent = gameOverState
      ? `クリア数 ${state.timeAttack.correctCount}。もう一度、落ち着いて挑戦できます。`
      : "正しい動きを積み重ねられています。";
    elements.summaryAccuracy.textContent = `${accuracy}%`;
    elements.summaryInputs.textContent = String(attack ? state.timeAttack.correctCount : state.session.correct);
    elements.summaryInputsLabel.textContent = attack ? "クリア数" : "入力数";
    elements.summaryTime.textContent = formatTime(state.session.startedAt ? (attack ? state.timeAttack.elapsedMs : Date.now() - state.session.startedAt) : 0);
    state.lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    elements.sessionOverlay.hidden = false;
    document.body.classList.add("is-modal");
    window.requestAnimationFrame(() => elements.summaryRestartButton.focus());
  }

  function renderTimeAttack() {
    elements.timeAttackStrip.hidden = !isTimeAttack();
    elements.normalProgressTrack.hidden = isTimeAttack();
    if (!isTimeAttack()) return;
    const gauge = Math.max(0, Math.min(100, state.timeAttack.gauge));
    elements.attackGaugeFill.style.width = `${gauge}%`;
    elements.attackGaugeFill.parentElement.setAttribute("aria-valuenow", String(Math.round(gauge)));
    elements.attackCorrect.textContent = String(state.timeAttack.correctCount);
    elements.attackRate.textContent = timeAttackRate().toFixed(1);
    elements.attackLevel.textContent = `LEVEL ${Math.floor(state.timeAttack.correctCount / 5) + 1}`;
    elements.attackStartButton.hidden = state.timeAttack.started || state.timeAttack.gameOver;
  }

  function renderPrompt() {
    const target = state.target;
    if (!target) return;
    const expected = target.tokens[state.typedTokens.length];
    const showGuide = state.settings.showGuide;
    const showDirection = Boolean(showGuide && expected && state.mode === "character" && !isTimeAttack());
    const currentValue = expected ? readableValue(expected.value) : "完了";
    const currentDefinition = expected ? getDefinition(expected.keyId) : null;

    elements.promptKicker.textContent = "お題";
    elements.promptText.hidden = target.kind === "word";
    elements.wordTarget.hidden = target.kind !== "word";
    elements.promptText.textContent = target.kind === "word" ? "" : target.text;
    elements.promptText.classList.toggle("is-word", target.kind === "word");
    if (target.kind === "word") renderWordTarget(target);

    if (!showGuide) {
      elements.promptSub.textContent = "";
    } else if (target.kind === "word") {
      elements.promptSub.textContent = expected ? `つぎは「${currentValue}」` : "ことばが完成しました";
    } else if (showDirection && expected) {
      elements.promptSub.textContent = expected.direction === "center"
        ? `中央をタップして「${currentValue}」を入力`
        : `${DIRECTIONS[expected.direction].label}して「${currentValue}」を入力`;
    } else {
      elements.promptSub.textContent = "目標の文字を思い出して入力";
    }

    elements.directionCard.hidden = !showDirection;
    elements.directionArrow.textContent = showDirection ? DIRECTIONS[expected.direction].arrow : "•";
    elements.directionLabel.textContent = showDirection ? DIRECTIONS[expected.direction].label : "";
    elements.focusBadge.hidden = !showGuide;
    elements.focusBadge.className = "focus-badge";
    if (state.mode === "words") elements.focusBadge.classList.add("is-words");
    if (isTimeAttack()) elements.focusBadge.classList.add("is-attack");
    if (showDirection && currentDefinition) elements.focusBadge.textContent = `${currentDefinition.subLabel} · ${DIRECTIONS[expected.direction].short}`;
    else if (state.mode === "words") elements.focusBadge.textContent = "次の文字";
    else if (isTimeAttack()) elements.focusBadge.textContent = "ゲージを保つ";
    else elements.focusBadge.textContent = state.language === "kana" ? "かな · 基本" : "ABC · 基本";

    const composed = composeTokens(state.typedTokens, state.language);
    elements.previewText.textContent = composed || "まだ入力されていません";
    elements.previewText.classList.toggle("is-empty", !composed);
    updateTargetKey();
  }

  function renderWordTarget(target) {
    elements.wordTarget.replaceChildren();
    [...target.text].forEach((character, index) => {
      const span = document.createElement("span");
      span.className = "word-character";
      span.textContent = character;
      const range = target.charRanges[index];
      if (state.typedTokens.length >= range.end) span.classList.add("is-done");
      else if (state.typedTokens.length >= range.start) span.classList.add("is-current");
      elements.wordTarget.appendChild(span);
    });
  }

  function updateTargetKey() {
    document.querySelectorAll(".flick-key.is-target").forEach((key) => key.classList.remove("is-target"));
    if (!state.target || !state.session || state.session.ended || state.session.transitioning) return;
    if (!state.settings.showGuide) return;
    if (isTimeAttack()) return;
    const expected = state.target.tokens[state.typedTokens.length];
    const targetButton = expected && elements.keyboard.querySelector(`[data-key-id="${expected.keyId}"]`);
    if (targetButton) targetButton.classList.add("is-target");
  }

  function composeTokens(tokens, language) {
    if (language === "alphabet") return tokens.join("");
    let output = "";
    tokens.forEach((token) => {
      if (token === "゛" || token === "゜") {
        const key = `${output.slice(-1)}|${token}`;
        const replacement = token === "゛" ? BASE_TO_VOICED[key] : BASE_TO_SEMI_VOICED[key];
        output = replacement ? `${output.slice(0, -1)}${replacement}` : `${output}${token}`;
      } else if (token === "小") {
        const replacement = BASE_TO_SMALL[output.slice(-1)];
        output = replacement ? `${output.slice(0, -1)}${replacement}` : `${output}${token}`;
      } else {
        output += token;
      }
    });
    return output;
  }

  function readableValue(value) {
    if (value === "゛" || value === "゜") return value;
    if (value === "小") return "小文字";
    return value;
  }

  function setFeedback(type, message) {
    elements.feedbackLine.className = "feedback-line";
    if (type === "good") elements.feedbackLine.classList.add("is-good");
    if (type === "wrong") elements.feedbackLine.classList.add("is-wrong");
    elements.feedbackIcon.textContent = type === "good" ? "✓" : type === "wrong" ? "!" : "i";
    elements.feedbackText.textContent = message;
    elements.promptArea.classList.remove("is-correct", "is-wrong");
    if (type === "good") elements.promptArea.classList.add("is-correct");
    if (type === "wrong") elements.promptArea.classList.add("is-wrong");
  }

  function flashKey(keyId, type) {
    const key = elements.keyboard.querySelector(`[data-key-id="${keyId}"]`);
    if (!key) return;
    key.classList.remove("is-correct", "is-wrong");
    void key.offsetWidth;
    key.classList.add(type === "correct" ? "is-correct" : "is-wrong");
    window.setTimeout(() => key.classList.remove("is-correct", "is-wrong"), 240);
  }

  function updateSessionUI() {
    if (!state.session) return;
    const correct = state.session.correct;
    const accuracy = state.session.attempts ? `${Math.round((correct / state.session.attempts) * 100)}%` : "—";
    elements.sessionProgressCount.textContent = isTimeAttack() ? String(state.timeAttack.correctCount) : `${state.session.completed}/${state.sequence.length}`;
    elements.sessionProgressLabel.textContent = isTimeAttack() ? "クリア" : "進み";
    elements.sessionAccuracy.textContent = accuracy;
    elements.sessionStreak.textContent = String(state.session.streak);
    elements.headerCorrect.textContent = String(correct);
    elements.headerMistakes.textContent = String(state.session.mistakes);
    if (!isTimeAttack()) elements.progressBar.style.width = `${Math.min(100, (state.session.completed / Math.max(state.sequence.length, 1)) * 100)}%`;
    updateSessionClock();
  }

  function updateSessionClock() {
    if (!state.session) return;
    const elapsed = state.session.startedAt ? (isTimeAttack() ? state.timeAttack.elapsedMs : Date.now() - state.session.startedAt) : 0;
    elements.sessionTime.textContent = formatTime(elapsed);
  }

  function setLanguage(language) {
    if (language !== "kana" && language !== "alphabet") return;
    if (language === state.language) return;
    startSession(state.mode, state.timeAttackEnabled, language);
    showToast(language === "kana" ? "かなキーボード" : "ABCキーボード");
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
  }

  function maybeVibrate(duration) {
    if (typeof navigator.vibrate === "function" && state.session && state.session.correct % 4 === 0) navigator.vibrate(duration);
  }

  function showToast(message) {
    window.clearTimeout(state.timers.toast);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    state.timers.toast = window.setTimeout(() => { elements.toast.hidden = true; }, 1800);
  }

  function hideSummary(restoreFocus = true) {
    elements.sessionOverlay.hidden = true;
    document.body.classList.remove("is-modal");
    const lastFocus = state.lastFocus;
    state.lastFocus = null;
    if (restoreFocus && lastFocus?.isConnected && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function restartFromSummary() {
    hideSummary(false);
    startSession(state.mode, state.timeAttackEnabled, state.language);
    elements.restartButton.focus();
  }

  function handleSummaryKeydown(event) {
    if (elements.sessionOverlay.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      restartFromSummary();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...elements.sessionOverlay.querySelectorAll("button:not(:disabled), [href], [tabindex]:not([tabindex=\"-1\"])")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleSettingsKeydown(event) {
    if (elements.settingsPanel.hidden) return false;
    if (event.key === "Escape") {
      event.preventDefault();
      toggleSettingsPanel(false);
      return true;
    }
    if (event.key !== "Tab") return false;
    const focusable = [elements.settingsCloseButton, ...elements.settingRows].filter((element) => element && !element.disabled);
    if (!focusable.length) return false;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    return false;
  }

  function handleDocumentKeydown(event) {
    if (handleSettingsKeydown(event)) return;
    handleSummaryKeydown(event);
  }

  async function init() {
    getElements();
    syncViewportHeight();
    window.addEventListener("resize", syncViewportHeight, { passive: true });
    window.visualViewport?.addEventListener("resize", syncViewportHeight, { passive: true });
    state.characterIndexes.kana = buildCharacterIndex("kana");
    state.characterIndexes.alphabet = buildCharacterIndex("alphabet");

    elements.modeButtons.forEach((button) => button.addEventListener("click", () => startSession(button.dataset.mode, state.timeAttackEnabled, state.language)));
    elements.timeAttackToggle.addEventListener("click", () => {
      const nextTimeAttack = !state.timeAttackEnabled;
      startSession(state.mode, nextTimeAttack, state.language);
      showToast(nextTimeAttack ? "タイムアタック" : "通常練習");
    });
    elements.settingsButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSettingsPanel();
    });
    elements.settingsCloseButton.addEventListener("click", () => toggleSettingsPanel(false));
    elements.settingRows.forEach((row) => row.addEventListener("click", () => toggleSetting(row.dataset.setting)));
    elements.attackStartButton.addEventListener("click", () => startTimeAttack());
    elements.languageButtons.forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.language)));
    elements.restartButton.addEventListener("click", () => startSession(state.mode, state.timeAttackEnabled, state.language));
    elements.summaryRestartButton.addEventListener("click", restartFromSummary);
    elements.closeSummaryButton.addEventListener("click", restartFromSummary);
    elements.sessionOverlay.addEventListener("click", (event) => {
      if (event.target.dataset.closeSummary === "true") restartFromSummary();
    });
    document.addEventListener("keydown", handleDocumentKeydown);
    document.addEventListener("pointerdown", (event) => {
      if (elements.settingsPanel.hidden) return;
      if (elements.settingsPanel.contains(event.target) || event.target === elements.settingsButton) return;
      toggleSettingsPanel(false);
    });
    document.addEventListener("visibilitychange", () => {
      if (isTimeAttack() && state.timeAttack.started) state.timeAttack.lastTick = Date.now();
    });

    startSession("character", false, "kana");
    await loadWordCorpus();
  }

  init();
})();
