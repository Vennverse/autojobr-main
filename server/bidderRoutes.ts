import express from "express";
import { storage } from "./storage.js";

const router = express.Router();

// Middleware to check authentication (will be applied at router level)
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// ===== BIDDER SYSTEM API ROUTES =====

// Bidder registration routes
router.get('/bidders/registration/:userId', isAuthenticated, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const registration = await storage.getBidderRegistration(userId);
    res.json(registration);
  } catch (error: any) {
    console.error('Get bidder registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bidders/registration', isAuthenticated, async (req: any, res) => {
  try {
    const registrationData = req.body;
    const registration = await storage.createBidderRegistration(registrationData);
    res.json(registration);
  } catch (error: any) {
    console.error('Create bidder registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/bidders/registration/:userId', isAuthenticated, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const registration = await storage.updateBidderRegistration(userId, updates);
    res.json(registration);
  } catch (error: any) {
    console.error('Update bidder registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Project routes
router.get('/projects', async (req: any, res) => {
  try {
    const { status, type, category } = req.query;
    const filters = { status, type, category };
    const projects = await storage.getProjects(filters);
    res.json(projects);
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/projects/:id', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const project = await storage.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error: any) {
    console.error('Get project error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:userId/projects', isAuthenticated, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const projects = await storage.getUserProjects(userId);
    res.json(projects);
  } catch (error: any) {
    console.error('Get user projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/projects', isAuthenticated, async (req: any, res) => {
  try {
    const projectData = req.body;
    const project = await storage.createProject(projectData);
    res.json(project);
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/projects/:id', isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const project = await storage.updateProject(id, updates);
    res.json(project);
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/projects/:id', isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteProject(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bid routes
router.get('/projects/:projectId/bids', async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const bids = await storage.getProjectBids(projectId);
    res.json(bids);
  } catch (error: any) {
    console.error('Get project bids error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:userId/bids', isAuthenticated, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const bids = await storage.getUserBids(userId);
    res.json(bids);
  } catch (error: any) {
    console.error('Get user bids error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bids', isAuthenticated, async (req: any, res) => {
  try {
    const bidData = req.body;
    const bid = await storage.createBid(bidData);
    res.json(bid);
  } catch (error: any) {
    console.error('Create bid error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/bids/:id', isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const bid = await storage.updateBid(id, updates);
    res.json(bid);
  } catch (error: any) {
    console.error('Update bid error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bids/:id/accept', isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const bid = await storage.acceptBid(id);
    res.json(bid);
  } catch (error: any) {
    console.error('Accept bid error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bids/:id', isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteBid(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete bid error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Project payment routes
router.get('/projects/:projectId/payment', isAuthenticated, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const payment = await storage.getProjectPayment(projectId);
    res.json(payment);
  } catch (error: any) {
    console.error('Get project payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/projects/:projectId/payment', isAuthenticated, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const paymentData = { ...req.body, projectId };
    const payment = await storage.createProjectPayment(paymentData);
    res.json(payment);
  } catch (error: any) {
    console.error('Create project payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/projects/payments/:id', isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const payment = await storage.updateProjectPayment(id, updates);
    res.json(payment);
  } catch (error: any) {
    console.error('Update project payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Project milestone routes
router.get('/projects/:projectId/milestones', async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const milestones = await storage.getProjectMilestones(projectId);
    res.json(milestones);
  } catch (error: any) {
    console.error('Get project milestones error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/projects/:projectId/milestones', isAuthenticated, async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const milestoneData = { ...req.body, projectId };
    const milestone = await storage.createProjectMilestone(milestoneData);
    res.json(milestone);
  } catch (error: any) {
    console.error('Create project milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/milestones/:id', isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const milestone = await storage.updateProjectMilestone(id, updates);
    res.json(milestone);
  } catch (error: any) {
    console.error('Update project milestone error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;