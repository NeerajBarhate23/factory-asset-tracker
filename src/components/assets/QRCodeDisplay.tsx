import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Download, QrCode, Printer } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import QRCodeLibrary from 'qrcode';

interface QRCodeDisplayProps {
  assetUid: string;
  assetName: string;
  onGenerate?: (qrCode: string) => void;
  mode?: 'uid' | 'url'; // 'uid' for just asset UID, 'url' for full page URL
  size?: number; // Size of QR code in pixels
  showButton?: boolean; // Whether to show the generate button
}

export function QRCodeDisplay({ 
  assetUid, 
  assetName, 
  onGenerate, 
  mode = 'uid',
  size = 512,
  showButton = true 
}: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      // Generate QR code data based on mode
      let qrData: string;
      if (mode === 'url') {
        // Create a URL that points to this asset detail page using asset ID
        const baseUrl = window.location.origin;
        qrData = `${baseUrl}/?asset_id=${assetUid}`;
      } else {
        // Just the asset UID (legacy mode)
        qrData = `ASSET:${assetUid}`;
      }
      
      // Generate QR code as a data URL using the qrcode library
      const dataUrl = await QRCodeLibrary.toDataURL(qrData, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // High error correction for better scanning
      });
      
      setQrCode(dataUrl);
      if (showButton) {
        setShowDialog(true);
      }
      
      if (onGenerate) {
        onGenerate(dataUrl);
      }
      
      if (showButton) {
        toast.success('QR code generated successfully!');
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    // Download the PNG data URL
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${assetUid}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR code downloaded!');
  };

  const printQRCode = () => {
    if (!qrCode) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${assetUid}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px solid #000;
            }
            .qr-code {
              margin: 20px 0;
            }
            .asset-info {
              margin-top: 20px;
            }
            .asset-uid {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .asset-name {
              font-size: 16px;
              color: #666;
            }
            @media print {
              body {
                display: block;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-code">
              <img src="${qrCode}" alt="QR Code" style="width: 300px; height: 300px;" />
            </div>
            <div class="asset-info">
              <div class="asset-uid">${assetUid}</div>
              <div class="asset-name">${assetName}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 100);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Auto-generate QR code if not showing button
  if (!showButton && !qrCode && !loading) {
    generateQRCode();
  }

  return (
    <>
      {showButton && (
        <Button
          onClick={generateQRCode}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <QrCode className="h-4 w-4 mr-2" />
          {loading ? 'Generating...' : 'Generate QR Code'}
        </Button>
      )}
      
      {!showButton && qrCode && (
        <div className="flex flex-col items-center gap-2 w-full h-full">
          <img 
            src={qrCode} 
            alt="Asset QR Code" 
            className="w-full h-full object-contain"
          />
          <p className="text-xs text-center text-muted-foreground">
            Scan to view asset details
          </p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {assetUid}</DialogTitle>
            <DialogDescription>
              Download or print this QR code to attach to your asset
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4">
            {qrCode && (
              <div className="border-2 border-border p-4 rounded-lg bg-white">
                <img 
                  src={qrCode} 
                  alt="Asset QR Code" 
                  className="w-64 h-64"
                />
              </div>
            )}

            <div className="text-center">
              <p className="text-muted-foreground">{assetName}</p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
            <Button
              onClick={printQRCode}
              variant="default"
              className="w-full sm:w-auto"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
