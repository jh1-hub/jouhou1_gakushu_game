import { initGame, updateParams, setRestartCallback, resetGame, launchBall, resetSessionBest, getLastGachaItem } from './app.js';
import { ITEM_LIST, getCollection, getCollectionStats, checkComplete } from './gacha.js';

// --- Helper Functions for generating math questions ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate unique wrong options
function generateUniqueOptions(correctVal, count, generatorFn) {
    const options = new Set([correctVal]);
    let safety = 0;
    while(options.size < count && safety < 100) {
        const val = generatorFn();
        if(val !== correctVal && val >= 0) { // Keep it positive
            options.add(val);
        }
        safety++;
    }
    // Fallback if generator fails
    while(options.size < count) {
        options.add(correctVal + options.size);
    }
    return Array.from(options);
}

// Generator: Units (Bits/Bytes) - SIMPLIFIED
function generateUnitQuestions(count = 16) {
  const qs = [];
  for(let i=0; i<count; i++) {
    const type = randomInt(0, 3);
    
    if(type === 0) {
      // Question: Patterns in N bits
      const bits = [1, 2, 3, 4, 8][randomInt(0, 4)]; // Easier numbers
      const answer = 2 ** bits;
      
      const wrongOptions = generateUniqueOptions(answer, 4, () => {
          // Generate realistic wrong answers
          const r = randomInt(0, 2);
          if (r === 0) return 2 ** (bits + randomInt(-1, 1)); // Off by power
          if (r === 1) return bits * 2; // Linear mistake
          return bits * bits; // Square mistake
      });

      qs.push({
        q: `${bits}ビットで表現できる情報の種類は何通り？`,
        options: wrongOptions.map(String),
        a: wrongOptions.indexOf(answer),
        explanation: `Nビットの情報量は $2^N$ 通りとなります。\n${bits}ビットなら $2^{${bits}} = ${answer}$ 通りです。`
      });

    } else if (type === 1) {
      // Question: Bytes to Bits
      const bytes = randomInt(1, 5); // Keep small
      const answer = bytes * 8;
      
      const wrongOptions = generateUniqueOptions(answer, 4, () => {
          return answer + randomInt(-5, 5) * 2; // Random even numbers nearby
      });

      qs.push({
        q: `${bytes}バイトは何ビット？`,
        options: wrongOptions.map(v => `${v}ビット`),
        a: wrongOptions.indexOf(answer),
        explanation: `1バイトは8ビットです。\nしたがって ${bytes} × 8 = ${answer} ビットとなります。`
      });

    } else if (type === 2) {
      // Question: KB to Bytes
      const kb = randomInt(1, 4);
      const answer = kb * 1024;
      
      const wrongOptions = generateUniqueOptions(answer, 4, () => {
          const type = randomInt(0, 2);
          if (type === 0) return kb * 1000; // Decimal mistake
          if (type === 1) return kb * 100;  // Order of magnitude mistake
          return answer + randomInt(-100, 100);
      });

      qs.push({
        q: `${kb}KB (キロバイト) は何バイト？ (1KB=1024Bとする)`,
        options: wrongOptions.map(String),
        a: wrongOptions.indexOf(answer),
        explanation: `情報の世界では $2^{10}=1024$ を単位の区切りとすることが多いです。\n${kb} × 1024 = ${answer} バイトです。`
      });
    } else {
       // Question: Color depth
       const colors = [1, 4, 8]; // Simple depths
       const c = colors[randomInt(0, 2)];
       const answer = 2 ** c;
       
       const wrongOptions = generateUniqueOptions(answer, 4, () => {
           const r = randomInt(0,2);
           if(r===0) return c * c;
           if(r===1) return c * 10;
           return 2 ** (c-1);
       });

       qs.push({
         q: `${c}ビットカラーで表現できる色数は？`,
         options: wrongOptions.map(String),
         a: wrongOptions.indexOf(answer),
         explanation: `色数もビット数Nに対して $2^N$ で計算できます。\n例：8ビットカラーなら256色です。`
       });
    }
  }
  return qs;
}

// Generator: Base Conversion - SIMPLIFIED
function generateBaseConvQuestions(count = 16) {
  const qs = [];
  for(let i=0; i<count; i++) {
    const type = randomInt(0, 2);
    if(type === 0) { // Bin -> Dec (Small numbers 3-15)
      const val = randomInt(3, 15); 
      const bin = val.toString(2);
      
      const wrongOptions = generateUniqueOptions(val, 4, () => val + randomInt(-3, 3));

      qs.push({
        q: `2進数「${bin}」を10進数に変換すると？`,
        options: wrongOptions.map(String),
        a: wrongOptions.indexOf(val),
        explanation: `各桁の重み(1, 2, 4, 8...)を足し合わせます。`
      });

    } else if (type === 1) { // Dec -> Bin (Small numbers 3-15)
      const val = randomInt(3, 15);
      const bin = val.toString(2);
      
      // Make sure wrong options are valid binaries of similar length
      const wrongOptions = generateUniqueOptions(bin, 4, () => {
          let v = val + randomInt(-3, 3);
          if (v <= 0) v = 1;
          return v.toString(2);
      });

      qs.push({
        q: `10進数「${val}」を2進数に変換すると？`,
        options: wrongOptions, // Already strings
        a: wrongOptions.indexOf(bin),
        explanation: `数値を2で割っていき、余りを下から並べると求められます。`
      });

    } else { // Hex -> Dec (Simple ones like A, F, 10, 1A)
      const val = [10, 11, 12, 13, 14, 15, 16, 26, 31][randomInt(0, 8)];
      const hex = val.toString(16).toUpperCase();
      
      const wrongOptions = generateUniqueOptions(val, 4, () => val + randomInt(-5, 5));

      qs.push({
        q: `16進数「${hex}」を10進数で表すと？`,
        options: wrongOptions.map(String),
        a: wrongOptions.indexOf(val),
        explanation: `16進数の1桁は0-9, A-F(10-15)です。`
      });
    }
  }
  return qs;
}

