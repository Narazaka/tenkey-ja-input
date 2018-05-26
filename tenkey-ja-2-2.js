// @ts-check

/** @typedef {"s" | "b" | "-"} Type */

/** @typedef {{s: number; b: number}} PressedChar */

/**
 * キーコードを種別に変換
 * @param {string} keycode 
 * @return {Type | undefined}
 */
function keyToType(keycode) {
    switch (keycode) {
        case "Numpad0": return "s";
        case "NumpadDecimal": return "b";
        case "NumpadEnter": return "-";
        case "KeyZ": return "s";
        case "KeyX": return "b";
        case "KeyC": return "-";
        case "Enter": return "-";
    }
}

const pressedCharToCharTable = [
    "あいうえお",
    "かきくけこ",
    "さしすせそ",
    "たちつてと",
    "なにぬねの",
    "はひふへほ",
    "まみむめも",
    "やゆよ",
    "らりるれろ",
    "わをん",
];

/**
 * 子音個数をかなに
 * @param {PressedChar} pressedChar 
 */
function pressedCharToChar(pressedChar) {
    const row = pressedCharToCharTable[pressedChar.s % pressedCharToCharTable.length];
    if (!row) return;
    return row[pressedChar.b % row.length];
}

class PressedChars {
    constructor() {
        /** @type {PressedChar[]} */
        this.all = [];
    }

    get latest() { return this.all[this.all.length - 1]; }
    next() {
        this.all.push({s: -1, b: 0});
    }

    get chars() {
        return this.all.map(pressedCharToChar).filter(c => c != null);
    }
}

const pressedChars = new PressedChars();

/** @type {SpeechSynthesisUtterance | undefined} */
let msg;
/** @type {SpeechSynthesisVoice[] | undefined} */
let voices;

let speakCalled = false;
/** @type {string} */
let speakChars;

function speak(str) {
    speakCalled = true;
    speakChars = str;
}

setInterval(() => {
    if (!speakCalled || !msg || typeof speechSynthesis === "undefined" || speechSynthesis.speaking) return;
    speakCalled = false;
    msg.text = speakChars[speakChars.length - 1] + "ー";
    speechSynthesis.speak(msg);
}, 250);

function getVoice() {
    msg = new SpeechSynthesisUtterance();
    const _voices = speechSynthesis.getVoices();
    if (!_voices) return;
    voices = _voices;
    showSetting(loadSetting(), true);
    setVoice(getSetting().voice);
    msg.rate = 0.5;
    msg.volume = 1;
    msg.pitch = 1;
    msg.lang = "ja-JP";
}

function setVoice(name = "") {
    if (!voices || !msg) return;
    if (!name) {
        const voice = voices.find((voice) => /^ja/.test(voice.lang));
        if (!voice) return;
        msg.voice = voice;
    } else {
        const voice = voices.find((voice) => voice.name === name);
        if (!voice) return;
        msg.voice = voice;
    }
}

window.addEventListener("DOMContentLoaded", () => {
    if (typeof speechSynthesis !== "undefined") {
        speechSynthesis.onvoiceschanged = getVoice;
        getVoice();
    }
    const fontSizeElem = /** @type {HTMLInputElement} */ (document.getElementById("fontSize"));
    const minTimeDiffElem = /** @type {HTMLInputElement} */ (document.getElementById("minTimeDiff"));
    const voiceElem = /** @type {HTMLSelectElement} */ (document.getElementById("voice"));
    fontSizeElem.addEventListener("change", applySettingFromInput);
    fontSizeElem.addEventListener("input", applySettingFromInput);
    minTimeDiffElem.addEventListener("change", applySettingFromInput);
    minTimeDiffElem.addEventListener("input", applySettingFromInput);
    voiceElem.addEventListener("change", applySettingFromInput);
    voiceElem.addEventListener("input", applySettingFromInput);
    applySetting(loadSetting(), true);
});

/** @typedef {{fontSize: string; minTimeDiff: "1" | "", voice: string}} Setting */

