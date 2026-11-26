# assets/

이미지는 아직 없다. 아래 경로 규칙대로 PNG를 넣으면 게임이 자동으로 사용한다.
없는 파일은 **색 블록 + 이름 텍스트**로 대신 표시된다.

| 폴더 | 파일명 규칙 | 예 |
|---|---|---|
| `bg/` | `<배경ID>.png` | `bg/library.png` |
| `char/` | **`<인물ID>_sheet.png`** — 표정 시트 한 장 (권장) | `char/vivienne_sheet.png` |
| `char/` | `<인물ID>_<표정>.png` — 표정 하나만 따로 (있으면 시트보다 우선) | `char/vivienne_smile.png` |
| `portrait/` | `<파티원ID>.png` — 선택. 없으면 시트의 「기본」 칸 상반신을 잘라 씀 | `portrait/kaien.png` |
| `cutin/` | `<파티원ID>_ult.png` | `cutin/lennox_ult.png` |
| `enemy/` | `<적ID>.png` | `enemy/name_hound.png` |
| `cg/` | `<CG ID>.png` | `cg/ending_true.png` |
| `title/` | `title_bg.png`, `logo.png` | |
| `ui/` | `elem_<속성>.png`, `status_<상태>.png` | `ui/status_bleed.png` |

### 표정 시트

인물 한 명의 표정을 한 장에 격자로 모은 그림이다. 프롬프트 1번이면 된다.
게임은 그림을 칸 수로 똑같이 나눠, 인물 데이터(`data/characters.js`의 `expressions`)의 순서대로 왼쪽→오른쪽, 위→아래로 칸을 읽는다.

| 표정 수 | 배치 | 권장 크기 (칸 하나 720×1280, 9:16) |
|---|---|---|
| 3 | 3열×1행 | 2160×1280 |
| 4 | 2열×2행 | 1440×2560 |
| 5~6 | 3열×2행 (5개면 마지막 칸 비움) | 2160×2560 |

배경은 지워서 투명 PNG로 저장하는 것을 권장한다.

전체 목록과 생성용 프롬프트는 `docs/IMAGE_PROMPTS.md`에 있다.

**이미지를 넣은 뒤** `node tools/scan_assets.js`를 실행해 `data/assets.js`(매니페스트)를 갱신한다.
게임은 매니페스트에 적힌 파일만 불러온다. 없는 파일을 요청하면 브라우저 콘솔에 404 에러가 남기 때문이다.
Node가 없다면 `data/assets.js`의 `files` 배열에 경로를 직접 적거나, `probeAll: true`로 바꾼다.
