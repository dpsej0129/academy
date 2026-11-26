# IMAGE PROMPTS — 「잿빛 매와 별의 장부」

> 이 문서는 `node tools/gen_image_prompts.js`로 생성된다. 게임 데이터가 실제로 참조하는 이미지 경로를 전부 모아 만들기 때문에, 여기 적힌 **파일 경로 그대로** 저장하면 게임에 바로 반영된다.
> 이미지를 넣은 뒤에는 `node tools/scan_assets.js`를 실행해 이미지 매니페스트(`data/assets.js`)를 갱신한다. (Node가 없다면 `data/assets.js`의 `files` 배열에 경로를 직접 추가하거나 `probeAll: true`로 바꾼다.)
> 파일이 없으면 게임은 색 블록 + 이름 텍스트로 대신 표시한다.

**프롬프트 실행 횟수: 필수 135회** (선택 6회 별도).
인물 스탠딩은 **표정 시트** 방식이라, 인물 한 명당 프롬프트 1번으로 표정 3~6종을 한 장에 받는다. 표정을 하나씩 뽑으면 62번이 필요하지만 시트로는 16번이면 된다. 게임이 시트를 칸 단위로 잘라 쓴다.

## 공통 스타일 (모든 프롬프트 맨 앞에 포함됨)

```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration
```

## 공통 네거티브 프롬프트

```
lowres, blurry, jpeg artifacts, watermark, signature, text, letters, logo, extra fingers, deformed hands, bad anatomy, 3d render, photorealistic, chibi, oversaturated neon colors, cropped head, duplicate character, modern city
```

## 표정 시트 사용법

1. 아래 「1. 캐릭터 표정 시트」의 프롬프트를 **한 번** 실행한다. 칸은 표의 순서(왼쪽→오른쪽, 위→아래)대로 표정이 들어가야 한다.
2. 결과가 칸 순서와 다르면 이미지 편집기에서 칸을 옮기거나, 원하는 표정이 나올 때까지 다시 뽑는다.
3. 가능하면 **배경을 제거해 투명 PNG**로 저장한다. 단색 배경 그대로 써도 동작하지만 인물 뒤에 회색 상자가 보인다.
4. `assets/char/<인물ID>_sheet.png`로 저장하고 `node tools/scan_assets.js`를 실행한다.

- 게임은 이미지 크기를 칸 수(열·행)로 똑같이 나눠 한 칸씩 잘라 쓴다. 비율이 조금 달라도 잘리긴 하지만, **권장 비율을 맞출수록 인물이 칸 중앙에 정확히 들어온다.**
- 칸 배치 규칙: 표정 1~3개 → 한 줄, 4개 → 2×2, 5~6개 → 3×2(5개면 마지막 칸은 비움).
- 우선순위: `assets/char/<인물ID>_<표정>.png` 개별 파일이 있으면 그것을, 없으면 시트를 쓴다. 특정 표정만 따로 고치고 싶을 때는 개별 파일로 덮어쓰면 된다.
- 전투·편성 초상화(`assets/portrait/<ID>.png`)는 **선택**이다. 없으면 시트의 「기본」 칸에서 머리~어깨를 잘라 쓴다.

| ID | 인물 | 표정 수 | 배치(열×행) | 권장 해상도 | 칸 순서 |
|---|---|---|---|---|---|
| `lennox` | 레녹스 그레이번 | 5 | 3×2 | 2160×2560 | 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`)<br>2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸) |
| `kaien` | 카이엔 브라트 | 5 | 3×2 | 2160×2560 | 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`)<br>2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸) |
| `vivienne` | 비비안 로셰 | 5 | 3×2 | 2160×2560 | 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`)<br>2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸) |
| `roland` | 롤랑 드 베르니에 | 5 | 3×2 | 2160×2560 | 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`)<br>2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸) |
| `mireille` | 미레유 그레이번 | 5 | 3×2 | 2160×2560 | 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`)<br>2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸) |
| `seraphine` | 세라핀 루엘 | 6 | 3×2 | 2160×2560 | 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`)<br>2행: 슬픔(`sad`) · 놀람(`surprised`) · 무표정(퀘스트 상태)(`blank`) |
| `hester` | 헤스터 크레인 | 3 | 3×1 | 2160×1280 | 1행: 기본(`normal`) · 미소(`smile`) · 슬픔(`sad`) |
| `belgrave` | 오스왈드 벨그레이브 | 4 | 2×2 | 1440×2560 | 1행: 기본(`normal`) · 미소(`smile`)<br>2행: 냉정(`cold`) · 슬픔(`sad`) |
| `julian` | 율리안 하이든 | 3 | 3×1 | 2160×1280 | 1행: 기본(`normal`) · 분노(`angry`) · 슬픔(`sad`) |
| `magda` | 마그다 오르테가 | 3 | 3×1 | 2160×1280 | 1행: 기본(`normal`) · 분노(`angry`) · 미소(`smile`) |
| `bruno` | 브루노 카스텔 | 3 | 3×1 | 2160×1280 | 1행: 기본(`normal`) · 분노(`angry`) · 겁먹음(`scared`) |
| `finn` | 핀 애셔 | 3 | 3×1 | 2160×1280 | 1행: 기본(`normal`) · 미소(`smile`) · 겁먹음(`scared`) |
| `ashen` | 잿빛 왕 (아르딘) | 3 | 3×1 | 2160×1280 | 1행: 기본(`normal`) · 미소(`smile`) · 슬픔(`sad`) |
| `real_lennox` | 진짜 레녹스 | 3 | 3×1 | 2160×1280 | 1행: 기본(`normal`) · 슬픔(`sad`) · 미소(`smile`) |
| `martha` | 마르타 브라트 | 3 | 3×1 | 2160×1280 | 1행: 기본(`normal`) · 미소(`smile`) · 슬픔(`sad`) |
| `eleanor` | 엘레노어 로셰 | 3 | 3×1 | 2160×1280 | 1행: 기본(`normal`) · 미소(`smile`) · 슬픔(`sad`) |

## 제작 가이드

- **일관성**: 같은 인물은 아래 '인물 묘사'를 토씨 하나 바꾸지 말고 재사용한다. 가능하면 같은 시드 / 캐릭터 레퍼런스(IP-Adapter, 캐릭터 LoRA 등)를 쓴다.
- **스탠딩**은 발끝까지 보이게. 게임은 칸 하나를 화면 높이의 약 82%(모바일 62%)로 아래 정렬해 표시한다.
- **아이콘**은 16~24px로 축소되어 보이므로 실루엣이 분명해야 한다.
- 한글·영문 글자가 그림에 들어가지 않도록 한다(로고는 프레임만 만들고 글자는 편집 프로그램에서 넣는다). 단, 시계탑 낙서 CG는 글자 위치만 잡고 한글은 후보정으로 넣는 것을 권장한다.

