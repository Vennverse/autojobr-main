import { Router } from 'express';
import { isAuthenticated as requireAuth } from '../auth';
import { proctorService } from '../proctorService';
import { behavioralAnalyzer } from '../behavioralAnalyzer';
import { cameraProctorService } from '../cameraProctorService';
import { aiDetectionService } from '../aiDetectionService';
import { storage } from '../storage';

const router = Router();

// Track violations per assignment in memory (in production, use database)
const violationCounts = new Map<string, number>();

// Device fingerprinting endpoint
router.post('/test-assignments/:id/device-fingerprint', requireAuth, async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const deviceData = req.body;
    
    console.log('📱 Received device fingerprint for assignment:', assignmentId);
    
    // Generate comprehensive device fingerprint
    const fingerprint = await proctorService.generateDeviceFingerprint(deviceData);
    
    // Validate environment
    const environmentValidation = await proctorService.validateEnvironment(deviceData);
    
    // Analyze browser security
    const browserSecurity = await proctorService.analyzeBrowserSecurity(deviceData);
    
    // Store in session (in production, you'd store in database)
    // For now, we'll just log and acknowledge
    console.log('🔍 Environment validation:', environmentValidation);
    console.log('🛡️ Browser security:', browserSecurity);
    
    res.json({
      success: true,
      fingerprint,
      environmentValidation,
      browserSecurity,
      riskLevel: environmentValidation.isVirtualMachine ? 'high' : 'low'
    });
  } catch (error) {
    console.error('Error processing device fingerprint:', error);
    res.status(500).json({ error: 'Failed to process device fingerprint' });
  }
});

// Violation reporting endpoint
router.post('/test-assignments/:id/violation', requireAuth, async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const violation = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log(`🚨 Violation reported: ${violation.type} for assignment ${assignmentId}`);
    
    // Record violation with enhanced data
    await proctorService.recordViolation({
      ...violation,
      userId,
      sessionId: assignmentId
    });
    
    // Track violation count
    const currentCount = violationCounts.get(assignmentId) || 0;
    const newCount = currentCount + 1;
    violationCounts.set(assignmentId, newCount);
    
    // CRITICAL: Automatically terminate test if violations exceed limit (5)
    const VIOLATION_LIMIT = 5;
    if (newCount >= VIOLATION_LIMIT) {
      console.log(`🚫 TERMINATING test ${assignmentId} - violations exceeded limit (${newCount}/${VIOLATION_LIMIT})`);
      
      // Fetch current assignment to get its data
      const assignment = await storage.getTestAssignment(parseInt(assignmentId));
      
      if (assignment && assignment.status !== 'terminated' && assignment.status !== 'completed') {
        // Terminate the test
        await storage.updateTestAssignment(parseInt(assignmentId), {
          status: 'terminated',
          terminationReason: `Exceeded violation limit (${newCount} violations)`,
          completedAt: new Date()
        });
        
        console.log(`✅ Test ${assignmentId} terminated due to excessive violations`);
        
        return res.json({ 
          success: true, 
          terminated: true,
          reason: 'Exceeded violation limit',
          violationCount: newCount 
        });
      }
    }
    
    res.json({ success: true, violationCount: newCount });
  } catch (error) {
    console.error('Error recording violation:', error);
    res.status(500).json({ error: 'Failed to record violation' });
  }
});

// Proctoring summary endpoint
router.post('/test-assignments/:id/proctoring-summary', requireAuth, async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { behavioralData, violations, deviceFingerprint, environmentData, riskScore } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('📊 Generating proctoring summary for assignment:', assignmentId);
    
    // Generate behavioral analysis
    const behavioralProfile = behavioralAnalyzer.generateBehavioralProfile({
      ...behavioralData,
      userId,
      sessionId: assignmentId
    });
    
    // Generate comprehensive proctoring summary
    const proctoringSummary = await proctorService.generateProctoringSummary(assignmentId);
    
    // Network activity analysis if available
    let networkAnalysis = null;
    if (req.body.networkData) {
      networkAnalysis = await proctorService.monitorNetworkActivity(req.body.networkData);
    }
    
    const summary = {
      sessionId: assignmentId,
      userId,
      timestamp: new Date().toISOString(),
      behavioralProfile,
      proctoringSummary,
      networkAnalysis,
      deviceFingerprint,
      environmentData,
      overallRiskScore: riskScore,
      recommendation: behavioralProfile.recommendation,
      violations: violations?.length || 0
    };
    
    console.log(`✅ Proctoring summary generated - Risk: ${behavioralProfile.riskAssessment}, Score: ${behavioralProfile.overallAuthenticity}%`);
    
    res.json(summary);
  } catch (error) {
    console.error('Error generating proctoring summary:', error);
    res.status(500).json({ error: 'Failed to generate proctoring summary' });
  }
});