// Generator: Calculation - SIMPLIFIED (Simple Addition)
function generateCalcQuestions(count = 16) {
  const qs = [];
  for(let i=0; i<count; i++) {
    const a = randomInt(1, 5); // Very small numbers
    const b = randomInt(1, 5);
    const sum = a + b;
    const aBin = a.toString(2);
    const bBin = b.toString(2);
    const sumBin = sum.toString(2);
    
    const wrongOptions = generateUniqueOptions(sumBin, 4, () => {
        let v = sum + randomInt(-2, 2);
        if (v <= 0) v = 1;
        return v.toString(2);
    });
    
    qs.push({
      q: `2進数の計算： ${aBin} + ${bBin} = ?`,
      options: wrongOptions,
      a: wrongOptions.indexOf(sumBin),
      explanation: `10進数で ${a}+${b}=${sum} なので、${sum}を2進数に直します。`
    });
  }
  return qs;
}

// Generator: Logic Gates
function generateLogicQuestions(count = 16) {
  const qs = [];
  const gates = ['AND', 'OR', 'XOR', 'NAND'];
  for(let i=0; i<count; i++) {
    const gate = gates[randomInt(0, 3)];
    const a = randomInt(0, 1);
    const b = randomInt(0, 1);
    let ans = 0;
    if(gate === 'AND') ans = a & b;
    if(gate === 'OR') ans = a | b;
    if(gate === 'XOR') ans = a ^ b;
    if(gate === 'NAND') ans = (a & b) ? 0 : 1;
    
    let desc = "";
    if(gate === 'AND') desc = "両方1のときだけ1";
    if(gate === 'OR') desc = "どちらかが1なら1";
    if(gate === 'XOR') desc = "異なる場合に1 (同じなら0)";
    if(gate === 'NAND') desc = "ANDの逆 (両方1のときだけ0)";

    qs.push({
      q: `論理回路：入力A=${a}, 入力B=${b} のとき、${gate}回路の出力は？`,
      options: ["0", "1", "不定", "Z"],
      a: ans === 0 ? 0 : 1,
      explanation: `${gate}回路は「${desc}」となる回路です。`
    });
  }
  return qs;
}


// --- Quiz Data Structure: 12 Genres based on "Info I" Curriculum ---
const genres = [
  {
    id: 'info_unit',
    title: '情報の単位と量',
    icon: '📏',
    description: 'ビット、バイト、情報量の計算',
    questions: [
      { q: "「1ビット」で表現できる情報の種類は何通り？", options: ["1通り", "2通り", "4通り", "8通り"], a: 1, explanation: "1ビットは0と1の2通りの状態を持ちます。" },
      { q: "「1バイト」は何ビット？", options: ["4ビット", "8ビット", "16ビット", "32ビット"], a: 1, explanation: "通常、8ビットをまとめて1バイトと呼びます。" },
      { q: "1バイトで表現できる情報量は2の8乗で何通り？", options: ["128", "255", "256", "512"], a: 2, explanation: "2の8乗 = 256通りです。0〜255の整数を表現できます。" },
      { q: "nビットで表現できる情報の種類は？", options: ["2 × n", "nの2乗", "2のn乗", "n + 2"], a: 2, explanation: "ビットが増えるごとに表現できる数は2倍になります。" }
    ]
  },
  {
    id: 'base_conv',
    title: '基数変換',
    icon: '🔢',
    description: '2進数、10進数、16進数の変換',
    questions: [
      { q: "2進数の「1010」を10進数にすると？", options: ["8", "10", "12", "14"], a: 1, explanation: "8+2=10 となります。" },
      { q: "10進数の「5」を2進数にすると？", options: ["100", "101", "110", "111"], a: 1, explanation: "5 = 4 + 1 なので、101となります。" },
      { q: "16進数で「10」から「15」を表すのに使う文字は？", options: ["G〜L", "A〜F", "X〜Z", "α〜ω"], a: 1, explanation: "A=10, B=11, ... F=15 と対応します。" },
      { q: "2進数「1111」は16進数でいくつ？", options: ["A", "C", "E", "F"], a: 3, explanation: "8+4+2+1=15。15は16進数でFです。" }
    ]
  },
  {
    id: 'calc_comp',
    title: '数値の計算と補数',
    icon: '➕',
    description: '2進数の加減算、負の数の表現',
    questions: [
      { q: "コンピュータで「負の数」を表現する際によく使われる考え方は？", options: ["逆数