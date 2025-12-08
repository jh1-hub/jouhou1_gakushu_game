// --- Item Data (30 Types) ---
// Rarity: 1=Common(Blue), 2=Rare(Gold), 3=UR(Rainbow)
export const ITEM_LIST = [
  // Common (15 items)
  { 
    id: 1, name: "Bit (ビット)", rarity: 1, icon: "01", desc: "情報の最小単位。", 
    flavor: "デジタル世界の最小構成要素。\n0と1、ONとOFF、たった2つの状態が\nこの広大な電脳宇宙のすべてを形作っている。" 
  },
  { 
    id: 2, name: "Byte (バイト)", rarity: 1, icon: "📦", desc: "8個のビットをまとめた単位。", 
    flavor: "8つのビットが集まって生まれた情報の器。\n英数字1文字を表すのにちょうど良いサイズ。\nデータの重さを測る基本の物差しとなる。" 
  },
  { 
    id: 3, name: "Pixel (画素)", rarity: 1, icon: "⬛", desc: "画像を構成する最小の点。", 
    flavor: "デジタル画像を構成する光の粒。\n無数の点が集まることで、鮮やかな風景が蘇る。\n拡大しすぎると、ただの四角いブロックになる。" 
  },
  { 
    id: 4, name: "RGB", rarity: 1, icon: "🎨", desc: "光の三原色。赤・緑・青。", 
    flavor: "光の三原色、Red・Green・Blue。\nこの3つの光を混ぜ合わせることで、\nディスプレイ上のあらゆる色彩が表現される。" 
  },
  { 
    id: 5, name: "Folder", rarity: 1, icon: "📁", desc: "ファイルを整理するための入れ物。", 
    flavor: "散らばるデータを整理整頓する収納ボックス。\nマトリョーシカのように入れ子構造にでき、\n整理下手な人のデスクトップでは増殖しがち。" 
  },
  { 
    id: 6, name: "File", rarity: 1, icon: "📄", desc: "データのまとまり。", 
    flavor: "記録された情報のひとかたまり。\n名前と拡張子を持ち、OSによって管理される。\n保存し忘れたときの絶望感は計り知れない。" 
  },
  { 
    id: 7, name: "Bug (バグ)", rarity: 1, icon: "🐛", desc: "プログラムの誤りや欠陥。", 
    flavor: "プログラムに潜む予期せぬ不具合。\n名前の由来は、昔の計算機に挟まった蛾。\nプログラマーにとっては永遠の宿敵である。" 
  },
  { 
    id: 8, name: "Mouse", rarity: 1, icon: "🖱️", desc: "ポインティングデバイスの一種。", 
    flavor: "画面上の矢印を操る手のひらサイズの相棒。\nその形状がネズミに似ていたことから名付けられた。\nクリック一つで世界を動かす魔法の杖。" 
  },
  { 
    id: 9, name: "Keyboard", rarity: 1, icon: "⌨️", desc: "文字を入力する装置。", 
    flavor: "思考を文字に変換する入力インターフェース。\nQWERTY配列はタイプライター時代の名残。\nプログラマーが最もこだわりを持つ道具の一つ。" 
  },
  { 
    id: 10, name: "Binary (2進数)", rarity: 1, icon: "10", desc: "0と1だけで数を表す方法。", 
    flavor: "コンピュータが理解できる唯一の言葉。\n世界を「ある」か「ない」かだけで記述する。\nシンプルだが、あらゆる複雑さを内包している。" 
  },
  { 
    id: 11, name: "Font", rarity: 1, icon: "Aa", desc: "文字のデザイン。", 
    flavor: "文字に表情を与えるデジタルの筆致。\n明朝体は知的、ゴシック体は力強く。\n選び方一つで、言葉の伝わり方は劇的に変わる。" 
  },
  { 
    id: 12, name: "Zip", rarity: 1, icon: "🤐", desc: "ファイルの圧縮形式の一つ。", 
    flavor: "データをギュッと小さくまとめる技術。\n中身を取り出すには「解凍」が必要。\nメール添付の際の頼れる味方。" 
  },
  { 
    id: 13, name: "Icon", rarity: 1, icon: "🖼️", desc: "機能やファイルを絵で表したもの。", 
    flavor: "機能を直感的に伝える小さな絵。\n言葉の壁を越えて、誰にでも意味を伝える。\nGUI（グラフィカル操作）の主役的存在。" 
  },
  { 
    id: 14, name: "Link", rarity: 1, icon: "🔗", desc: "クリックすると別のページへ飛ぶ仕組み。", 
    flavor: "Webページ同士を繋ぐ架け橋。\nハイパーテキストの根幹をなす仕組みであり、\n世界中の情報をクモの巣（Web）のように結びつける。" 
  },
  { 
    id: 15, name: "Trash", rarity: 1, icon: "🗑️", desc: "不要なファイルを捨てる場所。", 
    flavor: "デジタルのゴミ箱。\nここにあるうちはまだ引き返せる。\n「ゴミ箱を空にする」を押した瞬間、データは虚無へ。" 
  },

  // Rare (10 items)
  { 
    id: 16, name: "CPU", rarity: 2, icon: "🧠", desc: "コンピュータの頭脳。演算を行う。", 
    flavor: "コンピュータの中枢を担うシリコンの頭脳。\n1秒間に数十億回もの計算をこなし、\nあらゆる命令を瞬時に処理する司令塔。" 
  },
  { 
    id: 17, name: "RAM (メモリ)", rarity: 2, icon: "⚡", desc: "作業用の机。電源を切ると消える。", 
    flavor: "CPUが作業をするための作業台。\n広ければ広いほど、多くの仕事を同時にこなせる。\nただし電源を切ると、上の物はすべて消えてしまう。" 
  },
  { 
    id: 18, name: "HDD", rarity: 2, icon: "💿", desc: "大容量の磁気記憶装置。", 
    flavor: "高速回転する円盤に磁気で記憶する倉庫。\n大容量で安価だが、衝撃にはめっぽう弱い。\nカリカリという動作音は、データの読み書きの証。" 
  },
  { 
    id: 19, name: "SSD", rarity: 2, icon: "💾", desc: "高速な半導体記憶装置。", 
    flavor: "フラッシュメモリを使った次世代の倉庫。\n物理的な動作がないため、静かで衝撃に強く爆速。\n一度使うと、もうHDDには戻れない快適さ。" 
  },
  { 
    id: 20, name: "Wi-Fi", rarity: 2, icon: "📶", desc: "無線でネットワークに接続する技術。", 
    flavor: "見えない電波で世界と繋がる技術。\nケーブルの束縛から人類を解放した功労者。\nカフェや空港でこのマークを探すのが現代人の習性。" 
  },
  { 
    id: 21, name: "Firewall", rarity: 2, icon: "🔥", desc: "外部からの攻撃を防ぐ壁。", 
    flavor: "ネットワークの境界に立つデジタルの関所。\n怪しい通信を遮断し、内部の安全を守る。\n炎の壁となって、ウイルスの侵入を許さない。" 
  },
  { 
    id: 22, name: "Virus", rarity: 2, icon: "🦠", desc: "悪意のあるプログラム。", 
    flavor: "自己増殖し、システムを破壊する悪意の塊。\n生物のウイルスのように次々と感染を広げる。\nセキュリティソフトとの戦いは永遠に続く。" 
  },
  { 
    id: 23, name: "Algorithm", rarity: 2, icon: "🧩", desc: "問題を解決するための手順。", 
    flavor: "問題を解くための定式化された手順書。\n効率的なアルゴリズムは、計算時間を劇的に短縮する。\n料理のレシピのように、手順通りに行えば正解に辿り着く。" 
  },
  { 
    id: 24, name: "OS", rarity: 2, icon: "⚙️", desc: "基本ソフトウェア。", 
    flavor: "ハードウェアと人間を仲介する基本ソフト。\nWindows, macOS, Linuxなど、個性は様々。\nこれがなければ、PCはただの箱に過ぎない。" 
  },
  { 
    id: 25, name: "Server", rarity: 2, icon: "🏢", desc: "サービスを提供するコンピュータ。", 
    flavor: "24時間365日働き続ける堅牢なマシン。\nWebページやメールを、リクエストに応じて配信する。\nインターネット社会を陰で支える縁の下の力持ち。" 
  },

  // Ultra Rare (5 items)
  { 
    id: 26, name: "AI (人工知能)", rarity: 3, icon: "🤖", desc: "人間のような知能を持つシステム。", 
    flavor: "学習し、推論し、創造するデジタルの知性。\n画像認識から自然言語処理まで、進化は止まらない。\nいつか人類を超える日が来るのだろうか？" 
  },
  { 
    id: 27, name: "Blockchain", rarity: 3, icon: "⛓️", desc: "分散型台帳技術。暗号資産の基盤。", 
    flavor: "改ざん不可能な取引履歴を鎖のように繋ぐ技術。\n中央管理者がいなくても信頼を担保できる。\nインターネット以来の革命と呼ばれることもある。" 
  },
  { 
    id: 28, name: "Quantum PC", rarity: 3, icon: "⚛️", desc: "量子力学を利用した超高速計算機。", 
    flavor: "量子重ね合わせを利用した夢の計算機。\n従来のスパコンで数万年かかる計算を瞬時に解く。\n実用化されれば、暗号技術など社会基盤が一変する。" 
  },
  { 
    id: 29, name: "VR (仮想現実)", rarity: 3, icon: "🥽", desc: "仮想空間を体験できる技術。", 
    flavor: "ゴーグルを被れば、そこは別世界。\n現実の物理法則を超えた体験が可能になる。\nメタバースへの入り口となる未来の技術。" 
  },
  { 
    id: 30, name: "Big Data", rarity: 3, icon: "📊", desc: "巨大で複雑なデータの集合体。", 
    flavor: "人間では処理しきれないほどの膨大なデータ群。\nAIで解析することで、新たな知見や価値が生まれる。\n21世紀の石油とも呼ばれる、情報の宝山。" 
  }
];

