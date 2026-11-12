/**
 * 강남민화연구소 앱 → 원장님 Gmail 알림 · 주간 백업
 * script.google.com 에 붙여넣고 "웹 앱"으로 배포해서 사용합니다.
 * - 받는 사람은 이 스크립트를 배포한 원장님 본인 Gmail로 고정 (다른 주소로는 못 보냄)
 * - 학생 알림: 학생 이름·알림 종류·날짜만 받음 (전화번호 등은 받지 않음)
 * - 주간 백업(kind: 'backup'): 앱 백업 파일(.json)을 첨부로 보냄 (2026-11-13 추가)
 */
function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var clip = function (v, n) { return String(v || '').replace(/[\r\n]+/g, ' ').slice(0, n); };
    var me = Session.getEffectiveUser().getEmail();
    if (d.kind === 'backup') {
      var json = String(d.json || '');
      // 앱 백업 파일인지 간단히 확인 (다른 내용은 보내지 않음)
      if (json.length < 100 || json.length > 5000000 || json.indexOf('"app": "ggmh"') < 0) return ContentService.createTextOutput('skip');
      var name = clip(d.filename, 80) || '강남민화연구소_백업.json';
      MailApp.sendEmail({
        to: me,
        subject: '[강남민화연구소] 주간 백업 ' + clip(d.sent_at, 40),
        body: '앱 백업 파일을 첨부했어요 (회원 ' + clip(d.students, 6) + '명).\n' +
              '앱이 고장 나거나 데이터가 잘못됐을 때, 앱 ⚙ 관리 도구 → 백업 불러오기에서 이 파일을 쓰면 돼요.\n' +
              '이 메일은 지우지 말고 두세요.\n\n앱: https://woojooh67-art.github.io/gangnam-minhwa/',
        attachments: [Utilities.newBlob(json, 'application/json', name)]
      });
      return ContentService.createTextOutput('ok');
    }
    var kind = clip(d.kind, 30) || '알림';
    var student = clip(d.student, 30) || '학생';
    var detail = clip(d.detail, 120);
    var sentAt = clip(d.sent_at, 40);
    MailApp.sendEmail({
      to: me,
      subject: '[강남민화연구소] ' + student + '님 ' + kind,
      body: student + '님 — ' + kind + '\n' + (detail ? detail + '\n' : '') + '보낸 시각: ' + sentAt +
            '\n\n앱에서 확인해 주세요: https://woojooh67-art.github.io/gangnam-minhwa/'
    });
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  }
}
