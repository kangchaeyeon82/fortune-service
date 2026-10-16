#!/usr/bin/env bash
# GitHub Pages에 올릴 폴더(_site)를 만든다.
#   /           지금 버전 (web 폴더)
#   /v1/ ~ /vN/ versions.tsv에 적힌 이전 버전 (git 기록에서 그 커밋의 웹사이트 폴더를 꺼냄)
#   /versions/  버전 목록 페이지
# 사용: bash scripts/build_pages.sh [출력 폴더, 기본 _site]
set -euo pipefail
OUT="${1:-_site}"
rm -rf "$OUT"
mkdir -p "$OUT/versions"
cp -r web/. "$OUT/"

items=""
while IFS=$'\t' read -r path commit dir date title desc; do
  [[ -z "$path" || "$path" == \#* ]] && continue
  mkdir -p "$OUT/$path"
  depth=$(awk -F/ '{print NF}' <<<"$dir")
  git archive "$commit" "$dir" | tar -x -C "$OUT/$path" --strip-components="$depth"
  # 최신 버전이 위로 오게 앞에 붙임
  items="<li><a href=\"../$path/\"><span class=\"v\">$path</span><span class=\"t\"><b>$title</b><small>$date · $commit</small></span><span class=\"d\">$desc</span></a></li>$items"
done < versions.tsv

cat > "$OUT/versions/index.html" <<HTML
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>이전 버전</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; background: radial-gradient(120% 70% at 50% 0%, #0b0b10, #020203 60%) fixed, #020203; color: #f6f6f8;
    font-family: "Pretendard Variable", Pretendard, system-ui, sans-serif; line-height: 1.6; }
  main { max-width: 640px; margin: 0 auto; padding: 48px 16px; }
  h1 { font-weight: 300; font-size: 28px; margin: 0 0 6px; text-shadow: 0 0 24px rgb(255 255 255 / .35); }
  p { color: rgb(255 255 255 / .6); margin: 0 0 28px; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  a { display: grid; grid-template-columns: 44px 1fr; gap: 2px 12px; padding: 16px 18px; border-radius: 16px; text-decoration: none; color: inherit;
    background: rgb(12 12 16 / .78); border: 1px solid rgb(255 255 255 / .11); transition: border-color .15s, box-shadow .15s; }
  a:hover, a:focus-visible { border-color: rgb(255 255 255 / .5); box-shadow: 0 0 18px rgb(255 255 255 / .15); outline: none; }
  .v { grid-row: span 2; align-self: center; font-weight: 600; letter-spacing: .05em; }
  .t b { font-weight: 600; margin-right: 8px; } .t small { color: rgb(255 255 255 / .45); }
  .d { color: rgb(255 255 255 / .7); font-size: 14px; }
  .now .v { text-shadow: 0 0 10px rgb(255 255 255 / .6); }
</style>
</head>
<body>
<main>
  <h1>이전 버전</h1>
  <p>사이트가 바뀌어 온 과정이에요. 누르면 그때의 화면이 열려요.</p>
  <ul>
    <li class="now"><a href="../"><span class="v">지금</span><span class="t"><b>최신 버전</b><small>$(git log -1 --format=%h)</small></span><span class="d">지금 사용 중인 사이트</span></a></li>
    $items
  </ul>
</main>
</body>
</html>
HTML
echo "built $OUT"