| 구분 | 권장 해상도 | 비율 | 실행 횟수 |
|---|---|---|---|
| 1. 캐릭터 표정 시트 | 인물별 (위 표) | 인물별 | 16 |
| 2. 전투 초상화 (선택) | 512×512 | 1:1 | 6 |
| 3. 극의 컷인 | 1920×640 | 3:1 | 6 |
| 4. 적 · 보스 | 768×768 / 1024×1024 | 1:1 | 41 |
| 5. 배경 | 1920×1080 | 16:9 | 41 |
| 6. 이벤트 CG | 1920×1080 | 16:9 | 8 |
| 7. 엔딩 CG | 1920×1080 | 16:9 | 3 |
| 8. 타이틀 | 1920×1080 / 1600×600 | 16:9 / 8:3 | 2 |
| 9. UI 아이콘 — 속성 | 128×128 | 1:1 | 7 |
| 10. UI 아이콘 — 상태이상 | 128×128 | 1:1 | 11 |
| **필수 합계** | | | **135** |
| (선택 포함 시) | | | 141 |

## 인물 묘사 (고정 문구)

| ID | 묘사 |
|---|---|
| `lennox` | 17-year-old boy named Lennox, ash-silver messy hair, grey eyes, sharp jawline, faint dark circles, black and charcoal knight cadet uniform of Raven Hall with a worn silver falcon crest, long old longsword at the hip, small pen-nib shaped burn scar on the right palm |
| `kaien` | 18-year-old tall muscular boy named Kaien, short messy red hair, freckles across the nose, rolled-up sleeves, scuffed Raven Hall cadet uniform, large hand-forged round iron shield on the back, small bronze badge on the chest |
| `vivienne` | 17-year-old noble girl named Vivienne, long straight silver-blue hair with a frost-flower hairpin, pale blue eyes, elegant posture, white and navy Swan Hall mage uniform, short cape with a frost-flower ducal crest, slim silver crystal staff |
| `roland` | 18-year-old slender boy named Roland, wavy blond hair tied low at the nape, amber eyes, immaculate white Swan Hall uniform with a gold-trimmed short cape, a gold coin engraved with a white star between his fingers, dice charm on the belt |
| `mireille` | 15-year-old girl named Mireille, ash-silver hair in a neat side braid, soft grey eyes, white church healer apron over a pale grey Sanctum uniform, small silver staff with a tiny lantern charm |
| `seraphine` | 17-year-old girl named Seraphine, chocolate-brown bob haircut, warm brown eyes, plain worn scholarship-issue Raven Hall uniform, simple training sword, faint translucent empty rectangular window motif floating beside her |
| `hester` | ageless woman librarian named Hester, grey hair in a loose bun, grey knitted shawl, ink-stained fingertips, round spectacles, holding an old silver-thread bookmark |
| `belgrave` | elderly academy headmaster named Oswald Belgrave, long silver beard, deep brown and gold academic robes, carved wooden staff, kind grandfatherly face |
| `julian` | 19-year-old student council president named Julian, short dark wine-red hair, sharp red eyes, perfect posture, crimson-trimmed formal knight uniform with council sash, rapier in an ornate scabbard |
| `magda` | veteran female knight instructor in her forties named Magda, cropped brown hair, scar across the left cheek, muscular build, practical leather and steel training armor, wooden training sword over the shoulder |
| `bruno` | 17-year-old arrogant noble boy named Bruno, slicked-back dark green hair, Stag Hall uniform worn sloppily with an open collar, fancy rapier |
| `finn` | 16-year-old skinny timid boy named Finn, messy dull brown hair, freckles, oversized worn Raven Hall uniform, holding a small grey whetstone with both hands |
| `ashen` | the Ashen King, young man in his twenties with ash-grey hair, tired dark eyes, cracked compass-shaped crown made of ash, tattered grey royal coat over a modern grey hoodie, ash particles drifting around him |
| `real_lennox` | the true Lennox, same face as Lennox but colder and more fragile, hair slightly longer, standing on the other side of a mirror surface, faintly translucent edges, black mourning coat |
| `martha` | 21-year-old woman named Martha, red hair in a high ponytail, freckles, confident build, faded duel champion sash over a Raven Hall knight uniform |
| `eleanor` | elegant woman in her late thirties named Eleanor, long silver-blue hair like her daughter Vivienne, pale blue gown, frost-flower brooch, soft gentle eyes |


## 1. 캐릭터 표정 시트

