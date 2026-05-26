import { initGame, updateParams, setRestartCallback, resetGame, launchBall, resetSessionBest, getLastGachaItem } from './app.js';
import { ITEM_LIST, getCollection, getCollectionStats, checkComplete } from './gacha.js';

// --- CENTRALIZED EXAM CONFIGURATION (Change this for easy reuse in 2nd term or other subjects) ---
const EXAM_CONFIG = {
  subjectName: "情報Ⅰ",
  termName: "1学期末考査", // Change to "2学期末考査", "2学期中間考査", etc. for subsequent exams
  reportTitleSuffix: "対策 学習成果レポート",
  reportSubtitleSuffix: "授業提出レポート"
};

// --- Timer reference for countdown control ---
let nextButtonTimer = null;

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
    while(options.size < count) {
        options.add(correctVal + options.size);
    }
    return Array.from(options);
}

// Generator: Units (Bits/Bytes) - SIMPLIFIED & UNIQUE
function generateUnitQuestions(count = 10) {
  const qs = [];
  const parametersUsed = new Set();
  let safety = 0;
  while(qs.length < count && safety < 100) {
    safety++;
    const type = randomInt(0, 2);
    
    if(type === 0) {
      const bits = [1, 2, 3, 4, 8][randomInt(0, 4)];
      const paramKey = `bits_${bits}`;
      if (parametersUsed.has(paramKey)) continue;
      parametersUsed.add(paramKey);
      
      const answer = 2 ** bits;
      const wrongOptions = generateUniqueOptions(answer, 4, () => {
          const r = randomInt(0, 2);
          if (r === 0) return 2 ** (bits + randomInt(-1, 1));
          if (r === 1) return bits * 2;
          return bits * bits;
      });

      qs.push({
        q: `${bits}ビットで表現できる情報の種類は何通りか。`,
        options: wrongOptions.map(String),
        a: wrongOptions.indexOf(answer)
      });

    } else if (type === 1) {
      const bytes = randomInt(1, 10);
      const paramKey = `bytes_${bytes}`;
      if (parametersUsed.has(paramKey)) continue;
      parametersUsed.add(paramKey);
      
      const answer = bytes * 8;
      const wrongOptions = generateUniqueOptions(answer, 4, () => {
          return answer + randomInt(-5, 5) * 2;
      });

      qs.push({
        q: `${bytes}バイトは何ビットか。`,
        options: wrongOptions.map(v => `${v}ビット`),
        a: wrongOptions.indexOf(answer)
      });

    } else {
      const kb = randomInt(1, 8);
      const paramKey = `kb_${kb}`;
      if (parametersUsed.has(paramKey)) continue;
      parametersUsed.add(paramKey);
      
      const answer = kb * 1024;
      const wrongOptions = generateUniqueOptions(answer, 4, () => {
          const typeSub = randomInt(0, 1);
          if (typeSub === 0) return kb * 1000;
          return answer + randomInt(-100, 100);
      });

      qs.push({
        q: `${kb}KB (キロバイト) は何バイトか。 (1KB＝1024Bとする)`,
        options: wrongOptions.map(String),
        a: wrongOptions.indexOf(answer)
      });
    }
  }
  
  // Robust fallback to meet count requirements
  while (qs.length < count) {
    qs.push({
      q: `1バイトは何ビットか。`,
      options: ["2ビット", "4ビット", "8ビット", "16ビット"],
      a: 2
    });
  }
  return qs;
}

// Generator: Base Conversion - SIMPLIFIED & UNIQUE
function generateBaseConvQuestions(count = 10) {
  const qs = [];
  const numbersUsed = new Set();
  let safety = 0;
  while(qs.length < count && safety < 100) {
    safety++;
    const type = randomInt(0, 2);
    if(type === 0) { // Bin -> Dec (Small numbers 3-15)
      const val = randomInt(3, 15); 
      const paramKey = `bin_${val}`;
      if (numbersUsed.has(paramKey)) continue;
      numbersUsed.add(paramKey);
      
      const bin = val.toString(2);
      const wrongOptions = generateUniqueOptions(val, 4, () => val + randomInt(-3, 3));

      qs.push({
        q: `2進数「${bin}」を10進数に変換した値は何か。`,
        options: wrongOptions.map(String),
        a: wrongOptions.indexOf(val)
      });

    } else if (type === 1) { // Dec -> Bin (Small numbers 3-15)
      const val = randomInt(3, 15);
      const paramKey = `dec_${val}`;
      if (numbersUsed.has(paramKey)) continue;
      numbersUsed.add(paramKey);
      
      const bin = val.toString(2);
      const wrongOptions = generateUniqueOptions(bin, 4, () => {
          let v = val + randomInt(-3, 3);
          if (v <= 0) v = 1;
          return v.toString(2);
      });

      qs.push({
        q: `10進数「${val}」を2進数に変換した値は何か。`,
        options: wrongOptions,
        a: wrongOptions.indexOf(bin)
      });

    } else { // Hex -> Dec (Simple ones like A, F, 10, etc.)
      const val = [10, 11, 12, 13, 14, 15, 16, 17, 18, 20][randomInt(0, 9)];
      const paramKey = `hex_${val}`;
      if (numbersUsed.has(paramKey)) continue;
      numbersUsed.add(paramKey);
      
      const hex = val.toString(16).toUpperCase();
      const wrongOptions = generateUniqueOptions(val, 4, () => val + randomInt(-3, 3));

      qs.push({
        q: `16進数「${hex}」を10進数に変換した値は何か。`,
        options: wrongOptions.map(String),
        a: wrongOptions.indexOf(val)
      });
    }
  }
  
  // Fallback
  while(qs.length < count) {
    qs.push({
      q: `10進数「10」を2進数に変換した値は何か。`,
      options: ["1000", "1010", "1100", "1111"],
      a: 1
    });
  }
  return qs;
}

// Function to update vocabulary statistics when an answer is placed
function recordVocabStat(itemId, isCorrect) {
  if (!itemId) return;
  const stored = localStorage.getItem('golf_vocab_stats');
  let stats = stored ? JSON.parse(stored) : {};
  if (!stats[itemId]) {
    stats[itemId] = { attempts: 0, corrects: 0 };
  }
  stats[itemId].attempts++;
  if (isCorrect) {
    stats[itemId].corrects++;
  }
  localStorage.setItem('golf_vocab_stats', JSON.stringify(stats));
}

// Helper to generate a single vocab question of a specific type (A or B)
function makeVocabQuestion(targetItem, type) {
  const descIdx = Math.floor(Math.random() * 3);
  const targetDesc = targetItem.explanations[descIdx];
  const correctText = targetItem.name;
  const genreId = targetItem.genre_id;
  const itemsInGenre = ITEM_LIST.filter(item => item.genre_id === genreId);

  if (type === 'explanation_to_word') {
    // Type A: Explanation -> Word
    const sameGenreWrong = itemsInGenre.filter(item => item.id !== targetItem.id);
    let wrongOptions = [];
    const shuffledSameGenre = sameGenreWrong.sort(() => 0.5 - Math.random());
    wrongOptions.push(...shuffledSameGenre.map(item => item.name));
    
    if (wrongOptions.length < 3) {
      const otherGenreWrong = ITEM_LIST.filter(item => item.genre_id !== genreId);
      const shuffledOther = otherGenreWrong.sort(() => 0.5 - Math.random());
      for (let item of shuffledOther) {
        if (wrongOptions.length >= 3) break;
        if (!wrongOptions.includes(item.name)) {
          wrongOptions.push(item.name);
        }
      }
    } else {
      wrongOptions = wrongOptions.slice(0, 3);
    }
    
    const options = [correctText, ...wrongOptions];
    const shuffledOptions = options.sort(() => 0.5 - Math.random());
    const correctIdx = shuffledOptions.indexOf(correctText);
    
    return {
      q: targetDesc,
      options: shuffledOptions,
      a: correctIdx,
      genre_id: genreId,
      item_id: targetItem.id,
      vocab_type: 'explanation_to_word'
    };
  } else {
    // Type B: Word -> Explanation
    const correctExplain = targetDesc;
    const sameGenreWrong = itemsInGenre.filter(item => item.id !== targetItem.id);
    let wrongOptions = [];
    const shuffledSameGenre = sameGenreWrong.sort(() => 0.5 - Math.random());
    
    for (const item of shuffledSameGenre) {
      const randExp = item.explanations[Math.floor(Math.random() * 3)];
      wrongOptions.push(randExp);
    }
    
    if (wrongOptions.length < 3) {
      const otherGenreWrong = ITEM_LIST.filter(item => item.genre_id !== genreId);
      const shuffledOther = otherGenreWrong.sort(() => 0.5 - Math.random());
      for (let item of shuffledOther) {
        if (wrongOptions.length >= 3) break;
        const randExp = item.explanations[Math.floor(Math.random() * 3)];
        if (!wrongOptions.includes(randExp)) {
          wrongOptions.push(randExp);
        }
      }
    } else {
      wrongOptions = wrongOptions.slice(0, 3);
    }
    
    const options = [correctExplain, ...wrongOptions];
    const shuffledOptions = options.sort(() => 0.5 - Math.random());
    const correctIdx = shuffledOptions.indexOf(correctExplain);
    
    return {
      q: `用語「${correctText}」の説明として最も適切なものはどれか。`,
      options: shuffledOptions,
      a: correctIdx,
      genre_id: genreId,
      item_id: targetItem.id,
      vocab_type: 'word_to_explanation'
    };
  }
}

