# fortune-service

포스텔러 만세력 데이터를 활용한 사주 풀이 사이트 (수업 프로젝트)

**바로 보기: https://kangchaeyeon82.github.io/fortune-service/**

화면은 브라우저에서 포스텔러 API를 직접 호출하므로(`app/static/api.js`) 서버 없이 GitHub Pages에서 동작한다.
`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/pages.yml`)가 `app/static` 폴더를 자동 배포한다.

## 폴더 구조
```
fortune-service/
├── PLAN.md                 # 계획서: 무엇을, 어떤 순서로 만들지
├── README.md               # 이 파일: 프로젝트 소개 + 폴더 구조
├── .env                    # API 키 (git에 올리지 않음)
├── .env.example            # 키 형식 예시
├── requirements.txt        # 파이썬 패키지 목록
├── references/             # ★ 레퍼런스: AI/개발자가 참고할 자료
│   ├── README.md           #   참고 사이트·자료 목록
│   ├── forceteller-api.md  #   데이터 출처 API 정리
│   ├── data-schema.md      #   결과 JSON 각 항목의 의미
│   ├── sample_result.json  #   실제 수집한 샘플 데이터
│   └── screenshots/        #   참고 사이트 화면 캡처 넣는 곳
├── crawler/
│   └── forceteller_crawl.py  # 데이터 수집 스크립트
├── data/raw/               # 수집한 결과 JSON 저장 (git 제외)
├── app/                    # 서비스 코드
│   ├── main.py             #   API 서버 (FastAPI)
│   ├── forceteller.py      #   포스텔러 데이터 요청 모듈
│   └── static/             #   화면
│       ├── api.js          #     포스텔러 호출 · 도시 검색 · 날짜 검증 · 오늘 일진 계산
│       ├── interpret.js    #     풀이 엔진: 만세력 데이터 → 운세 점수·문장
│       ├── app.js          #     입력 폼 + 탭 3개 + 해석 시트
│       └── sample.json     #     '예시로 둘러보기' 데이터
└── docs/                   # 회의록, 발표자료 등
```

## 데이터 수집 실행
```
python crawler/forceteller_crawl.py --birthday 1990-01-01 --time 12:00 --gender F --out data/raw/test.json
```

## 내 컴퓨터에서 실행 (선택)
```
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
- 화면: http://127.0.0.1:8000 (GitHub Pages와 같은 화면)
- API 문서(직접 눌러서 테스트 가능): http://127.0.0.1:8000/docs

| 메서드 | 주소 | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 동작 확인 |
| GET | `/api/cities?q=수원` | 출생 도시 검색 (전 세계 시·군·구, 검색어 없으면 기본 도시) |
| POST | `/api/fortune` | 사주 데이터 조회 (아래 예시) |
| GET | `/api/fortune/sample` | 화면 개발용 샘플 데이터 |

`POST /api/fortune` 요청 예시:
```json
{ "name": "홍길동", "gender": "M", "birthday": "1995-03-15", "time": "08:00",
  "lunar": true, "leap_month": false,
  "location_id": 1835551, "location_name": "경기도 수원시, 대한민국" }
```
- `time`: 모르면 `null` · `lunar`: 음력 여부 · `leap_month`: 음력 윤달 여부
- 응답: `profile`(보낸 값), `summary`(띠·양/음력 생일·지역시 보정), `sections`(7개 섹션 — `references/data-schema.md`)
- 잘못된 입력·존재하지 않는 날짜(예: 음력 2월 31일, 없는 윤달) → 422, 포스텔러 쪽 오류 → 502