### `assets/char/lennox_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 레녹스 그레이번 — 표정 5종 (3열×2행)
- **권장 해상도 / 비율**: 2160×2560 / 27:32
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`) / 2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 5 times in an evenly spaced grid of 3 columns and 2 rows, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 17-year-old boy named Lennox, ash-silver messy hair, grey eyes, sharp jawline, faint dark circles, black and charcoal knight cadet uniform of Raven Hall with a worn silver falcon crest, long old longsword at the hip, small pen-nib shaped burn scar on the right palm, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) angry frown, gritted teeth, (4) sad downcast eyes, holding back tears, (5) surprised wide eyes, slightly open mouth, the last cell is left completely empty
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/kaien_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 카이엔 브라트 — 표정 5종 (3열×2행)
- **권장 해상도 / 비율**: 2160×2560 / 27:32
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`) / 2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 5 times in an evenly spaced grid of 3 columns and 2 rows, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 18-year-old tall muscular boy named Kaien, short messy red hair, freckles across the nose, rolled-up sleeves, scuffed Raven Hall cadet uniform, large hand-forged round iron shield on the back, small bronze badge on the chest, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) angry frown, gritted teeth, (4) sad downcast eyes, holding back tears, (5) surprised wide eyes, slightly open mouth, the last cell is left completely empty
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/vivienne_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 비비안 로셰 — 표정 5종 (3열×2행)
- **권장 해상도 / 비율**: 2160×2560 / 27:32
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`) / 2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 5 times in an evenly spaced grid of 3 columns and 2 rows, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 17-year-old noble girl named Vivienne, long straight silver-blue hair with a frost-flower hairpin, pale blue eyes, elegant posture, white and navy Swan Hall mage uniform, short cape with a frost-flower ducal crest, slim silver crystal staff, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) angry frown, gritted teeth, (4) sad downcast eyes, holding back tears, (5) surprised wide eyes, slightly open mouth, the last cell is left completely empty
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/roland_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 롤랑 드 베르니에 — 표정 5종 (3열×2행)
- **권장 해상도 / 비율**: 2160×2560 / 27:32
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`) / 2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 5 times in an evenly spaced grid of 3 columns and 2 rows, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 18-year-old slender boy named Roland, wavy blond hair tied low at the nape, amber eyes, immaculate white Swan Hall uniform with a gold-trimmed short cape, a gold coin engraved with a white star between his fingers, dice charm on the belt, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) angry frown, gritted teeth, (4) sad downcast eyes, holding back tears, (5) surprised wide eyes, slightly open mouth, the last cell is left completely empty
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/mireille_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 미레유 그레이번 — 표정 5종 (3열×2행)
- **권장 해상도 / 비율**: 2160×2560 / 27:32
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`) / 2행: 슬픔(`sad`) · 놀람(`surprised`) · (빈칸)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 5 times in an evenly spaced grid of 3 columns and 2 rows, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 15-year-old girl named Mireille, ash-silver hair in a neat side braid, soft grey eyes, white church healer apron over a pale grey Sanctum uniform, small silver staff with a tiny lantern charm, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) angry frown, gritted teeth, (4) sad downcast eyes, holding back tears, (5) surprised wide eyes, slightly open mouth, the last cell is left completely empty
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/seraphine_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 세라핀 루엘 — 표정 6종 (3열×2행)
- **권장 해상도 / 비율**: 2160×2560 / 27:32
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 분노(`angry`) / 2행: 슬픔(`sad`) · 놀람(`surprised`) · 무표정(퀘스트 상태)(`blank`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 6 times in an evenly spaced grid of 3 columns and 2 rows, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 17-year-old girl named Seraphine, chocolate-brown bob haircut, warm brown eyes, plain worn scholarship-issue Raven Hall uniform, simple training sword, faint translucent empty rectangular window motif floating beside her, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) angry frown, gritted teeth, (4) sad downcast eyes, holding back tears, (5) surprised wide eyes, slightly open mouth, (6) empty glassy eyes with faint white glyph reflections, emotionless puppet-like face
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/hester_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 헤스터 크레인 — 표정 3종 (3열×1행)
- **권장 해상도 / 비율**: 2160×1280 / 27:16
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 슬픔(`sad`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 3 times in an evenly spaced grid of 3 columns and 1 row, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, ageless woman librarian named Hester, grey hair in a loose bun, grey knitted shawl, ink-stained fingertips, round spectacles, holding an old silver-thread bookmark, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) sad downcast eyes, holding back tears
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/belgrave_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 오스왈드 벨그레이브 — 표정 4종 (2열×2행)
- **권장 해상도 / 비율**: 1440×2560 / 9:16
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) / 2행: 냉정(`cold`) · 슬픔(`sad`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 4 times in an evenly spaced grid of 2 columns and 2 rows, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, elderly academy headmaster named Oswald Belgrave, long silver beard, deep brown and gold academic robes, carved wooden staff, kind grandfatherly face, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) polite smile but cold empty eyes, unsettling, (4) sad downcast eyes, holding back tears
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/julian_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 율리안 하이든 — 표정 3종 (3열×1행)
- **권장 해상도 / 비율**: 2160×1280 / 27:16
- **칸 배치**: 1행: 기본(`normal`) · 분노(`angry`) · 슬픔(`sad`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 3 times in an evenly spaced grid of 3 columns and 1 row, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 19-year-old student council president named Julian, short dark wine-red hair, sharp red eyes, perfect posture, crimson-trimmed formal knight uniform with council sash, rapier in an ornate scabbard, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) angry frown, gritted teeth, (3) sad downcast eyes, holding back tears
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/magda_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 마그다 오르테가 — 표정 3종 (3열×1행)
- **권장 해상도 / 비율**: 2160×1280 / 27:16
- **칸 배치**: 1행: 기본(`normal`) · 분노(`angry`) · 미소(`smile`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 3 times in an evenly spaced grid of 3 columns and 1 row, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, veteran female knight instructor in her forties named Magda, cropped brown hair, scar across the left cheek, muscular build, practical leather and steel training armor, wooden training sword over the shoulder, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) angry frown, gritted teeth, (3) gentle warm smile
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/bruno_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 브루노 카스텔 — 표정 3종 (3열×1행)
- **권장 해상도 / 비율**: 2160×1280 / 27:16
- **칸 배치**: 1행: 기본(`normal`) · 분노(`angry`) · 겁먹음(`scared`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 3 times in an evenly spaced grid of 3 columns and 1 row, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 17-year-old arrogant noble boy named Bruno, slicked-back dark green hair, Stag Hall uniform worn sloppily with an open collar, fancy rapier, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) angry frown, gritted teeth, (3) frightened expression, shrinking posture
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/finn_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 핀 애셔 — 표정 3종 (3열×1행)
- **권장 해상도 / 비율**: 2160×1280 / 27:16
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 겁먹음(`scared`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 3 times in an evenly spaced grid of 3 columns and 1 row, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 16-year-old skinny timid boy named Finn, messy dull brown hair, freckles, oversized worn Raven Hall uniform, holding a small grey whetstone with both hands, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) frightened expression, shrinking posture
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/ashen_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 잿빛 왕 (아르딘) — 표정 3종 (3열×1행)
- **권장 해상도 / 비율**: 2160×1280 / 27:16
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 슬픔(`sad`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 3 times in an evenly spaced grid of 3 columns and 1 row, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, the Ashen King, young man in his twenties with ash-grey hair, tired dark eyes, cracked compass-shaped crown made of ash, tattered grey royal coat over a modern grey hoodie, ash particles drifting around him, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) sad downcast eyes, holding back tears
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/real_lennox_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 진짜 레녹스 — 표정 3종 (3열×1행)
- **권장 해상도 / 비율**: 2160×1280 / 27:16
- **칸 배치**: 1행: 기본(`normal`) · 슬픔(`sad`) · 미소(`smile`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 3 times in an evenly spaced grid of 3 columns and 1 row, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, the true Lennox, same face as Lennox but colder and more fragile, hair slightly longer, standing on the other side of a mirror surface, faintly translucent edges, black mourning coat, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) sad downcast eyes, holding back tears, (3) gentle warm smile
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/martha_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 마르타 브라트 — 표정 3종 (3열×1행)
- **권장 해상도 / 비율**: 2160×1280 / 27:16
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 슬픔(`sad`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 3 times in an evenly spaced grid of 3 columns and 1 row, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, 21-year-old woman named Martha, red hair in a high ponytail, freckles, confident build, faded duel champion sash over a Raven Hall knight uniform, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) sad downcast eyes, holding back tears
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

### `assets/char/eleanor_sheet.png`
- **용도**: 대화 스탠딩 표정 시트 — 칸 하나가 9:16 (권장 720×1280) — 엘레노어 로셰 — 표정 3종 (3열×1행)
- **권장 해상도 / 비율**: 2160×1280 / 27:16
- **칸 배치**: 1행: 기본(`normal`) · 미소(`smile`) · 슬픔(`sad`)
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, character expression sheet of one single character, the same person drawn 3 times in an evenly spaced grid of 3 columns and 1 row, identical outfit, hairstyle, body pose, size and camera angle in every cell, only the facial expression changes, each figure is a full body standing sprite in three-quarter view centered in its own equal-size cell with head and feet fully visible, wide empty margin between cells, plain flat light grey background, no grid lines, no borders, elegant woman in her late thirties named Eleanor, long silver-blue hair like her daughter Vivienne, pale blue gown, frost-flower brooch, soft gentle eyes, expressions in reading order from left to right, top to bottom: (1) neutral calm expression, (2) gentle warm smile, (3) sad downcast eyes, holding back tears
```
- **네거티브**: 공통 네거티브 + `different outfits between cells, different characters, inconsistent face, overlapping figures, cropped feet, text labels, numbers, grid lines, background scenery`

