/**
 * TankerEnding.js
 * 게임 클리어 시 유조선 통과 엔딩 연출
 * PixiJS 기반 애니메이션
 */

import * as PIXI from 'pixi.js';

/**
 * 유조선 엔딩 애니메이션 실행
 * @param {PIXI.Application} app - PixiJS 앱 (또는 stage 접근용)
 * @param {HTMLElement} container - 렌더링 컨테이너
 * @param {Function} onComplete - 애니메이션 완료 콜백
 */
export function playTankerEnding(container, onComplete) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const app = new PIXI.Application({
    width,
    height,
    backgroundColor: 0x0a1628,
    backgroundAlpha: 0.85,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  container.appendChild(app.view);
  app.view.style.position = 'absolute';
  app.view.style.inset = '0';
  app.view.style.zIndex = '500';

  // 유조선 그래픽 생성
  const tanker = _createTankerGraphic();
  tanker.x = -200;
  tanker.y = height * 0.5;
  app.stage.addChild(tanker);

  // 물보라 파티클 컨테이너
  const particles = new PIXI.Container();
  app.stage.addChild(particles);

  // 축하 텍스트
  const congratsText = new PIXI.Text('🎉 ESCORT COMPLETE! 🎉', {
    fontFamily: 'Outfit, sans-serif',
    fontSize: 28,
    fontWeight: '800',
    fill: ['#00d4ff', '#ffd700'],
    align: 'center',
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 8,
    dropShadowDistance: 2,
  });
  congratsText.anchor.set(0.5);
  congratsText.x = width / 2;
  congratsText.y = height * 0.2;
  congratsText.alpha = 0;
  app.stage.addChild(congratsText);

  const subtitleText = new PIXI.Text('유조선이 안전하게 해협을 통과했습니다!', {
    fontFamily: 'Outfit, sans-serif',
    fontSize: 16,
    fontWeight: '400',
    fill: '#8ba3c4',
    align: 'center',
  });
  subtitleText.anchor.set(0.5);
  subtitleText.x = width / 2;
  subtitleText.y = height * 0.28;
  subtitleText.alpha = 0;
  app.stage.addChild(subtitleText);

  // 애니메이션
  let elapsed = 0;
  const DURATION = 5000; // 5초
  const TANKER_END_X = width + 300;

  const ticker = (delta) => {
    elapsed += delta * 16.67;
    const progress = Math.min(elapsed / DURATION, 1);

    // 유조선 이동 (easeInOut)
    const eased = _easeInOutCubic(progress);
    tanker.x = -200 + (TANKER_END_X + 200) * eased;

    // 유조선 약간 상하 흔들림
    tanker.y = height * 0.5 + Math.sin(elapsed * 0.003) * 5;

    // 물보라 파티클 생성
    if (progress < 0.9 && Math.random() < 0.3) {
      _createWakeParticle(particles, tanker.x - 60, tanker.y + 15);
    }

    // 파티클 업데이트
    for (let i = particles.children.length - 1; i >= 0; i--) {
      const p = particles.children[i];
      p.alpha -= 0.015;
      p.x -= 0.5;
      p.y += (Math.random() - 0.5) * 0.5;
      p.scale.x *= 0.99;
      p.scale.y *= 0.99;
      if (p.alpha <= 0) {
        particles.removeChild(p);
        p.destroy();
      }
    }

    // 텍스트 페이드인 (50% 진행 후)
    if (progress > 0.3) {
      const textProgress = Math.min((progress - 0.3) / 0.3, 1);
      congratsText.alpha = textProgress;
      subtitleText.alpha = textProgress * 0.8;
    }

    // 축하 파티클 (60% 이후)
    if (progress > 0.6 && Math.random() < 0.15) {
      _createCelebrationParticle(app.stage, width, height);
    }

    // 애니메이션 완료
    if (progress >= 1) {
      app.ticker.remove(ticker);
      setTimeout(() => {
        app.destroy(true, { children: true });
        if (container.contains(app.view)) {
          container.removeChild(app.view);
        }
        onComplete?.();
      }, 1500);
    }
  };

  app.ticker.add(ticker);
}

/** 유조선 그래픽 생성 */
function _createTankerGraphic() {
  const container = new PIXI.Container();

  // 선체
  const hull = new PIXI.Graphics();
  hull.beginFill(0x556677);
  hull.moveTo(0, 0);
  hull.lineTo(120, 0);
  hull.lineTo(140, 15);
  hull.lineTo(120, 30);
  hull.lineTo(0, 30);
  hull.lineTo(-15, 15);
  hull.closePath();
  hull.endFill();

  // 선체 하단 (빨간색 수선)
  hull.beginFill(0x993333);
  hull.drawRect(0, 25, 120, 8);
  hull.endFill();

  container.addChild(hull);

  // 상부 구조물
  const bridge = new PIXI.Graphics();
  bridge.beginFill(0x778899);
  bridge.drawRect(10, -20, 30, 20);
  bridge.endFill();

  // 창문
  bridge.beginFill(0xffee88);
  bridge.drawRect(14, -16, 8, 6);
  bridge.drawRect(26, -16, 8, 6);
  bridge.endFill();

  container.addChild(bridge);

  // 굴뚝
  const funnel = new PIXI.Graphics();
  funnel.beginFill(0xff4444);
  funnel.drawRect(20, -35, 10, 15);
  funnel.endFill();
  funnel.beginFill(0xcccccc);
  funnel.drawRect(18, -37, 14, 3);
  funnel.endFill();
  container.addChild(funnel);

  // 탱크들 (원통)
  for (let i = 0; i < 3; i++) {
    const tank = new PIXI.Graphics();
    tank.beginFill(0x667788);
    tank.drawEllipse(55 + i * 22, -5, 9, 7);
    tank.endFill();
    container.addChild(tank);
  }

  container.scale.set(1.2);
  return container;
}

/** 물보라 파티클 */
function _createWakeParticle(container, x, y) {
  const particle = new PIXI.Graphics();
  particle.beginFill(0xaaddff, 0.6);
  particle.drawCircle(0, 0, 2 + Math.random() * 4);
  particle.endFill();
  particle.x = x + Math.random() * 20;
  particle.y = y + Math.random() * 10 - 5;
  particle.alpha = 0.7;
  container.addChild(particle);
}

/** 축하 파티클 */
function _createCelebrationParticle(stage, width, height) {
  const colors = [0xffd700, 0x00d4ff, 0xff6b35, 0x00e68a, 0xff3b5c];
  const particle = new PIXI.Graphics();
  const color = colors[Math.floor(Math.random() * colors.length)];
  particle.beginFill(color);

  if (Math.random() > 0.5) {
    particle.drawStar(0, 0, 5, 4, 2);
  } else {
    particle.drawCircle(0, 0, 3);
  }
  particle.endFill();

  particle.x = Math.random() * width;
  particle.y = -10;
  particle.alpha = 1;

  const vy = 1 + Math.random() * 2;
  const vx = (Math.random() - 0.5) * 2;
  const vr = (Math.random() - 0.5) * 0.1;

  stage.addChild(particle);

  const animate = () => {
    particle.y += vy;
    particle.x += vx;
    particle.rotation += vr;
    particle.alpha -= 0.005;

    if (particle.y > height + 20 || particle.alpha <= 0) {
      stage.removeChild(particle);
      particle.destroy();
      PIXI.Ticker.shared.remove(animate);
    }
  };

  PIXI.Ticker.shared.add(animate);
}

/** easeInOutCubic */
function _easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
