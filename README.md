# 🌊 Hormuz Minesweeper: Escort

호르무즈 해협의 기뢰를 제거하고 유조선의 안전한 통과를 도우세요!

200×200 대규모 그리드 기반 지뢰찾기 모바일 웹 게임입니다.

## 🎮 게임 소개

호르무즈 해협에 설치된 기뢰를 탐색하고 제거하여 유조선이 안전하게 해협을 통과할 수 있도록 호위하는 전략 게임입니다.

### 주요 기능
- 🗺️ **호르무즈 해협 지형 기반** — 실제 지형 마스크를 활용한 바다/육지 구분
- 📱 **모바일 최적화** — 핀치 줌, 팬, 탭, 롱프레스 터치 인터페이스
- 🌊 **물결 쉐이더** — WebGL 기반 실시간 물결 + 코스틱 효과
- 🚀 **미사일 공습** — 랜덤 타이밍의 미사일 경보, 셀 초기화 기믹
- 📦 **에어드랍** — 범위 기뢰 제거 리워드 아이템
- 🛢️ **유조선 엔딩** — 클리어 시 유조선 통과 파티클 애니메이션

### 조작법
| 입력 | 데스크탑 | 모바일 |
|------|----------|--------|
| 셀 열기 | 좌클릭 | 탭 |
| 깃발 배치 | 우클릭 | 롱프레스 |
| 맵 이동 | 드래그 | 스와이프 |
| 줌 확대/축소 | 마우스 휠 | 핀치 줌 |

## 🛠️ 기술 스택

- **Frontend**: React 18 + Vite
- **Rendering**: PixiJS 7 (WebGL)
- **Shader**: GLSL (Water Ripple + Caustic)
- **Touch**: Custom TouchController (Pinch/Pan/Tap/LongPress)
- **State**: React Context + useReducer

## 📂 프로젝트 구조

```
MobileWebGame/
├── Doc/                          # 문서
│   ├── PRD.md                    # 제품 요구사항
│   ├── TRD.md                    # 기술 요구사항
│   ├── UserFlow.md               # 사용자 플로우
│   ├── TaskGenerator.md          # 태스크 로드맵
│   └── DevLog/                   # 개발 로그
├── refImages/                    # 참조 이미지
│   ├── hormumap.jpg              # 호르무즈 해협 지도
│   └── hormumaskj.png            # 바다/육지 마스크
└── Source/                       # 소스 코드
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/images/             # 게임 에셋
    └── src/
        ├── main.jsx               # 진입점
        ├── core/                  # 코어 엔진
        │   ├── MaskLoader.js      # 마스크 → 그리드
        │   ├── MinesweeperEngine.js # 지뢰찾기 로직
        │   └── GameState.jsx      # 상태 관리
        ├── renderer/              # 렌더링
        │   ├── GridRenderer.jsx   # PixiJS 뷰포트 가상화
        │   ├── WaterShader.js     # 물결 쉐이더
        │   └── CellSprites.js    # 셀 텍스처
        ├── input/                 # 입력 처리
        │   └── TouchController.js # 터치/마우스
        ├── components/            # UI 컴포넌트
        │   ├── App.jsx
        │   ├── StartScreen.jsx
        │   ├── GameHUD.jsx
        │   └── GameOverModal.jsx
        ├── gimmicks/              # 게임 기믹
        │   ├── MissileStrike.js
        │   └── AirDrop.js
        ├── effects/               # 이펙트
        │   └── TankerEnding.js
        └── styles/
            └── index.css          # 디자인 시스템
```

## 🚀 로컬 실행

```bash
cd Source
npm install
npm run dev
```

`http://localhost:3000/` 에서 실행됩니다.

## 📋 난이도

| 난이도 | 기뢰 밀도 | 설명 |
|--------|-----------|------|
| 🌊 초급 | 10% | 여유로운 탐색 |
| ⚓ 중급 | 15% | 균형 잡힌 도전 |
| 💣 고급 | 20% | 극한의 긴장감 |

## 📄 License

MIT

## 게임 해볼수 있는 링크
https://tramper2.github.io/Hormuz-Minesweeper/