## 2. 전투 초상화 (선택)

> 선택 항목. 파일이 없으면 표정 시트의 「기본」 칸에서 상반신을 잘라 쓰므로, 따로 그리지 않아도 된다.

### `assets/portrait/lennox.png`
- **용도**: (선택) 전투 카드·편성 초상화 — 없으면 표정 시트의 「기본」 칸에서 상반신을 잘라 쓴다 — 레녹스 그레이번
- **권장 해상도 / 비율**: 512×512 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, bust portrait, head and shoulders, facing slightly left, simple dark vignette background, 17-year-old boy named Lennox, ash-silver messy hair, grey eyes, sharp jawline, faint dark circles, black and charcoal knight cadet uniform of Raven Hall with a worn silver falcon crest, long old longsword at the hip, small pen-nib shaped burn scar on the right palm, determined expression
```
- **네거티브**: 공통 네거티브

### `assets/portrait/kaien.png`
- **용도**: (선택) 전투 카드·편성 초상화 — 없으면 표정 시트의 「기본」 칸에서 상반신을 잘라 쓴다 — 카이엔 브라트
- **권장 해상도 / 비율**: 512×512 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, bust portrait, head and shoulders, facing slightly left, simple dark vignette background, 18-year-old tall muscular boy named Kaien, short messy red hair, freckles across the nose, rolled-up sleeves, scuffed Raven Hall cadet uniform, large hand-forged round iron shield on the back, small bronze badge on the chest, determined expression
```
- **네거티브**: 공통 네거티브

### `assets/portrait/vivienne.png`
- **용도**: (선택) 전투 카드·편성 초상화 — 없으면 표정 시트의 「기본」 칸에서 상반신을 잘라 쓴다 — 비비안 로셰
- **권장 해상도 / 비율**: 512×512 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, bust portrait, head and shoulders, facing slightly left, simple dark vignette background, 17-year-old noble girl named Vivienne, long straight silver-blue hair with a frost-flower hairpin, pale blue eyes, elegant posture, white and navy Swan Hall mage uniform, short cape with a frost-flower ducal crest, slim silver crystal staff, determined expression
```
- **네거티브**: 공통 네거티브

### `assets/portrait/roland.png`
- **용도**: (선택) 전투 카드·편성 초상화 — 없으면 표정 시트의 「기본」 칸에서 상반신을 잘라 쓴다 — 롤랑 드 베르니에
- **권장 해상도 / 비율**: 512×512 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, bust portrait, head and shoulders, facing slightly left, simple dark vignette background, 18-year-old slender boy named Roland, wavy blond hair tied low at the nape, amber eyes, immaculate white Swan Hall uniform with a gold-trimmed short cape, a gold coin engraved with a white star between his fingers, dice charm on the belt, determined expression
```
- **네거티브**: 공통 네거티브

### `assets/portrait/mireille.png`
- **용도**: (선택) 전투 카드·편성 초상화 — 없으면 표정 시트의 「기본」 칸에서 상반신을 잘라 쓴다 — 미레유 그레이번
- **권장 해상도 / 비율**: 512×512 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, bust portrait, head and shoulders, facing slightly left, simple dark vignette background, 15-year-old girl named Mireille, ash-silver hair in a neat side braid, soft grey eyes, white church healer apron over a pale grey Sanctum uniform, small silver staff with a tiny lantern charm, determined expression
```
- **네거티브**: 공통 네거티브

### `assets/portrait/seraphine.png`
- **용도**: (선택) 전투 카드·편성 초상화 — 없으면 표정 시트의 「기본」 칸에서 상반신을 잘라 쓴다 — 세라핀 루엘
- **권장 해상도 / 비율**: 512×512 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, bust portrait, head and shoulders, facing slightly left, simple dark vignette background, 17-year-old girl named Seraphine, chocolate-brown bob haircut, warm brown eyes, plain worn scholarship-issue Raven Hall uniform, simple training sword, faint translucent empty rectangular window motif floating beside her, determined expression
```
- **네거티브**: 공통 네거티브

## 3. 극의 컷인

### `assets/cutin/lennox_ult.png`
- **용도**: 극의(궁극기) 컷인 연출 — 레녹스 그레이번 — 「잿빛 매 · 무명참」
- **권장 해상도 / 비율**: 1920×640 / 3:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, ultra wide dynamic action cut-in banner, dramatic diagonal composition, speed lines, character on the right third, glowing effects, 17-year-old boy named Lennox, ash-silver messy hair, grey eyes, sharp jawline, faint dark circles, black and charcoal knight cadet uniform of Raven Hall with a worn silver falcon crest, long old longsword at the hip, small pen-nib shaped burn scar on the right palm, slashing diagonally with an ash-grey sword trail shaped like a falcon wing, purple moonlight shadows
```
- **네거티브**: 공통 네거티브

### `assets/cutin/kaien_ult.png`
- **용도**: 극의(궁극기) 컷인 연출 — 카이엔 브라트 — 「대장간의 불씨」
- **권장 해상도 / 비율**: 1920×640 / 3:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, ultra wide dynamic action cut-in banner, dramatic diagonal composition, speed lines, character on the right third, glowing effects, 18-year-old tall muscular boy named Kaien, short messy red hair, freckles across the nose, rolled-up sleeves, scuffed Raven Hall cadet uniform, large hand-forged round iron shield on the back, small bronze badge on the chest, slamming the iron shield down, forge-fire sparks and flames exploding, warm orange glow
```
- **네거티브**: 공통 네거티브

### `assets/cutin/vivienne_ult.png`
- **용도**: 극의(궁극기) 컷인 연출 — 비비안 로셰 — 「영구동토 정리」
- **권장 해상도 / 비율**: 1920×640 / 3:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, ultra wide dynamic action cut-in banner, dramatic diagonal composition, speed lines, character on the right third, glowing effects, 17-year-old noble girl named Vivienne, long straight silver-blue hair with a frost-flower hairpin, pale blue eyes, elegant posture, white and navy Swan Hall mage uniform, short cape with a frost-flower ducal crest, slim silver crystal staff, drawing a giant frost glyph in the air, ice crystals spreading into a blizzard, cold blue light
```
- **네거티브**: 공통 네거티브

### `assets/cutin/roland_ult.png`
- **용도**: 극의(궁극기) 컷인 연출 — 롤랑 드 베르니에 — 「잭팟」
- **권장 해상도 / 비율**: 1920×640 / 3:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, ultra wide dynamic action cut-in banner, dramatic diagonal composition, speed lines, character on the right third, glowing effects, 18-year-old slender boy named Roland, wavy blond hair tied low at the nape, amber eyes, immaculate white Swan Hall uniform with a gold-trimmed short cape, a gold coin engraved with a white star between his fingers, dice charm on the belt, throwing a gold coin and lightning dice, electric yellow arcs, jackpot sparkle
```
- **네거티브**: 공통 네거티브

