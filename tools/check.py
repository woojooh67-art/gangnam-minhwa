#!/usr/bin/env python3
"""앱 고친 뒤 점검 (Claude가 앱을 올리기 전에 돌리는 회귀 점검)

사용: python3 tools/check.py 백업.json [--base origin/main]
 - 백업 파일(앱 ⚙ 관리 도구 → 백업 저장)의 실제 데이터로, 지금 고친 index.html 과
   기준 버전(--base, 기본: origin/main = 지금 올라가 있는 앱)을 각각 띄워서 비교해요.
 - 회원마다: 잔여 회차, 이용 기한, '추가'/'미리 사용' 개수, 회원 정보·인쇄 화면이 오류 없이 그려지는지.
 - 차이가 있으면 회원별로 보여 주고, 화면 오류가 있으면 실패로 끝나요.
 - 백업 파일은 저장소에 올리지 않아요 (회원 개인정보).
필요: pip install playwright, Chrome (/usr/bin/google-chrome)
"""
import json, os, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright

STUB = "(()=>{const mk=()=>new Proxy(function(){},{get:(t,k)=>k==='then'?undefined:mk(),apply:()=>mk()});window.firebase=mk();})()"
PROBE = r"""(bk)=>{
  data=bk;window.save=async()=>{};window.renderFee=()=>{};window.renderReport=()=>{};window.regenerateStudentViews=()=>{};
  const t=todayISO(),out={};
  data.students.forEach(st=>{
    const r={remain:remainSessions(st),due:(typeof makeupDue==='function'?makeupDue(st):''),x:0,o:0,errors:[]};
    try{const cm=cycleMapOf(st);Object.keys(cm.days).forEach(k=>{if(k>t)return;cm.days[k].forEach(e=>{if(e.x)r.x++;if(e.o)r.o++;});});}catch(e){r.errors.push('cycleMap: '+e.message);}
    try{studentSheet(st);}catch(e){r.errors.push('회원 정보: '+e.message);}
    if(typeof memHistHTML==='function'){for(const f of ['daily','monthly']){try{memHistHTML(st,'',f);}catch(e){r.errors.push('인쇄('+f+'): '+e.message);}}}
    try{closeOverlay();}catch(e){}
    out[st.name+'#'+st.id.slice(-4)]=r;});
  if(typeof monthStatsSheet==='function'){try{monthStatsSheet();closeOverlay();}catch(e){out['(월별 현황)']={errors:['월별 현황: '+e.message]};}}
  return out;}"""

def run(html_path, bk):
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = b.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        pg.add_init_script(STUB)
        pg.route('http*://**', lambda r: r.abort())
        pg.goto('file://' + os.path.abspath(html_path)); pg.wait_for_timeout(800)
        errs.clear()
        res = pg.evaluate(PROBE, bk)
        b.close()
        return res, errs

def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(2)
    bk = json.load(open(sys.argv[1], encoding='utf-8'))['data']
    base = sys.argv[sys.argv.index('--base') + 1] if '--base' in sys.argv else 'origin/main'
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    old_html = subprocess.run(['git', '-C', root, 'show', base + ':index.html'], capture_output=True, check=True).stdout
    tmp = tempfile.NamedTemporaryFile(suffix='.html', delete=False); tmp.write(old_html); tmp.close()
    old, old_err = run(tmp.name, json.loads(json.dumps(bk)))
    new, new_err = run(os.path.join(root, 'index.html'), json.loads(json.dumps(bk)))
    bad = False; diffs = 0
    for k in sorted(set(old) | set(new)):
        a, n = old.get(k, {}), new.get(k, {})
        for f in ('remain', 'due', 'x', 'o'):
            if a.get(f) != n.get(f):
                diffs += 1; print(f'  변경  {k}: {f} {a.get(f)} → {n.get(f)}')
        for e in n.get('errors', []):
            bad = True; print(f'  오류  {k}: {e}')
    for e in new_err: bad = True; print('  페이지 오류:', e)
    print(f'회원 {len(new)}명 점검 · 기준({base})과 다른 값 {diffs}개 · ' + ('❌ 화면 오류 있음' if bad else '✅ 화면 오류 없음'))
    sys.exit(1 if bad else 0)

if __name__ == '__main__': main()
