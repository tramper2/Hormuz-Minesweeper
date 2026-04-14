/**
 * MaskLoader.js
 * 호르무즈 해협 마스크 이미지를 로드하여 200×200 boolean 그리드를 생성합니다.
 * 흰색 = 바다(true, 플레이 가능), 검정 = 육지(false, 비활성)
 */

const GRID_SIZE = 200;
const BRIGHTNESS_THRESHOLD = 128; // 0~255 중 128 이상이면 바다

/**
 * 마스크 이미지를 로드하고 200×200 그리드로 변환
 * @param {string} maskUrl - 마스크 이미지 URL
 * @returns {Promise<{grid: boolean[][], seaCellCount: number}>}
 */
export async function loadMask(maskUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = GRID_SIZE;
      canvas.height = GRID_SIZE;
      const ctx = canvas.getContext('2d');

      // 마스크 이미지를 200×200으로 다운스케일하여 그리기
      ctx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE);
      const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
      const pixels = imageData.data;

      const grid = [];
      let seaCellCount = 0;

      for (let y = 0; y < GRID_SIZE; y++) {
        const row = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          const idx = (y * GRID_SIZE + x) * 4;
          // RGB 평균 밝기 계산
          const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
          const isSea = brightness >= BRIGHTNESS_THRESHOLD;
          if (isSea) seaCellCount++;
          row.push(isSea);
        }
        grid.push(row);
      }

      resolve({ grid, seaCellCount });
    };

    img.onerror = () => reject(new Error('마스크 이미지 로드 실패'));
    img.src = maskUrl;
  });
}

export { GRID_SIZE };
