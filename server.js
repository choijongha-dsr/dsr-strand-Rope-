const express  = require('express');
const http     = require('http');
const WebSocket= require('ws');
const chokidar = require('chokidar');
const XLSX     = require('xlsx');
const fs       = require('fs');
const path     = require('path');

const PORT       = 3000;
const EXCEL_PATH = '\\\\10.10.12.61\\공정 공유폴더\\공정폴더\\2026공정표.xlsx';
const DATA_DIR   = path.join(__dirname, 'data');
const PROD_FILE  = path.join(DATA_DIR, 'production.json');
const CFG_FILE   = path.join(__dirname, 'config.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── 기계명 정규화 ──────────────────────────────────────────────
const MACH_NORM = {
  '16"x35b' :'m1', '12"x36b-1':'m2', '12"x36b-2':'m3', '12"x25b-1':'m4',
  '12"x35b-2':'m5', '12"x42b'  :'m6', '10"x35b'  :'m7', '8"x36b'   :'m8',
  '12"x6b'  :'m9', '14"x6b'   :'m10','16"x6b'   :'m11','10"x6b-2' :'m12',
  '12"x9b'  :'m13','14"x18b'  :'m14','24"x6b-2' :'m15'
};
const MACHINE_NAMES = {
  m1:'16"x35B', m2:'12"X36B-1', m3:'12"X36B-2', m4:'12"x25B-1',
  m5:'12"x35B-2', m6:'12"x42B', m7:'10"x35B', m8:'8"x36B',
  m9:'12"x6B', m10:'14"X6B', m11:'16"X6B', m12:'10"X6B-2',
  m13:'12"x9B', m14:'14"X18B', m15:'24"X6B-2'
};
function normMach(raw) {
  if (!raw) return null;
  return MACH_NORM[String(raw).replace(/[\r\n\s]+/g,'').replace(/[""]/g,'"').toLowerCase()] || null;
}

// ── 생산 데이터 ────────────────────────────────────────────────
function loadProd() {
  try { return JSON.parse(fs.readFileSync(PROD_FILE,'utf8')); }
  catch { return {}; }
}
function saveProd(data) {
  fs.writeFileSync(PROD_FILE, JSON.stringify(data,null,2), 'utf8');
}

// ── 설정 ────────────────────────────────────────────────────────
function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CFG_FILE,'utf8')); }
  catch { return { machines:['m1','m2','m3'], kiosk_name:'DSR 연선' }; }
}

// ── Excel 파싱 (서버사이드) ─────────────────────────────────────
const LAYER_KEYS   = ['중상층','중중층','중하층','코아층','상층'];
const STATUS_OPTS  = ['대기','IW완료','ST진행','ST완료','중층완료','1챠지완','완료'];

