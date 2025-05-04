/**
 * Transaction Security Monitor
 * 
 * Implements PCI DSS requirements:
 * - 10.2 (Automated Audit Trails)
 * - 10.6 (Log Review)
 */

import { recordAuditEvent } from './secureAuditTrail';

/**
 * Risk assessment result interface
 */
export interface RiskAssessment {
  score: number;
  factors: string[];
  recommendation: 'allow' | 'review' | 'challenge' | 'deny';
}

/**
 * Transaction data interface
 */
export interface PaymentTransaction {
  transactionId: string;
  userId?: string;
  ipAddress: string;
  timestamp: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

/**
 * Transaction security monitoring for payment transactions
 */
export class TransactionSecurityMonitor {
  // Store transaction history by user (in a real system, this would use a database)
  private userTransactionHistory: Map<string, PaymentTransaction[]> = new Map();
  
  // Store transaction history by IP (in a real system, this would use a database)
  private ipTransactionHistory: Map<string, PaymentTransaction[]> = new Map();
  
  /**
   * Analyze transaction risk based on multiple factors
   */
  analyzeTransactionRisk(transaction: PaymentTransaction): RiskAssessment {
    try {
      // Compile multiple risk factors
      const velocityRisk = this.checkTransactionVelocity(transaction);
      const amountRisk = this.assessAmountRisk(transaction);
      const patternRisk = this.analyzeTransactionPatterns(transaction);
      const locationRisk = this.evaluateLocationRisk(transaction);
      
      // Calculate composite risk score (0-100, higher is riskier)
      const riskScore = this.calculateCompositeRisk([
        velocityRisk,
        amountRisk,
        patternRisk,
        locationRisk
      ]);
      
      // Identify risk factors for reporting
      const factors = this.identifyRiskFactors(
        velocityRisk, 
        amountRisk, 
        patternRisk, 
        locationRisk
      );
      
      // Determine recommended action
      const recommendation = this.determineAction(riskScore);
      
      // Record the risk assessment for audit
      this.recordRiskAssessment(transaction, riskScore, factors, recommendation);
      
      return {
        score: riskScore,
        factors,
        recommendation
      };
    } catch (error) {
      console.error('[TransactionSecurityMonitor] Error analyzing transaction risk:', error);
      
      // Log the error
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'TRANSACTION_RISK_ANALYSIS_ERROR',
        resource: `transaction:${transaction.transactionId}`,
        userId: transaction.userId,
        ipAddress: transaction.ipAddress,
        result: 'failure',
        severity: 'error',
        details: {
          error: error.message,
          transactionId: transaction.transactionId
        }
      });
      
