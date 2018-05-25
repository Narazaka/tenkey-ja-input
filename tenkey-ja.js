// @ts-check

/**
 * キーコードを子音に変換
 * @param {string} keycode 
 */
function keyCodeToSiin(keycode) {
    switch (keycode) {
        case "Numpad7": return "a";
        case "Numpad8": return "k";
        case "Numpad9": return "s";
        case "Numpad4": return "t";
        case "Numpad5": return "n";
        case "Numpad6": return "h";
        case "Numpad1": return "m";
        case "Numpad2": return "y";
        case "Numpad3": return "r";
        case "Numpad0":
        case "NumpadDecimal": return "w";
        case "KeyQ": return "a";
        case "KeyW": return "k";
        case "KeyE": return "s";
        case "KeyA": return "t";
        case "KeyS": return "n";
        case "KeyD": return "h";
        case "KeyZ": return "m";
        case "KeyX": return "y";
        case "KeyC": return "r";
        case "AltLeft": return "w";
    }
}

/** @type {{[type: string]: string}} */
const siinToTopKana = {
    a: "あいうえお",
    k: "かきくけこ",
    s: "さしすせそ",
    t: "たちつてと",
    n: "なにぬねの",
    h: "はひふへほ",
    m: "まみむめも",
    y: "やゆよ",
    r: "らりるれろ",
    w: "わをん",
};

/**
 * 子音個数をかなに
 * @param {string} siin 
 * @param {number} count 
 */
function siinToKana(siin, count) {
    if (siinPressGroupMaxCount(siin) < count) return `${siin}*${count}`;
    console.info(siin, count);
    return siinToTopKana[siin][count - 1];
}

const minThresholdMs = 1800;
const thresholdMs = 2500;
const maxThresholdMs = 4000;

/**
 * 子音を押した情報
 * 
 * delayは前プレスからの遅延
 * @typedef {{siin: string; delay: number}} SiinPress
 */

/**
 * 単一子音グループ
 * @typedef {{siin: string; presses: SiinPress[]}} SiinPressGroup
 */

/** @type {SiinPress[]} */
const allSiinPresses = [];
/** @type {number | undefined} */
let previousKeyPressMs = undefined;

/**
 * キー押下時に子音を追加
 * @param {string} siin 
 */
function processSiinPress(siin) {
    const currentKeyPressMs = new Date().getTime();
    const delay = previousKeyPressMs == null ? 0 : currentKeyPressMs - previousKeyPressMs;
    previousKeyPressMs = currentKeyPressMs;
    allSiinPresses.push({siin, delay});
}

/**
 * 子音が変わるごとにグループ化
 * @param {SiinPress[]} siinPresses 
 */
function detectSiinPressGroups(siinPresses) {
    if (!siinPresses.length) return [];
    /** @type {string} */
    let currentSiin = siinPresses[0].siin;
    /** @type {SiinPress[]} */
    let currentSiinPresses = [];
    /** @type {SiinPressGroup[]} */
    const groups = [];

    function changeSiin() {
        groups.push({siin: currentSiin, presses: currentSiinPresses});
        currentSiinPresses = [];
    }
    for (const siinPress of siinPresses) {
        if (currentSiin !== siinPress.siin) {
            changeSiin();
            currentSiin = siinPress.siin;
        }
        currentSiinPresses.push(siinPress);
    }
    changeSiin();
    return groups;
}

/**
 * 遅延ごとの次
 * @param {number} delay 
 */
function splitProbability(delay) {
    if (delay > maxThresholdMs) {
        return 0;
    } else if (delay > thresholdMs) {
        return 30;
    } else if (delay > minThresholdMs) {
        return 70;
    } else {
        return 100;
    }
}

/**
 * 最大連続子音数
 * @param {string} siin 
 */
function siinPressGroupMaxCount(siin) {
    if (siin === "y" || siin === "w") return 3;
    return 5;
}

/**
 * 
 * @param {SiinPressGroup[]} groups 
 */