// Low-level helper to transform a list of item objects to 4-option quiz questions
function generateVocabQuestionsForItems(itemsToUse) {
  const qs = [];
  const startMode = Math.random() < 0.5;
  for (let i = 0; i < itemsToUse.length; i++) {
    const targetItem = itemsToUse[i];
    const type = (startMode ? (i % 2 === 0) : (i % 2 !== 0)) ? 'word_to_explanation' : 'explanation_to_word';
    qs.push(makeVocabQuestion(targetItem, type));
  }
  return qs;
}

// Generate Vocab Questions dynamically based on selected genre (Always 4-options, mixed QA type)
function generateVocabularyQuestions(genreId, count = 5) {
  const items = ITEM_LIST.filter(item => item.genre_id === genreId);
  if (items.length === 0) return [];
  const shuffledItems = [...items].sort(() => 0.5 - Math.random());
  const itemsToUse = shuffledItems.slice(0, Math.min(count, shuffledItems.length));
  return generateVocabQuestionsForItems(itemsToUse);
}

// Generate vocabulary weakness targeted questions (Weakness recovery)
function generateWeaknessQuestions(count = 5) {
  const stored = localStorage.getItem('golf_vocab_stats');
  const stats = stored ? JSON.parse(stored) : {};
  
  const itemsWithStats = ITEM_LIST.map(item => {
    const s = stats[item.id] || { attempts: 0, corrects: 0 };
    const accuracy = s.attempts > 0 ? (s.corrects / s.attempts) : 1.0;
    return {
      item,
      attempts: s.attempts,
      corrects: s.corrects,
      accuracy: accuracy
    };
  });
  
  // Separate into attempted and unattempted
  const attempted = itemsWithStats.filter(x => x.attempts >= 1);
  const unattempted = itemsWithStats.filter(x => x.attempts === 0);
  
  // Sort attempted by correct rate ascending (worst performing terms first)
  attempted.sort((a, b) => {
    if (a.accuracy !== b.accuracy) {
      return a.accuracy - b.accuracy;
    }
    // tie-breaker: sort by attempts ascending (fewer attempts gets attention) or random
    return 0.5 - Math.random();
  });
  
  // Build candidate pool
  // Take up to twice correct size, say 10
  const worstCount = Math.max(10, count * 2);
  let pool = attempted.slice(0, worstCount);
  
  if (pool.length < worstCount) {
    const shuffledUnattempted = [...unattempted].sort(() => 0.5 - Math.random());
    const needed = worstCount - pool.length;
    pool.push(...shuffledUnattempted.slice(0, needed));
  }
  
  // Select "count" items randomly from this poor/unattempted pool
  const finalPool = pool.sort(() => 0.5 - Math.random());
  const selectedItems = finalPool.slice(0, Math.min(count, finalPool.length)).map(x => x.item);
  
  return generateVocabQuestionsForItems(selectedItems);
}

// --- Quiz Data Structure: 7 Consolidated Genres ---
const genres = [
  {
    id: 'info_unit_base',
    title: '情報の単位と量・基数変換',
    icon: '🔢',
    description: 'ビット、バイト、情報量の計算、2進数・10進数・16進数の基数変換',
    questions: []
  },
  {
    id: '01_02_info_media_solving',
    title: '01・02 情報の特性と問題解決',
    icon: '💡',
    description: '一次・二次・三次情報、情報の特性（残存性・複製性・伝播性、個別性・トレードオフ・目的性）、知識、情報源、クロスチェック、企画・管理手法（ブレスト、KJ法、MECE、ロジックツリー、ガントチャート）',
    questions: []
  },
  {
    id: '03_04_moral_personal',
    title: '03・04 情報モラルと個人情報',
    icon: '👤',
    description: 'モラル、デバイド、フィルターバブル、エコーチェンバー、ネット依存、個人情報、要配慮個人情報、匿名加工情報、保護法、オプトイン・オプトアウト、肖像権、パブリシティ権、ジオタグ、Pマーク',
    questions: []
  },
  {
    id: '05_intellectual_property',
    title: '05 知的財産権',
    icon: '🎨',
    description: '知的財産権（特許・実用新案・意匠・商標）、著作権、無方式・方式主義、著作者、共同著作物、引用、著作者人格権（公表権、氏名表示権、同一性保持権）、パブリックドメイン、CCライセンス',
    questions: []
  },
  {
    id: '06_info_security',
    title: '06 情報セキュリティ',
    icon: '🔒',
    description: '3大要素（機密性・完全性・可用性）、マルウェア、フィッシング・ワンクリック詐欺、スキミング、重要ポリシー（アクセス制御、認証、プライバシーポリシー）、不正アクセス禁止法、ファイアウォール、攻撃（DoS、クラッキング）',
    questions: []
  },
  {
    id: '07_info_tech_dev',
    title: '07 情報技術の発展',
    icon: '📶',
    description: '生活を支えるPOS、IoT、GPS、AI、Society 5.0、クラウド、機械学習、ビッグデータ、決済（電子、QRコード）、EC、仮想・拡張・複合現実（VR、AR、MR）',
    questions: []
  },
  {
    id: '08_09_media_design',
    title: '08・09 メディアと情報デザイン',
    icon: '📞',
    description: 'メディア、活版印刷、情報の抽象化・構造化・可視化、同期・非同期型、マスメディアとSNS、情報デザイン、ピクトグラム、ユニバーサルデザイン、アフォーダンス、シグニファイア、GUI、アクセシビリティ、ユーザビリティ、UX/UI、バリアフリー',
    questions: []
  }
];

// Special Comprehensive Genre Definition
const comprehensiveGenre = {
  id: 'comprehensive',
  title: '総合演習 (全範囲)',
  icon: '🎓',
  description: '全ジャンルからランダムに出題。問題数10問。限界に挑戦！',
  questions: []
};

// Special Weakness Rescue Genre Definition
const weaknessGenre = {
  id: 'weakness_rescue',
  title: '🔥 苦手克服演習',
  icon: '🔥',
  description: '正答率が低い用語からランダムで出題。弱点を自動選定します！',
  questions: []
};

// --- State ---
let currentGenre = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let bonuses = { power: 10, loft: 20, wind: 0 };
let isQuestionsExpanded = false;
let wrongAnswers = [];
let questionStartTime = 0;
let quizStartTime = 0;
let currentShuffledIndices = [];

// Detailed view card toggler state
let currentCardDetailItem = null;
let currentCardDetailIndex = 0;
let selectedCollectionGenre = 'all';

// --- DOM Elements ---
let els = {};

