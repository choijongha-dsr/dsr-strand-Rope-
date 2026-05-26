const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const XLSX = require('xlsx');

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
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return {}; }
}

function writeJson(file, data) {
  const p = path.join(DATA_DIR, file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// 기계명 정규화 (클라이언트와 동일 로직)
const MACH_NORM = {
  '16"x35b':'m1','12"x36b-1':'m2','12"x36b-2':'m3',
  '12"x25b-1':'m4','12"x35b-2':'m5','12"x42b':'m6',
  '10"x35b':'m7','8"x36b':'m8',
  '12"x6b-1':'m9','12"x6b-2':'m10','12"x6b-3':'m11','12"x6b-4':'m12',
  '12"x9b':'m13','14"x6b':'m14','16"x6b':'m15'
};
function normMach(raw) {
  if (!raw) return null;
  return MACH_NORM[String(raw).replace(/[\r\n\s]+/g,'').replace(/“|”/g,'"').toLowerCase()] || null;
}

// ── REST API ───────────────────────────────────────────────────

app.get('/api/stranding/data', (req, res) => res.json(readJson('stranding.json')));
app.post('/api/stranding/data', (req, res) => { writeJson('stranding.json', req.body); res.json({ ok: true }); });

app.get('/api/ilbo/data', (req, res) => res.json(readJson('ilbo.json')));
app.post('/api/ilbo/data', (req, res) => { writeJson('ilbo.json', req.body); res.json({ ok: true }); });

app.get('/api/excel-path', (req, res) => {
  res.json({ path: EXCEL_PATH, exists: fs.existsSync(EXCEL_PATH) });
});

// ── EXCEL 쓰기 API (양방향 동기화) ─────────────────────────────
app.post('/api/excel/write', (req, res) => {
  if (!fs.existsSync(EXCEL_PATH)) {
    return res.json({ ok: false, error: '엑셀 파일을 찾을 수 없습니다.' });
  }

  const { prodData = {}, baseOrders = {}, prevData = {} } = req.body;

  try {
    const buf = fs.readFileSync(EXCEL_PATH);
    const wb  = XLSX.read(buf, { type: 'buffer', cellStyles: true, cellFormulas: true });

    // 최신 날짜 시트 찾기
    const dateSheets = wb.SheetNames.filter(n => /^\d+\.\d+$/.test(n.trim()));
    if (!dateSheets.length) return res.json({ ok: false, error: '날짜 형식 시트를 찾을 수 없습니다.' });
    const sheetName = dateSheets[dateSheets.length - 1];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    // 기계 행 위치 파악
    const machRows = [];
    rows.forEach((row, i) => {
      if (row[0] && typeof row[0] === 'string' && row[0].includes('"') && row[0] !== '기계명') {
        const mId = normMach(row[0]);
        if (mId) machRows.push({ idx: i, mId });
      }
    });

    let updatedCells = 0;

    function setCell(ri, ci, val, type) {
      const addr = XLSX.utils.encode_cell({ r: ri, c: ci });
      const existing = ws[addr] || {};
      ws[addr] = { ...existing, v: val, t: type };
      delete ws[addr].f; // 수식 제거 (값으로 덮어씀)
      updatedCells++;
    }

    machRows.forEach(({ idx: mIdx, mId }, mi) => {
      const nextIdx = machRows[mi + 1]?.idx ?? rows.length;
      const orders  = baseOrders[mId] || [];

      // 오더 행 업데이트
      let lastNo = null;
      for (let ri = mIdx + 1; ri < nextIdx; ri++) {
        const row = rows[ri];
        if (!row) continue;

        // noGroup 추적 (클라이언트와 동일 로직)
        let noVal = '';
        if (row[0] != null && String(row[0]).trim()) noVal = String(row[0]).trim();
        else if (row[1] != null && String(row[1]).trim()) noVal = String(row[1]).trim();
        if (noVal && !noVal.includes('"') && noVal !== '기계명') lastNo = noVal;
        const currentNo = lastNo || String(ri);

        const spec = row[2] ? String(row[2]).trim() : '';
        if (!spec) continue;

        const order = orders.find(o => o.proc === spec && o.noGroup === currentNo);
        if (!order) continue;

        const pd = prodData[order.id];
        if (!pd) continue;

        if (pd.day   != null) setCell(ri, 9,  Number(pd.day),   'n');
        if (pd.night != null) setCell(ri, 10, Number(pd.night), 'n');
        if (pd.status != null) {
          const stVal = pd.status === '완료' ? '완' : pd.status;
          setCell(ri, 11, stVal, 's');
        }
      }

      // 기계 행 주간/야간 합계 업데이트
      const dayTotal   = orders.reduce((s, o) => s + (Number(prodData[o.id]?.day)   || 0), 0);
      const nightTotal = orders.reduce((s, o) => s + (Number(prodData[o.id]?.night) || 0), 0);
      setCell(mIdx, 9,  dayTotal,   'n');
      setCell(mIdx, 10, nightTotal, 'n');
    });

    // 내가 쓴 변경은 무시 (무한루프 방지)
    suppressUntil = Date.now() + 15000;

    const outBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
    fs.writeFileSync(EXCEL_PATH, outBuf);

    res.json({ ok: true, updatedCells, sheet: sheetName });
  } catch (e) {
    const isLocked = ['EACCES','EBUSY','EPERM'].includes(e.code) || /lock/i.test(e.message);
    res.json({
      ok: false,
      error: isLocked
        ? '엑셀 파일이 열려 있습니다. 파일을 닫고 다시 시도해주세요.'
        : e.message
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stranding.html'));
});

// ── WEBSOCKET (Excel → 웹) ─────────────────────────────────────
let suppressUntil = 0;

function broadcastExcel(reason) {
  if (wss.clients.size === 0) return;
  if (Date.now() < suppressUntil) {
    console.log(`[Excel] ${reason} 감지됐지만 쓰기 직후라 무시`);
    return;
  }
  try {
    const buf    = fs.readFileSync(EXCEL_PATH);
    const base64 = buf.toString('base64');
    const msg    = JSON.stringify({ type: 'excel-update', data: base64, reason });
    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
    console.log(`[Excel] ${reason} → ${wss.clients.size}개 클라이언트에 전송`);
  } catch (e) {
    console.warn(`[Excel] 읽기 실패: ${e.message}`);
    const err = JSON.stringify({ type: 'excel-error', message: e.message });
    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(err); });
  }
}

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

// 네트워크 공유 폴더 감시 (폴링 방식)
const watcher = chokidar.watch(EXCEL_PATH, {
  usePolling: true,
  interval: 5000,
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 }
});

watcher.on('change', () => broadcastExcel('파일 변경'));
watcher.on('add',    () => broadcastExcel('파일 생성'));
watcher.on('error',  err => console.warn(`[Watcher] 오류: ${err.message}`));

console.log(`[Excel] 감시 중: ${EXCEL_PATH}`);

server.listen(PORT, () => {
  console.log(`DSR 연선공정표 서버 실행 중: http://localhost:${PORT}`);
});