### `assets/cutin/mireille_ult.png`
- **용도**: 극의(궁극기) 컷인 연출 — 미레유 그레이번 — 「백야의 기도」
- **권장 해상도 / 비율**: 1920×640 / 3:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, ultra wide dynamic action cut-in banner, dramatic diagonal composition, speed lines, character on the right third, glowing effects, 15-year-old girl named Mireille, ash-silver hair in a neat side braid, soft grey eyes, white church healer apron over a pale grey Sanctum uniform, small silver staff with a tiny lantern charm, raising the silver staff in prayer, white dawn light pouring down like a cathedral, feathers of light
```
- **네거티브**: 공통 네거티브

### `assets/cutin/seraphine_ult.png`
- **용도**: 극의(궁극기) 컷인 연출 — 세라핀 루엘 — 「퀘스트 완료」
- **권장 해상도 / 비율**: 1920×640 / 3:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, ultra wide dynamic action cut-in banner, dramatic diagonal composition, speed lines, character on the right third, glowing effects, 17-year-old girl named Seraphine, chocolate-brown bob haircut, warm brown eyes, plain worn scholarship-issue Raven Hall uniform, simple training sword, faint translucent empty rectangular window motif floating beside her, slashing with a colorless blade leaving a white blank trail, floating empty UI window fragments shattering
```
- **네거티브**: 공통 네거티브

## 4. 적 · 보스

### `assets/enemy/ink_rat.png`
- **용도**: 전투 적 초상화 — 누락 쥐 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a rat made of erased white paper, no fur texture, blank white eyes, eraser-smudged edges
```
- **네거티브**: 공통 네거티브

### `assets/enemy/name_hound.png`
- **용도**: 전투 보스 초상화 — 이름을 먹는 개 (보스)
- **권장 해상도 / 비율**: 1024×1024 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, boss portrait, imposing full presence, centered, dramatic rim light, dark vignette background, a huge white hound with a collar made of illegible erased letters, half its face smudged like eraser marks, white mist
```
- **네거티브**: 공통 네거티브

### `assets/enemy/training_doll.png`
- **용도**: 전투 적 초상화 — 대련 인형 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a wooden training dummy knight with a wooden sword, academy training yard dummy, worn paint
```
- **네거티브**: 공통 네거티브

### `assets/enemy/thug.png`
- **용도**: 전투 적 초상화 — 사슴관 패거리 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, upper-year noble student thug with a wooden club, smug face, Stag Hall uniform
```
- **네거티브**: 공통 네거티브

### `assets/enemy/bruno.png`
- **용도**: 전투 적 초상화 — 브루노 카스텔 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, Bruno, arrogant noble boy with slicked dark green hair, rapier drawn, sneering
```
- **네거티브**: 공통 네거티브

### `assets/enemy/ink_leech.png`
- **용도**: 전투 적 초상화 — 잉크 거머리 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a leech made of black ink crawling out of lake reeds, glossy, dripping
```
- **네거티브**: 공통 네거티브

### `assets/enemy/hollow_armor.png`
- **용도**: 전투 적 초상화 — 빈 갑옷 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, an empty suit of knight armor walking by itself, white mist inside the helmet
```
- **네거티브**: 공통 네거티브

### `assets/enemy/lake_shade.png`
- **용도**: 전투 적 초상화 — 교복 입은 그림자 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a faceless figure wearing a Raven Hall school uniform, face erased like smudged pencil, white mist
```
- **네거티브**: 공통 네거티브

### `assets/enemy/warden.png`
- **용도**: 전투 보스 초상화 — 감독관 인형 (보스)
- **권장 해상도 / 비율**: 1024×1024 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, boss portrait, imposing full presence, centered, dramatic rim light, dark vignette background, a giant academy examination automaton, white porcelain and steel, glowing white eye, judge-like design
```
- **네거티브**: 공통 네거티브

### `assets/enemy/warden_arm_l.png`
- **용도**: 전투 적 초상화 — 감독관 · 왼팔 (부위)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, the left arm of a giant examination automaton, sweeping blade arm, white porcelain and steel
```
- **네거티브**: 공통 네거티브

### `assets/enemy/warden_arm_r.png`
- **용도**: 전투 적 초상화 — 감독관 · 오른팔 (부위)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, the right arm of a giant examination automaton, heavy hammer fist, white porcelain and steel
```
- **네거티브**: 공통 네거티브

### `assets/enemy/cadet.png`
- **용도**: 전투 적 초상화 — 기사과 생도 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, knight course cadet in a red tournament tabard, wooden practice sword, determined face
```
- **네거티브**: 공통 네거티브

### `assets/enemy/twin_odel.png`
- **용도**: 전투 적 초상화 — 쌍검 쌍둥이 · 오델 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, twin swordsman Odel, dark purple short hair, dual swords, cold eyes, left-handed stance
```
- **네거티브**: 공통 네거티브

### `assets/enemy/twin_odil.png`
- **용도**: 전투 적 초상화 — 쌍검 쌍둥이 · 오딜 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, twin swordswoman Odil, dark crimson short hair, dual swords, playful smirk, right-handed stance
```
- **네거티브**: 공통 네거티브

### `assets/enemy/festival_crawler.png`
- **용도**: 전투 적 초상화 — 축제의 그림자 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a shadow creature crawling between festival lanterns, white hollow eyes
```
- **네거티브**: 공통 네거티브

### `assets/enemy/hollow_student.png`
- **용도**: 전투 적 초상화 — 교복 입은 누락체 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a tall faceless erased figure in an old Raven Hall uniform with a faded duel champion sash, reaching hand
```
- **네거티브**: 공통 네거티브

### `assets/enemy/julian.png`
- **용도**: 전투 보스 초상화 — 학생회장 율리안 하이든 (보스)
- **권장 해상도 / 비율**: 1024×1024 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, boss portrait, imposing full presence, centered, dramatic rim light, dark vignette background, Julian, student council president with dark wine-red hair, drawing a rapier, intense red eyes
```
- **네거티브**: 공통 네거티브

### `assets/enemy/margin_crawler.png`
- **용도**: 전투 적 초상화 — 여백의 기어다니는 것 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a pale white creature crawling out of blank nothingness, smooth featureless body, too many joints
```
- **네거티브**: 공통 네거티브

### `assets/enemy/margin_hound.png`
- **용도**: 전투 적 초상화 — 여백의 파수견 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a giant white guardian dog of the lighthouse, smooth chalk-like body, howling
```
- **네거티브**: 공통 네거티브

### `assets/enemy/imperial_agent.png`
- **용도**: 전투 적 초상화 — 제국 요원 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, masked agent of a holy empire in a white cloak with a white star emblem, poison needle daggers
```
- **네거티브**: 공통 네거티브

