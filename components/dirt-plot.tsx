import Image from 'next/image';

interface DirtPlotProps {
  x: number;
  y: number;
  visible: boolean;
}

export function DirtPlot({ x, y, visible }: DirtPlotProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute transition-opacity duration-300"
      style={{
        left: x,
        top: y,
        opacity: visible ? 1 : 0,
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
      }}
    >
      <Image
        src="/dirt.png"
        alt="Planting location"
        width={120}
        height={120}
        className="pointer-events-none"
      />
    </div>
  );
}