function parseExcel() {
  if (!fs.existsSync(EXCEL_PATH)) return null;
  try {
    const wb         = XLSX.read(fs.readFileSync(EXCEL_PATH), { type:'buffer' });
    const dateSheets = wb.SheetNames.filter(n => /^\d+\.\d+$/.test(n.trim()));
    if (!dateSheets.length) return null;

    const ws   = wb.Sheets[dateSheets[dateSheets.length-1]];
    const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:null });

    const machIdxs = [];
    rows.forEach((r,i) => {
      if (r[0] && typeof r[0]==='string' && r[0].includes('"') && r[0]!=='기계명')
        machIdxs.push(i);
    });

    const orders = {};
    machIdxs.forEach((mIdx, mi) => {
      const mId = normMach(rows[mIdx][0]);
      if (!mId) return;
      orders[mId] = [];

      let lastNo = null;
      const nextIdx = machIdxs[mi+1] ?? rows.length;

      for (let ri = mIdx+1; ri < nextIdx; ri++) {
        const row = rows[ri];
        if (!row) continue;
        const spec = row[2];
        if (!spec || typeof spec!=='string' || !spec.trim()) continue;
        const specStr   = spec.trim();
        const hasQty    = Number(row[8]) > 0;
        const layerName = LAYER_KEYS.find(k => specStr.includes(k)) || '';
        if (!/^\d/.test(specStr) && !layerName && !hasQty) continue;

        let noVal = '';
        if (row[0]!=null && String(row[0]).trim()) noVal = String(row[0]).trim();
        else if (row[1]!=null && String(row[1]).trim()) noVal = String(row[1]).trim();
        if (noVal && !noVal.includes('"') && noVal!=='기계명') lastNo = noVal;
        const currentNo = lastNo || String(ri);

        const rawSt = row[11] ? String(row[11]).trim() : '';
        const initSt = (() => {
          if (!rawSt) return '대기';
          if (rawSt==='완') return 'ST완료';
          if (/^IW$/i.test(rawSt)||/^IW완료$/i.test(rawSt)) return 'IW완료';
          return STATUS_OPTS.find(s=>s.toLowerCase()===rawSt.toLowerCase()) || '대기';
        })();

        orders[mId].push({
          id:        `${mId}||${currentNo}||${specStr}`,
          noGroup:   currentNo,
          proc:      specStr,
          qty:       Number(row[8])  || 0,
          initDay:   Number(row[9])  || 0,
          initNight: Number(row[10]) || 0,
          initSt,
          wire:      row[15] ? String(row[15]).trim() : '',
          ts:        row[17] ? String(row[17]).trim() : '',
          note:      row[18] ? String(row[18]).trim() : '',
        });
      }
    });
    return orders;
  } catch(e) {
    console.warn('[Excel] 파싱 오류:', e.message);
    return null;
  }
}

// ── REST API ───────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  const result = {
    kiosk_name: cfg.kiosk_name || 'DSR 연선',
    machines: (cfg.machines || []).map(id => ({
      id, name: MACHINE_NAMES[id] || id
    }))
  };
  res.json(result);
});

app.get('/api/orders', (req, res) => {
  res.json(parseExcel() || {});
});

app.get('/api/production', (req, res) => {
  res.json(loadProd());
});

app.post('/api/production', (req, res) => {
  const prod = loadProd();
  Object.assign(prod, req.body);
  saveProd(prod);
  broadcast({ type:'prod-update', data:prod });
  console.log(`[저장] ${Object.keys(req.body).length}개 오더 업데이트`);
  res.json({ ok:true });
});

app.get('/api/excel-status', (req, res) => {
  res.json({ exists: fs.existsSync(EXCEL_PATH), path: EXCEL_PATH });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kiosk.html'));
});

// ── WebSocket ──────────────────────────────────────────────────
function broadcast(msg) {
  const str = JSON.stringify(msg);
  wss.clients.forEach(c => { if (c.readyState===WebSocket.OPEN) c.send(str); });
}

wss.on('connection', ws => {
  console.log('[WS] 클라이언트 연결');
  const orders = parseExcel();
  if (orders) ws.send(JSON.stringify({ type:'orders', data:orders }));
  ws.send(JSON.stringify({ type:'prod', data:loadProd() }));
  ws.on('close', () => console.log('[WS] 연결 종료'));
});

// ── Excel 감시 ─────────────────────────────────────────────────
chokidar.watch(EXCEL_PATH, {
  usePolling:true, interval:2000, ignoreInitial:true,
  awaitWriteFinish:{ stabilityThreshold:1500, pollInterval:300 }
}).on('change', () => {
  console.log('[Excel] 변경 감지 → 전송');
  const orders = parseExcel();
  if (orders) broadcast({ type:'orders', data:orders });
}).on('error', err => console.warn('[Watcher] 오류:', err.message));

console.log(`[Excel] 감시 중: ${EXCEL_PATH}`);

server.listen(PORT, () => {
  console.log(`\nDSR 연선공정표 서버: http://localhost:${PORT}\n`);
});