function init() {
  els = {
    menuContainer: document.getElementById('menu-container'),
    quizContainer: document.getElementById('quiz-container'),
    gameContainer: document.getElementById('game-container'),
    collectionModal: document.getElementById('collection-modal'),
    genreGrid: document.getElementById('genre-grid'),
    specialGrid: document.getElementById('special-grid'),
    btnSubmit: document.getElementById('btn-submit'),
    submitModal: document.getElementById('submit-modal'),
    btnCloseSubmit: document.getElementById('btn-close-submit'),
    btnCancelSubmit: document.getElementById('btn-cancel-submit'),
    btnGenerateReport: document.getElementById('btn-generate-report'),
    btnDownloadReport: document.getElementById('btn-download-report'),
    submitUserGrade: document.getElementById('submit-user-grade'),
    submitUserClass: document.getElementById('submit-user-class'),
    submitUserNumber: document.getElementById('submit-user-number'),
    submitUserName: document.getElementById('submit-user-name'),
    reportCanvas: document.getElementById('report-canvas'),
    reportPreviewImg: document.getElementById('report-preview-img'),
    btnCollection: document.getElementById('btn-collection'),
    btnCloseCollection: document.getElementById('btn-close-collection'),
    valGlobalBest: document.getElementById('val-global-best'),
    collectionStats: document.getElementById('collection-stats-container'),
    
    // Card Detail Modal
    cardDetailModal: document.getElementById('card-detail-modal'),
    btnCloseDetail: document.getElementById('btn-close-detail'),
    cardDetailContent: document.getElementById('card-detail-content'),
    
    // Gacha Card
    gachaCard: document.getElementById('gacha-card')
  };

  if (!els.menuContainer || !els.genreGrid) {
    console.error("Initialization failed: Missing DOM elements.");
    return;
  }

  // Set dynamic page title and headers based on central EXAM_CONFIG coordinates
  document.title = `${EXAM_CONFIG.subjectName}　${EXAM_CONFIG.termName}対策`;
  const headerSubject = document.getElementById('header-subject-name');
  const headerTerm = document.getElementById('header-term-name');
  if (headerSubject) headerSubject.innerText = EXAM_CONFIG.subjectName;
  if (headerTerm) headerTerm.innerText = `${EXAM_CONFIG.termName}対策`;
  
  // Setup Controls
  if(els.btnSubmit) els.btnSubmit.onclick = openSubmitModal;
  if(els.btnCloseSubmit) els.btnCloseSubmit.onclick = closeSubmitModal;
  if(els.btnCancelSubmit) els.btnCancelSubmit.onclick = closeSubmitModal;
  if(els.btnGenerateReport) els.btnGenerateReport.onclick = () => generateReportCanvas();
  if(els.btnDownloadReport) els.btnDownloadReport.onclick = downloadReportImage;
  
  if(els.submitUserName) els.submitUserName.oninput = () => generateReportCanvas();
  if(els.submitUserGrade) els.submitUserGrade.oninput = () => generateReportCanvas();
  if(els.submitUserClass) els.submitUserClass.oninput = () => generateReportCanvas();
  if(els.submitUserNumber) els.submitUserNumber.oninput = () => generateReportCanvas();

  if(els.btnCollection) els.btnCollection.onclick = openCollection;
  if(els.btnCloseCollection) els.btnCloseCollection.onclick = closeCollection;
  if(els.btnCloseDetail) els.btnCloseDetail.onclick = closeCardDetail;
  
  // Performance Stats controls
  const btnStatsPage = document.getElementById('btn-stats-page');
  const btnCloseStats = document.getElementById('btn-close-stats');
  const statsSortSelect = document.getElementById('stats-sort-select');
  const btnStatsSubmit = document.getElementById('btn-stats-submit');
  const btnStatsSubmitBottom = document.getElementById('btn-stats-submit-bottom');
  const btnCloseStatsBottom = document.getElementById('btn-close-stats-bottom');
  if (btnStatsPage) btnStatsPage.onclick = openStatsPage;
  if (btnCloseStats) btnCloseStats.onclick = closeStatsPage;
  if (statsSortSelect) statsSortSelect.onchange = renderStatsList;
  if (btnStatsSubmit) btnStatsSubmit.onclick = openSubmitModal;
  if (btnStatsSubmitBottom) btnStatsSubmitBottom.onclick = openSubmitModal;
  if (btnCloseStatsBottom) btnCloseStatsBottom.onclick = closeStatsPage;
  
  // Make stats container clickable
  if(els.collectionStats) {
      els.collectionStats.onclick = openCollection;
  }
  
  // Make Gacha Card clickable for details
  if(els.gachaCard) {
      els.gachaCard.onclick = () => {
          if(els.gachaCard.classList.contains('card-flip')) {
              const item = getLastGachaItem();
              if(item) showCardDetail(item);
          }
      };
  }

  // Initialize game engine
  try {
    initGame();
  } catch(e) {
    console.warn("Game init error:", e);
  }

  // Setup restart callback from app.js
  setRestartCallback(returnToMenu);

  // Setup static/dynamic questions in memory (only once)
  if (!isQuestionsExpanded) {
    expandQuestions();
    isQuestionsExpanded = true;
  }

  // Load stats and render menu
  renderMenu();
}

function expandQuestions() {
  const unitBaseQ = genres.find(g => g.id === 'info_unit_base');
  if(unitBaseQ) {
     unitBaseQ.questions.push(...generateUnitQuestions(12));
     unitBaseQ.questions.push(...generateBaseConvQuestions(12));
  }
}

// --- Menu Logic ---
function getStats(genreId) {
  const key = `golf_stats_${genreId}`;
  const json = localStorage.getItem(key);
  return json ? JSON.parse(json) : { maxCorrect: 0, maxDistance: 0 };
}

function updateGlobalStats() {
  let maxShot = 0;
  genres.forEach(g => {
    const s = getStats(g.id);
    if (s.maxDistance > maxShot) maxShot = s.maxDistance;
  });
  const cs = getStats('comprehensive');
  if(cs.maxDistance > maxShot) maxShot = cs.maxDistance;

  if (els.valGlobalBest) {
    els.valGlobalBest.textContent = maxShot.toFixed(1);
  }
  
  // Update Collection Stats in Menu
  const colStats = getCollectionStats();
  const statsContainer = document.getElementById('collection-stats-container');
  if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="flex flex-col items-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Common</span>
            <span class="font-mono font-bold text-sky-500">${colStats.r1.owned}/${colStats.r1.total}</span>
        </div>
        <div class="w-px h-8 bg-slate-200 mx-2"></div>
        <div class="flex flex-col items-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Rare</span>
            <span class="font-mono font-bold text-amber-500">${colStats.r2.owned}/${colStats.r2.total}</span>
        </div>
        <div class="w-px h-8 bg-slate-200 mx-2"></div>
        <div class="flex flex-col items-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase">UR</span>
            <span class="font-mono font-bold text-purple-500">${colStats.r3.owned}/${colStats.r3.total}</span>
        </div>
      `;
  }
}

function resetProgress() {
  if(!confirm("すべての成績と記録（獲得コレクションカードを含む）をリセットしますか？")) return;
  if(!confirm("本当にリセットしてもよろしいですか？（この操作は取り消せません）")) return;

  genres.forEach(g => {
    localStorage.removeItem(`golf_stats_${g.id}`);
  });
  localStorage.removeItem(`golf_stats_comprehensive`);
  localStorage.removeItem('golf_gacha_collection'); 
  localStorage.removeItem('golf_gacha_history'); 
  
  // Clear any additional state key matches in localStorage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('golf_stats_') || key.startsWith('golf_gacha_'))) {
      localStorage.removeItem(key);
    }
  }

  // Reload the entire window to clear memory states and start fresh
  window.location.reload();
}

function renderMenu() {
  els.menuContainer.classList.remove('hidden');
  els.quizContainer.classList.add('hidden');
  els.gameContainer.classList.add('blur-md');
  
  els.gameContainer.style.zIndex = '0';
  els.menuContainer.style.zIndex = '50';
  
  updateGlobalStats();
  
  const isComplete = checkComplete();
  const badge = document.getElementById('complete-badge');
  if (isComplete) {
      if(badge) badge.classList.remove('hidden');
      els.menuContainer.classList.remove('bg-slate-50');
      els.menuContainer.classList.add('bg-gradient-to-b', 'from-amber-50', 'to-yellow-100');
  } else {
      if(badge) badge.classList.add('hidden');
      els.menuContainer.classList.add('bg-slate-50');
      els.menuContainer.classList.remove('bg-gradient-to-b', 'from-amber-50', 'to-yellow-100');
  }

  if (els.specialGrid) els.specialGrid.innerHTML = '';
  els.genreGrid.innerHTML = '';
  renderWeaknessCard();
  renderGenreCard(comprehensiveGenre, true);
  genres.forEach(genre => renderGenreCard(genre));
}

function renderGenreCard(genre, isComprehensive = false) {
  const stats = getStats(genre.id);
  const totalQ = isComprehensive ? 10 : 5;
  
  const card = document.createElement('div');
  const borderClass = isComprehensive ? 'border-amber-400' : 'border-slate-200';
  const hoverClass = isComprehensive ? 'hover:border-amber-500 hover:shadow-amber-500/20' : 'hover:border-emerald-500 hover:shadow-emerald-500/20';
  
  card.className = `bg-white rounded-2xl p-5 shadow-lg ${borderClass} ${hoverClass} hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-full`;
  card.onclick = () => startQuiz(genre);

  card.innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-4">
        <span class="text-3xl bg-slate-100 p-3 rounded-xl group-hover:scale-110 transition-transform">${genre.icon}</span>
        <div class="text-right">
           <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cleared</div>
           <div class="font-bold text-emerald-600 text-xl leading-none">${stats.maxCorrect} <span class="text-slate-400 text-xs">/ ${totalQ}</span></div>
        </div>
      </div>
      <h3 class="text-lg font-bold text-slate-800 mb-2 leading-tight ${isComprehensive ? 'text-amber-600' : 'group-hover:text-emerald-500'} transition-colors">${genre.title}</h3>
      <p class="text-slate-500 text-xs mb-4 line-clamp-2">${genre.description}</p>
    </div>
    
    <div class="bg-slate-50 rounded-lg p-3 flex justify-between items-center mt-auto border border-slate-100">
      <span class="text-[10px] font-bold text-slate-400 uppercase">Best Record</span>
      <span class="font-mono font-bold text-amber-500 text-md">${stats.maxDistance.toFixed(1)}m</span>
    </div>
  `;
  if (isComprehensive && els.specialGrid) {
    els.specialGrid.appendChild(card);
  } else {
    els.genreGrid.appendChild(card);
  }
}

