import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, ScanLine, Search } from 'lucide-react';

interface ProfileScannerProps {
  image: string | null;
  isScanning: boolean;
  useDeepScan: boolean;
  hasAnalysis: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onScan: () => void;
  onDeepScanChange: (value: boolean) => void;
}

export function ProfileScanner({
  image,
  isScanning,
  useDeepScan,
  hasAnalysis,
  onImageUpload,
  onClearImage,
  onScan,
  onDeepScanChange
}: ProfileScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!image) {
    return (
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors"
      >
        <Upload className="w-8 h-8 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg">Cliquez ou glissez une photo ici</h3>
        <p className="text-muted-foreground text-sm mt-1">PNG, JPG jusqu'à 5MB</p>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={onImageUpload} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden border border-border aspect-square bg-muted flex items-center justify-center">
        <img src={image} alt="Target" className="max-h-full max-w-full object-contain" />
        {isScanning && (
          <motion.div 
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-brand-500 shadow-[0_0_15px_rgba(var(--brand-500),0.8)]"
          />
        )}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onClearImage}
          disabled={isScanning}
          className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          Changer de photo
        </button>
        <button 
          onClick={onScan}
          disabled={isScanning || hasAnalysis}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {isScanning ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <ScanLine className="w-4 h-4" />
            </motion.div>
          ) : (
            <Search className="w-4 h-4" />
          )}
          {isScanning ? 'Analyse...' : 'Lancer le Scan'}
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 px-1">
        <input 
          type="checkbox" 
          id="deepScan" 
          checked={useDeepScan}
          onChange={(e) => onDeepScanChange(e.target.checked)}
          disabled={isScanning}
          className="rounded text-brand-500 focus:ring-brand-500 bg-background border-input"
        />
        <label htmlFor="deepScan" className="text-sm text-muted-foreground cursor-pointer">
          Utiliser le Navigateur Furtif (Deep OSINT via Yandex)
        </label>
      </div>
    </div>
  );
}
