import fs from 'fs';

const content = fs.readFileSync('gacha.js', 'utf8');

// Match simple declaration of items using a regex
const matches = [];
const regex = /id:\s*(\d+),\s*name:\s*"([^"]+)",\s*rarity:\s*(\d+),\s*icon:\s*"([^"]+)",\s*genre_id:\s*"([^"]+)"/g;
let m;
while ((m = regex.exec(content)) !== null) {
  matches.push({
    index: m.index,
    id: parseInt(m[1]),
    name: m[2],
    rarity: parseInt(m[3]),
    icon: m[4],
    genre_id: m[5],
  });
}

console.log(`Found ${matches.length} items by simple regex:`);
const byGenre = {};
matches.forEach(item => {
  if (!byGenre[item.genre_id]) byGenre[item.genre_id] = [];
  byGenre[item.genre_id].push(item);
});

for (const [genre, items] of Object.entries(byGenre)) {
  console.log(`\nGenre: ${genre} (${items.length} items):`);
  items.forEach(item => {
    console.log(`   id: ${item.id}, name: "${item.name}"`);
  });
}
