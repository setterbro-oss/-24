// 공고에 적힌 기본 요건만 간단히 대조하는 자가진단입니다. 최종 판단이 아닙니다.
export function evaluateEligibility(input, rules) {
  const items = [];

  const by = input.birthYear;
  if (!Number.isInteger(by) || by < 1900 || by > 2100) {
    items.push({ key: 'age', label: '연령', status: 'check', message: '출생연도를 입력하면 확인합니다.' });
  } else if (by >= rules.birthYearMin && by <= rules.birthYearMax) {
    items.push({ key: 'age', label: '연령', status: 'ok', message: `${rules.birthYearMin}~${rules.birthYearMax}년생 범위에 해당합니다.` });
  } else {
    items.push({ key: 'age', label: '연령', status: 'fail', message: `2026년 신청 가능 출생연도(${rules.birthYearMin}~${rules.birthYearMax}년생)를 벗어납니다. 군 복무 등 예외는 공고에서 확인하세요.` });
  }

  if (input.livesSeparately === 'yes') {
    items.push({ key: 'separate', label: '부모와 별도 거주', status: 'ok', message: '별도 거주 요건에 해당합니다. 주민등록상 거주지도 분리되어야 합니다.' });
  } else if (input.livesSeparately === 'no') {
    items.push({ key: 'separate', label: '부모와 별도 거주', status: 'fail', message: '부모와 함께 거주하면 대상이 아닐 수 있습니다.' });
  } else {
    items.push({ key: 'separate', label: '부모와 별도 거주', status: 'check', message: '선택하면 확인합니다.' });
  }

  if (input.ownsHome === 'no') {
    items.push({ key: 'home', label: '무주택', status: 'ok', message: '무주택 요건에 해당합니다.' });
  } else if (input.ownsHome === 'yes') {
    items.push({ key: 'home', label: '무주택', status: 'fail', message: '주택 소유자는 제외 대상입니다.' });
  } else {
    items.push({ key: 'home', label: '무주택', status: 'check', message: '선택하면 확인합니다.' });
  }

  const inc = input.monthlyIncome;
  if (inc === null || inc === undefined || !Number.isFinite(inc) || inc < 0) {
    items.push({ key: 'income', label: '청년가구 소득', status: 'check', message: '월 소득을 입력하면 1인 청년가구 기준과 비교합니다.' });
  } else if (inc <= rules.incomeLimit1p) {
    items.push({ key: 'income', label: '청년가구 소득', status: 'ok', message: '1인 청년가구 기준(중위소득 60%) 이내입니다. 원가구 기준과 소득 산정 방식은 별도로 확인해야 합니다.' });
  } else {
    items.push({ key: 'income', label: '청년가구 소득', status: 'fail', message: '1인 청년가구 기준을 넘을 수 있습니다. 소득 산정 방식에 따라 달라지므로 복지로 모의계산으로 확인하세요.' });
  }

  const overall = items.some((i) => i.status === 'fail') ? 'fail' : items.some((i) => i.status === 'check') ? 'check' : 'ok';
  return { items, overall };
}