### `assets/enemy/imperial_captain.png`
- **용도**: 전투 적 초상화 — 제국 첩보대장 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, imperial spymaster in an ornate white and gold cloak, white star emblem, longsword
```
- **네거티브**: 공통 네거티브

### `assets/enemy/roland_foe.png`
- **용도**: 전투 적 초상화 — 롤랑 드 베르니에 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, Roland, blond boy in a white imperial cloak over his academy uniform, gold coin and rapier, sad smile
```
- **네거티브**: 공통 네거티브

### `assets/enemy/page_wraith.png`
- **용도**: 전투 적 초상화 — 페이지 망령 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a wraith made of torn book pages folded into a human shape, paper blade arms
```
- **네거티브**: 공통 네거티브

### `assets/enemy/bookworm.png`
- **용도**: 전투 적 초상화 — 서가의 좀 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a giant bookworm insect made of chewed letters and parchment, crawling out of shelves
```
- **네거티브**: 공통 네거티브

### `assets/enemy/choir_conductor.png`
- **용도**: 전투 보스 초상화 — 성가대 · 지휘자 (보스)
- **권장 해상도 / 비율**: 1024×1024 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, boss portrait, imposing full presence, centered, dramatic rim light, dark vignette background, a faceless choir conductor in black robes with a white baton, surrounded by floating erased names
```
- **네거티브**: 공통 네거티브

### `assets/enemy/choir_soprano.png`
- **용도**: 전투 적 초상화 — 성가대 · 소프라노 (부위)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a faceless choir singer in an old white academy uniform, mouth open in a high note, ghostly
```
- **네거티브**: 공통 네거티브

### `assets/enemy/choir_alto.png`
- **용도**: 전투 적 초상화 — 성가대 · 알토 (부위)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a faceless choir singer in an old blue academy uniform, ghostly, hands clasped
```
- **네거티브**: 공통 네거티브

### `assets/enemy/choir_bass.png`
- **용도**: 전투 적 초상화 — 성가대 · 베이스 (부위)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a tall faceless choir singer in an old black academy uniform, ghostly, deep resonance
```
- **네거티브**: 공통 네거티브

### `assets/enemy/rewritten_student.png`
- **용도**: 전투 적 초상화 — 개찬된 학생 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, academy student with white glowing glyphs flowing across the eyes, puppet-like stance
```
- **네거티브**: 공통 네거티브

### `assets/enemy/bruno_rewritten.png`
- **용도**: 전투 적 초상화 — 개찬된 브루노 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, Bruno with white glowing glyphs flowing across his eyes, crying, rapier raised stiffly
```
- **네거티브**: 공통 네거티브

### `assets/enemy/warden_mk2.png`
- **용도**: 전투 적 초상화 — 감독관 개량형 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, an upgraded giant examination automaton painted white, twice as large, multiple blade arms, glowing lock seals
```
- **네거티브**: 공통 네거티브

### `assets/enemy/ink_squire.png`
- **용도**: 전투 적 초상화 — 잉크 종자 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a squire knight made entirely of black ink, dripping, holding an ink blade
```
- **네거티브**: 공통 네거티브

### `assets/enemy/ledger_executor.png`
- **용도**: 전투 적 초상화 — 장부의 집행관 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a knight whose helmet is a giant pen nib, armor made of book pages and gold, executioner stance
```
- **네거티브**: 공통 네거티브

### `assets/enemy/belgrave.png`
- **용도**: 전투 보스 초상화 — 관리인 오스왈드 벨그레이브 (보스)
- **권장 해상도 / 비율**: 1024×1024 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, boss portrait, imposing full presence, centered, dramatic rim light, dark vignette background, Headmaster Belgrave raising a staff that glows like a quill pen, white glyphs swirling, sorrowful smile
```
- **네거티브**: 공통 네거티브

### `assets/enemy/hollow_noble.png`
- **용도**: 전투 적 초상화 — 지워진 귀족 (일반)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, an erased noble from a past era, white featureless face, ornate faded ducal clothing, old sword
```
- **네거티브**: 공통 네거티브

### `assets/enemy/ink_knight.png`
- **용도**: 전투 적 초상화 — 검은 잉크의 기사 (정예)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a knight in pitch-black armor dripping black ink, a plastic keychain hanging from the belt, broken visor
```
- **네거티브**: 공통 네거티브

### `assets/enemy/scripted_seraphine.png`
- **용도**: 전투 보스 초상화 — 각본의 성객 (보스)
- **권장 해상도 / 비율**: 1024×1024 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, boss portrait, imposing full presence, centered, dramatic rim light, dark vignette background, Seraphine with empty glowing white eyes, chains of white glyphs around her wrists, colorless sword
```
- **네거티브**: 공통 네거티브

### `assets/enemy/ashen_king.png`
- **용도**: 전투 보스 초상화 — 잿빛 왕 (보스)
- **권장 해상도 / 비율**: 1024×1024 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, boss portrait, imposing full presence, centered, dramatic rim light, dark vignette background, the Ashen King on his feet, cracked compass ash crown, grey coat over a hoodie, sword made of ash, tired expression
```
- **네거티브**: 공통 네거티브

### `assets/enemy/ledger.png`
- **용도**: 전투 보스 초상화 — 별의 장부 (보스)
- **권장 해상도 / 비율**: 1024×1024 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, boss portrait, imposing full presence, centered, dramatic rim light, dark vignette background, a gigantic floating open book the size of a cathedral, pages glowing gold, star constellations on the cover, ominous
```
- **네거티브**: 공통 네거티브

### `assets/enemy/ledger_quill.png`
- **용도**: 전투 적 초상화 — 장부의 펜 (부위)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a gigantic floating golden quill pen with a razor nib, moving by itself
```
- **네거티브**: 공통 네거티브

