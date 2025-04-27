/**
 * Zero-Knowledge Security Proofs API Routes
 * 
 * This file contains the API routes for managing zero-knowledge security proofs.
 */

import { Router } from 'express';
import { zeroKnowledgeProofs, ZKProofParams } from '../../../security/advanced/zero-knowledge';

// Create router for zero-knowledge routes
export const zeroKnowledgeRoutes = Router();

/**
 * Get all zero-knowledge proofs for a specific property
 * 
 * @route GET /api/security/zero-knowledge/proofs/:property
 */
zeroKnowledgeRoutes.get('/proofs/:property', (req, res) => {
  try {
    const property = req.params.property;
    const proofs = zeroKnowledgeProofs.getProofsForProperty(property);
    
    res.json({
      success: true,
      count: proofs.length,
      data: proofs
    });
  } catch (error) {
    console.error('Error fetching zero-knowledge proofs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch zero-knowledge proofs'
    });
  }
});

/**
 * Get a specific zero-knowledge proof by ID
 * 
 * @route GET /api/security/zero-knowledge/proof/:id
 */
zeroKnowledgeRoutes.get('/proof/:id', (req, res) => {
  try {
    const proofId = req.params.id;
    const proof = zeroKnowledgeProofs.getProof(proofId);
    
    if (!proof) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Zero-knowledge proof with ID ${proofId} not found`
      });
      return;
    }
    
    res.json({
      success: true,
      data: proof
    });
  } catch (error) {
    console.error(`Error fetching zero-knowledge proof ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch zero-knowledge proof'
    });
  }
});

/**
 * Generate a new zero-knowledge proof
 * 
 * @route POST /api/security/zero-knowledge/generate
 */
zeroKnowledgeRoutes.post('/generate', (req, res) => {
  try {
    const params: ZKProofParams = req.body;
    
    // Validate required fields
    if (!params.property || !params.secretData || !params.publicParams) {
      res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Missing required parameters: property, secretData, or publicParams'
      });
      return;
    }
    
    // Generate the proof
    const proof = zeroKnowledgeProofs.generateProof(params);
    
    res.status(201).json({
      success: true,
      message: `Successfully generated zero-knowledge proof for property: ${params.property}`,
      data: {
        proofId: proof.id,
        property: proof.property,
        timestamp: proof.timestamp,
        verificationInstructions: proof.verificationInstructions
      }
    });
  } catch (error) {
    console.error('Error generating zero-knowledge proof:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate zero-knowledge proof'
    });
  }
});

/**
 * Verify a zero-knowledge proof
 * 
 * @route POST /api/security/zero-knowledge/verify/:id
 */
zeroKnowledgeRoutes.post('/verify/:id', (req, res) => {
  try {
    const proofId = req.params.id;
    const verificationData = req.body;
    
    // Verify the proof
    const result = zeroKnowledgeProofs.verifyProof(proofId, verificationData);
    
    res.json({
      success: true,
      isValid: result.isValid,
      property: result.property,
      timestamp: result.timestamp,
      details: result.details
    });
  } catch (error) {
    console.error(`Error verifying zero-knowledge proof ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify zero-knowledge proof'
    });
  }
});

/**
 * Delete a zero-knowledge proof
 * 
 * @route DELETE /api/security/zero-knowledge/proof/:id
 */
zeroKnowledgeRoutes.delete('/proof/:id', (req, res) => {
  try {
    const proofId = req.params.id;
    const deleted = zeroKnowledgeProofs.deleteProof(proofId);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Zero-knowledge proof with ID ${proofId} not found`
      });
      return;
    }
    
    res.json({
      success: true,
      message: `Successfully deleted zero-knowledge proof with ID ${proofId}`
    });
  } catch (error) {
    console.error(`Error deleting zero-knowledge proof ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete zero-knowledge proof'
    });
  }
});

export default zeroKnowledgeRoutes;