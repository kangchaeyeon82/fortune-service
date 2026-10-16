# 레퍼런스 목록

## 1. 데이터 출처
- 포스텔러 만세력: https://pro.forceteller.com  (결과: /result)
- 정리 문서: `forceteller-api.md`, `data-schema.md`
- 실제 샘플: `sample_result.json` (1990-01-01 12:00, 여, 양력, 서울)

## 2. 참고할 운세 서비스 (화면·기획 참고)
- 포스텔러 https://forceteller.com — 결과 화면 구성, 카드형 UI
- 점신 https://www.jeomsin.co.kr — 오늘의 운세, 띠별 운세 구성
- 헬로우봇 https://hellobot.co — 챗봇 대화형 운세 풀이 방식
> 마음에 드는 화면은 캡처해서 `screenshots/` 에 넣고, 어떤 점이 좋은지 한 줄 메모.

## 2-1. 원하는 느낌 (직접 고른 자료)
- `screenshots/` — 디자인 분위기 사진 12장: 검은 밤하늘, 금색 가는 선의 8방향 별·동심원, 보라빛 은하수, 흰 별빛, 옅은 무지갯빛
- `saju-explain.md` — (개인 정보가 있어 GitHub에는 올리지 않음) 원하는 풀이 방식 예시: 표로 한눈에 → 상태 한 단어 → 💡 종합 해석 문단 (원국표·오행·십성·대운·신살·12운성·지장간·형충회합·2026년·적성)
- 이 두 자료를 어떻게 반영할지는 `../PLAN.md` 4~5장 참고

## 3. 기술 문서
- Firecrawl: https://docs.firecrawl.dev
- FastAPI: https://fastapi.tiangolo.com

## 4. AI에게 작업 시킬 때
"docs/ 폴더(PLAN.md, references/) 를 먼저 읽고, 작업 순서 3번(서버)부터 진행해 줘" 처럼
**계획서와 레퍼런스를 먼저 읽게** 하면 결과물이 훨씬 정확해짐.
