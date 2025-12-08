import { initGame, updateParams, setRestartCallback, resetGame, launchBall, resetSessionBest, getLastGachaItem } from './app.js';
import { ITEM_LIST, getCollection, getCollectionStats } from './gacha.js';

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
      { q: "コンピュータで「負の数」を表現する際によく使われる考え方は？", options: ["逆数", "補数", "虚数", "対数"], a: 1, explanation: "補数を使うと、引き算を足し算として処理できるため効率的です。" },
      { q: "2進数の「0101 + 1001」の計算結果は？", options: ["1100", "1110", "1000", "1111"], a: 1, explanation: "5 + 9 = 14。14は2進数で1110です。" },
      { q: "2の補数を求める手順：ビットを反転させた後、どうする？", options: ["1を引く", "1を足す", "そのまま", "2倍する"], a: 1, explanation: "反転して1を足すことで2の補数（負の数）が得られます。" },
      { q: "桁あふれ（オーバーフロー）とは何？", options: ["計算結果が桁数を超える", "計算が速すぎること", "ゼロで割ること", "電源が落ちること"], a: 0, explanation: "用意されたビット数に収まりきらない状態のことです。" }
    ]
  },
  {
    id: 'text_enc',
    title: '文字のデジタル表現',
    icon: '🔤',
    description: '文字コード、フォント',
    questions: [
      { q: "英数字や記号を扱う最も基本的な文字コードは？", options: ["Shift_JIS", "ASCII", "EUC-JP", "Unicode"], a: 1, explanation: "ASCII（アスキー）は7ビットで英数字を表す基本コードです。" },
      { q: "世界中の文字を統一して扱うための文字コードは？", options: ["ASCII", "Unicode (UTF-8等)", "JISコード", "EBCDIC"], a: 1, explanation: "Unicodeは多言語対応のための標準規格です。" },
      { q: "文字の形状（デザイン）データのことを何と呼ぶ？", options: ["グリフ", "グラフ", "ビット", "ピクセル"], a: 0, explanation: "同じ文字コードでも、フォントによってグリフ（形）が異なります。" },
      { q: "拡大してもギザギザにならないフォント形式は？", options: ["ビットマップフォント", "アウトラインフォント", "ドットフォント", "ラスターフォント"], a: 1, explanation: "輪郭を数式で記録するため、拡大しても滑らかです。" },
      { q: "日本語の文字コードとしてWindowsで標準的に使われてきたのは？", options: ["Shift_JIS", "EUC-JP", "ISO-2022-JP", "UTF-8"], a: 0, explanation: "Shift_JIS（CP932）が長らく使われてきました。" },
      { q: "Unicodeの符号化方式の一つで、Webで最も普及しているのは？", options: ["UTF-8", "UTF-16", "UTF-32", "Shift_JIS"], a: 0, explanation: "UTF-8はASCIIとの互換性が高く、Webの標準となっています。" },
      { q: "文字化けの原因として最も可能性が高いのは？", options: ["文字コードの不一致", "フォントサイズの違い", "画面の明るさ", "OSの種類"], a: 0, explanation: "作成時と表示時で異なる文字コードを指定すると発生します。" },
      { q: "「A」のASCIIコードは0x41。「B」のASCIIコードは？", options: ["0x40", "0x42", "0x43", "0x50"], a: 1, explanation: "連番になっているため、41の次は42です。" },
      { q: "アウトラインフォントは画像をどう記録している？", options: ["点の集まり", "輪郭線の座標計算式", "色の濃淡", "圧縮データ"], a: 1, explanation: "ベジェ曲線などの数式データとして記録されています。" },
      { q: "「改行」などの制御文字も文字コードに含まれる？", options: ["含まれる", "含まれない", "OSによる", "アプリによる"], a: 0, explanation: "コンピュータへの命令を表す文字としてコードが割り当てられています。" }
    ]
  },
  {
    id: 'sound_digi',
    title: '音のデジタル表現',
    icon: '🎵',
    description: '標本化、量子化、符号化',
    questions: [
      { q: "アナログ波形をデジタル化する3ステップの正しい順序は？", options: ["標本化→量子化→符号化", "量子化→標本化→符号化", "符号化→標本化→量子化", "標本化→符号化→量子化"], a: 0, explanation: "時間を区切る(標本化)→値を決める(量子化)→数値にする(符号化)の順です。" },
      { q: "1秒間に波の高さを測定する回数（サンプリング周波数）の単位は？", options: ["dpi", "bps", "Hz", "fps"], a: 2, explanation: "Hz（ヘルツ）は1秒あたりの回数を表します。" },
      { q: "電圧（波の高さ）を段階的な数値に変換することを何という？", options: ["標本化", "量子化", "符号化", "暗号化"], a: 1, explanation: "連続的な値を離散的な（飛び飛びの）値にすることを量子化と言います。" },
      { q: "CDの音質など、音を圧縮せずに記録する方式は？", options: ["PCM方式", "MP3方式", "AAC方式", "MIDI方式"], a: 0, explanation: "Pulse Code Modulationの略で、非圧縮のデジタル音声形式です。" },
      { q: "ハイレゾ音源の特徴は？", options: ["CDよりサンプリング周波数が低い", "CDより情報量が多い", "モノラルである", "アナログレコードと同じ"], a: 1, explanation: "CDを超える情報量（高解像度）を持つ音源のことです。" },
      { q: "量子化ビット数を増やすとどうなる？", options: ["音の大小の段階が細かくなる", "音が高くなる", "再生速度が速くなる", "ノイズが増える"], a: 0, explanation: "16bitより24bitの方が、より繊細な音の強弱を表現できます。" },
      { q: "人の可聴域（聞こえる周波数）はおよそ？", options: ["20Hz〜20kHz", "1Hz〜100Hz", "100kHz以上", "0Hz〜10kHz"], a: 0, explanation: "個人差はありますが、一般的にこの範囲とされています。" },
      { q: "MP3などの非可逆圧縮でカットされるデータは？", options: ["人間が聞き取りにくい部分", "一番大きい音", "一番低い音", "ランダムな部分"], a: 0, explanation: "聴覚心理学に基づき、聞こえにくい成分を削除して容量を減らします。" },
      { q: "「MIDI」データが記録しているのは？", options: ["波形の音そのもの", "演奏情報（音程や長さ）", "歌詞", "ジャケット画像"], a: 1, explanation: "電子楽器の演奏データ（楽譜のようなもの）で、容量が非常に小さいです。" },
      { q: "音の3要素は「大きさ」「高さ」とあと一つは？", options: ["音色", "速さ", "距離", "温度"], a: 0, explanation: "同じ高さと大きさでも、ピアノとバイオリンで音が違うのは音色が違うからです。" }
    ]
  },
  {
    id: 'image_digi',
    title: '画像のデジタル表現',
    icon: '🖼️',
    description: '画素、三原色、ラスタ/ベクタ',
    questions: [
      { q: "ディスプレイなどで使われる「光の三原色」は？", options: ["CMY", "RGB", "HSV", "YUV"], a: 1, explanation: "Red(赤), Green(緑), Blue(青)の3色で、混ぜると白になります（加法混色）。" },
      { q: "光の三原色をすべて混ぜると何色になる？", options: ["黒", "白", "紫", "茶"], a: 1, explanation: "光は重なるほど明るくなり、白になります。" },
      { q: "画像を点の集まり（画素）で表現する形式は？", options: ["ベクタ形式", "ラスタ形式", "数式形式", "パス形式"], a: 1, explanation: "写真などはラスタ形式（ビットマップ）が適しています。" },
      { q: "画像の細かさを表す「解像度」の単位でよく使われるのは？", options: ["dpi", "Hz", "bps", "rpm"], a: 0, explanation: "dots per inchの略で、1インチあたりのドット数を表します。" },
      { q: "印刷インクで使われる「色の三原色」は？", options: ["CMY", "RGB", "RYB", "BkWH"], a: 0, explanation: "Cyan, Magenta, Yellowの3色で、混ぜると黒に近づきます（減法混色）。" },
      { q: "1画素を24ビット（RGB各8ビット）で表現する場合、表現できる色数は？", options: ["約256色", "約65000色", "約1677万色", "無限"], a: 2, explanation: "2の24乗 ≒ 1677万色（フルカラー）です。" },
      { q: "画像を拡大するとぼやけたりギザギザになるのは？", options: ["ラスタ画像", "ベクタ画像", "アウトラインフォント", "SVG"], a: 0, explanation: "点の集まりであるため、拡大すると点が目立ってしまいます。" },
      { q: "透明度を表すチャンネル（アルファチャンネル）を持つ画像形式は？", options: ["JPEG", "PNG", "BMP", "GIF(透過色のみ)"], a: 1, explanation: "PNGは半透明（アルファチャンネル）を扱えます。" },
      { q: "CMY（シアン・マゼンタ・イエロー）を混ぜると何色に近づく？", options: ["白", "黒", "赤", "青"], a: 1, explanation: "インクを混ぜるほど暗くなり、黒に近づきます。" },
      { q: "1インチあたりのドット数を表すdpiは何の略？", options: ["dots per inch", "data per image", "digital pixel index", "display per inch"], a: 0, explanation: "1インチ(約2.54cm)の中にどれだけドットがあるかを示します。" }
    ]
  },
  {
    id: 'video_digi',
    title: '動画のデジタル表現',
    icon: '🎬',
    description: 'フレームレート、データ量',
    questions: [
      { q: "動画が動いて見える原理は目の何を利用している？", options: ["錯覚現象", "残像現象", "焦点調節", "明暗順応"], a: 1, explanation: "前の映像の残像が残っている間に次の映像が表示されることで動いて見えます。" },
      { q: "1秒間に表示される画像の枚数を表す単位は？", options: ["dpi", "Hz", "fps", "bps"], a: 2, explanation: "frames per secondの略です。" },
      { q: "30fpsの動画で、1分間に表示される静止画は何枚？", options: ["300枚", "600枚", "1800枚", "3600枚"], a: 2, explanation: "30枚 × 60秒 = 1800枚です。" },
      { q: "一般的に、動画のデータ量は静止画に比べてどうなる？", options: ["非常に小さい", "変わらない", "非常に大きい", "半減する"], a: 2, explanation: "大量の静止画と音声を含むため、データ量は非常に大きくなります。" },
      { q: "動画データの入れ物（コンテナ）を表す拡張子は？", options: [".mp4", ".jpg", ".txt", ".html"], a: 0, explanation: "mp4は映像と音声を格納する代表的なコンテナフォーマットです。" },
      { q: "動画圧縮の基準となるフレーム（完全な画像）を何という？", options: ["キーフレーム", "サブフレーム", "デルタフレーム", "ヌルフレーム"], a: 0, explanation: "Iフレームとも呼ばれ、単体で画像として成立するフレームです。" },
      { q: "インターネットでの動画配信に適した技術は？", options: ["ストリーミング", "ダウンロードのみ", "フロッピーディスク", "FAX"], a: 0, explanation: "データをダウンロードしながら再生する技術です。" },
      { q: "4K解像度はおよそどのくらい？", options: ["1920x1080", "3840x2160", "720x480", "800x600"], a: 1, explanation: "フルHD(1920x1080)の縦横2倍、面積で4倍の解像度です。" },
      { q: "フレーム間の差分だけを記録する圧縮方式を何という？", options: ["フレーム間圧縮", "空間圧縮", "可逆圧縮", "ZIP圧縮"], a: 0, explanation: "前後の画像と似ている部分を省略することで圧縮します。" },
      { q: "アスペクト比「16:9」はどのような形状？", options: ["正方形", "横長（ワイド）", "縦長", "円形"], a: 1, explanation: "現在の一般的なテレビやYouTube動画の比率です。" }
    ]
  },
  {
    id: 'compression',
    title: 'データの圧縮',
    icon: '📦',
    description: '可逆圧縮、非可逆圧縮',
    questions: [
      { q: "圧縮したデータを元に戻したとき、完全に元の状態に戻る方式は？", options: ["可逆圧縮", "非可逆圧縮", "不可逆圧縮", "高圧縮"], a: 0, explanation: "文書ファイルやプログラムなどは、1ビットでも変わると困るため可逆圧縮を使います。" },
      { q: "JPEG形式の画像やMP3形式の音声は、一般的にどの圧縮方式？", options: ["可逆圧縮", "非可逆圧縮", "ZIP圧縮", "LZH圧縮"], a: 1, explanation: "人の感覚に影響が少ない範囲でデータを捨てて、圧縮率を高めています。" },
      { q: "「白白白黒黒」を「白3黒2」のように記録する圧縮方法は？", options: ["ハフマン符号化", "ランレングス圧縮", "辞書圧縮", "差分圧縮"], a: 1, explanation: "連続するデータの長さを記録する方式です。" },
      { q: "非可逆圧縮のメリットは？", options: ["画質が良くなる", "圧縮率を高くできる", "元に戻せる", "計算が不要"], a: 1, explanation: "画質等は多少劣化しますが、ファイルサイズを劇的に小さくできます。" },
      { q: "出現頻度の高いデータに短いビット列を割り当てる手法は？", options: ["ハフマン符号化", "ランレングス法", "MP3", "JPEG"], a: 0, explanation: "よく出る文字を短く表現することで全体のデータ量を減らします。" },
      { q: "ZIPファイルはどの圧縮方式？", options: ["可逆圧縮", "非可逆圧縮", "音声圧縮", "動画圧縮"], a: 0, explanation: "ZIPは解凍すると完全に元に戻る可逆圧縮です。" },
      { q: "圧縮したデータを元に戻すことを何という？", options: ["解凍（伸張/展開）", "冷凍", "再圧縮", "インストール"], a: 0, explanation: "伸張（しんちょう）や展開とも呼ばれます。" },
      { q: "次のうち、可逆圧縮の画像形式は？", options: ["JPEG", "PNG", "MPEG", "HEIC(設定による)"], a: 1, explanation: "PNGは画質を劣化させずに圧縮できます。" },
      { q: "辞書圧縮法で利用するのは？", options: ["データの繰り返しパターン", "色の平均値", "音の高さ", "ファイル名"], a: 0, explanation: "繰り返し出現するパターンを短いコードに置き換えます。" },
      { q: "データ量が半分になった場合、圧縮率は？", options: ["200%", "50%", "100%", "0%"], a: 1, explanation: "圧縮後のサイズ ÷ 元のサイズ × 100 で計算します。" }
    ]
  },
  {
    id: 'hardware',
    title: 'コンピュータの構成',
    icon: '🖥️',
    description: '5大装置、CPU、メモリ',
    questions: [
      { q: "コンピュータの「頭脳」にあたり、演算と制御を行う装置は？", options: ["HDD", "メモリ", "CPU", "マウス"], a: 2, explanation: "Central Processing Unit（中央演算処理装置）のことです。" },
      { q: "電源を切るとデータが消えてしまう主記憶装置（メモリ）は？", options: ["RAM", "ROM", "SSD", "DVD"], a: 0, explanation: "Random Access Memoryは揮発性のメモリです。" },
      { q: "5大装置に含まれないものは？", options: ["入力装置", "出力装置", "通信装置", "記憶装置"], a: 2, explanation: "5大装置は「制御・演算・記憶・入力・出力」です。通信装置は含まれません（現代では必須ですが）。" },
      { q: "CPUの処理速度に関係する、動作のタイミングを合わせる信号は？", options: ["クロック信号", "デジタル信号", "アナログ信号", "Wi-Fi信号"], a: 0, explanation: "クロック周波数（Hz）が高いほど、1秒間に多くの処理ができます。" },
      { q: "CPUと主記憶装置の速度差を埋めるための高速なメモリは？", options: ["キャッシュメモリ", "USBメモリ", "仮想メモリ", "フラッシュメモリ"], a: 0, explanation: "CPU内部などにあり、頻繁に使うデータを一時保存します。" },
      { q: "GPUが特に得意とする処理は？", options: ["OSの起動", "画像・映像の処理", "文書作成", "印刷"], a: 1, explanation: "並列処理が得意で、3DグラフィックスやAI計算に使われます。" },
      { q: "SSDの特徴として正しいものは？", options: ["HDDより遅い", "衝撃に強い・高速", "磁気ディスクを使う", "容量が無限"], a: 1, explanation: "半導体メモリを使うため、物理的な駆動部がなく高速です。" },
      { q: "BIOS/UEFIが保存されているメモリは？", options: ["RAM", "ROM (フラッシュROM)", "HDD", "Cache"], a: 1, explanation: "起動用プログラムは書き換える必要が少ないため、ROMに保存されます。" },
      { q: "周辺機器を接続する規格「USB」は何の略？", options: ["Universal Serial Bus", "Ultra Speed Board", "United System Base", "User Service Box"], a: 0, explanation: "汎用的な直列バスという意味です。" },
      { q: "主記憶装置の容量が足りない時にHDDなどを借りて使う仕組みは？", options: ["仮想メモリ", "キャッシュメモリ", "クラウド", "バックアップ"], a: 0, explanation: "補助記憶装置の一部をメモリのように扱います。" }
    ]
  },
  {
    id: 'software',
    title: 'ソフトウェアとOS',
    icon: '💿',
    description: 'OSの役割、GUI、ファイル',
    questions: [
      { q: "ハードウェアとアプリの間で管理を行う「基本ソフトウェア」は？", options: ["OS", "Webブラウザ", "表計算ソフト", "ドライバ"], a: 0, explanation: "Operating Systemの略です。Windows, macOS, iOS, Androidなどがあります。" },
      { q: "マウスやアイコンを使って直感的に操作できる画面環境を何という？", options: ["CUI", "GUI", "API", "SNS"], a: 1, explanation: "Graphical User Interfaceの略です。" },
      { q: "ファイルを階層的に整理するための入れ物を何という？", options: ["ファイル", "ドライブ", "フォルダ（ディレクトリ）", "クラウド"], a: 2, explanation: "PCではフォルダ、プログラミング等ではディレクトリと呼びます。" },
      { q: "ファイル名の末尾につき、ファイルの種類を表す文字列（例 .jpg）は？", options: ["ドメイン", "プロトコル", "拡張子", "パス"], a: 2, explanation: "OSがどのアプリで開くかを判断するのに使われます。" },
      { q: "オープンソースのOSの代表例は？", options: ["Linux", "Windows", "macOS", "Excel"], a: 0, explanation: "誰でもソースコードを閲覧・改良できるOSです。" },
      { q: "新しいハードウェアを接続した時に必要な制御ソフトは？", options: ["デバイスドライバ", "デバイスマネージャ", "デバイスアプリ", "デバイスOS"], a: 0, explanation: "OSとハードウェアの仲介役をするソフトです。" },
      { q: "複数のタスクを同時に実行しているように見せる機能は？", options: ["マルチタスク", "シングルタスク", "マルチコア", "ハイパースレッド"], a: 0, explanation: "CPUの処理時間を細かく切り替えて、並行して動いているように見せます。" },
      { q: "アプリ同士でデータをやり取りするためのコピー領域は？", options: ["クリップボード", "デスクトップ", "ごみ箱", "タスクバー"], a: 0, explanation: "コピー＆ペーストの際に一時的にデータが保存される場所です。" },
      { q: "OSが提供する機能を利用するためのプログラム部品群は？", options: ["API", "GUI", "CUI", "URL"], a: 0, explanation: "Application Programming Interfaceの略です。" },
      { q: "バックアップの目的は？", options: ["容量を増やす", "データの消失に備える", "動作を速くする", "電気代を節約する"], a: 1, explanation: "故障や操作ミスに備えて、別の場所に複製を保存することです。" }
    ]
  },
  {
    id: 'logic_circuit',
    title: '論理回路',
    icon: '🔌',
    description: 'AND, OR, NOT, 真理値表',
    questions: [
      { q: "2つの入力が「ともに1」のときだけ1を出力する回路は？", options: ["OR回路", "NOT回路", "AND回路", "NAND回路"], a: 2, explanation: "論理積回路とも呼ばれます。" },
      { q: "入力の「どちらか一方でも1」なら1を出力する回路は？", options: ["OR回路", "NOT回路", "AND回路", "NOR回路"], a: 0, explanation: "論理和回路とも呼ばれます。" },
      { q: "入力信号を反転させる（0なら1、1なら0にする）回路は？", options: ["OR回路", "NOT回路", "AND回路", "XOR回路"], a: 1, explanation: "否定回路とも呼ばれます。" },
      { q: "1桁の2進数の足し算を行う回路を何という？", options: ["半加算器", "全加算器", "倍率器", "整流器"], a: 0, explanation: "繰り上がりを考慮しない1桁の加算回路です（考慮するのは全加算器）。" }
      // Dynamic logic questions added on init
    ]
  },
  {
    id: 'algorithm',
    title: 'アルゴリズム',
    icon: '🧩',
    description: '処理手順、フローチャート',
    questions: [
      { q: "問題を解決するための手順や計算方法を定式化したものは？", options: ["アルゴリズム", "プログラム", "パラダイム", "メカニズム"], a: 0, explanation: "コンピュータに処理させるための手順のことです。" },
      { q: "アルゴリズムの基本構造3つに含まれないものは？", options: ["順次（順接）", "選択（分岐）", "反復（繰り返し）", "乱数（ランダム）"], a: 3, explanation: "基本構造は「順次」「選択」「反復」の3つです。" },
      { q: "処理の流れを図形で表したものを何という？", options: ["グラフ", "フローチャート", "マインドマップ", "ヒストグラム"], a: 1, explanation: "流れ図とも呼ばれます。" },
      { q: "フローチャートで「判断（分岐）」を表す記号の形は？", options: ["長方形", "楕円", "ひし形", "平行四辺形"], a: 2, explanation: "Yes/Noで線が分岐します。" },
      { q: "データの探索で、先頭から順に探す方法は？", options: ["線形探索", "二分探索", "ハッシュ探索", "深さ優先探索"], a: 0, explanation: "リニアサーチとも呼ばれ、データが整列していなくても使えます。" },
      { q: "データが整列されている時に使える高速な探索法は？", options: ["二分探索", "線形探索", "全探索", "ランダム探索"], a: 0, explanation: "バイナリサーチ。真ん中と比較して範囲を半分に絞っていきます。" },
      { q: "フローチャートで「処理」を表す記号の形は？", options: ["長方形", "円", "ひし形", "平行四辺形"], a: 0, explanation: "計算や代入などの処理を表します。" },
      { q: "「交換」「選択」「挿入」などが代表的なアルゴリズムの種類は？", options: ["整列（ソート）", "探索（サーチ）", "圧縮", "暗号化"], a: 0, explanation: "データをある規則（小さい順など）に従って並べ替えるアルゴリズムです。" },
      { q: "バグを取り除く作業を何という？", options: ["デバッグ", "コンパイル", "コーディング", "リンク"], a: 0, explanation: "プログラムの誤り（バグ）を修正する作業です。" },
      { q: "プログラムのソースコードを機械語に変換するソフトは？", options: ["コンパイラ", "エディタ", "デバッガ", "OS"], a: 0, explanation: "人間が読めるプログラムを、コンピュータが実行できる形式に翻訳します。" }
    ]
  }
];

