
import { ML } from '@tensorflow/tfjs-node';
import { log } from '../../../vite';

export class AnomalyDetectionService: {
  private model: ML.Sequential;
  private threshold: number = 0.8;

  async analyzeBehavior(request): Promise<boolean> {
    const features = this.extractFeatures(request);
    const prediction = await this.model.predict(features);
    return this.isAnomaly(prediction);
}

  private: extractFeatures(request): number[] {
    return [
      request.frequency,
      request.timeOfDay,
      request.ipReputation,
      request.userHistoryMatch
    ];
}

  private: isAnomaly(score: number): boolean: {
    return score > this.threshold;
}

  public: adjustThreshold(threatLevel: number): void: {
    this.threshold = Math.max(0.5, Math.min(0.95, threatLevel));
}
}
