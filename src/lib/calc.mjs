export const MAX_RENT = 100_000_000;

export function formatWon(n) {
  return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
}

// 월세와 월 한도 중 작은 값을 개월 수만큼 곱하는 단순 산술입니다. 자격 심사를 하지 않습니다.
export function calculateSupport({ rent, months, monthlyLimit, maxMonths }) {
  if (!Number.isFinite(rent) || rent < 0 || rent > MAX_RENT) {
    return { ok: false, error: `월세는 0~${MAX_RENT.toLocaleString('ko-KR')}원 사이로 입력하세요.` };
  }
  if (!Number.isInteger(months) || months < 1 || months > maxMonths) {
    return { ok: false, error: `기간은 1~${maxMonths}개월 사이의 정수로 입력하세요.` };
  }
  const monthly = Math.min(Math.floor(rent), monthlyLimit);
  return { ok: true, monthly, total: monthly * months };
}
