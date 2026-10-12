# 포스텔러 만세력 데이터 출처 정리

`/result` 페이지는 입력 후 브라우저에서 그려지는 SPA라 Firecrawl로 직접 긁으면 실패한다.
페이지가 내부적으로 호출하는 API를 사용한다. (로그인 불필요, 2026-10-12 확인)

- Base URL: `https://api.forceteller.com`
- 방식: 모두 `POST`, Body = 프로필 JSON (아래)

| 섹션 | 엔드포인트 |
|---|---|
| 사주명식 | `/api/pro/profile/saju/chart` |
| 오행십성 | `/api/pro/profile/saju/points` |
| 신강신약 | `/api/pro/profile/saju/power` |
| 용신 | `/api/pro/profile/saju/useful` |
| 대운·연운·월운 | `/api/pro/profile/saju/daeun` (`?year=` 로 연도 지정 가능) |
| 사주풀이 (합·충·형 등) | `/api/pro/profile/saju/details/v2?cat=1` |
| 길흉성 (신살) | `/api/pro/profile/saju/details/v2?cat=2` |

## 요청 Body
```json
{
  "name": "", "gender": "F", "birthday": "1990-01-01", "birthtime": "12:00",
  "calendar": "S", "hmUnsure": false, "midnightAdjust": false,
  "locationId": 1835848, "locationName": "서울특별시",
  "year": 1990, "month": 1, "day": 1, "hour": 12, "min": 0,
  "saved": false, "_합보정": false, "_조후궁성보정": false
}
```
- `gender`: F/M · `calendar`: S(양력)/M(음력)/L(음력 윤달) · `hmUnsure`: 시간 모름
- `locationId`: GeoNames ID (0이면 에러). 서울 = 1835848
- 응답: `{"status":200, "data": {...}}`

## 그 밖의 엔드포인트
| 용도 | 요청 | 응답 |
|---|---|---|
| 도시 검색 | `GET /api/pro/cities?q=수원` | `data.cities[]`: `geonameId`, `name`, `fullName`, `lat`, `lng`, `timeZoneId` |
| 날짜 검증 | `POST /api/calendar/validate` (Body = 프로필) | `{"status":200}` 존재하는 날짜 / `400` 없는 날짜 (음력 30일·윤달 유무까지 확인) |
