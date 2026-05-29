#!/usr/bin/env python3
"""Rewrite openWorkReport() modal to A4 paper form style."""

filepath = '/home/user/dsr-strand-Rope-/public/stranding.html'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# ── new modal body content (replaces lines 1951-2201, i.e. indices 1950-2200) ──
NEW_MODAL = """\

        <!-- 오더 선택 바 -->
        <div style="background:#fff;border-radius:10px;padding:10px 12px;margin-bottom:10px;
          display:flex;align-items:center;gap:8px;flex-wrap:wrap;border:2px solid #dde2ea;
          box-shadow:0 1px 6px rgba(0,0,0,0.07);">
          <label style="font-size:14px;font-weight:800;color:#333;">📌 No.</label>
          <select id="wrOrder" onchange="_wrFillFromOrder()" style="flex:1;min-width:180px;
            padding:10px 12px;border:2px solid #ccc;border-radius:8px;font-family:inherit;
            font-size:14px;min-height:46px;touch-action:manipulation;background:#f9fafc;">${optHtml}</select>
          <div style="display:flex;gap:6px;flex-shrink:0;">
            <button id="wr-shift-day" onclick="_wrSetShift('주')"
              style="padding:10px 18px;border-radius:8px;border:2px solid #2980b9;font-size:14px;
              font-weight:800;background:#2980b9;color:#fff;cursor:pointer;min-height:46px;
              touch-action:manipulation;">☀️ 주간</button>
            <button id="wr-shift-night" onclick="_wrSetShift('야')"
              style="padding:10px 18px;border-radius:8px;border:2px solid #ccc;font-size:14px;
              font-weight:800;background:#f0f0f0;color:#888;cursor:pointer;min-height:46px;
              touch-action:manipulation;">🌙 야간</button>
            <input type="hidden" id="wr-shift" value="주">
          </div>
        </div>

        <!-- ═══ A4 용지 (min-width 고정 → 좁은 화면에서 body가 가로스크롤) ═══ -->
        <div style="min-width:700px;background:#fff;padding:10px 12px 14px;
          box-shadow:0 3px 14px rgba(0,0,0,0.22);border:1px solid #bbb;border-radius:4px;">

          <!-- ① 타이틀 + 결재 -->
          <table style="width:100%;border-collapse:collapse;border:2px solid #222;">
            <tr>
              <td rowspan="2" style="font-size:20px;font-weight:900;letter-spacing:5px;
                text-align:center;border-right:2px solid #222;padding:10px 0;
                vertical-align:middle;">STRAND 작업일보</td>
              <td style="background:#d0d0d0;font-size:11px;font-weight:800;text-align:center;
                border-bottom:1.5px solid #222;padding:3px 10px;width:54px;">결&nbsp;&nbsp;&nbsp;재</td>
              <td style="background:#d0d0d0;font-size:11px;font-weight:800;text-align:center;
                border-left:1.5px solid #222;border-bottom:1.5px solid #222;padding:3px 10px;width:54px;">주&nbsp;&nbsp;임</td>
              <td style="background:#d0d0d0;font-size:11px;font-weight:800;text-align:center;
                border-left:1.5px solid #222;border-bottom:1.5px solid #222;padding:3px 10px;width:54px;">사&nbsp;&nbsp;장</td>
            </tr>
            <tr>
              <td style="background:#d0d0d0;border-right:1.5px solid #222;height:46px;"></td>
              <td style="border-right:1.5px solid #222;height:46px;"></td>
              <td style="height:46px;"></td>
            </tr>
          </table>

          <!-- ② 작업일 + 기계명/작업자 -->
          <table style="width:100%;border-collapse:collapse;border:2px solid #222;border-top:none;margin-top:-1px;">
            <tr style="height:40px;">
              <th style="background:#d0d0d0;font-size:12px;font-weight:800;text-align:center;
                border-right:2px solid #222;padding:0 10px;white-space:nowrap;width:72px;">작 업 일</th>
              <td colspan="3" style="padding:0 12px;">
                <span style="font-size:14px;">20</span>
                <input id="wr-yr" maxlength="2" value="${yr}" inputmode="numeric"
                  style="width:26px;border:none;border-bottom:2px solid #444;outline:none;font-size:15px;text-align:center;background:transparent;font-weight:700;">
                <span style="font-size:14px;">년</span>
                <input id="wr-mo" maxlength="2" value="${mo}" inputmode="numeric"
                  style="width:24px;border:none;border-bottom:2px solid #444;outline:none;font-size:15px;text-align:center;background:transparent;font-weight:700;">
                <span style="font-size:14px;">월</span>
                <input id="wr-dy" maxlength="2" value="${dy}" inputmode="numeric"
                  style="width:24px;border:none;border-bottom:2px solid #444;outline:none;font-size:15px;text-align:center;background:transparent;font-weight:700;">
                <span style="font-size:14px;">일</span>
                <select id="wr-dow" style="border:none;border-bottom:2px solid #444;outline:none;font-size:15px;background:transparent;font-weight:700;min-height:32px;">
                  <option value=""></option>
                  <option ${dow==='월'?'selected':''}>월</option>
                  <option ${dow==='화'?'selected':''}>화</option>
                  <option ${dow==='수'?'selected':''}>수</option>
                  <option ${dow==='목'?'selected':''}>목</option>
                  <option ${dow==='금'?'selected':''}>금</option>
                  <option ${dow==='토'?'selected':''}>토</option>
                  <option ${dow==='일'?'selected':''}>일</option>
                </select>
                <span style="font-size:14px;">요일</span>
              </td>
            </tr>
            <tr style="height:40px;border-top:1.5px solid #222;">
              <th style="background:#d0d0d0;font-size:12px;font-weight:800;text-align:center;
                border-right:2px solid #222;border-top:1.5px solid #222;padding:0 10px;white-space:nowrap;">기 계 명</th>
              <td style="padding:0 12px;font-size:15px;font-weight:900;color:#0f2744;
                border-right:2px solid #222;border-top:1.5px solid #222;min-width:80px;">${m.name}</td>
              <th style="background:#d0d0d0;font-size:12px;font-weight:800;text-align:center;
                border-right:2px solid #222;border-top:1.5px solid #222;padding:0 10px;white-space:nowrap;width:72px;">작 업 자</th>
              <td style="padding:0;border-top:1.5px solid #222;">
                <div style="display:flex;align-items:center;">
                  <input id="wr-worker" type="text" placeholder="이름 입력"
                    style="flex:1;border:none;outline:none;font-size:14px;background:transparent;padding:0 10px;min-height:38px;touch-action:manipulation;">
                  <select id="wr-shift2" style="border:none;border-left:2px solid #222;outline:none;font-size:14px;background:#f5f7fb;padding:0 8px;min-height:38px;font-weight:700;touch-action:manipulation;">
                    <option value="주">(주)</option><option value="야">(야)</option>
                  </select>
                </div>
              </td>
            </tr>
          </table>

          <!-- ③ 작업내역 -->
          <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:-1px;">
            <table style="width:100%;min-width:580px;border-collapse:collapse;border:2px solid #222;border-top:none;">
              <thead>
                <tr style="height:28px;">
                  <th colspan="9" style="border:1px solid #555;font-size:12px;text-align:center;background:#c8d0dc;padding:4px;font-weight:800;letter-spacing:1px;">작 업 내 역</th>
                </tr>
                <tr style="height:26px;">
                  <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;width:44px;">번호</th>
                  <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;width:34px;">표면</th>
                  <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;min-width:140px;">구 성</th>
                  <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;width:54px;">연방향</th>
                  <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;width:34px;">도유</th>
                  <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;width:58px;">경(mm)</th>
                  <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;width:58px;">GRADE</th>
                  <th style="border:1px solid #555;background:#fffde7;font-size:11px;text-align:center;width:80px;font-weight:900;color:#c0392b;">생산량(M)</th>
                  <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;width:80px;">S/T DIA</th>
                </tr>
              </thead>
              <tbody id="wr-ord-body"></tbody>
              <tfoot>
                <tr style="height:30px;">
                  <td colspan="7" style="border:1px solid #555;background:#d0d0d0;text-align:right;padding-right:10px;font-weight:800;font-size:12px;">합 계</td>
                  <td id="wr-total" style="border:1px solid #555;font-weight:900;font-size:16px;color:#c0392b;text-align:center;background:#fffde7;"></td>
                  <td style="border:1px solid #555;"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- ④ 보빈검사표 -->
          <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:-1px;">
            <table style="border-collapse:collapse;min-width:600px;width:100%;border:2px solid #222;border-top:none;">
              <thead>
                <tr style="height:28px;">
                  <th colspan="13" style="border:1px solid #555;font-size:12px;text-align:center;background:#c8d0dc;padding:4px;font-weight:800;letter-spacing:1px;">보 빈 검 사 표</th>
                </tr>
                <tr style="height:24px;">
                  <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;min-width:90px;padding:0 4px;">검사항목</th>
                  ${Array.from({length:6},(_,i)=>`<th style="border:1px solid #555;background:#d4e8f5;font-size:11px;text-align:center;min-width:44px;">${i+1}번</th>`).join('')}
                  ${Array.from({length:6},(_,i)=>`<th style="border:1px solid #555;background:#d4f5e4;font-size:11px;text-align:center;min-width:44px;">${i+1}번</th>`).join('')}
                </tr>
              </thead>
              <tbody id="wr-bb-body"></tbody>
            </table>
          </div>

          <!-- ⑤ 소선 DIA(mm) -->
          <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:-1px;">
            <table style="border-collapse:collapse;width:100%;min-width:500px;border:2px solid #222;border-top:none;">
              <thead>
                <tr style="height:28px;">
                  <th colspan="12" style="border:1px solid #555;font-size:12px;text-align:center;background:#c8d0dc;padding:4px;font-weight:800;letter-spacing:1px;">소 선 DIA(mm)</th>
                </tr>
              </thead>
              <colgroup><col style="width:76px"><col><col><col><col><col><col style="width:10px"><col><col><col><col><col></colgroup>
              <tbody>
                <tr style="height:22px;">
                  <td rowspan="2" style="border:1px solid #555;background:#d0d0d0;font-weight:700;text-align:center;font-size:11px;padding:3px;vertical-align:middle;">소선 DIA(mm)</td>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">d0</th>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">d1</th>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">dw,df</th>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">ds</th>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">d2</th>
                  <td style="background:#bbb;border-top:1px solid #555;border-bottom:1px solid #555;width:10px;"></td>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">d0</th>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">d1</th>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">dw,df</th>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">ds</th>
                  <th style="border:1px solid #555;background:#dce8f0;font-size:11px;text-align:center;padding:2px;">d2</th>
                </tr>
                <tr style="height:30px;">
                  ${['o1d0','o1d1','o1dwdf','o1ds','o1d2'].map(k=>`<td style="border:1px solid #555;padding:0;"><input type="number" class="wr-sd" data-k="${k}" step="0.001" style="width:100%;border:none;outline:none;font-size:13px;text-align:center;background:transparent;padding:3px;touch-action:manipulation;"></td>`).join('')}
                  <td style="background:#bbb;border-top:1px solid #555;border-bottom:1px solid #555;"></td>
                  ${['o2d0','o2d1','o2dwdf','o2ds','o2d2'].map(k=>`<td style="border:1px solid #555;padding:0;"><input type="number" class="wr-sd" data-k="${k}" step="0.001" style="width:100%;border:none;outline:none;font-size:13px;text-align:center;background:transparent;padding:3px;touch-action:manipulation;"></td>`).join('')}
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ⑥ 불가동요인 -->
          <table style="width:100%;border-collapse:collapse;border:2px solid #222;border-top:none;margin-top:-1px;">
            <tr>
              <th style="background:#d0d0d0;font-size:11px;font-weight:800;text-align:center;
                border-right:2px solid #222;padding:6px 10px;white-space:nowrap;width:76px;vertical-align:middle;">불 가 동<br>요 인</th>
              <td style="padding:8px 12px;">
                <div style="font-size:12px;color:#333;margin-bottom:6px;">① 인원부족 &nbsp; ② 재료대기 &nbsp; ③ 기계고장 &nbsp; ④ 공정변경 &nbsp; ⑤ 사고처리</div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:12px;color:#666;font-weight:700;">※ 해당 번호 :</span>
                  <input id="wr-dt" type="text" placeholder="예: ①③" inputmode="text"
                    style="flex:1;border:none;border-bottom:2px solid #444;outline:none;font-size:16px;font-weight:700;background:transparent;padding:4px 2px;min-height:36px;touch-action:manipulation;">
                </div>
              </td>
            </tr>
          </table>

          <!-- ⑦ 시간별발생내역 -->
          <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:-1px;border:2px solid #222;border-top:none;">
            <table style="border-collapse:collapse;min-width:640px;">
              <thead>
                <tr style="height:28px;">
                  <th colspan="25" style="border:1px solid #555;font-size:12px;text-align:center;background:#c8d0dc;padding:4px;font-weight:800;letter-spacing:1px;">시 간 별 발 생 내 역</th>
                </tr>
                <tr style="height:24px;">
                  <th style="border:1px solid #555;background:#d0d0d0;writing-mode:vertical-rl;font-size:10px;padding:2px;min-width:24px;">시간</th>
                  ${Array.from({length:24},(_,i)=>`<th style="border:1px solid #555;background:#d0d0d0;font-size:12px;text-align:center;min-width:32px;">${i+1}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                <tr style="height:54px;">
                  <td style="border:1px solid #555;background:#d0d0d0;writing-mode:vertical-rl;font-size:10px;text-align:center;">발생내역</td>
                  ${Array.from({length:24},(_,i)=>`<td style="border:1px solid #555;padding:0;min-width:32px;"><textarea class="wr-hr" data-h="${i+1}" style="width:100%;height:52px;border:none;outline:none;font-size:11px;resize:none;background:transparent;padding:2px;touch-action:manipulation;"></textarea></td>`).join('')}
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ⑧ 단선내역 -->
          <table style="width:100%;border-collapse:collapse;border:2px solid #222;border-top:none;margin-top:-1px;">
            <tr>
              <th style="background:#d0d0d0;font-size:11px;font-weight:800;text-align:center;
                border-right:2px solid #222;padding:6px 10px;white-space:nowrap;width:76px;vertical-align:middle;">단 선 내 역<br>시 편 첨 부</th>
              <td style="padding:6px 8px;">
                <textarea id="wr-wb" placeholder="단선 내역을 입력하세요..."
                  style="width:100%;height:58px;border:2px solid #dde2ea;border-radius:4px;outline:none;font-size:13px;resize:none;font-family:inherit;padding:6px;touch-action:manipulation;box-sizing:border-box;"></textarea>
              </td>
            </tr>
          </table>

          <!-- ⑨ 환경정리상태 (3정5S) -->
          <table style="width:100%;border-collapse:collapse;border:2px solid #222;border-top:none;margin-top:-1px;">
            <thead>
              <tr style="height:28px;">
                <th colspan="3" style="border:1px solid #555;font-size:12px;text-align:center;background:#c8d0dc;padding:4px;font-weight:800;letter-spacing:1px;">환 경 정 리 상 태 (3정5S)</th>
              </tr>
              <tr style="height:24px;">
                <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;font-weight:800;">급선대 및 주변</th>
                <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;font-weight:800;">동체 및 주변</th>
                <th style="border:1px solid #555;background:#d0d0d0;font-size:11px;text-align:center;font-weight:800;">권취기 및 주변</th>
              </tr>
            </thead>
            <tbody>
              <tr style="height:52px;">
                <td style="border:1px solid #555;text-align:center;padding:6px 4px;vertical-align:middle;">
                  <button class="touch-env-btn" id="wr-ef-y" onclick="_wrToggleEnv('feed','양호')">✅ 양호</button>
                  <button class="touch-env-btn" id="wr-ef-b" onclick="_wrToggleEnv('feed','불량')">❌ 불량</button>
                </td>
                <td style="border:1px solid #555;text-align:center;padding:6px 4px;vertical-align:middle;">
                  <button class="touch-env-btn" id="wr-eb-y" onclick="_wrToggleEnv('body','양호')">✅ 양호</button>
                  <button class="touch-env-btn" id="wr-eb-b" onclick="_wrToggleEnv('body','불량')">❌ 불량</button>
                </td>
                <td style="border:1px solid #555;text-align:center;padding:6px 4px;vertical-align:middle;">
                  <button class="touch-env-btn" id="wr-ew-y" onclick="_wrToggleEnv('wind','양호')">✅ 양호</button>
                  <button class="touch-env-btn" id="wr-ew-b" onclick="_wrToggleEnv('wind','불량')">❌ 불량</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 양식 footer -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:2px 4px;">
            <span style="font-size:11px;color:#888;">양식 I-207-1</span>
            <span style="font-size:12px;font-weight:800;color:#0f2744;">DSR 제강(주)</span>
            <span style="font-size:11px;color:#888;">A4(297×210)</span>
          </div>
        </div><!-- end A4 paper -->

        <!-- 하단 버튼 -->
        <div style="display:flex;gap:12px;margin-top:10px;padding-bottom:8px;">
          <button class="btn-secondary" style="flex:1;min-height:48px;font-size:15px;" onclick="closeWorkReport()">✖ 취소</button>
          <button class="btn-primary" style="flex:2;min-height:48px;font-size:15px;" onclick="_wrSave()">✅ 저장 및 공정표 반영</button>
        </div>

"""

# lines are 1-indexed; Python list is 0-indexed
# Replace lines 1951-2201 (indices 1950-2200 inclusive)
START_IDX = 1950   # line 1951
END_IDX   = 2201   # line 2201 inclusive → slice [1950:2201]

new_lines = lines[:START_IDX] + [NEW_MODAL] + lines[END_IDX:]

# ── Also remove the duplicate soson DIA rows appended inside _wrFillFromOrder() ──
# Find the comment "// 소선 DIA(mm) 2행" and remove from there through the closing backtick+semicolon
# We do string-level replacement on the joined content.
content_out = ''.join(new_lines)

# The block to remove: starts with "    // 소선 DIA(mm) 2행\n" and ends before "    bbBody.innerHTML = bbHtml;"
import re
# Remove the entire bbHtml += `...`; block for soson DIA
content_out = re.sub(
    r'    // 소선 DIA\(mm\) 2행\n    bbHtml \+= `[\s\S]*?`;\n',
    '',
    content_out
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content_out)

print("Done. Lines written:", content_out.count('\n'))
