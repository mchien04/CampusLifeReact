import * as React from 'react';

declare module 'react-qr-barcode-scanner' {
    type QrResult = { text?: string } | null;
    interface QrScannerProps {
        onUpdate?: (error: unknown, result: QrResult) => void;
        [key: string]: any;
    }

    const QrScanner: React.ComponentType<QrScannerProps>;
    export default QrScanner;
}


