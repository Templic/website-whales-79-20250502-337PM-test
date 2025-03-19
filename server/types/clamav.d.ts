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
      scanArchives: boolean;
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
    constructor();
    init(options: ClamScanOptions): Promise<void>;
    isInfected(path: string): Promise<ScanResult>;
  }

  export default NodeClam;
}