function renderWeaknessCard() {
  const stats = getStats('weakness_rescue');
  
  const card = document.createElement('div');
  const borderClass = 'border-rose-300 bg-rose-50/10';
  const hoverClass = 'hover:border-rose-400 hover:shadow-rose-400/20';
  
  card.className = `bg-white rounded-2xl p-5 shadow-lg border-2 ${borderClass} ${hoverClass} hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-full`;
  card.onclick = () => startQuiz(weaknessGenre);

  card.innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-4">
        <span class="text-3xl bg-rose-100 p-3 rounded-xl group-hover:scale-110 transition-transform">🔥</span>
        <div class="text-right">
           <div class="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Cleared</div>
           <div class="font-bold text-rose-600 text-xl leading-none">${stats.maxCorrect} <span class="text-slate-400 text-xs">/ 5</span></div>
        </div>
      </div>
      <h3 class="text-lg font-bold text-rose-600 mb-2 leading-tight transition-colors">苦手克服演習</h3>
      <p class="text-slate-500 text-xs mb-4 line-clamp-2">正答率が低い用語から優先的に出題します。弱点を自動判別し、確実な知識定着へ導きます。</p>
    </div>
    
    <div class="bg-rose-50 rounded-lg p-3 flex justify-between items-center mt-auto border border-rose-100/50">
      <span class="text-[10px] font-bold text-rose-400 uppercase">Best Record</span>
      <span class="font-mono font-bold text-amber-500 text-md">${stats.maxDistance.toFixed(1)}m</span>
    </div>
  `;
  if (els.specialGrid) {
    els.specialGrid.appendChild(card);
  } else {
    els.genreGrid.appendChild(card);
  }
}

function returnToMenu() {
  if (nextButtonTimer) {
     clearInterval(nextButtonTimer);
     nextButtonTimer = null;
  }
  document.getElementById('msg-finished').classList.add('hidden');
  renderMenu();
}

// --- Collection Modal Logic ---
function openCollection() {
  selectedCollectionGenre = 'all';
  renderCollectionFilters();
  renderCollectionItems();
  els.collectionModal.classList.remove('hidden');
}

function renderCollectionFilters() {
  const filtersDiv = document.getElementById('collection-filters');
  if(!filtersDiv) return;

  // Build the list of categories including overall option
  const list = [
    { id: 'all', title: '全体カード一覧', icon: '📖' },
    ...genres.map(g => ({ id: g.id, title: g.title, icon: g.icon }))
  ];

  filtersDiv.innerHTML = list.map(f => {
    const isActive = selectedCollectionGenre === f.id;
    const activeClass = isActive 
      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md font-bold' 
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-transparent hover:text-slate-900';
    return `
      <button onclick="window.setCollectionFilter('${f.id}')" class="px-4 py-2 shrink-0 rounded-full border text-xs transition-all flex items-center gap-1.5 cursor-pointer select-none ${activeClass}">
        <span>${f.icon}</span>
        <span>${f.title}</span>
      </button>
    `;
  }).join('');
}

function renderCollectionItems() {
  const collection = getCollection();
  const grid = document.getElementById('collection-grid');
  if(!grid) return;
  grid.innerHTML = '';

  let filtered = ITEM_LIST;
  if (selectedCollectionGenre !== 'all') {
    filtered = ITEM_LIST.filter(item => item.genre_id === selectedCollectionGenre);
  }

  let ownedCount = 0;
  let totalCount = filtered.length;

  filtered.forEach(item => {
    const isOwned = !!collection[item.id];
    if(isOwned) ownedCount++;
    
    const div = document.createElement('div');
    let borderClass = 'border-slate-200 bg-white';
    if (isOwned) {
       if (item.rarity === 3) borderClass = 'border-purple-400 bg-purple-50';
       if (item.rarity === 2) borderClass = 'border-amber-400 bg-amber-50';
       if (item.rarity === 1) borderClass = 'border-sky-400 bg-sky-50';
    }

    const displayName = isOwned ? item.name : (item.name.charAt(0) + '***');

    div.className = `aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-3 text-center transition-all ${borderClass} ${isOwned ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'opacity-50 grayscale'}`;
    
    if (isOwned) {
        div.onclick = () => showCardDetail(item);
    }
    
    div.innerHTML = `
      <div class="text-3xl mb-1">${isOwned ? item.icon : '🔒'}</div>
      <div class="text-[11px] font-black leading-tight ${isOwned ? 'text-slate-800' : 'text-slate-400'}">${displayName}</div>
      ${isOwned && collection[item.id] > 1 ? `<div class="mt-1.5 text-[10px] bg-black/10 px-1.5 py-0.5 rounded-full font-bold">x${collection[item.id]}</div>` : ''}
    `;
    grid.appendChild(div);
  });

  // Calculate global total count owned
  const overallOwnedCount = Object.keys(collection).length;
  
  if (selectedCollectionGenre === 'all') {
    document.getElementById('col-count').textContent = `${overallOwnedCount}/${ITEM_LIST.length}`;
  } else {
    document.getElementById('col-count').textContent = `${overallOwnedCount}/${ITEM_LIST.length} (単元内: ${ownedCount}/${totalCount})`;
  }
}

// Attach filter change method to window
window.setCollectionFilter = (genreId) => {
  selectedCollectionGenre = genreId;
  renderCollectionFilters();
  renderCollectionItems();
};

function closeCollection() {
  els.collectionModal.classList.add('hidden');
}

// --- Performance Stats Page Logic ---
let selectedStatsGenre = 'all';

function openStatsPage() {
  selectedStatsGenre = 'all';
  const sortSelect = document.getElementById('stats-sort-select');
  if (sortSelect) sortSelect.value = 'id_asc';
  
  renderStatsFilters();
  renderStatsList();
  document.getElementById('stats-modal').classList.remove('hidden');
}

function closeStatsPage() {
  document.getElementById('stats-modal').classList.add('hidden');
}

window.setStatsFilter = (genreId) => {
  selectedStatsGenre = genreId;
  renderStatsFilters();
  renderStatsList();
};

function renderStatsFilters() {
  const filtersDiv = document.getElementById('stats-filters');
  if (!filtersDiv) return;

  const list = [
    { id: 'all', title: '全カテゴリ', icon: '📖' },
    ...genres.map(g => ({ id: g.id, title: g.title, icon: g.icon }))
  ];

  filtersDiv.innerHTML = list.map(f => {
    const isActive = selectedStatsGenre === f.id;
    const activeClass = isActive 
      ? 'bg-rose-500 text-white border-rose-500 shadow-md font-bold' 
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-transparent hover:text-slate-900';
    return `
      <button onclick="window.setStatsFilter('${f.id}')" class="px-3.5 py-1.5 shrink-0 rounded-full border text-xs transition-all flex items-center gap-1.5 cursor-pointer select-none ${activeClass}">
        <span>${f.icon}</span>
        <span>${f.title}</span>
      </button>
    `;
  }).join('');
}

function renderStatsList() {
  const statsListDiv = document.getElementById('stats-list');
  if (!statsListDiv) return;
  statsListDiv.innerHTML = '';

  const stored = localStorage.getItem('golf_vocab_stats');
  const stats = stored ? JSON.parse(stored) : {};

  // Map each item in ITEM_LIST to have its computed correctness rate & stats
  let terms = ITEM_LIST.map(item => {
    const s = stats[item.id] || { attempts: 0, corrects: 0 };
    const accuracy = s.attempts > 0 ? (s.corrects / s.attempts) : null;
    return {
      item,
      attempts: s.attempts,
      corrects: s.corrects,
      accuracy: accuracy
    };
  });

  // Filter by category/genre
  if (selectedStatsGenre !== 'all') {
    terms = terms.filter(t => t.item.genre_id === selectedStatsGenre);
  }

  // Sort by option
  const sortOption = document.getElementById('stats-sort-select')?.value || 'id_asc';
  terms.sort((a, b) => {
    if (sortOption === 'id_asc') {
      return a.item.id - b.item.id;
    } else if (sortOption === 'attempts_desc') {
      return b.attempts - a.attempts;
    } else if (sortOption === 'accuracy_asc') {
      // Prioritize attempted ones before unattempted
      const aVal = a.accuracy === null ? 2.0 : a.accuracy;
      const bVal = b.accuracy === null ? 2.0 : b.accuracy;
      if (aVal !== bVal) return aVal - bVal;
      // tie breaker is ID asc
      return a.item.id - b.item.id;
    } else if (sortOption === 'accuracy_desc') {
      const aVal = a.accuracy === null ? -1.0 : a.accuracy;
      const bVal = b.accuracy === null ? -1.0 : b.accuracy;
      if (aVal !== bVal) return bVal - aVal;
      // tie breaker is ID asc
      return a.item.id - b.item.id;
    }
    return 0;
  });

  if (terms.length === 0) {
    statsListDiv.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-xs font-semibold">
        対象の用語が見つかりません。
      </div>
    `;
    return;
  }

  statsListDiv.innerHTML = terms.map(t => {
    const item = t.item;
    const attempts = t.attempts;
    const corrects = t.corrects;
    const accuracy = t.accuracy;

    let pctText = '-';
    let colorClass = 'text-slate-400 font-bold';
    let progressBarHtml = '';

    if (attempts > 0) {
      const pctVal = Math.round(accuracy * 100);
      pctText = `${pctVal}%`;
      
      let barColor = 'bg-rose-500';
      if (accuracy >= 0.8) {
        barColor = 'bg-emerald-500';
        colorClass = 'text-emerald-600 font-black';
      } else if (accuracy >= 0.4) {
        barColor = 'bg-indigo-500';
        colorClass = 'text-indigo-600 font-bold';
      } else {
        colorClass = 'text-rose-500 font-black';
      }

      progressBarHtml = `
        <div class="w-12 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shrink-0">
          <div class="${barColor} h-full" style="width: ${pctVal}%"></div>
        </div>
      `;
    }

    return `
      <div class="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:grid md:grid-cols-12 md:gap-2 items-center hover:border-slate-300 hover:bg-slate-50/50 transition-all">
         <div class="md:col-span-1 text-center text-xs font-mono font-bold text-slate-400 mb-1 md:mb-0 w-full md:w-auto flex md:justify-center justify-between">
            <span class="md:hidden font-bold text-[10px] text-slate-400 uppercase tracking-wider">No</span>
            <span>#${item.id}</span>
         </div>
         <div class="md:col-span-2 flex items-center gap-2 mb-2 md:mb-0 w-full md:w-auto">
            <span class="text-lg shrink-0">${item.icon}</span>
            <span class="font-bold text-slate-800 text-xs md:text-sm line-clamp-1">${item.name}</span>
         </div>
         <!-- Use only the first explanation, no flavour texts, explicitly matching the prompt -->
         <div class="md:col-span-5 text-[11px] text-slate-500 line-clamp-2 md:line-clamp-none mb-2 md:mb-0 w-full leading-relaxed bg-slate-50/50 md:bg-transparent p-2 md:p-0 rounded-lg">
            ${item.explanations[0]}
         </div>
         <div class="md:col-span-2 flex md:flex-col justify-between items-center md:justify-center text-xs text-slate-600 mb-1 md:mb-0 w-full md:w-auto">
            <span class="md:hidden font-bold text-slate-400 uppercase tracking-wider text-[10px]">出題状況</span>
            <span class="font-mono font-semibold">${corrects} / ${attempts} 回</span>
         </div>
         <div class="md:col-span-2 flex md:flex-row md:justify-center items-center justify-between text-xs w-full md:w-auto gap-2">
            <span class="md:hidden font-bold text-slate-400 uppercase tracking-wider text-[10px]">正答率</span>
            <div class="flex items-center gap-1.5 justify-end">
               <span class="font-mono font-bold ${colorClass} text-sm">${pctText}</span>
               ${progressBarHtml}
            </div>
         </div>
      </div>
    `;
  }).join('');
}

