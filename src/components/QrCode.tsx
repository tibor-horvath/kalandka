import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

/**
 * A QR code in byte mode, drawn as one SVG path with the white margin readers need.
 * On paper `moduleMm` fixes the size of one square, so a longer address makes a bigger code rather than a harder one to read.
 */
export function QrCode({ data, correction, label, className, moduleMm }: { data: string; correction: 'L' | 'M'; label: string; className?: string; moduleMm?: number }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, correction);
    qr.addData(data, 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    return { size: n + 8, path: d };
  }, [data, correction]);
  const side = moduleMm ? `${size * moduleMm}mm` : undefined;

  return (
    <svg className={className} style={moduleMm ? { width: side, height: side } : undefined} role="img" aria-label={label} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
