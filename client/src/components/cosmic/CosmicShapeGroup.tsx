import React from 'react';

export interface PolygonShapeProps {
  type: 'polygon';
  sides: number;
  size: number;
  color: string;
  glowColor?: string;
  fillOpacity?: number;
  strokeWidth?: number;  // Added this property
  position: { top?: string; right?: string; bottom?: string; left?: string };
  rotation?: number;
}

export interface CircleShapeProps {
  type: 'circle';
  size: number;
  color: string;
  glowColor?: string;
  fillOpacity?: number;
  strokeWidth?: number;  // Added this property
  position: { top?: string; right?: string; bottom?: string; left?: string };
}

export type ShapeProps = PolygonShapeProps | CircleShapeProps;

interface CosmicShapeGroupProps {
  shapes: ShapeProps[];
  className?: string;
}

// Helper function to create polygon points
const createPolygonPoints = (sides: number, size: number): string => {
  let points = '';
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    const x = size * Math.cos(angle) + size;
    const y = size * Math.sin(angle) + size;
    points += `${x},${y} `;
  }
  return points.trim();
};

export const CosmicShapeGroup: React.FC<CosmicShapeGroupProps> = ({ shapes, className }) => {
  return (
    <div className={`absolute inset-0 ${className || ''}`}>
      {shapes.map((shape, index) => {
        const key = `shape-${index}`;
        const positionStyle = {
          position: 'absolute',
          ...shape.position
        } as React.CSSProperties;

        if (shape.type === 'polygon') {
          const points = createPolygonPoints(shape.sides, shape.size);
          const svgSize = shape.size * 2 + 10; // Add padding

          return (
            <div
              key={key}
              style={{
                ...positionStyle,
                transform: shape.rotation ? `rotate(${shape.rotation}deg)` : undefined,
              }}
            >
              <svg
                width={svgSize}
                height={svgSize}
                viewBox={`0 0 ${svgSize} ${svgSize}`}
                className="cosmic-shape"
              >
                <polygon
                  points={points}
                  fill={shape.color}
                  fillOpacity={shape.fillOpacity || 0.2}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth || 1}
                  className="cosmic-shape-polygon"
                />
                {shape.glowColor && (
                  <polygon
                    points={points}
                    fill="none"
                    stroke={shape.glowColor}
                    strokeWidth="3"
                    strokeOpacity="0.2"
                    filter="blur(5px)"
                    className="cosmic-shape-glow"
                  />
                )}
              </svg>
            </div>
          );
        } else if (shape.type === 'circle') {
          const svgSize = shape.size * 2 + 10; // Add padding

          return (
            <div key={key} style={positionStyle}>
              <svg
                width={svgSize}
                height={svgSize}
                viewBox={`0 0 ${svgSize} ${svgSize}`}
                className="cosmic-shape"
              >
                <circle
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={shape.size}
                  fill={shape.color}
                  fillOpacity={shape.fillOpacity || 0.2}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth || 1}
                  className="cosmic-shape-circle"
                />
                {shape.glowColor && (
                  <circle
                    cx={svgSize / 2}
                    cy={svgSize / 2}
                    r={shape.size}
                    fill="none"
                    stroke={shape.glowColor}
                    strokeWidth="3"
                    strokeOpacity="0.2"
                    filter="blur(5px)"
                    className="cosmic-shape-glow"
                  />
                )}
              </svg>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

// Default export
export default React.memo(CosmicShapeGroup);