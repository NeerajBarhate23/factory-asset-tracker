import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { QrCode, Download, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Asset } from '../../lib/types';
import QRCodeLibrary from 'qrcode';

interface BulkQRCodeGeneratorProps {
  assets: Asset[];
}

export function BulkQRCodeGenerator({ assets }: BulkQRCodeGeneratorProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [qrCodes, setQrCodes] = useState<Array<{ uid: string; qr_code: string; qr_code_svg: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const toggleAssetSelection = (uid: string) => {
    setSelectedAssets(prev =>
      prev.includes(uid)
        ? prev.filter(id => id !== uid)
        : [...prev, uid]
    );
  };

  const selectAll = () => {
    setSelectedAssets(assets.map(a => a.asset_uid));
  };

  const deselectAll = () => {
    setSelectedAssets([]);
  };

  const generateBulkQRCodes = async () => {
    if (selectedAssets.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }

    setLoading(true);
    try {
      // Generate QR codes client-side for each selected asset using the qrcode library
      const generatedCodes = await Promise.all(
        selectedAssets.map(async (uid) => {
          const qrData = `ASSET:${uid}`;
          
          // Generate QR code as a data URL
          const dataUrl = await QRCodeLibrary.toDataURL(qrData, {
            width: 512,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
            errorCorrectionLevel: 'H', // High error correction for better scanning
          });
          
          return {
            uid,
            qr_code: dataUrl,
            qr_code_svg: dataUrl // Using PNG data URL for both
          };
        })
      );

      setQrCodes(generatedCodes);
      setShowDialog(false);
      setShowPreview(true);
      toast.success(`Generated ${generatedCodes.length} QR codes!`);
    } catch (error: any) {
      console.error('Error generating QR codes:', error);
      toast.error('Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  const downloadAllQRCodes = () => {
    qrCodes.forEach(({ uid, qr_code }) => {
      const link = document.createElement('a');
      link.href = qr_code;
      link.download = `${uid}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    
    toast.success('All QR codes downloaded!');
  };

  const printAllQRCodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrCodesHtml = qrCodes.map(({ uid, qr_code }, index) => {
      const asset = assets.find(a => a.asset_uid === uid);
      return `
        <div class="qr-item" data-index="${index}">
          <div class="qr-code">
            <img src="${qr_code}" alt="QR Code ${uid}" />
          </div>
          <div class="qr-info">
            <div class="uid">${uid}</div>
            <div class="name">${asset?.name || ''}</div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk QR Codes</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 20px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          }
          .qr-item {
            border: 2px solid #000;
            padding: 16px;
            text-align: center;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .qr-code img {
            width: 220px;
            height: 220px;
            margin: 0 auto;
          }
          .qr-info {
            margin-top: 12px;
          }
          .uid {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .name {
            font-size: 14px;
            color: #666;
          }
          @media print {
            body {
              padding: 10px;
            }
            .grid {
              gap: 15px;
            }
            .qr-item {
              border-width: 1px;
              padding: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${qrCodesHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="default"
      >
        <QrCode className="h-4 w-4 mr-2" />
        Bulk Generate QR Codes
      </Button>

      {/* Selection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Assets for QR Code Generation</DialogTitle>
            <DialogDescription>
              Choose the assets you want to generate QR codes for
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAll}>
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={deselectAll}>
                Deselect All
              </Button>
              <div className="ml-auto text-sm text-muted-foreground">
                {selectedAssets.length} selected
              </div>
            </div>

            <ScrollArea className="h-96 border rounded-lg p-4">
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center space-x-3 p-3 hover:bg-accent rounded-lg"
                  >
                    <Checkbox
                      checked={selectedAssets.includes(asset.asset_uid)}
                      onCheckedChange={() => toggleAssetSelection(asset.asset_uid)}
                    />
                    <div className="flex-1">
                      <div>{asset.name}</div>
                      <div className="text-sm text-muted-foreground">{asset.asset_uid}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              onClick={generateBulkQRCodes}
              disabled={loading || selectedAssets.length === 0}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate {selectedAssets.length} QR Code{selectedAssets.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Generated QR Codes ({qrCodes.length})</DialogTitle>
            <DialogDescription>
              Download or print these QR codes for your selected assets
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-96">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
              {qrCodes.map(({ uid, qr_code }) => {
                const asset = assets.find(a => a.asset_uid === uid);
                return (
                  <div key={uid} className="border rounded-lg p-4 text-center">
                    <img 
                      src={qr_code} 
                      alt={uid} 
                      className="w-full h-auto"
                    />
                    <div className="mt-2">
                      <div className="text-xs">{uid}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {asset?.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={downloadAllQRCodes}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
            <Button
              onClick={printAllQRCodes}
              variant="default"
              className="w-full sm:w-auto"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