// --- Card Detail Modal Logic ---
function showCardDetail(item) {
    if(!item) return;
    currentCardDetailItem = item;
    currentCardDetailIndex = 0;
    renderCardDetail();
}

function renderCardDetail() {
    const item = currentCardDetailItem;
    if(!item) return;
    
    const collection = getCollection();
    const isOwned = !!collection[item.id];
    
    const modalBox = els.cardDetailModal.firstElementChild;
    modalBox.classList.remove('border-sky-400', 'border-amber-400', 'border-purple-400');
    if (item.rarity === 1) modalBox.classList.add('border-sky-400');
    if (item.rarity === 2) modalBox.classList.add('border-amber-400');
    if (item.rarity === 3) modalBox.classList.add('border-purple-400');

    const rarityLabel = item.rarity === 3 ? 'ULTRA RARE' : (item.rarity === 2 ? 'RARE' : 'COMMON');
    const rarityColor = item.rarity === 3 ? 'text-purple-500' : (item.rarity === 2 ? 'text-amber-500' : 'text-sky-500');

    // Tab buttons for switching 3 explanations/flavors (only if owned)
    let tabsHtml = '';
    const ownedCount = isOwned ? (collection[item.id] || 0) : 0;
    
    // Safety check: reset index if the saved index is locked for this item
    if (currentCardDetailIndex > 0 && ownedCount < (currentCardDetailIndex + 1)) {
        currentCardDetailIndex = 0;
    }

    if (isOwned) {
        tabsHtml = `
          <div class="flex flex-col gap-1 mb-4 shrink-0">
            <div class="flex justify-center gap-1.5">
               ${[0, 1, 2].map(idx => {
                 const isUnlocked = ownedCount >= (idx + 1);
                 if (isUnlocked) {
                   return `
                     <button onclick="window.setCardDetailIndex(${idx})" class="px-3 py-1.5 text-[11px] font-extrabold rounded-full border transition-all cursor-pointer ${currentCardDetailIndex === idx ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}">
                       Ver. ${idx + 1}
                     </button>
                   `;
                 } else {
                   return `
                     <button disabled title="同じカードを複数獲得すると解放されます" class="px-3 py-1.5 text-[11px] font-extrabold rounded-full border bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed select-none flex items-center justify-center gap-0.5">
                       <span>Ver. ${idx + 1}</span>
                       <span class="text-[9px] opacity-75">🔒</span>
                     </button>
                   `;
                 }
               }).join('')}
            </div>

          </div>
        `;
    }

    const currentDesc = isOwned ? item.explanations[currentCardDetailIndex] : item.explanations[0];
    const currentFlavor = isOwned ? item.flavors[currentCardDetailIndex] : item.flavors[0];

    els.cardDetailContent.innerHTML = `
         <div class="w-full h-32 bg-slate-50 flex items-center justify-center text-6xl mb-3 relative overflow-hidden shrink-0">
             <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
             <span class="relative z-10 drop-shadow-xl animate-bounce">${item.icon}</span>
         </div>
         <div class="p-6 pt-0 w-full flex flex-col overflow-y-auto max-h-[50vh]">
           <h3 class="text-xl font-black text-slate-800 mb-1 leading-tight">${item.name}</h3>
           <div class="text-[10px] font-black uppercase tracking-widest ${rarityColor} mb-3 border-b pb-1 flex justify-between">
              <span>${rarityLabel}</span>
              ${isOwned ? `<span class="text-slate-400">所有数: x${collection[item.id]}</span>` : `<span class="text-rose-400">未獲得 (ロック)</span>`}
           </div>
           
           ${tabsHtml}
           
           <div class="text-left bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm flex-grow space-y-4">
              <div>
                 <p class="text-slate-800 text-base md:text-lg leading-relaxed whitespace-pre-line font-bold">
                   ${isOwned ? currentDesc : (item.name.charAt(0) + '*** に隠された重要用語です。クイズをクリアして獲得しましょう！')}
                 </p>
              </div>
              <div class="pt-1">
                 <p class="text-slate-500 text-[11.5px] md:text-xs leading-relaxed whitespace-pre-line italic font-sans font-normal antialiased">
                   ${isOwned ? currentFlavor : '（未獲得のため、コラムを読むことはできません）'}
                 </p>
              </div>
           </div>
         </div>
    `;
    
    els.cardDetailModal.classList.remove('hidden');
}

function closeCardDetail() {
    els.cardDetailModal.classList.add('hidden');
}

// Make accessible to onclick attributes in modal HTML
window.setCardDetailIndex = (index) => {
    currentCardDetailIndex = index;
    renderCardDetail();
};


