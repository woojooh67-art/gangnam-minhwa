/**
 * 강남민화연구소 앱 → 원장님 Gmail 알림
 * script.google.com 에 붙여넣고 "웹 앱"으로 배포해서 사용합니다.
 * - 받는 사람은 이 스크립트를 배포한 원장님 본인 Gmail로 고정 (다른 주소로는 못 보냄)
 * - 학생 이름·알림 종류·날짜만 받음 (전화번호 등은 받지 않음)
 */
function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var clip = function (v, n) { return String(v || '').replace(/[\r\n]+/g, ' ').slice(0, n); };
    var kind = clip(d.kind, 30) || '알림';
    var student = clip(d.student, 30) || '학생';
    var detail = clip(d.detail, 120);
    var sentAt = clip(d.sent_at, 40);
    var me = Session.getEffectiveUser().getEmail();
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
