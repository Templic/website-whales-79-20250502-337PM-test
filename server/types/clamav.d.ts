declare module 'clamav.js' {
  interface ClamScanOptions {
    removeInfected?: boolean;
    quarantineInfected?: boolean;
    scanLog?: string | null;
    debugMode?: boolean;
    fileList?: string | null;
    scanRecursively?: boolean;
    clamscan?: {
      path: string;
      db: string | null;
      active: boolean;
    };
    preference?: 'clamscan' | 'clamdscan';
  }

  interface ScanResult {
    isInfected: boolean;
    viruses: string[];
    errors?: string[];
  }

  class NodeClam {
    constructor(options?: ClamScanOptions);
    init(): Promise<void>;
    isInfected(path: string): Promise<ScanResult>;
  }

  // Update the export to match the actual module structure
  const clamav: {
    createInstance(options?: ClamScanOptions): NodeClam;
  };

  export = clamav;
}