### `assets/enemy/ledger_ink.png`
- **용도**: 전투 적 초상화 — 장부의 잉크병 (부위)
- **권장 해상도 / 비율**: 768×768 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, creature or character portrait, centered, dark vignette background, menacing pose, a gigantic floating inkwell overflowing with black ink, starry reflections in the ink
```
- **네거티브**: 공통 네거티브

## 5. 배경

### `assets/bg/room_earth.png`
- **용도**: 배경 — 도윤의 원룸 · 새벽 3시
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a cramped modern Seoul studio apartment at 3 AM, only a monitor glowing with a mobile RPG ending screen, energy drink cans, rain on the window
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/dorm_room.png`
- **용도**: 배경 — 갈까마귀관 · 2인실
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a small two-person dormitory room in an old fantasy academy, wooden rafters, cracked mirror on the wall, rough wool blankets, morning light through a window facing a lake
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/dorm_hall.png`
- **용도**: 배경 — 갈까마귀관 · 라운지
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, the lounge of a modest academy dormitory for commoners, worn sofas, fireplace, notice board, raven motifs
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/dorm_night.png`
- **용도**: 배경 — 갈까마귀관 · 밤
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, the exterior of an old stone dormitory at night, raven weathervane, lanterns flickering, ominous white mist at the entrance
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/academy_gate.png`
- **용도**: 배경 — 베스퍼홀 · 호수 다리
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a long stone bridge crossing a mirror-like lake toward a gothic academy on an island, spring blossoms, banners
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/forest_day.png`
- **용도**: 배경 — 속삭임 숲
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a whispering ancient forest in daylight, leaves rustling without wind, sunbeams, mossy roots, training path
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/forest_rift.png`
- **용도**: 배경 — 속삭임 숲 · 균열
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a forest clearing where the sky is torn open by a glowing white rift, papery white wind pouring out
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/training_yard.png`
- **용도**: 배경 — 기사과 훈련장
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, knight training yard of a fantasy academy, wooden dummies, weapon racks, sand ground, stone walls
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/classroom.png`
- **용도**: 배경 — 마도과 강의실
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a gothic magic lecture hall, chalkboard with glowing runes, tiered wooden desks, tall windows
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/library.png`
- **용도**: 배경 — 대도서관
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, an enormous grand library with towering shelves to a vaulted ceiling, ladders, dust in light beams
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/infirmary.png`
- **용도**: 배경 — 신성과 치유동
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a bright church infirmary ward, white linen beds, herb baskets, stained glass light
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/ballroom.png`
- **용도**: 배경 — 대강당 · 환영 무도회
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a grand academy ballroom with hundreds of crystal chandeliers, gold trim, string quartet stage
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/ballroom_garden.png`
- **용도**: 배경 — 대강당 뒤뜰
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a dark garden behind a ballroom at night, hedges, warm window light behind, stone path
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/ballroom_ruin.png`
- **용도**: 배경 — 무너지는 대강당 · 겨울 무도회
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a grand ballroom in winter whose ceiling is being erased into white nothingness, broken chandeliers, falling snow and paper
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/lake_day.png`
- **용도**: 배경 — 거울 호수
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a calm mirror lake around an academy island, perfect reflections, reeds, walking path
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/lake_night.png`
- **용도**: 배경 — 거울 호수 · 밤
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a mirror lake at night reflecting a starry sky, moonflowers on the shore, reeds, lantern light
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/arena.png`
- **용도**: 배경 — 원형 결투장 「붉은 원」
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a circular red stone dueling arena with tiered seats, banners, sand floor, daytime
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/arena_final.png`
- **용도**: 배경 — 붉은 원 · 결승의 밤
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a circular red dueling arena at night, ring of torches, packed crowd silhouettes, dramatic
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/arena_hall.png`
- **용도**: 배경 — 결투장 회랑 · 우승자 명패
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a dim stone corridor lined with brass champion plaques, one plaque perfectly blank
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/tea_room.png`
- **용도**: 배경 — 백조관 · 다과실
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, an elegant noble tea room in lilac and white, silver tea set, frost-flower decorations, afternoon light
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/clocktower.png`
- **용도**: 배경 — 옛 시계탑
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, interior machine room of an old stopped clock tower, giant gears, dust, Korean hangul letters carved into the stone wall
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/clocktower_stairs.png`
- **용도**: 배경 — 시계탑 계단
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, an endless spiral staircase inside a clock tower, walls covered with pasted book pages, white glow from above
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/clocktower_top.png`
- **용도**: 배경 — 시계탑 꼭대기
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, the top chamber of a clock tower at night, a giant open book on the floor glowing, broken clock face showing the sky
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/headmaster_office.png`
- **용도**: 배경 — 학장실
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a warm headmaster office with fireplace, bookshelves, antique desk, window to the lake, teacups
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/carriage.png`
- **용도**: 배경 — 마차 안
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, interior of a wooden travel carriage, cushioned benches, curtains, countryside sunlight
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/fortress.png`
- **용도**: 배경 — 흰 등대 요새
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a white stone fortress at the edge of the world, beyond the walls only blank white nothingness without horizon
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/fortress_night.png`
- **용도**: 배경 — 흰 등대 요새 · 밤
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a white fortress wall at night, torches, beyond the wall a faintly glowing white void
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/lighthouse.png`
- **용도**: 배경 — 흰 등대 꼭대기
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, top of a white lighthouse, giant lens facing inward toward the continent, an old wall map with arrows pointing inward
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/archive.png`
- **용도**: 배경 — 금서고
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a forbidden underground archive, chained books, descending endless stairs, candlelight, paper dust
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/archive_choir.png`
- **용도**: 배경 — 금서고 · 성가대석
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a cathedral-like choir hall deep in an archive, choir stalls, faint ghostly silhouettes, dark
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/archive_deep.png`
- **용도**: 배경 — 장부의 바깥 페이지
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, an abyss of gigantic overlapping book pages descending forever, golden handwriting glowing
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/corridor.png`
- **용도**: 배경 — 본관 복도
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a long gothic academy corridor in grey daylight, students standing in eerie rows, tall windows
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/courtyard_snow.png`
- **용도**: 배경 — 눈 덮인 안뜰
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, an academy courtyard covered in first snow, frozen fountain, bare trees, quiet grey sky
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/dream_mirror.png`
- **용도**: 배경 — 꿈 · 거울의 방
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a dream room made entirely of mirrors reflecting infinitely, cold blue light, floating dust
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/margin_shore.png`
- **용도**: 배경 — 여백의 해안
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, an endless white void with a faint sense of shoreline, floating fragments of erased things: teacups, letters, buttons, a paper boat
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/memory_classroom.png`
- **용도**: 배경 — 기억의 교실
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a faded classroom floating in white nothingness, everything bleached of color, chalk dust, window showing a white lake
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/ink_corridor.png`
- **용도**: 배경 — 잉크의 회랑
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, an endless corridor flooded with black ink, reflective floor, dripping pillars, faint gold glyphs
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/ashen_throne.png`
- **용도**: 배경 — 잿빛 왕좌
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a throne made of piled ash and broken crowns in a grey void, ash snow falling
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/ledger_heart.png`
- **용도**: 배경 — 장부의 심장
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, the heart of a cosmic book world, colossal glowing pages forming a sky, golden light, floating quill and inkwell
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/spring_academy.png`
- **용도**: 배경 — 봄의 베스퍼홀
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, the academy on the lake island in full spring bloom, cherry-like blossoms, bright hopeful morning
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

### `assets/bg/white_void.png`
- **용도**: 배경 — 하얀 여백
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, background art, wide establishing shot, no characters, visual novel background, depth and atmosphere, a peaceful spring academy seen from afar with a soft white void visible on the far horizon, bittersweet
```
- **네거티브**: 공통 네거티브 + `people, characters, crowd in foreground`

## 6. 이벤트 CG

### `assets/cg/cg_awaken.png`
- **용도**: 이벤트 CG — 거울 속 낯선 얼굴
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic event illustration, visual novel CG, emotional lighting, a boy with ash-silver hair (Lennox) staring in shock at his own reflection in a cracked mirror in a small dorm room, morning light, raising his scarred right palm
```
- **네거티브**: 공통 네거티브