// --- Quiz Logic ---
function startQuiz(genre) {
  currentGenre = genre;
  wrongAnswers = [];
  
  if (nextButtonTimer) {
     clearInterval(nextButtonTimer);
     nextButtonTimer = null;
  }
  
  if (genre.id === 'comprehensive') {
    let allQuestions = [];
    
    // Add some base math/base conversion questions
    const poolMath = [
        ...generateUnitQuestions(6),
        ...generateBaseConvQuestions(6)
    ];
    allQuestions.push(...poolMath);
    
    // Add dynamic vocabulary questions across all other 9 genres (2 questions from each to populate comprehensively)
    genres.forEach(g => {
        if(g.id !== 'info_unit_base') {
            allQuestions.push(...generateVocabularyQuestions(g.id, 2));
        }
    });
    
    // Shuffle and pick 10 questions total for Comprehensive
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, 10);
  } else if (genre.id === 'weakness_rescue') {
    currentQuestions = generateWeaknessQuestions(5);
  } else {
    if (genre.id === 'info_unit_base') {
        const poolMath = [
             ...generateUnitQuestions(4),
             ...generateBaseConvQuestions(4)
        ];
        currentQuestions = poolMath.sort(() => 0.5 - Math.random()).slice(0, 5);
    } else {
        // Dynamic procedural vocab questions (5 questions)
        currentQuestions = generateVocabularyQuestions(genre.id, 5);
    }
  }
  
  // Ensure vocab questions in the finalized currentQuestions set are strictly alternating between Type A and Type B
  let vocabCount = 0;
  const startMode = Math.random() < 0.5;
  currentQuestions = currentQuestions.map(q => {
    if (q.item_id !== undefined) {
      const targetItem = ITEM_LIST.find(item => item.id === q.item_id);
      if (targetItem) {
        const type = (startMode ? (vocabCount % 2 === 0) : (vocabCount % 2 !== 0)) ? 'word_to_explanation' : 'explanation_to_word';
        vocabCount++;
        return makeVocabQuestion(targetItem, type);
      }
    }
    return q;
  });
  
  currentQuestionIndex = 0;
  score = 0;
  bonuses = { power: 10, loft: 20, wind: 0 }; 
  quizStartTime = Date.now(); 

  els.menuContainer.classList.add('hidden');
  els.quizContainer.classList.remove('hidden');
  
  renderQuizStructure();
  renderQuestion();
  updateQuizStatsDisplay(); 
}

function renderQuizStructure() {
  const isComp = currentGenre.id === 'comprehensive';
  const headerGradient = isComp ? 'from-amber-500 to-orange-500' : 'from-emerald-600 to-teal-600';

  els.quizContainer.innerHTML = `
    <div id="quiz-card" class="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden fade-in mx-4 transition-colors duration-300 flex flex-col max-h-[92vh]">
      <div class="bg-gradient-to-r ${headerGradient} p-3.5 text-white text-center shadow shadow-slate-100 relative shrink-0">
        <button id="btn-quit-quiz" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white font-black text-xs bg-black/20 px-3 py-1.5 rounded-full hover:bg-black/30 transition cursor-pointer">✕ MENU</button>
        <h1 class="text-xs sm:text-sm font-black tracking-tight truncate px-20">${currentGenre.title}</h1>
        <div class="flex justify-between items-center text-white/90 text-[10px] font-bold uppercase tracking-widest mt-1 px-4">
            <span>Q <span id="q-idx">1</span>/${currentQuestions.length}</span>
            <span>Score <span id="val-quiz-score">0</span></span>
        </div>
      </div>

      <div class="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/80 shrink-0">
        <div class="py-2 text-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase block tracking-wider leading-none mb-0.5">Power</span>
            <span id="q-stat-power" class="font-mono font-bold text-base text-emerald-600">10</span>
        </div>
        <div class="py-2 text-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase block tracking-wider leading-none mb-0.5">Angle</span>
            <span id="q-stat-loft" class="font-mono font-bold text-base text-emerald-600">20°</span>
        </div>
        <div class="py-2 text-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase block tracking-wider leading-none mb-0.5">Assist</span>
            <span id="q-stat-wind" class="font-mono font-bold text-base text-emerald-600">0</span>
        </div>
      </div>
      
      <div class="p-4 md:p-6 overflow-y-auto flex-grow flex flex-col justify-start">
        <div class="w-full bg-slate-100 rounded-full h-1.5 mb-4 shrink-0">
          <div id="quiz-progress" class="${isComp ? 'bg-amber-500' : 'bg-emerald-500'} h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
        
        <div id="question-area" class="flex-grow flex flex-col justify-center">
          <div class="text-[11px] font-bold text-emerald-600 tracking-wider text-center uppercase mb-2">
             次の説明文や問いに最も当てはまる用語を選択してください。
          </div>
          <h2 id="question-text" class="text-sm sm:text-base md:text-lg font-bold text-slate-800 mb-4 text-center min-h-[3.5rem] px-3.5 flex items-center justify-center whitespace-pre-wrap leading-relaxed bg-slate-50/50 rounded-xl py-3 border border-slate-100 shadow-inner"></h2>
          <div id="options-grid" class="grid grid-cols-1 gap-2 mb-2"></div>
        </div>
        
        <div id="result-area" class="hidden text-center space-y-4 pb-1 flex-grow flex flex-col justify-center">
          <div class="text-3xl animate-bounce">🎊</div>
          <h2 class="text-lg font-bold text-slate-800 tracking-tight leading-none">Stage Clear!</h2>
          <p class="text-slate-500 text-xs leading-none">Score: <span id="val-result-score" class="font-bold ${isComp ? 'text-amber-500' : 'text-emerald-600'} text-base">${score}</span> / ${currentQuestions.length}</p>
          
          <div id="review-list-container" class="shrink-0"></div>

          <div class="bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-600 space-y-1.5 border border-slate-150 shadow-inner shrink-0">
            <p class="font-bold text-center mb-1.5 text-xs text-slate-800">獲得ボーナスパラメータ</p>
            <div class="flex justify-between items-center border-b border-slate-200/50 pb-1">
              <span>⚡ Power Module</span> <span id="bonus-power" class="font-black text-base text-emerald-600">+0</span>
            </div>
            <div class="flex justify-between items-center border-b border-slate-200/50 pb-1">
              <span>📐 Angle Gear</span> <span id="bonus-loft" class="font-black text-base text-emerald-600">+0°</span>
            </div>
            <div class="flex justify-between items-center pb-0.5">
              <span>💨 Assist Fan</span> <span id="bonus-wind" class="font-black text-base text-emerald-600">+0</span>
            </div>
          </div>

          <button id="btn-start-game" class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm shadow hover:scale-[1.01] hover:shadow-lg transition-all border border-emerald-500/20 shrink-0 cursor-pointer">
            PLAY BONUS GAME 🤖
          </button>
        </div>
      </div>

      <!-- Feedback Area as a Sticky Fixed Footer to prevent scrolling next button -->
      <div id="feedback-area" class="hidden text-center p-4 bg-slate-50 border-t border-slate-100 shrink-0">
        <p id="feedback-text" class="text-xs md:text-sm font-bold mb-3"></p>
        <button id="btn-next-question" class="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white rounded-xl font-bold transition shadow border border-transparent text-sm cursor-pointer">Next</button>
      </div>

    </div>
  `;
  
  document.getElementById('btn-next-question').onclick = nextQuestion;
  document.getElementById('btn-start-game').onclick = transitionToGame;
  document.getElementById('btn-quit-quiz').onclick = returnToMenu;
}

function updateQuizStatsDisplay() {
    const elP = document.getElementById('q-stat-power');
    const elL = document.getElementById('q-stat-loft');
    const elW = document.getElementById('q-stat-wind');
    
    if(elP) elP.textContent = bonuses.power;
    if(elL) elL.textContent = bonuses.loft + '°';
    if(elW) elW.textContent = bonuses.wind;
}

function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  
  const card = document.getElementById('quiz-card');
  if (card) {
     card.classList.remove('bg-emerald-50', 'border-emerald-400', 'bg-rose-50', 'border-rose-400');
     card.classList.add('bg-white', 'border-slate-200');
  }

  questionStartTime = Date.now();

  document.getElementById('q-idx').textContent = currentQuestionIndex + 1;
  document.getElementById('question-text').textContent = q.q;
  
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  
  const pct = (currentQuestionIndex / currentQuestions.length) * 100;
  document.getElementById('quiz-progress').style.width = `${pct}%`;

  currentShuffledIndices = Array.from({length: q.options.length}, (_, i) => i);
  for (let i = currentShuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentShuffledIndices[i], currentShuffledIndices[j]] = [currentShuffledIndices[j], currentShuffledIndices[i]];
  }

  currentShuffledIndices.forEach((originalIndex, visualIndex) => {
    const btn = document.createElement('button');
    btn.className = `quiz-option w-full py-3.5 px-4 text-left border-2 border-slate-200 rounded-2xl font-bold text-sm sm:text-base text-slate-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/20 bg-white transition-all shadow-md active:scale-98 min-h-[50px] cursor-pointer flex items-center justify-start`;
    btn.textContent = q.options[originalIndex];
    btn.onclick = () => handleAnswer(visualIndex);
    grid.appendChild(btn);
  });
}

