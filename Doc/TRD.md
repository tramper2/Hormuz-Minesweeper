
Frontend: React + Canvas API (또는 PixiJS) - 대량의 셀 렌더링 최적화.
Shader: WebGL 기반의 Water Ripple Effect Shader.
Backend: Node.js (Express) on AWS EC2 (Ubuntu).
Logic: * Masking: 픽셀 데이터 기반의 Grid 생성 알고리즘.
    Interaction: Pinch Zoom & Pan (모바일 터치 최적화).
Deployment: Nginx, PM2, SSL(Certbot).


Vite + React + PixiJS 기반으로 40,000셀 렌더링 성능 최적화
마스크 이미지로 바다/육지 구분하여 바다 영역에서만 게임 진행
7단계로 나누어 코어 엔진 → 렌더링 → 터치 → UI → 기믹 → 엔딩 순으로 개발
작업 진행은 Doc/DevLog/ 하위 폴더에 기록

난이도별 기뢰 밀도 (Easy 10% / Medium 15% / Hard 20% )
백엔드 동시 개발 vs 프론트엔드 우선 완성
사운드 에셋 다운로드 받을수 있으면 다운로드 아니면 별도로 기획자가 제공