/** @return {Setting} */
function loadSetting() {
    return {
        fontSize: localStorage.getItem("fontSize") || "20",
        minTimeDiff: /** @type {"1" | ""} */ localStorage.getItem("minTimeDiff") ? "1" : "",
        voice: /** @type {"1" | ""} */ localStorage.getItem("voice") || "",
    };
}

/**
 * @param {Setting} setting 
 */
function saveSetting(setting) {
    localStorage.setItem("fontSize", setting.fontSize);
    localStorage.setItem("minTimeDiff", setting.minTimeDiff);
    localStorage.setItem("voice", setting.voice);
}

/** @return {Setting} */
function getSetting() {
    const fontSizeElem = /** @type {HTMLInputElement} */ (document.getElementById("fontSize"));
    const minTimeDiffElem = /** @type {HTMLInputElement} */ (document.getElementById("minTimeDiff"));
    const voiceElem = /** @type {HTMLSelectElement} */ (document.getElementById("voice"));
    return {
        fontSize: fontSizeElem.value,
        minTimeDiff: minTimeDiffElem.checked ? "1" : "",
        voice: voiceElem.value,
    };
}

/**
 * 
 * @param {Setting} setting 
 * @param {boolean} showInput 
 */
function applySetting(setting, showInput = false) {
    const charsElem = document.getElementById("chars");
    charsElem.style.fontSize = setting.fontSize + "px";
    useMinTimeDiff = Boolean(setting.minTimeDiff);
    if (voices) setVoice(setting.voice);

    saveSetting(setting);
    showSetting(setting, showInput);
}

function applySettingFromInput() {
    applySetting(getSetting());
}

/**
 * 
 * @param {Setting} setting 
 * @param {boolean} showInput 
 */
function showSetting(setting, showInput = false) {
    const fontSizeElem = /** @type {HTMLInputElement} */ (document.getElementById("fontSize"));
    const minTimeDiffElem = /** @type {HTMLInputElement} */ (document.getElementById("minTimeDiff"));
    const voiceElem = /** @type {HTMLSelectElement} */ (document.getElementById("voice"));
    const fontSizeDisplayElem = document.getElementById("fontSizeDisplay");
    const minTimeDiffDisplayElem = document.getElementById("minTimeDiffDisplay");
    if (showInput) {
        fontSizeElem.value = setting.fontSize;
        minTimeDiffElem.checked = setting.minTimeDiff === "1";
        if (!voiceElem.childElementCount && voices) {
            for (const voice of voices) {
                const optionElem = /** @type {HTMLOptionElement} */ (document.createElement("option"));
                optionElem.textContent = `${voice.name} [${voice.lang}] (${voice.localService ? "local" : "remote"})`;
                optionElem.value = voice.name;
                voiceElem.appendChild(optionElem);
            }
        }
        voiceElem.value = setting.voice;
    }
    fontSizeDisplayElem.textContent = setting.fontSize;
    minTimeDiffDisplayElem.textContent = setting.minTimeDiff ? "ON" : "OFF";
}

const keypressed = {};
/** @type {number} */
const minTimeDiff = 600;
let useMinTimeDiff = true;

window.addEventListener("keydown", (event) => {
    const type = keyToType(event.code);
    if (!type) return;
    if (useMinTimeDiff) {
        const time = new Date().getTime();
        const previousTime = keypressed[type];
        const timeDiff = time - (previousTime || 0);
        keypressed[type] = time;
        if (timeDiff < minTimeDiff) return;
    }
    press(type);
});

/**
 * 
 * @param {Type} type 
 */
function press(type) {
    if (!pressedChars.latest) pressedChars.next(); // 初回
    switch (type) {
        case "s": ++pressedChars.latest.s; break;
        case "b":
            if (pressedChars.latest.s === -1) {
                pressedChars.latest.s = 0;
                pressedChars.latest.b = -1;
            }
            ++pressedChars.latest.b;
            break;
        case "-": pressedChars.next(); break;
    }
    const chars = pressedChars.chars;
    const charsElem = document.getElementById("chars");
    charsElem.textContent = "";

    for (const char of chars) {
        const charElem = document.createElement("span");
        charElem.textContent = char;
        charElem.className = "char";
        charsElem.appendChild(charElem);
    }

    speak(chars);
}