function handleAnswer(visualIndex) {
  const q = currentQuestions[currentQuestionIndex];
  const originalIndex = currentShuffledIndices[visualIndex];
  const isCorrect = originalIndex === q.a;
  
  // Record vocabulary statistics if this is a vocabulary question
  if (q.item_id) {
    recordVocabStat(q.item_id, isCorrect);
  }
  
  const options = document.getElementById('options-grid').children;

  for (let btn of options) {
    btn.disabled = true;
    btn.classList.add('cursor-not-allowed', 'opacity-60');
  }

  const feedbackText = document.getElementById('feedback-text');
  const card = document.getElementById('quiz-card');
  const btnNext = document.getElementById('btn-next-question');
  
  if (isCorrect) {
    card.classList.remove('bg-white', 'border-slate-200');
    card.classList.add('bg-emerald-50', 'border-emerald-400');

    options[visualIndex].classList.add('correct');
    options[visualIndex].classList.remove('opacity-60');
    score++;
    
    const scoreEl = document.getElementById('val-quiz-score');
    if(scoreEl) scoreEl.textContent = score;

    // Point distribution (Doubled for regular 5-question genres, normal for 10-question comprehensive)
    const isComp = currentGenre.id === 'comprehensive';
    let totalPoints = isComp ? 6 : 12;
    
    const elapsedSeconds = (Date.now() - questionStartTime) / 1000;
    if (elapsedSeconds <= 5) {
      totalPoints += isComp ? 1 : 2;
    }
    
    const dist = distributePoints(totalPoints);
    bonuses.power += dist.power;
    bonuses.loft += dist.loft;
    bonuses.wind += dist.wind;
    
    updateQuizStatsDisplay();
    
    let bStr = [];
    if (dist.power > 0) bStr.push(`Power +${dist.power}`);
    if (dist.loft > 0) bStr.push(`Angle +${dist.loft}°`);
    if (dist.wind > 0) bStr.push(`Assist +${dist.wind}`);

    feedbackText.innerHTML = `
      <span class="text-emerald-600 block text-xs font-black mb-0.5">Correct! (正解)</span>
      <span class="text-amber-500 text-[10px] font-bold font-mono">✨ ${bStr.join(' ')}</span>
    `;

    // Normal Next button behavior, instantly active
    btnNext.disabled = false;
    btnNext.textContent = "Next ➔";
    btnNext.classList.remove('opacity-50', 'cursor-not-allowed');

  } else {
    card.classList.remove('bg-white', 'border-slate-200');
    card.classList.add('bg-rose-50', 'border-rose-400');

    options[visualIndex].classList.add('wrong');
    
    const correctVisualIndex = currentShuffledIndices.indexOf(q.a);
    if (correctVisualIndex !== -1) {
        options[correctVisualIndex].classList.add('correct');
        options[correctVisualIndex].classList.remove('opacity-60');
    }
    
    feedbackText.innerHTML = `
        <span class="text-rose-500 block text-xs font-black mb-0.5">Incorrect... (不正解)</span>
        <span class="text-[9px] text-slate-500 block">正解: <strong class="text-emerald-600">${q.options[q.a]}</strong></span>
    `;
    
    // Disable Next Button for 5 seconds countdown on mistaking
    btnNext.disabled = true;
    btnNext.classList.add('opacity-50', 'cursor-not-allowed');
    
    let secondsLeft = 5;
    btnNext.textContent = `Next (${secondsLeft}s)`;
    
    if (nextButtonTimer) clearInterval(nextButtonTimer);
    nextButtonTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(nextButtonTimer);
        nextButtonTimer = null;
        btnNext.disabled = false;
        btnNext.textContent = "Next ➔";
        btnNext.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        btnNext.textContent = `Next (${secondsLeft}s)`;
      }
    }, 1000);
    
    wrongAnswers.push({
      q: q.q,
      correct: q.options[q.a],
      selected: q.options[originalIndex]
    });
  }

  const fbArea = document.getElementById('feedback-area');
  fbArea.classList.remove('hidden');
  fbArea.classList.add('fade-in');
}

function distributePoints(points) {
  const stats = ['power', 'loft', 'wind'];
  let dist = { power: 0, loft: 0, wind: 0 };
  for (let i = 0; i < points; i++) {
    dist[stats[Math.floor(Math.random() * 3)]]++;
  }
  return dist;
}

