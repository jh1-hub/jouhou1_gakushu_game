// --- Item Data (30 Types) ---
// Rarity: 1=Common(Blue), 2=Rare(Gold), 3=UR(Rainbow)
export const ITEM_LIST = [
  // Common (15 items)
  { id: 1, name: "Bit (ビット)", rarity: 1, icon: "01", desc: "情報の最小単位。0か1の状態を持つ。" },
  { id: 2, name: "Byte (バイト)", rarity: 1, icon: "📦", desc: "8個のビットをまとめた単位。" },
  { id: 3, name: "Pixel (画素)", rarity: 1, icon: "⬛", desc: "画像を構成する最小の点。" },
  { id: 4, name: "RGB", rarity: 1, icon: "🎨", desc: "光の三原色。赤・緑・青。" },
  { id: 5, name: "Folder", rarity: 1, icon: "📁", desc: "ファイルを整理するための入れ物。" },
  { id: 6, name: "File", rarity: 1, icon: "📄", desc: "データのまとまり。" },
  { id: 7, name: "Bug (バグ)", rarity: 1, icon: "🐛", desc: "プログラムの誤りや欠陥。" },
  { id: 8, name: "Mouse", rarity: 1, icon: "🖱️", desc: "ポインティングデバイスの一種。" },
  { id: 9, name: "Keyboard", rarity: 1, icon: "⌨️", desc: "文字を入力する装置。" },
  { id: 10, name: "Binary (2進数)", rarity: 1, icon: "10", desc: "0と1だけで数を表す方法。" },
  { id: 11, name: "Font", rarity: 1, icon: "Aa", desc: "文字のデザイン。" },
  { id: 12, name: "Zip", rarity: 1, icon: "🤐", desc: "ファイルの圧縮形式の一つ。" },
  { id: 13, name: "Icon", rarity: 1, icon: "🖼️", desc: "機能やファイルを絵で表したもの。" },
  { id: 14, name: "Link", rarity: 1, icon: "🔗", desc: "クリックすると別のページへ飛ぶ仕組み。" },
  { id: 15, name: "Trash", rarity: 1, icon: "🗑️", desc: "不要なファイルを捨てる場所。" },

  // Rare (10 items)
  { id: 16, name: "CPU", rarity: 2, icon: "🧠", desc: "コンピュータの頭脳。演算を行う。" },
  { id: 17, name: "RAM (メモリ)", rarity: 2, icon: "⚡", desc: "作業用の机。電源を切ると消える。" },
  { id: 18, name: "HDD", rarity: 2, icon: "💿", desc: "大容量の磁気記憶装置。" },
  { id: 19, name: "SSD", rarity: 2, icon: "💾", desc: "高速な半導体記憶装置。" },
  { id: 20, name: "Wi-Fi", rarity: 2, icon: "📶", desc: "無線でネットワークに接続する技術。" },
  { id: 21, name: "Firewall", rarity: 2, icon: "🔥", desc: "外部からの攻撃を防ぐ壁。" },
  { id: 22, name: "Virus", rarity: 2, icon: "🦠", desc: "悪意のあるプログラム。" },
  { id: 23, name: "Algorithm", rarity: 2, icon: "🧩", desc: "問題を解決するための手順。" },
  { id: 24, name: "OS", rarity: 2, icon: "⚙️", desc: "基本ソフトウェア。" },
  { id: 25, name: "Server", rarity: 2, icon: "🏢", desc: "サービスを提供するコンピュータ。" },

  // Ultra Rare (5 items)
  { id: 26, name: "AI (人工知能)", rarity: 3, icon: "🤖", desc: "人間のような知能を持つシステム。" },
  { id: 27, name: "Blockchain", rarity: 3, icon: "⛓️", desc: "分散型台帳技術。暗号資産の基盤。" },
  { id: 28, name: "Quantum PC", rarity: 3, icon: "⚛️", desc: "量子力学を利用した超高速計算機。" },
  { id: 29, name: "VR (仮想現実)", rarity: 3, icon: "🥽", desc: "仮想空間を体験できる技術。" },
  { id: 30, name: "Big Data", rarity: 3, icon: "📊", desc: "巨大で複雑なデータの集合体。" }
];

const STORAGE_KEY = 'golf_gacha_collection';

// --- Functions ---

export function getCollection() {
  const json = localStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : {}; // { itemId: count }
}

export function saveCollection(collection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

export function drawGacha(distance, quizScore) {
  const collection = getCollection();
  
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

  // --- Apply Quiz Score Restrictions ---
  
  if (quizScore <= 5) {
    // Condition 1: If 5 or less correct, ONLY Common items.
    rarityWeights = { 1: 100, 2: 0, 3: 0 };
  } else if (quizScore < 9) {
    // Condition 2: If less than 9 correct, NO UR items.
    // Redistribution: Add UR weight to Rare weight.
    const urWeight = rarityWeights[3];
    rarityWeights[3] = 0;
    rarityWeights[2] += urWeight;
  }
  // If 9 or more, use base weights (UR is possible)

  // -------------------------------------

  const rand = Math.random() * 100;
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
  // Logic: Bonus chance to get "Unowned" item based on distance
  const pool = ITEM_LIST.filter(i => i.rarity === selectedRarity);
  const unowned = pool.filter(i => !collection[i.id]);
  const owned = pool.filter(i => collection[i.id]);

  let finalItem;
  
  // "New Item Chance" increases with distance (max 80% at 200m)
  const newChance = Math.min(0.8, distance / 250); 
  
  if (unowned.length > 0 && Math.random() < newChance) {
    finalItem = unowned[Math.floor(Math.random() * unowned.length)];
  } else {
    finalItem = pool[Math.floor(Math.random() * pool.length)];
  }

  // 3. Save Result
  if (!collection[finalItem.id]) collection[finalItem.id] = 0;
  collection[finalItem.id]++;
  saveCollection(collection);

  return {
    item: finalItem,
    isNew: collection[finalItem.id] === 1
  };
}