// Special Comprehensive Genre Definition
const comprehensiveGenre = {
  id: 'comprehensive',
  title: '総合演習 (全範囲)',
  icon: '🎓',
  description: '全ジャンルから出題。問題数20問。獲得ステータスは半分(切り上げ)。',
  questions: [] // Populated dynamically
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
let currentShuffledIndices = [];

// --- DOM Elements ---
let els = {};

function init() {
  els = {
    menuContainer: document.getElementById('menu-container'),
    quizContainer: document.getElementById('quiz-container'),
    gameContainer: document.getElementById('game-container'),
    collectionModal: document.getElementById('collection-modal'),
    genreGrid: document.getElementById('genre-grid'),
    btnReset: document.getElementById('btn-reset'),
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
  
  // Setup Controls
  if(els.btnReset) els.btnReset.onclick = resetProgress;
  if(els.btnCollection) els.btnCollection.onclick = openCollection;
  if(els.btnCloseCollection) els.btnCloseCollection.onclick = closeCollection;
  if(els.btnCloseDetail) els.btnCloseDetail.onclick = closeCardDetail;
  
  // Make stats container clickable
  if(els.collectionStats) {
      els.collectionStats.onclick = openCollection;
  }
  
  // Make Gacha Card clickable for details
  if(els.gachaCard) {
      els.gachaCard.onclick = () => {
          // Check if card is flipped (has result)
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

  // Expand questions just once
  if (!isQuestionsExpanded) {
    expandQuestions();
    isQuestionsExpanded = true;
  }

  // Load stats and render menu
  renderMenu();
}

function expandQuestions() {
  // Add dynamic questions to Math/Logic genres
  const unitQ = genres.find(g => g.id === 'info_unit');
  if(unitQ) unitQ.questions.push(...generateUnitQuestions(16));
  
  const baseQ = genres.find(g => g.id === 'base_conv');
  if(baseQ) baseQ.questions.push(...generateBaseConvQuestions(16));
  
  const calcQ = genres.find(g => g.id === 'calc_comp');
  if(calcQ) calcQ.questions.push(...generateCalcQuestions(16));
  
  const logicQ = genres.find(g => g.id === 'logic_circuit');
  if(logicQ) logicQ.questions.push(...generateLogicQuestions(16));
}

// --- Menu Logic ---
function getStats(genreId) {
  const key = `golf_stats_${genreId}`;
  const json = localStorage.getItem(key);
  return json ? JSON.parse(json) : { maxCorrect: 0, maxDistance: 0 };
}

function updateGlobalStats() {
  let maxShot = 0;
  // Check standard genres
  genres.forEach(g => {
    const s = getStats(g.id);
    if (s.maxDistance > maxShot) maxShot = s.maxDistance;
  });
  // Check comprehensive
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
  if(!confirm("すべての成績と記録をリセットしますか？")) return;
  if(!confirm("本当にいいですか？")) return;
  if(!confirm("後悔しませんね？")) return;
  if(!confirm("ほんとにぃ？（もどせないったら！）")) return;

  genres.forEach(g => {
    localStorage.removeItem(`golf_stats_${g.id}`);
  });
  localStorage.removeItem(`golf_stats_comprehensive`);
  localStorage.removeItem('golf_gacha_collection'); // Reset Collection
  localStorage.removeItem('golf_gacha_history'); // Reset History
  resetSessionBest();
  renderMenu();
}

function renderMenu() {
  els.menuContainer.classList.remove('hidden');
  els.quizContainer.classList.add('hidden');
  els.gameContainer.classList.add('blur-md');
  
  els.gameContainer.style.zIndex = '0';
  els.menuContainer.style.zIndex = '50';
  
  updateGlobalStats();
  
  els.genreGrid.innerHTML = '';

  // Render Standard Genres
  genres.forEach(genre => renderGenreCard(genre));

  // Render Comprehensive Card
  renderGenreCard(comprehensiveGenre, true);
}

function renderGenreCard(genre, isComprehensive = false) {
  const stats = getStats(genre.id);
  const totalQ = isComprehensive ? 20 : 10; // Session limit
  
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
  els.genreGrid.appendChild(card);
}

function returnToMenu() {
  document.getElementById('msg-finished').classList.add('hidden');
  renderMenu();
}

// --- Collection Modal Logic ---

function openCollection() {
  const collection = getCollection();
  const grid = document.getElementById('collection-grid');
  grid.innerHTML = '';

  let ownedCount = 0;

  ITEM_LIST.forEach(item => {
    const isOwned = !!collection[item.id];
    if(isOwned) ownedCount++;
    
    const div = document.createElement('div');
    // Rarity styles
    let borderClass = 'border-slate-200 bg-white';
    if (isOwned) {
       if (item.rarity === 3) borderClass = 'border-purple-400 bg-purple-50';
       if (item.rarity === 2) borderClass = 'border-amber-400 bg-amber-50';
       if (item.rarity === 1) borderClass = 'border-sky-400 bg-sky-50';
    }

    // Masking Name
    const displayName = isOwned ? item.name : (item.name.charAt(0) + '***');

    div.className = `aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all ${borderClass} ${isOwned ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'opacity-50 grayscale'}`;
    
    if (isOwned) {
        div.onclick = () => showCardDetail(item);
    }
    
    div.innerHTML = `
      <div class="text-3xl mb-1">${isOwned ? item.icon : '🔒'}</div>
      <div class="text-[10px] font-bold leading-tight ${isOwned ? 'text-slate-800' : 'text-slate-400'}">${displayName}</div>
      ${isOwned && collection[item.id] > 1 ? `<div class="mt-1 text-[9px] bg-black/10 px-1 rounded-full">x${collection[item.id]}</div>` : ''}
    `;
    grid.appendChild(div);
  });

  document.getElementById('col-count').textContent = `${ownedCount}/${ITEM_LIST.length}`;
  els.collectionModal.classList.remove('hidden');
}

function closeCollection() {
  els.collectionModal.classList.add('hidden');
}

// --- Card Detail Modal Logic ---
function showCardDetail(item) {
    if(!item) return;
    
    // Set Rarity Theme
    const modalBox = els.cardDetailModal.firstElementChild;
    modalBox.classList.remove('border-sky-400', 'border-amber-400', 'border-purple-400');
    if (item.rarity === 1) modalBox.classList.add('border-sky-400');
    if (item.rarity === 2) modalBox.classList.add('border-amber-400');
    if (item.rarity === 3) modalBox.classList.add('border-purple-400');

    const rarityLabel = item.rarity === 3 ? 'ULTRA RARE' : (item.rarity === 2 ? 'RARE' : 'COMMON');
    const rarityColor = item.rarity === 3 ? 'text-purple-500' : (item.rarity === 2 ? 'text-amber-500' : 'text-sky-500');

    els.cardDetailContent.innerHTML = `
         <div class="w-full h-40 bg-slate-50 flex items-center justify-center text-7xl mb-4 relative overflow-hidden">
             <!-- Simple shine effect background -->
             <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
             <span class="relative z-10 drop-shadow-xl animate-bounce">${item.icon}</span>
         </div>
         <div class="p-6 pt-0 w-full">
           <h3 class="text-2xl font-black text-slate-800 mb-1 leading-tight">${item.name}</h3>
           <div class="text-xs font-black uppercase tracking-widest ${rarityColor} mb-6 border-b pb-2">${rarityLabel}</div>
           
           <div class="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
             <p class="text-slate-600 text-sm leading-7 whitespace-pre-line font-medium">
               ${item.flavor || item.desc}
             </p>
           </div>
         </div>
    `;
    
    els.cardDetailModal.classList.remove('hidden');
}

function closeCardDetail() {
    els.cardDetailModal.classList.add('hidden');
}


// --- Quiz Logic ---

function startQuiz(genre) {
  currentGenre = genre;
  wrongAnswers = [];
  
  if (genre.id === 'comprehensive') {
    // Collect questions from ALL genres
    let allQuestions = [];
    genres.forEach(g => {
        allQuestions.push(...g.questions);
    });
    // Shuffle and pick 20
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, 20);
  } else {
    // Normal Genre: Shuffle and take up to 10
    const shuffled = [...genre.questions].sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, 10);
  }
  
  currentQuestionIndex = 0;
  score = 0;
  bonuses = { power: 10, loft: 20, wind: 0 }; 

  els.menuContainer.classList.add('hidden');
  els.quizContainer.classList.remove('hidden');
  
  renderQuizStructure();
  renderQuestion();
}

function renderQuizStructure() {
  const isComp = currentGenre.id === 'comprehensive';
  const headerGradient = isComp ? 'from-amber-500 to-orange-500' : 'from-emerald-600 to-teal-600';

  els.quizContainer.innerHTML = `
    <div id="quiz-card" class="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden fade-in mx-4 transition-colors duration-300 flex flex-col max-h-[90vh]">
      <div class="bg-gradient-to-r ${headerGradient} p-4 text-white text-center shadow-md relative shrink-0">
        <button id="btn-quit-quiz" class="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white font-bold text-xs bg-black/20 px-3 py-1 rounded-full hover:bg-black/30 transition">✕ MENU</button>
        <h1 class="text-lg font-bold tracking-tight mb-1 truncate px-8">${currentGenre.title}</h1>
        <div class="flex justify-between items-center text-white/80 text-[10px] font-medium uppercase tracking-widest mt-1 px-4">
            <span>Q <span id="q-idx">1</span>/${currentQuestions.length}</span>
            <span>Score <span id="val-quiz-score">0</span></span>
        </div>
      </div>
      
      <div class="p-4 md:p-8 overflow-y-auto flex-grow flex flex-col">
        <div class="w-full bg-slate-200 rounded-full h-1.5 mb-4 shrink-0">
          <div id="quiz-progress" class="${isComp ? 'bg-amber-500' : 'bg-emerald-500'} h-1.5 rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
        
        <div id="question-area" class="flex-grow flex flex-col">
          <h2 id="question-text" class="text-base md:text-xl font-bold text-slate-800 mb-4 md:mb-8 text-center min-h-[3rem] flex items-center justify-center"></h2>
          <div id="options-grid" class="grid grid-cols-1 gap-2 md:gap-3 mb-4"></div>
        </div>

        <div id="feedback-area" class="hidden text-center mt-auto pt-4 border-t border-slate-200 shrink-0">
          <p id="feedback-text" class="text-lg font-bold mb-3"></p>
          <button id="btn-next-question" class="w-full md:w-auto px-10 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-lg border border-transparent">Next</button>
        </div>
        
        <div id="result-area" class="hidden text-center space-y-4 md:space-y-6 pb-4">
          <div class="text-4xl md:text-5xl mb-2 animate-bounce">🎊</div>
          <h2 class="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Stage Clear!</h2>
          <p class="text-slate-500">Score: <span id="val-result-score" class="font-bold ${isComp ? 'text-amber-500' : 'text-emerald-600'} text-2xl">${score}</span> / ${currentQuestions.length}</p>
          
          <div id="review-list-container"></div>

          <div class="bg-slate-50 p-4 rounded-xl text-left text-xs md:text-sm text-slate-600 space-y-2 border border-slate-200 shadow-inner">
            <p class="font-bold text-center mb-2 text-base ${isComp ? 'text-amber-500' : 'text-emerald-600'}">Item Get!</p>
            <div class="flex justify-between items-center border-b border-slate-200 pb-1">
              <span>⚡ Power Module</span> <span id="bonus-power" class="font-bold text-lg text-emerald-600">+0</span>
            </div>
            <div class="flex justify-between items-center border-b border-slate-200 pb-1">
              <span>📐 Angle Gear</span> <span id="bonus-loft" class="font-bold text-lg text-emerald-600">+0°</span>
            </div>
            <div class="flex justify-between items-center">
              <span>💨 Assist Fan</span> <span id="bonus-wind" class="font-bold text-lg text-emerald-600">+0</span>
            </div>
          </div>

          <button id="btn-start-game" class="w-full py-3 md:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:translate-y-[-2px] transition-all border border-emerald-500/50">
            PLAY BONUS GAME 🤖
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('btn-next-question').onclick = nextQuestion;
  document.getElementById('btn-start-game').onclick = transitionToGame;
  document.getElementById('btn-quit-quiz').onclick = returnToMenu;
}

function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  
  // Reset card styles
  const card = document.getElementById('quiz-card');
  if (card) {
     card.classList.remove('bg-emerald-100', 'border-emerald-500', 'bg-rose-100', 'border-rose-500');
     card.classList.add('bg-white', 'border-slate-200');
  }

  // Set start time for speed bonus
  questionStartTime = Date.now();

  document.getElementById('q-idx').textContent = currentQuestionIndex + 1;
  document.getElementById('question-text').textContent = q.q;
  
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  
  const pct = (currentQuestionIndex / currentQuestions.length) * 100;
  document.getElementById('quiz-progress').style.width = `${pct}%`;

  // Create array of indices 0..n-1 and shuffle
  currentShuffledIndices = Array.from({length: q.options.length}, (_, i) => i);
  for (let i = currentShuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentShuffledIndices[i], currentShuffledIndices[j]] = [currentShuffledIndices[j], currentShuffledIndices[i]];
  }

  // Render options based on shuffled indices
  currentShuffledIndices.forEach((originalIndex, visualIndex) => {
    const btn = document.createElement('button');
    btn.className = `quiz-option w-full p-3 md:p-4 text-left border-2 border-slate-200 rounded-xl font-medium text-sm md:text-base text-slate-600 hover:border-emerald-500 hover:text-emerald-600 bg-white transition-all`;
    btn.textContent = q.options[originalIndex];
    // Pass visualIndex so we can select the button in DOM, but use originalIndex for correctness check
    btn.onclick = () => handleAnswer(visualIndex);
    grid.appendChild(btn);
  });
}

function handleAnswer(visualIndex) {
  const q = currentQuestions[currentQuestionIndex];
  const originalIndex = currentShuffledIndices[visualIndex];
  const isCorrect = originalIndex === q.a;
  
  const options = document.getElementById('options-grid').children;

  for (let btn of options) {
    btn.disabled = true;
    btn.classList.add('cursor-not-allowed', 'opacity-60');
  }

  const feedbackText = document.getElementById('feedback-text');
  const card = document.getElementById('quiz-card');
  
  // Create Explanation Element
  const expHtml = q.explanation ? 
    `<div class="mt-2 md:mt-4 p-3 md:p-4 text-xs md:text-sm text-left bg-slate-50 rounded-lg border border-slate-100 text-slate-600 animate-in fade-in slide-in-from-bottom-2 max-h-32 overflow-y-auto">
       <div class="font-bold text-[10px] uppercase mb-1 opacity-70">💡 Point</div>
       ${q.explanation}
    </div>` : '';
  
  if (isCorrect) {
    // Change card background to green
    card.classList.remove('bg-white', 'border-slate-200');
    card.classList.add('bg-emerald-100', 'border-emerald-500');

    options[visualIndex].classList.add('correct');
    options[visualIndex].classList.remove('opacity-60');
    score++;
    
    // Update live score display
    const scoreEl = document.getElementById('val-quiz-score');
    if(scoreEl) scoreEl.textContent = score;

    // Bonus Logic
    let totalPoints = 6;
    
    const elapsedSeconds = (Date.now() - questionStartTime) / 1000;
    if (elapsedSeconds <= 5) {
      totalPoints += 1;
    }
    
    if (currentGenre.id === 'comprehensive') {
        totalPoints = Math.ceil(totalPoints * 0.5);
    }
    
    const dist = distributePoints(totalPoints);
    bonuses.power += dist.power;
    bonuses.loft += dist.loft;
    bonuses.wind += dist.wind;
    
    let bStr = [];
    if (dist.power > 0) bStr.push(`Power +${dist.power}`);
    if (dist.loft > 0) bStr.push(`Angle +${dist.loft}`);
    if (dist.wind > 0) bStr.push(`Assist +${dist.wind}`);

    feedbackText.innerHTML = `
      <span class="text-emerald-600 block text-lg md:text-xl mb-1">Correct!</span>
      <span class="text-amber-500 text-xs md:text-sm font-bold">✨ ${bStr.join(' ')}</span>
      ${expHtml}
    `;
  } else {
    // Change card background to red
    card.classList.remove('bg-white', 'border-slate-200');
    card.classList.add('bg-rose-100', 'border-rose-500');

    options[visualIndex].classList.add('wrong');
    
    // Find the visual index of the correct answer to highlight it
    const correctVisualIndex = currentShuffledIndices.indexOf(q.a);
    if (correctVisualIndex !== -1) {
        options[correctVisualIndex].classList.add('correct');
        options[correctVisualIndex].classList.remove('opacity-60');
    }
    
    feedbackText.innerHTML = `<span class="text-rose-500 block text-lg md:text-xl">Incorrect...</span>${expHtml}`;
    
    // Record Wrong Answer
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
  currentQuestionIndex++;
  document.getElementById('feedback-area').classList.add('hidden');
  
  if (currentQuestionIndex < currentQuestions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  document.getElementById('question-area').classList.add('hidden');
  const resArea = document.getElementById('result-area');
  resArea.classList.remove('hidden');
  resArea.classList.add('fade-in');
  document.getElementById('quiz-progress').style.width = '100%';

  // FIX: Update the score in the result view. The span ID was added in renderQuizStructure.
  const scoreEl = document.getElementById('val-result-score');
  if (scoreEl) scoreEl.textContent = score;

  document.getElementById('bonus-power').textContent = `Lv. ${bonuses.power}`;
  document.getElementById('bonus-loft').textContent = `Lv. ${bonuses.loft}`;
  document.getElementById('bonus-wind').textContent = `Lv. ${bonuses.wind}`;

  // Render Review List
  const container = document.getElementById('review-list-container');
  if (wrongAnswers.length > 0) {
      container.innerHTML = `
        <div class="mt-4 md:mt-6 bg-rose-50 p-3 md:p-4 rounded-xl border border-rose-200 text-left">
          <h3 class="font-bold text-rose-600 mb-3 text-xs md:text-sm uppercase flex items-center gap-2"><span>⚠️</span> Review Mistakes</h3>
          <div class="space-y-3 max-h-32 md:max-h-40 overflow-y-auto pr-2 text-[10px] md:text-sm custom-scrollbar">
            ${wrongAnswers.map(w => `
              <div class="border-b border-rose-100 pb-2 last:border-0 last:pb-0">
                <p class="font-bold text-slate-700 mb-1 leading-snug">${w.q}</p>
                <div class="flex justify-between items-center">
                   <span class="text-rose-500 line-through decoration-2 opacity-70 truncate max-w-[45%]">${w.selected}</span>
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
  // 1. Reset Game Physics & Status (IDLE)
  resetGame();

  // 2. Apply New Parameters from Quiz
  // PASS SCORE TO APP.JS
  updateParams({
    power: bonuses.power,
    loft: bonuses.loft,
    wind: bonuses.wind
  }, currentGenre.id, score);

  // 3. Update UI Visibility
  els.quizContainer.classList.add('hidden');
  els.menuContainer.classList.add('hidden'); 
  els.gameContainer.classList.remove('blur-md');
  els.gameContainer.style.zIndex = '10';

  // 4. Auto Launch after a short delay for visual transition
  // This ensures params are set and UI is ready before physics starts
  setTimeout(() => {
    launchBall();
  }, 600);
}

// Directly call init since module script is deferred by default
init();