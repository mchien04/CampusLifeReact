import React, { useState } from 'react';
import QrScanner from 'react-qr-barcode-scanner';

interface QRCodeScannerProps {
    onScan: (code: string) => void;
    onError?: (error: Error) => void;
    onClose?: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onError, onClose }) => {
    const [isScanning, setIsScanning] = useState(true);

    const handleUpdate = (err: any, result?: any) => {
        if (err) {
            // Chỉ báo lỗi nếu thực sự không thể truy cập camera
            // Bỏ qua các warning hoặc lỗi nhỏ trong quá trình khởi động
            if (onError && err.name !== 'NotAllowedError' && err.name !== 'NotFoundError' && err.name !== 'NotReadableError') {
                // Chỉ báo lỗi cho các lỗi nghiêm trọng về quyền truy cập
                // Các lỗi khác có thể là warning trong quá trình khởi động
                console.warn('QR Scanner warning:', err);
                return;
            }
            // Chỉ gọi onError cho các lỗi nghiêm trọng
            if (onError && (err.name === 'NotAllowedError' || err.name === 'NotFoundError' || err.name === 'NotReadableError')) {
                onError(err);
            }
            return;
        }

        if (result && result.text) {
            setIsScanning(false);
            onScan(result.text);
        }
    };

    const handleClose = () => {
        setIsScanning(false);
        if (onClose) {
            onClose();
        }
    };

    return (
        <div className="relative">
            {isScanning ? (
                <div className="relative">
                    <QrScanner
                        onUpdate={handleUpdate}
                    />
                </div>
            ) : (
                <div className="p-8 text-center bg-gray-100 rounded-lg">
                    <p className="text-gray-600">Camera đã được đóng</p>
                    {onClose && (
                        <button
                            onClick={() => setIsScanning(true)}
                            className="mt-4 bg-[#001C44] text-white px-4 py-2 rounded-lg hover:bg-[#002A66] transition-colors"
                        >
                            Mở lại Camera
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default QRCodeScanner;