const STORAGE_KEY = 'golf_gacha_collection';
const HISTORY_KEY = 'golf_gacha_history';

// --- Functions ---

export function getCollection() {
  const json = localStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : {}; // { itemId: count }
}

export function saveCollection(collection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

// Get history of plays (to determine consecutive/new genre)
function getHistory() {
  const json = localStorage.getItem(HISTORY_KEY);
  return json ? JSON.parse(json) : { lastGenre: null, visitedGenres: [] };
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Stats helper for Menu
export function getCollectionStats() {
    const collection = getCollection();
    const stats = {
        total: ITEM_LIST.length,
        owned: 0,
        r1: { total: 0, owned: 0 },
        r2: { total: 0, owned: 0 },
        r3: { total: 0, owned: 0 }
    };
    
    ITEM_LIST.forEach(item => {
        const isOwned = !!collection[item.id];
        if (isOwned) stats.owned++;
        
        if (item.rarity === 1) {
            stats.r1.total++;
            if (isOwned) stats.r1.owned++;
        } else if (item.rarity === 2) {
            stats.r2.total++;
            if (isOwned) stats.r2.owned++;
        } else if (item.rarity === 3) {
            stats.r3.total++;
            if (isOwned) stats.r3.owned++;
        }
    });
    return stats;
}

export function drawGacha(distance, quizScore, genreId) {
  const collection = getCollection();
  const history = getHistory();
  
  // Logic: Check consecutive and first time
  const isConsecutive = history.lastGenre === genreId;
  const isFirstTime = !history.visitedGenres.includes(genreId);
  
  // Update History
  history.lastGenre = genreId;
  if (isFirstTime) {
      history.visitedGenres.push(genreId);
  }
  saveHistory(history);

  
  // 1. Determine Target Rarity based on Distance & Quiz Score
  let rarityWeights;
  
  // Base weights based on Distance
  if (distance < 30) {
    rarityWeights = { 1: 90, 2: 9, 3: 1 };
  } else if (distance < 80) {
    rarityWeights = { 1: 60, 2: 35, 3: 5 };
  } else if (distance < 150) {
    rarityWeights = { 1: 30, 2: 50, 3: 20 };
  } else {
    // Over 150m (Super Shot)
    rarityWeights = { 1: 10, 2: 40, 3: 50 };
  }

  // --- Apply Bonus / Penalty ---
  if (isFirstTime) {
      // Bonus: Boost Rare/UR chances slightly
      rarityWeights[2] += 10;
      rarityWeights[3] += 5;
  }

  // --- Apply Quiz Score Restrictions (Override) ---
  if (quizScore <= 5) {
    // Condition 1: If 5 or less correct, ONLY Common items.
    rarityWeights = { 1: 100, 2: 0, 3: 0 };
  } else if (quizScore < 9) {
    // Condition 2: If less than 9 correct, NO UR items.
    const urWeight = rarityWeights[3];
    rarityWeights[3] = 0;
    rarityWeights[2] += urWeight;
  }
  
  // Normalize weights (optional, but good for clarity)
  // Logic continues with cumulative check...

  const rand = Math.random() * (rarityWeights[1] + rarityWeights[2] + rarityWeights[3]);
  let selectedRarity = 1;
  let cumulative = 0;
  
  for (const r of [1, 2, 3]) {
    cumulative += rarityWeights[r];
    if (rand <= cumulative) {
      selectedRarity = r;
      break;
    }
  }

  // 2. Select Item from Rarity Pool
  const pool = ITEM_LIST.filter(i => i.rarity === selectedRarity);
  const unowned = pool.filter(i => !collection[i.id]);
  
  let finalItem;
  
  // "New Item Chance"
  let newChance = Math.min(0.8, distance / 250); 
  
  // Penalty: Consecutive play reduces new card chance significantly
  if (isConsecutive) {
      newChance *= 0.2; // 80% reduction in new card chance
  }
  
  // Bonus: First time play increases new card chance to max
  if (isFirstTime) {
      newChance = 1.0; 
  }
  
  if (unowned.length > 0 && Math.random() < newChance) {
    finalItem = unowned[Math.floor(Math.random() * unowned.length)];
  } else {
    // Fallback to full pool (likely duplicate)
    finalItem = pool[Math.floor(Math.random() * pool.length)];
  }

  // 3. Save Result
  if (!collection[finalItem.id]) collection[finalItem.id] = 0;
  collection[finalItem.id]++;
  saveCollection(collection);

  return {
    item: finalItem,
    isNew: collection[finalItem.id] === 1,
    isFirstBonus: isFirstTime,
    isConsecutivePenalty: isConsecutive
  };
}