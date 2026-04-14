# 🌊 Hormuz Minesweeper: Escort - 개발 로그

## 2026-04-14 | Phase 1~7 초기 구현 완료

### 작업 내용

#### Phase 1: 프로젝트 초기 설정 ✅
- Vite + React 프로젝트 수동 구성
- 의존성: `react@18`, `react-dom@18`, `pixi.js@7`, `@vitejs/plugin-react`
- 참조 이미지(`hormumap.jpg`, `hormumaskj.png`)를 `public/images/`로 복사
- 디자인 시스템 CSS 작성 (딥 오션 테마, 글래스모피즘)
- Google Fonts: Outfit, JetBrains Mono

#### Phase 2: 코어 게임 엔진 ✅
- **MaskLoader.js**: 마스크 이미지를 Canvas에 그려 200×200으로 다운샘플링, 밝기 threshold로 바다/육지 구분
- **MinesweeperEngine.js**: Flat Uint8Array로 40,000셀 관리, Fisher-Yates 셔플 기뢰 배치, 스택 기반 Flood Fill, 에어드랍/미사일 기믹 로직 내장
- **GameState.jsx**: React Context + useReducer 패턴, 타이머/토스트/미사일경보 상태 관리

#### Phase 3: 렌더링 엔진 ✅
- **GridRenderer.jsx**: PixiJS Application → 뷰포트 가상화로 화면에 보이는 셀만 렌더링
- **WaterShader.js**: WebGL Fragment Shader - 다중 주파수 사인/코사인 합성 물결 + 코스틱 빛 반사 효과
- **CellSprites.js**: Canvas 2D로 셀 텍스처 아틀라스 생성 (닫힘/열림/숫자1~8/기뢰/깃발/육지)

#### Phase 4: 모바일 터치 인터페이스 ✅
- **TouchController.js**: Pinch Zoom (0.3x~6x), Pan (관성 스크롤), Tap (셀 오픈), Long Press (400ms 깃발), 마우스 휠 줌

#### Phase 5: UI 컴포넌트 ✅
- **StartScreen.jsx**: 난이도 선택 카드 (Easy 10%/Medium 15%/Hard 20%), 미션 브리핑
- **GameHUD.jsx**: 상단 HUD (기뢰/타이머/진행률), 하단 에어드랍 버튼, 미사일 경보 오버레이
- **GameOverModal.jsx**: 승리/패배 결과, 통계 카드, 재시작/홈 버튼
- **App.jsx**: 게임 플로우 관리 (로딩→메뉴→플레이→일시정지→승/패)

#### Phase 6: 게임 기믹 ✅
- **MissileStrike.js**: 45~90초 간격 랜덤 미사일 경보, 5초 카운트다운 후 9×9 영역 셀 초기화
- **AirDrop.js**: 5×5 범위 기뢰 안전 제거, 500셀 오픈마다 리워드 적립

#### Phase 7: 엔딩 연출 ✅
- **TankerEnding.js**: PixiJS로 유조선 그래픽(선체/선교/탱크/굴뚝) 생성, 해협 통과 애니메이션, 물보라/축하 파티클

### 기술적 결정사항
| 항목 | 결정 | 이유 |
|------|------|------|
| 렌더러 | PixiJS v7 | 안정적 API, WebGL 자동 폴백 |
| 상태 관리 | React Context | 단일 게임이므로 외부 라이브러리 불필요 |
| 셀 데이터 | Uint8Array (flat) | 40,000셀 성능 최적화 |
| 셀 렌더링 | 뷰포트 가상화 | 전체 렌더링 시 성능 비용 과다 |
| 물결 효과 | WebGL Shader | GPU 가속으로 60fps 유지 |
| 터치 제스처 | 자체 구현 | 라이브러리 의존성 최소화 |

### 파일 구조
```
Source/
├── index.html
├── package.json
├── vite.config.js
├── public/images/
│   ├── hormumap.jpg
│   └── hormumaskj.png
└── src/
    ├── main.jsx
    ├── core/
    │   ├── MaskLoader.js
    │   ├── MinesweeperEngine.js
    │   └── GameState.jsx
    ├── renderer/
    │   ├── GridRenderer.jsx
    │   ├── WaterShader.js
    │   └── CellSprites.js
    ├── input/
    │   └── TouchController.js
    ├── components/
    │   ├── App.jsx
    │   ├── StartScreen.jsx
    │   ├── GameHUD.jsx
    │   └── GameOverModal.jsx
    ├── gimmicks/
    │   ├── MissileStrike.js
    │   └── AirDrop.js
    ├── effects/
    │   └── TankerEnding.js
    └── styles/
        └── index.css
```

### 해결한 이슈
- **JSX 확장자**: GameState.js에서 JSX 문법 사용 → `.jsx`로 확장자 변경 필요
- **의존성**: `pixi.js@7.4.2` 수동 버전 고정 (v8 API 호환성 문제 방지)

### 다음 단계
- [ ] 브라우저 실제 테스트 및 디버깅
- [ ] 성능 프로파일링 (60fps 확인)
- [ ] P1(인프라): AWS EC2 배포
- [ ] P5-502: 광고 SDK 연동
