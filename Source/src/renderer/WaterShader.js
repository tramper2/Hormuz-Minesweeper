/**
 * WaterShader.js
 * WebGL 기반 물결 이펙트 쉐이더 (PixiJS Filter)
 */

import * as PIXI from 'pixi.js';

const vertexShader = `
  attribute vec2 aVertexPosition;
  uniform mat3 projectionMatrix;
  varying vec2 vTextureCoord;

  uniform vec4 inputSize;
  uniform vec4 outputFrame;

  vec4 filterVertexPosition(void) {
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;
    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
  }

  vec2 filterTextureCoord(void) {
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
  }

  void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
  }
`;

const fragmentShader = `
  precision mediump float;

  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uResolution;

  void main(void) {
    vec2 uv = vTextureCoord;

    // 여러 주파수의 물결 합성
    float wave1 = sin(uv.x * 12.0 + uTime * 1.2) * cos(uv.y * 10.0 + uTime * 0.8);
    float wave2 = sin(uv.x * 8.0 - uTime * 0.9 + uv.y * 6.0) * 0.5;
    float wave3 = cos(uv.y * 14.0 + uTime * 1.5 + uv.x * 4.0) * 0.3;

    float ripple = (wave1 + wave2 + wave3) * uIntensity * 0.003;

    vec2 distortedUV = uv + vec2(ripple, ripple * 0.7);

    vec4 color = texture2D(uSampler, distortedUV);

    // 약간의 코스틱(빛 반사) 효과
    float caustic = abs(sin(uv.x * 20.0 + uTime * 2.0) * cos(uv.y * 20.0 - uTime * 1.5));
    caustic = pow(caustic, 8.0) * 0.15 * uIntensity;

    color.rgb += vec3(caustic * 0.3, caustic * 0.6, caustic);

    gl_FragColor = color;
  }
`;

export class WaterFilter extends PIXI.Filter {
  constructor(intensity = 1.0) {
    super(vertexShader, fragmentShader, {
      uTime: 0.0,
      uIntensity: intensity,
      uResolution: [window.innerWidth, window.innerHeight],
    });

    this._time = 0;
  }

  /** 매 프레임 업데이트 */
  update(delta) {
    this._time += delta * 0.016; // ~60fps 기준 정규화
    this.uniforms.uTime = this._time;
  }

  set intensity(value) {
    this.uniforms.uIntensity = value;
  }

  get intensity() {
    return this.uniforms.uIntensity;
  }

  updateResolution(width, height) {
    this.uniforms.uResolution = [width, height];
  }
}
