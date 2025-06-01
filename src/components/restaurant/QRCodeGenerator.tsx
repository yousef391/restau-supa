import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download } from 'lucide-react';
import Button from '../ui/Button';

interface QRCodeGeneratorProps {
  url: string;
  restaurantName: string;
  tableNumber?: string;
}

const QRCodeGenerator = ({ url, restaurantName, tableNumber }: QRCodeGeneratorProps) => {
  const [size, setSize] = useState(256);
  
  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${restaurantName}${tableNumber ? `-table-${tableNumber}` : ''}-qrcode.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  
  const shareQRCode = async () => {
    if (!navigator.share) {
      alert('Web Share API is not supported in your browser');
      return;
    }
    
    try {
      await navigator.share({
        title: `${restaurantName} Menu QR Code`,
        text: `Scan this QR code to view the menu for ${restaurantName}${tableNumber ? ` (Table ${tableNumber})` : ''}`,
        url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <h3 className="text-center text-xl font-semibold">
        {restaurantName}{tableNumber ? ` - Table ${tableNumber}` : ''}
      </h3>
      
      <div className="relative">
        <QRCodeSVG
          id="qr-code"
          value={url}
          size={size}
          level="H"
          includeMargin
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
        <canvas
          id="qr-canvas"
          style={{ display: 'none' }}
          width={size}
          height={size}
        />
      </div>
      
      <p className="text-center text-sm text-gray-600">
        Scan this QR code to view the menu
      </p>
      
      <div className="flex w-full gap-2">
        <Button
          variant="outline"
          onClick={shareQRCode}
          className="flex-1"
          icon={<Share2 size={16} />}
        >
          Share
        </Button>
        <Button
          variant="primary"
          onClick={downloadQRCode}
          className="flex-1"
          icon={<Download size={16} />}
        >
          Download
        </Button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;