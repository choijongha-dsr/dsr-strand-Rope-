const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// data 디렉토리 없으면 자동 생성 (Railway 등 배포 환경 대응)
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readJson(file) {
  const p = path.join(DATA_DIR, file);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function writeJson(file, data) {
  const p = path.join(DATA_DIR, file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// 연선공정표 데이터
app.get('/api/stranding/data', (req, res) => {
  res.json(readJson('stranding.json'));
});

app.post('/api/stranding/data', (req, res) => {
  writeJson('stranding.json', req.body);
  res.json({ ok: true });
});

// 작업일보 데이터
app.get('/api/ilbo/data', (req, res) => {
  res.json(readJson('ilbo.json'));
});

app.post('/api/ilbo/data', (req, res) => {
  writeJson('ilbo.json', req.body);
  res.json({ ok: true });
});

// SPA fallback: /stranding → stranding.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stranding.html'));
});

app.listen(PORT, () => {
  console.log(`DSR 연선공정표 서버 실행 중: http://localhost:${PORT}`);
});