// Camera proctoring endpoints
router.post('/test-assignments/:id/camera/initialize', requireAuth, async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const config = req.body.config || {};
    
    await cameraProctorService.initializeSession(assignmentId, config);
    
    res.json({ success: true, sessionId: assignmentId });
  } catch (error) {
    console.error('Error initializing camera proctoring:', error);
    res.status(500).json({ error: 'Failed to initialize camera proctoring' });
  }
});

router.post('/test-assignments/:id/camera/analyze-frame', requireAuth, async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const frameData = req.body;
    
    const analysis = await cameraProctorService.analyzeVideoFrame(assignmentId, frameData);
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing video frame:', error);
    res.status(500).json({ error: 'Failed to analyze video frame' });
  }
});

router.post('/test-assignments/:id/camera/analyze-audio', requireAuth, async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const audioData = req.body;
    
    const analysis = await cameraProctorService.analyzeAudioStream(assignmentId, audioData);
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing audio:', error);
    res.status(500).json({ error: 'Failed to analyze audio' });
  }
});

router.get('/test-assignments/:id/camera/summary', requireAuth, async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    
    const summary = await cameraProctorService.generateSummary(assignmentId);
    
    res.json(summary);
  } catch (error) {
    console.error('Error generating camera summary:', error);
    res.status(500).json({ error: 'Failed to generate camera summary' });
  }
});

// Enhanced AI detection endpoint
router.post('/test-assignments/:id/analyze-response', requireAuth, async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { response, question, behavioralData } = req.body;
    
    console.log('🤖 Analyzing response for AI detection in assignment:', assignmentId);
    
    // Enhanced AI detection with behavioral data
    const aiDetection = await aiDetectionService.detectAIUsage(response, question, behavioralData);
    
    // Mock original analysis for demonstration
    const originalAnalysis = {
      responseQuality: 8,
      overallScore: 85
    };
    
    // Analyze response with AI detection
    const responseAnalysis = aiDetectionService.analyzeResponseWithAI(originalAnalysis, aiDetection);
    
    // Generate feedback
    const recruiterFeedback = aiDetectionService.generateRecruiterFeedback(responseAnalysis);
    const candidateFeedback = aiDetectionService.generateCandidateFeedback(responseAnalysis);
    
    res.json({
      aiDetection,
      responseAnalysis,
      recruiterFeedback,
      candidateFeedback
    });
  } catch (error) {
    console.error('Error analyzing response:', error);
    res.status(500).json({ error: 'Failed to analyze response' });
  }
});

// Behavioral analysis endpoint
router.post('/behavioral-analysis/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const behavioralData = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log('🧠 Performing behavioral analysis for session:', sessionId);
    
    const profile = behavioralAnalyzer.generateBehavioralProfile({
      ...behavioralData,
      userId,
      sessionId
    });
    
    res.json(profile);
  } catch (error) {
    console.error('Error performing behavioral analysis:', error);
    res.status(500).json({ error: 'Failed to perform behavioral analysis' });
  }
});

// Real-time monitoring endpoint
router.post('/monitoring/:sessionId/status', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { violations, riskScore, behavioralData } = req.body;
    
    // Real-time assessment
    const assessment = {
      sessionId,
      timestamp: new Date().toISOString(),
      currentRiskScore: riskScore,
      violationsCount: violations?.length || 0,
      recommendation: riskScore > 80 ? 'terminate' : riskScore > 60 ? 'investigate' : 'continue',
      status: riskScore > 80 ? 'high_risk' : riskScore > 40 ? 'monitoring' : 'normal'
    };
    
    res.json(assessment);
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    res.status(500).json({ error: 'Failed to get monitoring status' });
  }
});

export { router as proctoring };