      // Return a moderate risk score as fallback
      return {
        score: 50,
        factors: ['Error in risk analysis'],
        recommendation: 'review'
      };
    }
  }
  
  /**
   * Record a transaction for later analysis
   */
  recordTransaction(transaction: PaymentTransaction): void {
    try {
      // Store by user ID if available
      if (transaction.userId) {
        const userHistory = this.userTransactionHistory.get(transaction.userId) || [];
        userHistory.push(transaction);
        
        // Keep only the last 50 transactions per user
        if (userHistory.length > 50) {
          userHistory.shift();
        }
        
        this.userTransactionHistory.set(transaction.userId, userHistory);
      }
      
      // Store by IP address
      const ipHistory = this.ipTransactionHistory.get(transaction.ipAddress) || [];
      ipHistory.push(transaction);
      
      // Keep only the last 50 transactions per IP
      if (ipHistory.length > 50) {
        ipHistory.shift();
      }
      
      this.ipTransactionHistory.set(transaction.ipAddress, ipHistory);
    } catch (error) {
      console.error('[TransactionSecurityMonitor] Error recording transaction:', error);
      
      // Log the error
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        action: 'TRANSACTION_RECORDING_ERROR',
        resource: `transaction:${transaction.transactionId}`,
        userId: transaction.userId,
        ipAddress: transaction.ipAddress,
        result: 'failure',
        severity: 'error',
        details: {
          error: error.message,
          transactionId: transaction.transactionId
        }
      });
    }
  }
  
  /**
   * Check transaction velocity (number of transactions in a short time)
   * Returns a risk score from 0-100
   */
  private checkTransactionVelocity(transaction: PaymentTransaction): number {
    try {
      const now = new Date(transaction.timestamp).getTime();
      const lookbackPeriod = 60 * 60 * 1000; // 1 hour
      const lookbackTime = now - lookbackPeriod;
      
      // Get relevant transaction history
      let recentTransactions: PaymentTransaction[] = [];
      
      if (transaction.userId) {
        const userHistory = this.userTransactionHistory.get(transaction.userId) || [];
        recentTransactions = userHistory.filter(tx => 
          new Date(tx.timestamp).getTime() > lookbackTime
        );
      } else {
        const ipHistory = this.ipTransactionHistory.get(transaction.ipAddress) || [];
        recentTransactions = ipHistory.filter(tx => 
          new Date(tx.timestamp).getTime() > lookbackTime
        );
      }
      
      // Calculate velocity metrics
      const count = recentTransactions.length;
      
      // Determine risk based on count thresholds
      if (count >= 20) return 100; // Very high risk
      if (count >= 15) return 80;  // High risk
      if (count >= 10) return 60;  // Moderate risk
      if (count >= 5)  return 40;  // Low risk
      if (count >= 2)  return 20;  // Very low risk
      
      return 0; // No risk for first transaction
    } catch (error) {
      console.error('[TransactionSecurityMonitor] Error checking velocity:', error);
      return 50; // Moderate risk as fallback
    }
  }
  
  /**
   * Assess risk based on transaction amount
   * Returns a risk score from 0-100
   */
  private assessAmountRisk(transaction: PaymentTransaction): number {
    try {
      // Get typical transaction amount for this user or IP
      let averageAmount = 0;
      let transactionCount = 0;
      
      if (transaction.userId) {
        const userHistory = this.userTransactionHistory.get(transaction.userId) || [];
        transactionCount = userHistory.length;
        
        if (transactionCount > 0) {
          const total = userHistory.reduce((sum, tx) => sum + tx.amount, 0);
          averageAmount = total / transactionCount;
        }
      } else {
        const ipHistory = this.ipTransactionHistory.get(transaction.ipAddress) || [];
        transactionCount = ipHistory.length;
        
        if (transactionCount > 0) {
          const total = ipHistory.reduce((sum, tx) => sum + tx.amount, 0);
          averageAmount = total / transactionCount;
        }
      }
      
      // If we have no history, use absolute amount for risk assessment
      if (transactionCount === 0) {
        // Assess risk based on absolute amount
        if (transaction.amount >= 10000) return 80; // High risk for large amounts
        if (transaction.amount >= 5000) return 60;  // Moderate risk
        if (transaction.amount >= 1000) return 40;  // Low risk
        return 20; // Very low risk for small amounts
      }
      
      // Calculate deviation from average
      const deviation = Math.abs(transaction.amount - averageAmount);
      const deviationPercent = (deviation / averageAmount) * 100;
      
      // Determine risk based on deviation
      if (deviationPercent >= 500) return 100; // Very high risk
      if (deviationPercent >= 300) return 80;  // High risk
      if (deviationPercent >= 200) return 60;  // Moderate risk
      if (deviationPercent >= 100) return 40;  // Low risk
      if (deviationPercent >= 50)  return 20;  // Very low risk
      
      return 0; // No risk for typical amounts
    } catch (error) {
      console.error('[TransactionSecurityMonitor] Error assessing amount risk:', error);
      return 50; // Moderate risk as fallback
    }
  }
  
  /**
   * Analyze transaction patterns for anomalies
   * Returns a risk score from 0-100
   */
  private analyzeTransactionPatterns(transaction: PaymentTransaction): number {
    try {
      // Implement basic pattern analysis
      // In a real system, this would be more sophisticated
      
      const hour = new Date(transaction.timestamp).getHours();
      
      // Unusual hours for transactions (late night)
      if (hour >= 0 && hour <= 5) {
        return 60; // Moderate risk for late-night transactions
      }
      
      // Check currency matches previous transactions
      if (transaction.userId) {
        const userHistory = this.userTransactionHistory.get(transaction.userId) || [];
        
        if (userHistory.length > 0) {
          // Get the unique currencies used by this user
          const currencies = new Set(userHistory.map(tx => tx.currency));
          
          // If this is a new currency for this user, that's suspicious
          if (!currencies.has(transaction.currency)) {
            return 70; // Higher risk for new currency
          }
        }
      }
      
      return 0; // No pattern-based risk detected
    } catch (error) {
      console.error('[TransactionSecurityMonitor] Error analyzing transaction patterns:', error);
      return 30; // Low-moderate risk as fallback
    }
  }
  
  /**
   * Evaluate risk based on location/IP address
   * Returns a risk score from 0-100
   */
  private evaluateLocationRisk(transaction: PaymentTransaction): number {
    try {
      // In a real system, this would use geolocation data
      // For now, just check if the IP has been seen before
      
      if (transaction.userId) {
        const userHistory = this.userTransactionHistory.get(transaction.userId) || [];
        
        if (userHistory.length > 0) {
          // Check if this IP has been used before by this user
          const knownIPs = new Set(userHistory.map(tx => tx.ipAddress));
          
          if (!knownIPs.has(transaction.ipAddress)) {
            return 60; // Moderate risk for new IP
          }
        }
      }
      
      return 20; // Low baseline risk
    } catch (error) {
      console.error('[TransactionSecurityMonitor] Error evaluating location risk:', error);
      return 30; // Low-moderate risk as fallback
    }
  }
  
  /**
   * Calculate composite risk score from individual factor scores
   */
  private calculateCompositeRisk(scores: number[]): number {
    // Weight the factors equally for now
    const sum = scores.reduce((total, score) => total + score, 0);
    
    // Return average, rounded to nearest integer
    return Math.round(sum / scores.length);
  }
  
  /**
   * Identify specific risk factors for reporting
   */
  private identifyRiskFactors(
    velocityRisk: number,
    amountRisk: number,
    patternRisk: number,
    locationRisk: number
  ): string[] {
    const factors: string[] = [];
    
    if (velocityRisk >= 60) factors.push('High transaction velocity');
    if (amountRisk >= 60) factors.push('Unusual transaction amount');
    if (patternRisk >= 60) factors.push('Suspicious transaction pattern');
    if (locationRisk >= 60) factors.push('Unusual transaction location');
    
    return factors;
  }
  
  /**
   * Determine recommended action based on risk score
   */
  private determineAction(riskScore: number): 'allow' | 'review' | 'challenge' | 'deny' {
    if (riskScore >= 80) return 'deny';
    if (riskScore >= 60) return 'challenge';
    if (riskScore >= 40) return 'review';
    return 'allow';
  }
  
  /**
   * Record risk assessment for audit trail
   */
  private recordRiskAssessment(
    transaction: PaymentTransaction,
    riskScore: number,
    factors: string[],
    recommendation: string
  ): void {
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      action: 'TRANSACTION_RISK_ASSESSMENT',
      resource: `transaction:${transaction.transactionId}`,
      userId: transaction.userId,
      ipAddress: transaction.ipAddress,
      result: riskScore >= 60 ? 'failure' : 'success',
      severity: riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'warning' : 'info',
      details: {
        transactionId: transaction.transactionId,
        riskScore,
        factors,
        recommendation,
        amount: transaction.amount,
        currency: transaction.currency
      }
    });
  }
}

// Create and export singleton instance
const transactionSecurityMonitor = new TransactionSecurityMonitor();
export default transactionSecurityMonitor;