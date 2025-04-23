
import { QueryAnalyzer } from './database/QueryAnalyzer';
import { RASPManager } from './rasp/RASPManager';

export class ThreatPreventionService {
  private queryAnalyzer: QueryAnalyzer;
  private raspManager: RASPManager;

  async analyzeQuery(query: string): Promise<boolean> {
    return this.queryAnalyzer.isSafe(query);
  }

  async protect(req: Request): Promise<void> {
    await this.raspManager.monitor(req);
  }
}
