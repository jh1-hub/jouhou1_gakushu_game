import fs from 'fs';

const path = '/.gemini/antigravity/brain/fabc13ed-b092-41c7-974d-46ffecd2a62a/.system_generated/logs/transcript.jsonl';
try {
  if (fs.existsSync(path)) {
    const stat = fs.statSync(path);
    console.log(`File exists! Size: ${stat.size} bytes`);
  } else {
    console.log('File does not exist at absolute path');
  }
} catch (e) {
  console.error(e);
}