function nextQuestion() {
  if (nextButtonTimer) {
     clearInterval(nextButtonTimer);
     nextButtonTimer = null;
  }

  currentQuestionIndex++;
  document.getElementById('feedback-area').classList.add('hidden');
  
  if (currentQuestionIndex < currentQuestions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  if (nextButtonTimer) {
     clearInterval(nextButtonTimer);
     nextButtonTimer = null;
  }

  document.getElementById('question-area').classList.add('hidden');
  const resArea = document.getElementById('result-area');
  resArea.classList.remove('hidden');
  resArea.classList.add('fade-in');
  document.getElementById('quiz-progress').style.width = '100%';

  const scoreEl = document.getElementById('val-result-score');
  if (scoreEl) scoreEl.textContent = score;

  document.getElementById('bonus-power').textContent = `Lv. ${bonuses.power}`;
  document.getElementById('bonus-loft').textContent = `Lv. ${bonuses.loft}`;
  document.getElementById('bonus-wind').textContent = `Lv. ${bonuses.wind}`;

  const container = document.getElementById('review-list-container');
  if (wrongAnswers.length > 0) {
      container.innerHTML = `
        <div class="mt-2 bg-rose-50 p-3 rounded-xl border border-rose-100 text-left">
          <h3 class="font-bold text-rose-600 mb-1.5 text-xs uppercase flex items-center gap-1 text-xs md:text-sm"><span>⚠️</span> 復習ポイント</h3>
          <div class="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-xs custom-scrollbar">
            ${wrongAnswers.map(w => `
              <div class="border-b border-rose-100/50 pb-1.5 last:border-0 last:pb-0">
                <p class="font-bold text-slate-700 mb-0.5 leading-snug">${w.q}</p>
                <div class="flex justify-between items-center bg-white/70 px-2 py-1 rounded border border-rose-50">
                   <span class="text-rose-500 line-through opacity-70 truncate max-w-[45%]">${w.selected}</span>
                   <span class="text-emerald-600 font-bold truncate max-w-[45%]">👉 ${w.correct}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
  } else {
      container.innerHTML = '';
  }

  // Save Quiz High Score (Correct count) immediately
  const stats = getStats(currentGenre.id);
  if (score > stats.maxCorrect) {
    stats.maxCorrect = score;
    localStorage.setItem(`golf_stats_${currentGenre.id}`, JSON.stringify(stats));
  }
}

function transitionToGame() {
  if (nextButtonTimer) {
     clearInterval(nextButtonTimer);
     nextButtonTimer = null;
  }

  resetGame();

  const quizDuration = (Date.now() - quizStartTime) / 1000;
  const totalLimit = currentQuestions.length;
  const isSpam = (quizDuration < totalLimit * 1.5) && (score <= (totalLimit / 2));

  updateParams({
    power: bonuses.power,
    loft: bonuses.loft,
    wind: bonuses.wind
  }, currentGenre.id, score, isSpam, totalLimit);

  els.quizContainer.classList.add('hidden');
  els.menuContainer.classList.add('hidden'); 
  els.gameContainer.classList.remove('blur-md');
  els.gameContainer.style.zIndex = '10';

  setTimeout(() => {
    launchBall();
  }, 600);
}

// --- Submit Report Preview & Download (Canvas Generator with Web Stamp) ---
function openSubmitModal() {
  if (els.submitModal) {
    els.submitModal.classList.remove('hidden');
    
    // Retrieve previous saved profile if exists
    const savedGrade = localStorage.getItem('golf_submit_user_grade') || "";
    const savedClass = localStorage.getItem('golf_submit_user_class') || "";
    const savedNumber = localStorage.getItem('golf_submit_user_number') || "";
    const savedName = localStorage.getItem('golf_submit_user_name') || "";
    
    if (els.submitUserGrade) els.submitUserGrade.value = savedGrade;
    if (els.submitUserClass) els.submitUserClass.value = savedClass;
    if (els.submitUserNumber) els.submitUserNumber.value = savedNumber;
    if (els.submitUserName) els.submitUserName.value = savedName;
    
    generateReportCanvas();
  }
}

function closeSubmitModal() {
  if (els.submitModal) {
    els.submitModal.classList.add('hidden');
  }
}

function generateReportCanvas() {
  const canvas = els.reportCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const grade = els.submitUserGrade ? els.submitUserGrade.value.trim() : "";
  const className = els.submitUserClass ? els.submitUserClass.value.trim() : "";
  const number = els.submitUserNumber ? els.submitUserNumber.value.trim() : "";
  const name = els.submitUserName ? els.submitUserName.value.trim() : "";

  // Save profile information dynamically to localStorage
  localStorage.setItem('golf_submit_user_grade', grade);
  localStorage.setItem('golf_submit_user_class', className);
  localStorage.setItem('golf_submit_user_number', number);
  localStorage.setItem('golf_submit_user_name', name);

  // Validate inputs
  const isValid = grade !== "" && className !== "" && number !== "" && name !== "";
  if (els.btnDownloadReport) {
    if (isValid) {
      els.btnDownloadReport.disabled = false;
      els.btnDownloadReport.className = "px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg shadow-md hover:from-emerald-600 hover:to-teal-600 text-xs flex items-center gap-1.5 cursor-pointer opacity-100 transition-all";
    } else {
      els.btnDownloadReport.disabled = true;
      els.btnDownloadReport.className = "px-6 py-2 bg-slate-300 text-slate-500 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-not-allowed opacity-60 pointer-events-none transition-all";
    }
  }
  const warningLabel = document.getElementById('submit-warning-msg');
  if (warningLabel) {
    if (isValid) {
      warningLabel.classList.add('hidden');
    } else {
      warningLabel.classList.remove('hidden');
    }
  }

  // Clear Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Background Fill color
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Beautiful frame borders
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  // 3. Diagonal low-opacity watermarked background pattern
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px "Helvetica Neue", sans-serif';
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 6); // -30 Deg Rotation
  const watermarkText = `${EXAM_CONFIG.subjectName} ${EXAM_CONFIG.termName} ${EXAM_CONFIG.reportSubtitleSuffix}`;
  for (let x = -canvas.width * 1.5; x <= canvas.width * 1.5; x += 440) {
    for (let y = -canvas.height * 1.5; y <= canvas.height * 1.5; y += 180) {
      ctx.fillText(watermarkText, x, y);
    }
  }
  ctx.restore();

  // 4. Header title of certificate
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px "Georgia", "MS Gothic", sans-serif';
  const reportFullTitle = `「${EXAM_CONFIG.subjectName}」 ${EXAM_CONFIG.termName}${EXAM_CONFIG.reportTitleSuffix}`;
  ctx.fillText(reportFullTitle, canvas.width / 2, 85);

  // Decorative thin header separator
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 115);
  ctx.lineTo(canvas.width - 50, 115);
  ctx.stroke();

  // 5. Output date info (top-right align)
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  const dateStr = `出力日時: ${d.getFullYear()}年${pad(d.getMonth()+1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  ctx.fillStyle = '#6B7280';
  ctx.font = '12px Courier, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, canvas.width - 50, 138);

  // 6. Student Profile Identity Row (Balanced Left-Right aligning)
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText("提出者所属:", 50, 175);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#374151';
  ctx.fillText(`第 ${grade || ' ＿ '} 学年   ${className || ' ＿ '} 組   ${number || ' ＿ '} 番`, 145, 175);

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText("氏名:", 450, 175);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#1D4ED8'; // elegant highlight blue
  ctx.fillText(name || "（ここに氏名を入力してください）", 500, 175);

  // Underlines for input indicators
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Underline for Grade/Class/Number
  ctx.moveTo(140, 182);
  ctx.lineTo(410, 182);
  // Underline for Name
  ctx.moveTo(495, 182);
  ctx.lineTo(750, 182);
  ctx.stroke();

  // 7. General stats row boxes
  const statsList = getCollectionStats();
  
  // Calculate best overall distance across all units (including comprehensive)
  let globalBestDistance = 0;
  const allReportCategories = [...genres, comprehensiveGenre];
  allReportCategories.forEach(g => {
    const s = getStats(g.id);
    if (s.maxDistance > globalBestDistance) {
      globalBestDistance = s.maxDistance;
    }
  });

  // Calculate overall card completion percentage
  const cardPct = statsList.total > 0 ? ((statsList.owned / statsList.total) * 100).toFixed(1) : "0.0";

  // Box 1: Collection Card status
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(50, 210, 330, 85, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#4B5563';
  ctx.font = 'bold 12.5px sans-serif';
  ctx.fillText("📁 IT用語カード収集率", 70, 240);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`${statsList.owned} / ${statsList.total} 枚 (${cardPct}%)`, 70, 274);

  // Box 2: High Score distance stats
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E5E7EB';
  ctx.beginPath();
  ctx.roundRect(canvas.width - 380, 210, 330, 85, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#4B5563';
  ctx.font = 'bold 12.5px sans-serif';
  ctx.fillText("⛳️ クラブベスト飛距離", canvas.width - 360, 240);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`${globalBestDistance.toFixed(1)} m`, canvas.width - 360, 274);

  // 8. Unit detailed list header text
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText("📌 単元別クリアスコア・成績一覧（プリント範囲に準拠）", 50, 332);

  // 10. Table columns details
  const startY = 352;
  const rowHeight = 60; // Slightly more compact to comfortably fit 10 categories

  // Header background row
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.roundRect(50, startY, 700, 35, { topLeft: 6, topRight: 6 });
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11.5px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText("講義・単元カテゴリ名", 50 + 12, startY + 22);
  ctx.textAlign = 'center';
  ctx.fillText("最高正答数", 540, startY + 22);
  ctx.fillText("最長飛距離", 675, startY + 22);

  // Table Body alternation rows
  let currentY = startY + 35;
  allReportCategories.forEach((genre, index) => {
    const genreStats = getStats(genre.id);
    const maxCorrect = genreStats.maxCorrect || 0;
    const maxDistance = genreStats.maxDistance || 0;

    // Zebra design background color
    ctx.fillStyle = index % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
    ctx.fillRect(50, currentY, 700, rowHeight);

    // Row bottom separator line
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, currentY + rowHeight);
    ctx.lineTo(750, currentY + rowHeight);
    ctx.stroke();

    // Align texts
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(genre.title, 50 + 12, currentY + 25);
    
    // Core detail overview list
    ctx.fillStyle = '#6B7280';
    ctx.font = '10px sans-serif';
    const shortDesc = genre.description.length > 70 ? genre.description.substring(0, 68) + "..." : genre.description;
    ctx.fillText(shortDesc, 50 + 12, currentY + 44);

    // Accuracy numbers and colors (Centered at 540)
    ctx.textAlign = 'center';
    const totalQOfGenre = (genre.id === 'comprehensive') ? 10 : 5;
    const isExcellent = (genre.id === 'comprehensive') ? (maxCorrect >= 8) : (maxCorrect >= 4);
    ctx.fillStyle = isExcellent ? '#059669' : (maxCorrect > 0 ? '#4F46E5' : '#9CA3AF');
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${maxCorrect} / ${totalQOfGenre} 問`, 540, currentY + 35);

    // High Score Meter (Centered at 675)
    ctx.fillStyle = maxDistance > 0 ? '#111827' : '#9CA3AF';
    ctx.font = 'bold 12.5px sans-serif';
    ctx.fillText(maxDistance > 0 ? `${maxDistance.toFixed(1)} m` : "未クリア", 675, currentY + 35);

    currentY += rowHeight;
  });

  // Footer metadata
  ctx.fillStyle = '#4B5563';
  ctx.textAlign = 'left';
  ctx.font = '10px sans-serif';
  ctx.fillText("※ 提出される画像の記録はブラウザ上で生徒が到達した最高スコアを表します。", 50, currentY + 35);

  // Red circle academic stamp verification
  ctx.save();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(680, currentY + 45, 33, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(680, currentY + 45, 28, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
  ctx.font = 'bold 10.5px serif';
  ctx.textAlign = 'center';
  ctx.fillText("学習成果", 680, currentY + 40);
  ctx.fillText("確認済印", 680, currentY + 55);
  ctx.restore();

  // Signature validation zone text
  ctx.fillStyle = '#4B5563';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${EXAM_CONFIG.subjectName} 担当教職員 承認印:`, 485, currentY + 48);

  // Save base64 snapshot to img preview slot dynamically
  try {
    const dataUrl = canvas.toDataURL('image/png');
    if (els.reportPreviewImg) {
      els.reportPreviewImg.src = dataUrl;
    }
  } catch (err) {
    console.error("Failed to swap URL preview:", err);
  }
}

function downloadReportImage() {
  const canvas = els.reportCanvas;
  if (!canvas) return;

  const grade = els.submitUserGrade ? els.submitUserGrade.value.trim() : "";
  const className = els.submitUserClass ? els.submitUserClass.value.trim() : "";
  const number = els.submitUserNumber ? els.submitUserNumber.value.trim() : "";
  const name = els.submitUserName ? els.submitUserName.value.trim() : "";

  const profileParts = [];
  if (grade) profileParts.push(`${grade}年`);
  if (className) profileParts.push(`${className}組`);
  if (number) profileParts.push(`${number}番`);
  if (name) profileParts.push(name);

  const filenamePrefix = `${EXAM_CONFIG.subjectName}_${EXAM_CONFIG.termName}_report`;
  const filenameSuffix = profileParts.length > 0 ? `_${profileParts.join('_')}` : "";
  const filename = `${filenamePrefix}${filenameSuffix}.png`;

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    alert("画像のダウンロードに失敗しました。プレビュー画像を長押し、または右クリックして保存を試してください。");
  }
}

init();