### `assets/cg/cg_carving.png`
- **용도**: 이벤트 CG — 시계탑의 한글 낙서
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic event illustration, visual novel CG, emotional lighting, close-up of Korean hangul letters carved with a blade into an old stone wall inside a clock tower, lantern light, a hand touching the carving
```
- **네거티브**: 공통 네거티브

### `assets/cg/cg_empty_bed.png`
- **용도**: 이벤트 CG — 아무도 기억하지 않는 침대
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic event illustration, visual novel CG, emotional lighting, an empty dusty dormitory room with a single bare bed, a grey whetstone left on the desk, cold light
```
- **네거티브**: 공통 네거티브

### `assets/cg/cg_reveal.png`
- **용도**: 이벤트 CG — 제47장의 마지막 페이지
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic event illustration, visual novel CG, emotional lighting, Lennox standing before gigantic glowing book pages full of golden handwriting, a translucent grey king with a cracked compass crown appearing between the pages
```
- **네거티브**: 공통 네거티브

### `assets/cg/cg_hester.png`
- **용도**: 이벤트 CG — 지워지는 사서
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic event illustration, visual novel CG, emotional lighting, an elderly librarian in a grey shawl fading into white powder from her feet up, smiling calmly, a headmaster watching, ink-stained hand reaching out
```
- **네거티브**: 공통 네거티브

### `assets/cg/cg_winter_ball.png`
- **용도**: 이벤트 CG — 겨울 무도회
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic event illustration, visual novel CG, emotional lighting, a boy with ash-silver hair dancing with a partner in a grand winter ballroom, chandeliers, snow outside tall windows, warm gold light
```
- **네거티브**: 공통 네거티브

### `assets/cg/cg_kaien_last.png`
- **용도**: 이벤트 CG — 갈까마귀관의 문
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic event illustration, visual novel CG, emotional lighting, a big red-haired young man sitting against a dormitory door at dawn, eyes closed peacefully, broken sword in hand, a copper badge fallen on the snow
```
- **네거티브**: 공통 네거티브

### `assets/cg/cg_ashen_name.png`
- **용도**: 이벤트 CG — 이름을 불린 왕
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic event illustration, visual novel CG, emotional lighting, the Ashen King removing his cracked crown in tears while sitting on an ash throne, a boy with ash-silver hair holding an open notebook
```
- **네거티브**: 공통 네거티브

## 7. 엔딩 CG

### `assets/cg/ending_true.png`
- **용도**: 엔딩 CG — TRUE END · 이름을 부르는 자
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic ending illustration, visual novel ending CG, emotional climax, painterly light, spring morning at the academy, friends gathered on the lake shore, two paper boats floating toward a white door of light, a notebook full of names, hopeful
```
- **네거티브**: 공통 네거티브

### `assets/cg/ending_normal.png`
- **용도**: 엔딩 CG — NORMAL END · 여백의 봄
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic ending illustration, visual novel ending CG, emotional climax, painterly light, a young swordsman teaching unblessed children swordsmanship in a sunlit training yard, a soft white void on the distant horizon, bittersweet hope
```
- **네거티브**: 공통 네거티브

### `assets/cg/ending_bad.png`
- **용도**: 엔딩 CG — BAD END · 제49장
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, cinematic ending illustration, visual novel ending CG, emotional climax, painterly light, an ash throne in a grey void, a silver-haired boy wearing a cracked compass crown looking down tiredly through a rift at new students, ominous
```
- **네거티브**: 공통 네거티브

## 8. 타이틀

### `assets/title/title_bg.png`
- **용도**: 타이틀 화면 배경 — 타이틀 배경
- **권장 해상도 / 비율**: 1920×1080 / 16:9
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, key visual, epic composition, leave the upper center empty for the title logo, a boy with ash-silver hair and an old longsword standing on the roof of an old clock tower at night, a gigantic open glowing star ledger book in the sky above a gothic academy on a lake island, a grey falcon silhouette crossing the moon
```
- **네거티브**: 공통 네거티브

### `assets/title/logo.png`
- **용도**: 타이틀 로고 (투명 배경 PNG) — 타이틀 로고 프레임
- **권장 해상도 / 비율**: 1600×600 / 8:3
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, ornate title logo frame, transparent background, ornate antique gold frame with a falcon wing on the left and an open book with stars on the right, empty center plate for adding the Korean title text 「잿빛 매와 별의 장부」 later in an image editor
```
- **네거티브**: 공통 네거티브

## 9. UI 아이콘 — 속성

### `assets/ui/elem_ember.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 속성: 홍염
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a stylized red flame, accent color #e2583e
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/elem_tide.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 속성: 청류
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a stylized blue water drop with an ice crystal, accent color #3f8fe0
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/elem_thunder.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 속성: 뇌명
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a stylized yellow lightning bolt, accent color #e6c23a
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/elem_verdant.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 속성: 녹음
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a stylized green leaf with a vine, accent color #4fb562
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/elem_umbra.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 속성: 월영
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a stylized purple crescent moon with shadow, accent color #8d5ad8
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/elem_lumen.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 속성: 백광
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a stylized white-gold radiant star, accent color #efe6c4
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/elem_blank.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 속성: 무색
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, an empty grey square outline with a tiny spark, representing a blank slot, accent color #b9bec8
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

## 10. UI 아이콘 — 상태이상

### `assets/ui/status_bleed.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 출혈
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a red blood drop with a slash
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_burn.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 화상
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, an orange flame on a small ember
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_paralyze.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 마비
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a yellow zigzag spark over a hand
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_bind.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 속박
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, blue ice chains
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_haste.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 신속
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a green winged boot
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_shield.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 보호
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a silver round shield
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_focus.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 집중
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a golden eye with a target ring
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_erosion.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 침식
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a purple ink stain eating a letter
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_taunt.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 도발
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, an orange shouting face with exclamation lines
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_broken.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 자세 붕괴
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a white cracked sword stance icon
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`

### `assets/ui/status_panic.png`
- **용도**: UI 아이콘 (투명 배경 PNG) — 상태: 공황
- **권장 해상도 / 비율**: 128×128 / 1:1
- **프롬프트**:
```
anime gacha game art, western dark fantasy academy, cel shading with soft painterly lighting, clean confident lineart, muted palette of slate grey, deep navy and antique gold with one accent color per character, high detail, consistent character design, 2D illustration, flat game UI icon, bold silhouette, thin gold outline, transparent background, centered, readable at 16px, a purple spiral over a cracked mind
```
- **네거티브**: 공통 네거티브 + `background, gradient background, realistic shading`
