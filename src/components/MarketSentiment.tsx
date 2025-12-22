import { useEffect, useRef } from 'react';
import type { MarketSentiment as MarketSentimentType } from '../types/stock';

interface MarketSentimentProps {
  sentiment: MarketSentimentType;
}

/**
 * 市場情緒指標組件 - 圓形儀表盤設計（五個顏色分明的扇形區域）
 */
export function MarketSentiment({ sentiment }: MarketSentimentProps) {
  const pointerRef = useRef<SVGGElement>(null);

  /**
   * 情緒等級配置
   */
  const emotionLevels = [
    { label: 'Extreme Fear', color: '#ef4444', range: [0, 20] },
    { label: 'Fear', color: '#f97316', range: [21, 40] },
    { label: 'Neutral', color: '#eab308', range: [41, 60] },
    { label: 'Greed', color: '#22c55e', range: [61, 80] },
    { label: 'Extreme Greed', color: '#16a34a', range: [81, 100] },
  ];

  /**
   * 極座標轉換為笛卡爾座標
   */
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ): { x: number; y: number } => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  /**
   * 創建扇形路徑
   */
  const createSectorPath = (
    startAngle: number,
    endAngle: number,
    innerRadius: number,
    outerRadius: number,
    centerX: number,
    centerY: number
  ): string => {
    const startInner = polarToCartesian(centerX, centerY, innerRadius, startAngle);
    const endInner = polarToCartesian(centerX, centerY, innerRadius, endAngle);
    const startOuter = polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const endOuter = polarToCartesian(centerX, centerY, outerRadius, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      `M ${startInner.x} ${startInner.y}`,
      `L ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
      'Z',
    ].join(' ');
  };

  // SVG 參數
  const viewBoxSize = 160;
  const centerX = viewBoxSize / 2;
  const centerY = viewBoxSize * 0.7; // 向上移動：從 0.9 改為 0.7
  const innerRadius = 35;
  const outerRadius = 55;
  const startAngle = -90; // 向左90度：從 0（右側）改為 -90（上方）
  const endAngle = 90; // 從 180（左側）改為 90（下方）

  // 計算當前指數對應的角度（0-100 映射到 -90到90度）
  const currentAngle = startAngle + (sentiment.index / 100) * (endAngle - startAngle);

  // 計算指針三角形頂點（在 -90 度時計算，然後通過 transform 旋轉）
  // 指針頂點（指向外圓，從上方 -90 度開始）
  const pointerTip = polarToCartesian(centerX, centerY, outerRadius - 3, -90);
  // 指針底部兩個點（形成三角形底邊，調整位置避免被中央文字遮擋）
  const baseOffset = 8; // 三角形底邊寬度的一半（角度）
  // 將指針底部稍微向外移動，避免與中央顯示區域重疊
  const pointerBaseRadius = innerRadius + 8; // 從 innerRadius + 5 改為 innerRadius + 8
  const pointerBase1 = polarToCartesian(centerX, centerY, pointerBaseRadius, -90 - baseOffset);
  const pointerBase2 = polarToCartesian(centerX, centerY, pointerBaseRadius, -90 + baseOffset);

  // 動畫效果：組件載入時觸發
  useEffect(() => {
    if (pointerRef.current) {
      pointerRef.current.style.opacity = '0';
      pointerRef.current.style.transform = 'rotate(-90deg)';
      setTimeout(() => {
        if (pointerRef.current) {
          pointerRef.current.style.transition = 'opacity 0.5s ease-out, transform 1s cubic-bezier(0.4, 0, 0.2, 1)';
          pointerRef.current.style.opacity = '1';
          pointerRef.current.style.transform = `rotate(${currentAngle}deg)`;
        }
      }, 100);
    }
  }, [sentiment.index, currentAngle]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4">
      {/* 標題區域（極簡） */}
      <div className="flex items-center justify-center mb-2">
        <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold">
          Fear & Greed Index
        </span>
      </div>

      {/* 圓形儀表盤區域 */}
      <div className="relative flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px]">
        {/* SVG 圓形儀表盤 */}
        <svg
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="w-full max-w-[180px] sm:max-w-[200px] h-auto"
          style={{ maxHeight: '160px' }}
        >
          {/* 五個顏色分明的扇形區域 */}
          {emotionLevels.map((level) => {
            const sectorStartAngle = startAngle + (level.range[0] / 100) * (endAngle - startAngle);
            const sectorEndAngle = startAngle + ((level.range[1] + 1) / 100) * (endAngle - startAngle);
            const sectorPath = createSectorPath(
              sectorStartAngle,
              sectorEndAngle,
              innerRadius,
              outerRadius,
              centerX,
              centerY
            );

            return (
              <g key={level.label}>
                {/* 扇形區域 */}
                <path
                  d={sectorPath}
                  fill={level.color}
                  className="opacity-90"
                />
              </g>
            );
          })}

          {/* 灰色三角形指針 - 在中央文字之前渲染，確保指針在文字下方 */}
          <g
            ref={pointerRef}
            style={{
              transformOrigin: `${centerX}px ${centerY}px`,
              transform: `rotate(${currentAngle}deg)`,
            }}
          >
            <polygon
              points={`${pointerTip.x},${pointerTip.y} ${pointerBase1.x},${pointerBase1.y} ${pointerBase2.x},${pointerBase2.y}`}
              fill="#6b7280"
              stroke="#4b5563"
              strokeWidth="0.5"
              className="opacity-95"
            />
          </g>

          {/* 中心顯示區域 - 移到 SVG 內部，在指針之後渲染，確保文字在指針上方 */}
          <g>
            {/* 指數數字 */}
            <text
              x={centerX}
              y={centerY - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="24"
              fontWeight="bold"
              fill={emotionLevels.find(l => sentiment.index >= l.range[0] && sentiment.index <= l.range[1])?.color || '#eab308'}
              className="transition-colors duration-300"
              style={{ pointerEvents: 'none' }}
            >
              {sentiment.index}
            </text>
            {/* 情緒等級文字 */}
            <text
              x={centerX}
              y={centerY + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="#9ca3af"
              className="uppercase tracking-wide"
              style={{ pointerEvents: 'none' }}
            >
              {sentiment.level}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
