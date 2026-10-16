# 사주 풀이 (fortune-service)

만세력 데이터를 바탕으로 내 사주의 구성을 그림과 그래프로 보여 주고, 올해 운세와 오늘의 운세를 풀어 주는 웹사이트입니다. (수업 프로젝트)

**바로 사용하기 → https://kangchaeyeon82.github.io/fortune-service/**

설치 없이 브라우저에서 바로 쓸 수 있고, 휴대폰 화면과 다크 모드도 지원합니다.

## 무엇을 볼 수 있나요

이름, 성별, 생년월일(양력·음력·윤달), 태어난 시각(모름 가능), 태어난 곳을 입력하면 세 개의 탭으로 결과를 보여 줍니다. 그래프나 글자를 누르면 아래에서 해석 창이 올라옵니다.

| 탭 | 내용 |
|---|---|
| **내 사주** | 사주팔자 · 기둥별 오행 · 오행 분포 · 십신 분포 · 귀인 · 신살 · 대운 |
| **2026년 운세** | 올해 운세 지수 · 분야별 지수(연애·재물·직장학업·대인관계·건강) · 월별 흐름 · 주의할 점 · 개운법 |
| **오늘의 운세** | 오늘의 점수 · 오늘의 개운법(행운의 색·숫자·방향 등) · 시간대별 흐름 |

## 어떻게 동작하나요

1. **만세력 데이터:** [포스텔러 만세력](https://pro.forceteller.com)에서 사주팔자, 오행·십신, 신강신약, 용신, 대운·연운·월운, 신살을 가져옵니다. 브라우저가 직접 호출하므로 서버가 필요 없습니다.
2. **직접 계산하는 값:** 오늘의 일진·시간대별 간지, 첫 대운 전 어린이의 올해 간지는 데이터에 없어서 직접 계산합니다. 포스텔러 값과 대조해 모두 일치하는 것을 확인했습니다.
3. **풀이:** AI 없이, 명리학의 일반적인 해석을 규칙으로 옮겨 문장과 점수를 만듭니다.
   - 올해·오늘의 기운이 나에게 필요한 기운(용신)이면 점수가 오르고, 이미 넘치는 기운이면 내려갑니다.
   - 연애운은 이성 인연을 뜻하는 기운과 도화살, 배우자 자리(일지)와의 합·충을 봅니다.
   - 학업운은 인성·관성 기운과 문창·학당귀인 같은 공부 별을 봅니다.
   - 올해 지지와 내 사주가 부딪히는지(충), 삼재인지도 계산합니다.

## 연결된 외부 도구

| 도구 | 어디에 쓰나 | 키·비용 | 사용하는 곳 |
|---|---|---|---|
| **포스텔러 만세력 API** (`api.forceteller.com`) | 사주팔자 · 오행·십신 · 신강신약 · 용신 · 대운·연운·월운 · 신살, 태어난 곳(도시) 검색, 날짜 검증 | 키 없음 · 무료 | `web/js/api.js`, `server/forceteller.py`, `crawler/` |
| **Firecrawl** (`api.firecrawl.dev`) | 포스텔러 첫 화면을 수집하는 데만 사용. 웹사이트는 사용하지 않음 | `FIRECRAWL_API_KEY` 필요 (`.env`) | `crawler/forceteller_crawl.py` |
| **GitHub Pages + GitHub Actions** | `main`에 push하면 `web` 폴더를 자동으로 배포 | 무료 (공개 저장소) | `.github/workflows/pages.yml` |
| **jsDelivr CDN · Pretendard 글꼴** | 화면 글꼴 | 키 없음 · 무료 | `web/index.html` |
| **FastAPI · Uvicorn · httpx** (파이썬 라이브러리) | 내 컴퓨터에서 서버로 실행할 때만 사용 | 무료 | `server/main.py`, `requirements.txt` |

- AI API(Claude, ChatGPT 등)는 쓰지 않습니다. 풀이 문장과 점수는 모두 코드 안의 규칙으로 만듭니다.
- API 키는 `.env` 파일에만 넣고, 이 파일은 GitHub에 올리지 않습니다(`.gitignore`). 형식은 `.env.example`을 참고하세요.

## 폴더 구조

```
fortune-service/
├── web/                     # 웹사이트 (GitHub Pages로 배포되는 폴더)
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js           #   포스텔러 호출 · 도시 검색 · 날짜 검증 · 일진 계산
│   │   ├── interpret.js     #   풀이 엔진: 만세력 데이터 → 점수 · 해석 문장
│   │   └── app.js           #   입력 폼 · 탭 3개 · 해석 창
│   └── data/sample.json     #   '예시로 둘러보기' 데이터
├── server/                  # 내 컴퓨터에서 실행할 때 쓰는 서버 (선택)
│   ├── main.py              #   FastAPI 서버
│   └── forceteller.py       #   서버용 포스텔러 연동 모듈
├── crawler/                 # 만세력 데이터 수집 스크립트
│   └── forceteller_crawl.py
├── docs/                    # 기획 · 레퍼런스
│   ├── PLAN.md              #   기획서
│   └── references/          #   포스텔러 API 정리, 데이터 구조, 샘플 데이터, 참고 서비스
├── data/raw/                # 수집 결과 저장 위치 (GitHub에 올리지 않음)
├── .github/workflows/       # main에 push하면 GitHub Pages 자동 배포
├── README.md
└── requirements.txt
```

## 내 컴퓨터에서 실행하기 (선택)

웹사이트만 쓸 거라면 필요 없습니다. 코드를 고쳐 보며 확인하고 싶을 때 사용하세요.

```
pip install -r requirements.txt
python -m uvicorn server.main:app
```

- 화면: http://127.0.0.1:8000
- API 문서: http://127.0.0.1:8000/docs (`/api/fortune`, `/api/cities` 등 — 화면과 같은 기능을 API로 제공)
- 코드를 고친 뒤에는 서버를 껐다 다시 켜야 반영됩니다.

데이터만 파일로 받고 싶다면 수집 스크립트를 쓸 수 있습니다. Firecrawl 키가 필요하면 `.env.example`을 참고해 `.env`를 만드세요.

```
python crawler/forceteller_crawl.py --birthday 1990-01-01 --time 12:00 --gender F --out data/raw/test.json
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 `web` 폴더를 GitHub Pages에 자동으로 배포합니다. 보통 30초 안에 끝납니다.

## 알아 둘 점

- 사주 데이터는 포스텔러 만세력의 공개되지 않은 내부 API를 사용합니다. 포스텔러가 API를 바꾸거나 외부 요청을 막으면 사이트가 동작하지 않을 수 있습니다.
- 입력한 정보는 저장하지 않고, 사주 계산을 위해 포스텔러에만 전달됩니다.
- 운세 풀이는 재미와 참고용입니다.
