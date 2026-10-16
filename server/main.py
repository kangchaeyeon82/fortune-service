"""로컬 실행용 서버: 화면(web/)을 그대로 보여주고, 같은 기능의 API(/api/...)도 제공한다.
화면 자체는 브라우저에서 포스텔러를 직접 호출하므로(api.js) GitHub Pages처럼 서버 없이도 동작한다.

실행:  python -m uvicorn server.main:app   (fortune-service 폴더에서)
화면:  http://127.0.0.1:8000    API 문서: http://127.0.0.1:8000/docs
"""
import datetime as dt
import json
from functools import lru_cache
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from .forceteller import (DEFAULT_CITIES, ForcetellerError, build_profile, fetch_saju, fill_current_year,
                          is_valid_date, search_cities, today_section)

ROOT = Path(__file__).resolve().parent.parent
SAMPLE = ROOT / "docs" / "references" / "sample_result.json"
STATIC = ROOT / "web"

app = FastAPI(title="Fortune Service API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class FortuneRequest(BaseModel):
    name: str = Field("", max_length=20)
    gender: Literal["F", "M"]
    birthday: str = Field(..., examples=["1990-01-01"], description="YYYY-MM-DD")
    time: Optional[str] = Field(None, examples=["12:00"], description="HH:MM, 모르면 null")
    lunar: bool = False
    leap_month: bool = Field(False, description="음력 윤달 (lunar=true일 때만 의미)")
    midnight_adjust: bool = False
    location_id: int = Field(1835848, gt=0, description="출생지 GeoNames ID (/api/cities 검색 결과)")
    location_name: str = Field("서울특별시", max_length=100)

    @field_validator("birthday")
    @classmethod
    def check_birthday(cls, v):
        # 음력은 양력 달력에 없는 날(예: 음력 2월 30일)도 있으므로 범위만 보고,
        # 실제로 있는 날짜인지는 포스텔러 날짜 검증에 맡긴다.
        try:
            y, m, d = (int(x) for x in v.split("-"))
        except ValueError:
            raise ValueError("생년월일 형식은 YYYY-MM-DD 입니다")
        if not 1900 <= y <= dt.date.today().year:
            raise ValueError("1900년 이후 날짜만 가능합니다")
        if not (1 <= m <= 12 and 1 <= d <= 31):
            raise ValueError("월은 1~12, 일은 1~31 사이여야 합니다")
        return f"{y:04d}-{m:02d}-{d:02d}"

    @field_validator("time")
    @classmethod
    def check_time(cls, v):
        if v is None or v == "":
            return None
        return dt.time.fromisoformat(v).strftime("%H:%M")


# 같은 입력은 포스텔러에 다시 요청하지 않도록 메모리 캐시
_cache: dict = {}


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/cities")
async def cities(q: str = ""):
    """출생 도시 검색. 검색어가 없으면 기본 도시 목록."""
    q = q.strip()
    if not q:
        return DEFAULT_CITIES
    try:
        return await search_cities(q[:30])
    except ForcetellerError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/api/fortune")
async def fortune(req: FortuneRequest):
    profile = build_profile(**req.model_dump())
    key = json.dumps(profile, sort_keys=True, ensure_ascii=False)
    if key in _cache:
        return {**_cache[key], "today": today_section(_cache[key]["sections"])}
    try:
        if not await is_valid_date(profile):
            raise HTTPException(status_code=422, detail="존재하지 않는 날짜예요. 음력이라면 그 달에 30일이 있는지, 윤달이 있는 해인지 확인해 주세요.")
        sections = await fetch_saju(profile)
    except ForcetellerError as e:
        raise HTTPException(status_code=502, detail=str(e))
    result = {"profile": profile, "summary": sections["사주명식"].get("profile"), "sections": sections}
    if len(_cache) >= 200:
        _cache.pop(next(iter(_cache)))
    _cache[key] = result
    # 오늘의 일진은 날짜가 바뀌므로 캐시하지 않고 매번 계산
    return {**result, "today": today_section(sections)}


@app.get("/api/fortune/sample")
def fortune_sample():
    """화면 개발용 샘플 (docs/references/sample_result.json)."""
    data = _load_sample()
    return {**data, "today": today_section(data["sections"])}


@lru_cache
def _load_sample():
    data = json.loads(SAMPLE.read_text(encoding="utf-8"))
    data.pop("landing", None)
    data["summary"] = data["sections"]["사주명식"].get("profile")
    fill_current_year(data["sections"])
    return data


# 화면: GitHub Pages와 같은 상대 경로 구조 그대로 제공 (API 라우트 뒤에 둬야 함)
app.mount("/", StaticFiles(directory=STATIC, html=True), name="site")
