const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// 감시할 Excel 파일 경로 (환경변수로 변경 가능)
const EXCEL_PATH = process.env.EXCEL_PATH ||
  '\\\\10.10.12.61\\공정 공유폴더\\공정폴더\\2026공정표.xlsx';

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

// Excel 감시 경로 조회 API
app.get('/api/excel-path', (req, res) => {
  res.json({ path: EXCEL_PATH, exists: fs.existsSync(EXCEL_PATH) });
});

// SPA fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stranding.html'));
});

// 연결된 모든 클라이언트에 Excel 파일 브로드캐스트
function broadcastExcel(reason) {
  if (wss.clients.size === 0) return;
  try {
    const buf = fs.readFileSync(EXCEL_PATH);
    const base64 = buf.toString('base64');
    const msg = JSON.stringify({ type: 'excel-update', data: base64, reason });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    });
    console.log(`[Excel] ${reason} → ${wss.clients.size}개 클라이언트에 전송`);
  } catch (e) {
    console.warn(`[Excel] 읽기 실패: ${e.message}`);
    const errMsg = JSON.stringify({ type: 'excel-error', message: e.message });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(errMsg);
    });
  }
}

// 신규 WebSocket 연결 시 즉시 현재 파일 전송
wss.on('connection', (ws) => {
  console.log('[WS] 클라이언트 연결');
  ws.on('close', () => console.log('[WS] 클라이언트 연결 종료'));
  if (fs.existsSync(EXCEL_PATH)) {
    try {
      const buf = fs.readFileSync(EXCEL_PATH);
      ws.send(JSON.stringify({ type: 'excel-update', data: buf.toString('base64'), reason: '연결 초기화' }));
    } catch (e) {
      console.warn(`[Excel] 초기 전송 실패: ${e.message}`);
    }
  }
});

// 네트워크 공유 폴더는 usePolling 필수
const watcher = chokidar.watch(EXCEL_PATH, {
  usePolling: true,
  interval: 5000,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 500
  }
});

watcher.on('change', () => broadcastExcel('파일 변경'));
watcher.on('add',    () => broadcastExcel('파일 생성'));
watcher.on('error',  err => console.warn(`[Watcher] 오류: ${err.message}`));

console.log(`[Excel] 감시 중: ${EXCEL_PATH}`);

server.listen(PORT, () => {
  console.log(`DSR 연선공정표 서버 실행 중: http://localhost:${PORT}`);
});
