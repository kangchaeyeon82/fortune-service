"""포스텔러 만세력(pro.forceteller.com/result) 결과 데이터 수집기.

/result 페이지는 생년월일 입력 후 클라이언트에서 렌더링되는 SPA라
Firecrawl 단독으로는 내용이 나오지 않는다(입력 없이 접근 시 스크랩 실패).
그래서 Firecrawl로 랜딩 페이지 메타/본문을 수집하고, 결과 데이터는
페이지가 내부적으로 호출하는 api.forceteller.com 엔드포인트에서 직접 받는다.

사용 예:
  python forceteller_crawl.py --birthday 1990-01-01 --time 12:00 --gender F
  python forceteller_crawl.py --birthday 1990-01-01 --lunar --unknown-time
"""
import argparse
import json
import os
import urllib.request
from pathlib import Path

API = "https://api.forceteller.com"
SITE = "https://pro.forceteller.com"
HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Origin": SITE,
    "Referer": SITE + "/result",
    "User-Agent": "Mozilla/5.0",
}

# 페이지 화면 섹션 이름 -> (엔드포인트, 쿼리스트링)
ENDPOINTS = {
    "사주명식": ("/api/pro/profile/saju/chart", ""),
    "오행십성": ("/api/pro/profile/saju/points", ""),
    "신강신약": ("/api/pro/profile/saju/power", ""),
    "용신": ("/api/pro/profile/saju/useful", ""),
    "대운_연운_월운": ("/api/pro/profile/saju/daeun", ""),
    "사주풀이": ("/api/pro/profile/saju/details/v2", "?cat=1"),
    "길흉성": ("/api/pro/profile/saju/details/v2", "?cat=2"),
}


def load_env(path=".env"):
    if Path(path).exists():
        for line in Path(path).read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))


def post(url, body, headers):
    req = urllib.request.Request(
        url, data=json.dumps(body, ensure_ascii=False).encode("utf-8"), headers=headers
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def firecrawl_landing():
    key = os.environ.get("FIRECRAWL_API_KEY")
    if not key:
        return None
    return post(
        "https://api.firecrawl.dev/v1/scrape",
        {"url": SITE, "formats": ["markdown"], "waitFor": 3000},
        {"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )


def build_profile(a):
    y, m, d = (int(x) for x in a.birthday.split("-"))
    hh, mm = (int(x) for x in (a.time or "00:00").split(":"))
    return {
        "name": a.name, "gender": a.gender, "birthday": a.birthday,
        "birthtime": "" if a.unknown_time else f"{hh:02d}:{mm:02d}",
        "calendar": "M" if a.lunar else "S",  # S=양력, M=음력, L=음력(윤달)
        "hmUnsure": a.unknown_time, "midnightAdjust": a.midnight_adjust,
        "locationId": a.location_id, "locationName": a.location_name,
        "year": y, "month": m, "day": d, "hour": hh, "min": mm, "saved": False,
        "_합보정": False, "_조후궁성보정": False,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--birthday", required=True, help="YYYY-MM-DD")
    p.add_argument("--time", default="12:00", help="HH:MM")
    p.add_argument("--unknown-time", action="store_true", help="태어난 시간 모름")
    p.add_argument("--gender", choices=["F", "M"], default="F")
    p.add_argument("--lunar", action="store_true", help="음력 생일")
    p.add_argument("--midnight-adjust", action="store_true", help="야자시/조자시 보정")
    p.add_argument("--name", default="")
    p.add_argument("--location-id", type=int, default=1835848, help="GeoNames ID (기본: 서울)")
    p.add_argument("--location-name", default="서울특별시")
    p.add_argument("--out", default="forceteller_result.json")
    a = p.parse_args()

    load_env()
    profile = build_profile(a)
    result = {"profile": profile, "landing": None, "sections": {}}

    try:
        fc = firecrawl_landing()
        if fc and fc.get("success"):
            result["landing"] = fc["data"].get("markdown")
    except Exception as e:
        print("Firecrawl 실패:", e)

    for name, (path, qs) in ENDPOINTS.items():
        try:
            res = post(API + path + qs, profile, HEADERS)
            ok = res.get("status") == 200
            result["sections"][name] = res.get("data") if ok else res
            print(f"[{'OK' if ok else 'ERR'}] {name}")
        except Exception as e:
            result["sections"][name] = {"error": str(e)}
            print(f"[ERR] {name}: {e}")

    Path(a.out).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print("저장:", Path(a.out).resolve())


if __name__ == "__main__":
    main()