function siinPressGroupToChars(groups) {
    return groups.map((group) => singleSiinPressGroupToChars(group.siin, group.presses));
}

/**
 * 単一子音の押下
 * @param {string} siin
 * @param {SiinPress[]} presses
 */
function singleSiinPressGroupToChars(siin, presses) {
    const length = presses.length;
    const maxCount = siinPressGroupMaxCount(siin);
    const splitIndexes =
        presses
        .map((press, index) => ({index, ...press}))
        .filter((press) => press.delay >= minThresholdMs) // 閾値より上
        // .sort((a, b) => b.delay - a.delay) // 遅延大からの順
        .map((press) => press.index);
    const splitIndexSets =
        [[]]
        .concat(makeAllSets(splitIndexes))
        .filter((indexSet) => maxDistance(indexSet, length) <= maxCount); // 最大距離がmaxを越えない
    splitIndexSets.sort((a, b) => meanDelay(presses, b) - meanDelay(presses, a)); // 平均遅延大からの順
    console.log(splitIndexSets);

    if (!splitIndexSets.length) return `[${siin}*${length}]`;
    return splitIndexSets.map((indexes) => {
        const useIndexes = [0].concat(indexes).concat([length]);
        const chars = [];
        for (let i = 0; i < useIndexes.length - 1; ++i) {
            const start = useIndexes[i];
            const end = useIndexes[i + 1];
            const char = siinToKana(siin, end - start);
            const delay = presses[start].delay;
            chars.push({char, delay});
        }
        return chars;
    });
}

/**
 * インデックスにある押下の平均遅延
 * @param {SiinPress[]} presses 
 * @param {number[]} indexes 
 */
function meanDelay(presses, indexes) {
    return indexes.reduce((sum, index) => presses[index].delay + sum, 0) / indexes.length;
}

/**
 * インデックス間の最大距離
 * @param {number[]} indexes 
 * @param {number} length
 */
function maxDistance(indexes, length) {
    const useIndexes = [0].concat(indexes).concat([length]);
    return Math.max(...Array.from(Array(indexes.length + 1)).map((_, i) => useIndexes[i + 1] - useIndexes[i]));
}

/**
 * 組み合わせ総当たりを作る
 * @param {number[]} numbers 
 * @param {number[][]} results 
 * @param {number} restCount 
 * @return {number[][]}
 */
function makeAllSets(numbers, results = numbers.map(n => [n]), restCount = numbers.length - 1) {
    if (restCount <= 0) return results;
    /** @type {number[][]} */
    const nextResults = [];
    for (const number of numbers) {
        for (const result of results) {
            if (result[result.length - 1] < number) nextResults.push(result.concat(number));
        }
    }
    return results.concat(makeAllSets(numbers, nextResults, restCount - 1))
}

window.addEventListener("keypress", (event) => {
    const siin = keyCodeToSiin(event.code);
    if (!siin) return;
    processSiinPress(siin);
    const groups = detectSiinPressGroups(allSiinPresses);
    // document.getElementById("console").textContent = JSON.stringify(groups, null, "  ");
    const chars = siinPressGroupToChars(groups);

    const charsElem = document.getElementById("chars");
    charsElem.textContent = "";
    for (const char of chars) {
        if (typeof char === "string") {
            const charElem = document.createElement("span");
            charElem.textContent = char;
            charsElem.appendChild(charElem);
        } else {
            const charElem = document.createElement("ul");
            charElem.className = "candidates";
            
            const candidateStrs = {};
            for (const candidate of char) {
                candidateStrs[candidate.map((c) => c.char).join("")] = true;
            }

            for (const candidateStr of Object.keys(candidateStrs)) {
                const candidateElem = document.createElement("li");
                candidateElem.className = "candidate";
                candidateElem.textContent = candidateStr;
                charElem.appendChild(candidateElem);
            }
            charsElem.appendChild(charElem);
        }
    }
});
