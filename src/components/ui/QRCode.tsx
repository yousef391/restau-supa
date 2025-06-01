import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCode = ({ value, size = 200, className = '' }: QRCodeProps) => {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        includeMargin
        className="rounded-lg bg-white p-4 shadow-sm"
      />
      <p className="text-sm text-gray-500">Scan to view menu</p>
    </div>
  );
};

export default QRCode; 