
import { storage } from "./storage";
import { groqService } from "./groqService";
import { aiDetectionService } from "./aiDetectionService";
import { proctorService } from "./proctorService";

interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  type: 'customer_service' | 'project_management' | 'sales' | 'technical_troubleshooting' | 'team_leadership';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // minutes
  tools: SimulationTool[];
  objectives: string[];
  successCriteria: SuccessCriteria[];
}

interface SimulationTool {
  name: string;
  type: 'email' | 'calendar' | 'chat' | 'spreadsheet' | 'crm' | 'ticketing_system' | 'video_call';
  interface: any; // Tool-specific configuration
  permissions: string[];
}

interface SuccessCriteria {
  metric: string;
  target: number | string;
  weight: number; // percentage of total score
  measurement: 'time' | 'accuracy' | 'completion' | 'quality';
}

interface SimulationAction {
  timestamp: Date;
  tool: string;
  action: string;
  target: string;
  data: any;
  context: string;
}

interface SimulationResult {
  sessionId: string;
  candidateId: string;
  scenario: SimulationScenario;
  actions: SimulationAction[];
  metrics: {
    timeToComplete: number;
    accuracyScore: number;
    efficiencyScore: number;
    decisionQuality: number;
    communicationScore: number;
  };
  overallScore: number;
  feedback: string;
  recommendations: string[];
}

export class SimulationAssessmentService {
  private activeSimulations = new Map<string, any>();

  async createSimulationAssessment(
    candidateId: string,
    recruiterId: string,
    jobId: number,
    scenarioType: string,
    difficulty: string
  ): Promise<any> {
    const scenario = await this.getScenarioByType(scenarioType, difficulty);
    
    const assessment = await storage.createSimulationAssessment({
      candidateId,
      recruiterId,
      jobId,
      scenarioId: scenario.id,
      scenario: JSON.stringify(scenario),
      status: 'created',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return { assessment, scenario };
  }

  async startSimulation(assessmentId: number): Promise<string> {
    const assessment = await storage.getSimulationAssessment(assessmentId);
    if (!assessment) throw new Error('Assessment not found');

    const sessionId = `sim_${assessmentId}_${Date.now()}`;
    const scenario = JSON.parse(assessment.scenario);

    // Initialize virtual environment
    const environment = await this.initializeVirtualEnvironment(scenario);
    
    // Start proctoring
    await proctorService.initializeSession(sessionId, assessment.candidateId, {
      sessionType: 'simulation_assessment',
      securityLevel: 'high',
      enableScreenRecording: true,
      enableActivityTracking: true
    });

    this.activeSimulations.set(sessionId, {
      assessmentId,
      scenario,
      environment,
      startTime: Date.now(),
      actions: [],
      candidateId: assessment.candidateId
    });

    await storage.updateSimulationAssessment(assessmentId, {
      sessionId,
      status: 'in_progress',
      startedAt: new Date()
    });

    return sessionId;
  }

  private async initializeVirtualEnvironment(scenario: SimulationScenario): Promise<any> {
    const environment: {
      tools: { [key: string]: any };
      data: { [key: string]: any };
      state: string;
    } = {
      tools: {},
      data: {},
      state: 'active'
    };

    // Initialize each tool in the scenario
    for (const tool of scenario.tools) {
      environment.tools[tool.name] = await this.initializeTool(tool);
    }

    // Pre-populate with scenario data
    environment.data = await this.generateScenarioData(scenario);

    return environment;
  }

  private async initializeTool(tool: SimulationTool): Promise<any> {
    switch (tool.type) {
      case 'email':
        return {
          inbox: await this.generateEmails(tool.interface?.emailCount || 5),
          sent: [],
          drafts: []
        };
      
      case 'calendar':
        return {
          events: await this.generateCalendarEvents(tool.interface?.eventCount || 3),
          availability: []
        };
      
      case 'chat':
        return {
          conversations: await this.generateChatConversations(tool.interface?.chatCount || 2),
          activeUsers: []
        };
      
      case 'crm':
        return {
          contacts: await this.generateCRMContacts(tool.interface?.contactCount || 10),
          deals: await this.generateCRMDeals(tool.interface?.dealCount || 5),
          activities: []
        };
      
      case 'ticketing_system':
        return {
          tickets: await this.generateTickets(tool.interface?.ticketCount || 8),
          categories: ['Technical', 'Billing', 'General', 'Urgent']
        };
      
      default:
        return {};
    }
  }

  async recordAction(
    sessionId: string,
    action: Omit<SimulationAction, 'timestamp'>
  ): Promise<void> {
    const simulation = this.activeSimulations.get(sessionId);
    if (!simulation) throw new Error('Simulation not found');

    const fullAction: SimulationAction = {
      ...action,
      timestamp: new Date()
    };

    simulation.actions.push(fullAction);
    
    // Update environment state based on action
    await this.updateEnvironmentState(simulation, fullAction);
    
    // Check for completion criteria
    await this.checkCompletionCriteria(simulation);
  }

  private async updateEnvironmentState(simulation: any, action: SimulationAction): Promise<void> {
    const { environment } = simulation;
    
    switch (action.tool) {
      case 'email':
        if (action.action === 'send') {
          environment.tools.email.sent.push({
            to: action.target,
            subject: action.data.subject,
            body: action.data.body,
            timestamp: action.timestamp
          });
        }
        break;
      
      case 'crm':
        if (action.action === 'update_contact') {
          const contact = environment.tools.crm.contacts.find((c: any) => c.id === action.target);
          if (contact) {
            Object.assign(contact, action.data);
          }
        }
        break;
      
      case 'ticketing_system':
        if (action.action === 'resolve_ticket') {
          const ticket = environment.tools.ticketing_system.tickets.find((t: any) => t.id === action.target);
          if (ticket) {
            ticket.status = 'resolved';
            ticket.resolution = action.data.resolution;
            ticket.resolvedAt = action.timestamp;
          }
        }
        break;
    }
  }

  private async checkCompletionCriteria(simulation: any): Promise<void> {
    const { scenario, actions, startTime } = simulation;
    const elapsedTime = (Date.now() - startTime) / 1000 / 60; // minutes
    
    // Check if time limit exceeded
    if (elapsedTime >= scenario.duration) {
      await this.completeSimulation(simulation.sessionId);
      return;
    }
    
    // Check if all objectives completed
    const completedObjectives = this.calculateCompletedObjectives(simulation);
    if (completedObjectives >= scenario.objectives.length) {
      await this.completeSimulation(simulation.sessionId);
      return;
    }
  }

  private calculateCompletedObjectives(simulation: any): number {
    const { scenario, environment } = simulation;
    let completed = 0;
    
    for (const objective of scenario.objectives) {
      if (this.isObjectiveCompleted(objective, environment)) {
        completed++;
      }
    }
    
    return completed;
  }

  private isObjectiveCompleted(objective: string, environment: any): boolean {
    // Example objective checking logic
    if (objective.includes('resolve all high priority tickets')) {
      const highPriorityTickets = environment.tools.ticketing_system?.tickets?.filter(
        (t: any) => t.priority === 'high'
      ) || [];
      return highPriorityTickets.every((t: any) => t.status === 'resolved');
    }
    
    if (objective.includes('respond to all emails')) {
      const inbox = environment.tools.email?.inbox || [];
      const responses = environment.tools.email?.sent || [];
      return inbox.length <= responses.length;
    }
    
    // Add more objective checking logic as needed
    return false;
  }

  async completeSimulation(sessionId: string): Promise<SimulationResult> {
    const simulation = this.activeSimulations.get(sessionId);
    if (!simulation) throw new Error('Simulation not found');

    const result = await this.calculateSimulationResult(simulation);
    
    // Store result
    await storage.updateSimulationAssessment(simulation.assessmentId, {
      status: 'completed',
      completedAt: new Date(),
      result: JSON.stringify(result),
      score: result.overallScore
    });

    // Clean up
    this.activeSimulations.delete(sessionId);
    
    return result;
  }

  private async calculateSimulationResult(simulation: any): Promise<SimulationResult> {
    const { scenario, actions, startTime, environment, candidateId } = simulation;
    const endTime = Date.now();
    const timeToComplete = (endTime - startTime) / 1000 / 60; // minutes
    
    // Calculate metrics
    const metrics = {
      timeToComplete,
      accuracyScore: this.calculateAccuracyScore(simulation),
      efficiencyScore: this.calculateEfficiencyScore(simulation),
      decisionQuality: this.calculateDecisionQuality(simulation),
      communicationScore: this.calculateCommunicationScore(simulation)
    };
    
    // Calculate overall score based on success criteria
    const overallScore = this.calculateOverallScore(scenario, metrics);
    
    // Generate feedback
    const feedback = await this.generateSimulationFeedback(scenario, metrics, actions);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics);
    
    return {
      sessionId: simulation.sessionId,
      candidateId,
      scenario,
      actions,
      metrics,
      overallScore,
      feedback,
      recommendations
    };
  }

  private calculateAccuracyScore(simulation: any): number {
    const { scenario, environment } = simulation;
    let totalTasks = 0;
    let completedCorrectly = 0;
    
    // Check each objective completion accuracy
    for (const objective of scenario.objectives) {
      totalTasks++;
      if (this.isObjectiveCompletedCorrectly(objective, environment)) {
        completedCorrectly++;
      }
    }
    
    return totalTasks > 0 ? (completedCorrectly / totalTasks) * 100 : 0;
  }

  private isObjectiveCompletedCorrectly(objective: string, environment: any): boolean {
    // More detailed checking than just completion
    if (objective.includes('resolve all high priority tickets')) {
      const highPriorityTickets = environment.tools.ticketing_system?.tickets?.filter(
        (t: any) => t.priority === 'high'
      ) || [];
      return highPriorityTickets.every((t: any) => 
        t.status === 'resolved' && t.resolution && t.resolution.length > 20
      );
    }
    
    return this.isObjectiveCompleted(objective, environment);
  }

  private calculateEfficiencyScore(simulation: any): number {
    const { actions, scenario } = simulation;
    const expectedActions = scenario.objectives.length * 3; // Estimate
    const actualActions = actions.length;
    
    // Reward completing tasks with fewer actions
    if (actualActions <= expectedActions) {
      return 100;
    } else {
      return Math.max(0, 100 - ((actualActions - expectedActions) / expectedActions) * 50);
    }
  }

  private calculateDecisionQuality(simulation: any): number {
    const { actions } = simulation;
    let qualityScore = 0;
    let scorableActions = 0;
    
    for (const action of actions) {
      if (action.tool === 'ticketing_system' && action.action === 'resolve_ticket') {
        scorableActions++;
        const resolutionQuality = action.data?.resolution?.length || 0;
        qualityScore += Math.min(100, resolutionQuality * 2); // 2 points per character, max 100
      }
      
      if (action.tool === 'email' && action.action === 'send') {
        scorableActions++;
        const emailQuality = (action.data?.subject?.length || 0) + (action.data?.body?.length || 0);
        qualityScore += Math.min(100, emailQuality / 2);
      }
    }
    
    return scorableActions > 0 ? qualityScore / scorableActions : 50;
  }

  private calculateCommunicationScore(simulation: any): number {
    const { actions } = simulation;
    let communicationActions = 0;
    let qualitySum = 0;
    
    for (const action of actions) {
      if (['email', 'chat'].includes(action.tool)) {
        communicationActions++;
        const content = action.data?.body || action.data?.message || '';
        // Simple quality assessment based on length and politeness indicators
        const politenessWords = ['please', 'thank you', 'sorry', 'appreciate'];
        const politenessScore = politenessWords.filter(word => 
          content.toLowerCase().includes(word)
        ).length * 10;
        
        const lengthScore = Math.min(50, content.length / 4);
        qualitySum += Math.min(100, politenessScore + lengthScore);
      }
    }
    
    return communicationActions > 0 ? qualitySum / communicationActions : 50;
  }

  private calculateOverallScore(scenario: SimulationScenario, metrics: any): number {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const criteria of scenario.successCriteria) {
      const metricValue = this.getMetricValue(criteria.metric, metrics);
      let score = 0;
      
      switch (criteria.measurement) {
        case 'time':
          // Lower time is better, but within reasonable limits
          const targetTime = typeof criteria.target === 'number' ? criteria.target : 0;
          score = Math.max(0, 100 - Math.max(0, (metricValue - targetTime) / targetTime * 100));
          break;
        case 'accuracy':
        case 'completion':
        case 'quality':
          score = metricValue;
          break;
      }
      
      totalScore += score * (criteria.weight / 100);
      totalWeight += criteria.weight;
    }
    
    return totalWeight > 0 ? Math.round(totalScore) : 0;
  }

  private getMetricValue(metric: string, metrics: any): number {
    switch (metric) {
      case 'time_to_complete': return metrics.timeToComplete;
      case 'accuracy': return metrics.accuracyScore;
      case 'efficiency': return metrics.efficiencyScore;
      case 'decision_quality': return metrics.decisionQuality;
      case 'communication': return metrics.communicationScore;
      default: return 0;
    }
  }

  private async generateSimulationFeedback(scenario: SimulationScenario, metrics: any, actions: SimulationAction[]): Promise<string> {
    let feedback = `Simulation Assessment Results\n`;
    feedback += `Scenario: ${scenario.title}\n\n`;
    
    feedback += `Performance Metrics:\n`;
    feedback += `• Time to Complete: ${metrics.timeToComplete.toFixed(1)} minutes\n`;
    feedback += `• Accuracy Score: ${metrics.accuracyScore.toFixed(0)}/100\n`;
    feedback += `• Efficiency Score: ${metrics.efficiencyScore.toFixed(0)}/100\n`;
    feedback += `• Decision Quality: ${metrics.decisionQuality.toFixed(0)}/100\n`;
    feedback += `• Communication Score: ${metrics.communicationScore.toFixed(0)}/100\n\n`;
    
    feedback += `Behavioral Analysis:\n`;
    feedback += `• Total Actions: ${actions.length}\n`;
    feedback += `• Tools Used: ${new Set(actions.map(a => a.tool)).size}\n`;
    feedback += `• Action Distribution: ${this.getActionDistribution(actions)}\n\n`;
    
    feedback += `Strengths:\n`;
    if (metrics.accuracyScore >= 80) feedback += `• High accuracy in task completion\n`;
    if (metrics.efficiencyScore >= 80) feedback += `• Efficient use of resources and tools\n`;
    if (metrics.communicationScore >= 80) feedback += `• Excellent communication skills\n`;
    
    feedback += `\nAreas for Improvement:\n`;
    if (metrics.accuracyScore < 70) feedback += `• Focus on task accuracy and attention to detail\n`;
    if (metrics.efficiencyScore < 70) feedback += `• Work on time management and process optimization\n`;
    if (metrics.communicationScore < 70) feedback += `• Enhance professional communication skills\n`;
    
    return feedback;
  }

  private getActionDistribution(actions: SimulationAction[]): string {
    const distribution: { [key: string]: number } = {};
    actions.forEach(action => {
      distribution[action.tool] = (distribution[action.tool] || 0) + 1;
    });
    
    return Object.entries(distribution)
      .map(([tool, count]) => `${tool}: ${count}`)
      .join(', ');
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations = [];
    
    if (metrics.timeToComplete > 60) {
      recommendations.push('Focus on time management and prioritization skills');
    }
    if (metrics.accuracyScore < 80) {
      recommendations.push('Practice attention to detail and task verification');
    }
    if (metrics.efficiencyScore < 80) {
      recommendations.push('Learn workflow optimization and tool proficiency');
    }
    if (metrics.decisionQuality < 80) {
      recommendations.push('Develop problem-solving and analytical thinking skills');
    }
    if (metrics.communicationScore < 80) {
      recommendations.push('Improve professional communication and customer service skills');
    }
    
    return recommendations;
  }

  // Helper methods for generating scenario data
  private async generateEmails(count: number): Promise<any[]> {
    const emails = [];
    const senders = ['customer@company.com', 'manager@company.com', 'support@vendor.com'];
    const subjects = [
      'Urgent: System Issue Needs Resolution',
      'Question about recent order',
      'Meeting request for next week',
      'Follow-up on proposal',
      'Customer complaint - high priority'
    ];
    
    for (let i = 0; i < count; i++) {
      emails.push({
        id: `email_${i}`,
        from: senders[Math.floor(Math.random() * senders.length)],
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        body: 'This is a simulated email content that requires a professional response.',
        timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
        priority: Math.random() > 0.7 ? 'high' : 'normal'
      });
    }
    
    return emails;
  }

  private async generateCalendarEvents(count: number): Promise<any[]> {
    const events = [];
    const eventTypes = ['Team Meeting', 'Client Call', 'Training Session', 'Project Review'];
    
    for (let i = 0; i < count; i++) {
      events.push({
        id: `event_${i}`,
        title: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        start: new Date(Date.now() + Math.random() * 604800000), // Random time in next week
        duration: 30 + Math.floor(Math.random() * 90), // 30-120 minutes
        attendees: Math.floor(Math.random() * 5) + 2 // 2-6 attendees
      });
    }
    
    return events;
  }

  private async generateChatConversations(count: number): Promise<any[]> {
    const conversations = [];
    const users = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson'];
    
    for (let i = 0; i < count; i++) {
      conversations.push({
        id: `chat_${i}`,
        user: users[Math.floor(Math.random() * users.length)],
        lastMessage: 'Hi, I need help with...',
        timestamp: new Date(Date.now() - Math.random() * 3600000), // Last hour
        unreadCount: Math.floor(Math.random() * 3) + 1
      });
    }
    
    return conversations;
  }

  private async generateCRMContacts(count: number): Promise<any[]> {
    const contacts = [];
    const companies = ['Acme Corp', 'Tech Solutions', 'Global Industries', 'StartupXYZ'];
    
    for (let i = 0; i < count; i++) {
      contacts.push({
        id: `contact_${i}`,
        name: `Contact ${i + 1}`,
        company: companies[Math.floor(Math.random() * companies.length)],
        email: `contact${i + 1}@example.com`,
        phone: `555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        status: Math.random() > 0.5 ? 'active' : 'prospect',
        lastContact: new Date(Date.now() - Math.random() * 2592000000) // Last 30 days
      });
    }
    
    return contacts;
  }

  private async generateCRMDeals(count: number): Promise<any[]> {
    const deals = [];
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed'];
    
    for (let i = 0; i < count; i++) {
      deals.push({
        id: `deal_${i}`,
        title: `Deal ${i + 1}`,
        value: Math.floor(Math.random() * 100000) + 10000,
        stage: stages[Math.floor(Math.random() * stages.length)],
        probability: Math.floor(Math.random() * 100),
        closeDate: new Date(Date.now() + Math.random() * 7776000000) // Next 90 days
      });
    }
    
    return deals;
  }

  private async generateTickets(count: number): Promise<any[]> {
    const tickets = [];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const categories = ['Technical', 'Billing', 'General', 'Account'];
    const statuses = ['open', 'in_progress', 'pending', 'resolved'];
    
    for (let i = 0; i < count; i++) {
      tickets.push({
        id: `ticket_${i}`,
        subject: `Support ticket #${i + 1}`,
        description: 'Customer is experiencing an issue that needs resolution.',
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(Date.now() - Math.random() * 604800000), // Last week
        customer: `Customer ${i + 1}`
      });
    }
    
    return tickets;
  }

  private async getScenarioByType(type: string, difficulty: string): Promise<SimulationScenario> {
    // Return predefined scenarios based on type and difficulty
    const scenarios: { [key: string]: SimulationScenario } = {
      'customer_service_easy': {
        id: 'cs_easy_1',
        title: 'Customer Service - Basic Support',
        description: 'Handle customer inquiries and resolve basic support tickets',
        type: 'customer_service',
        difficulty: 'easy',
        duration: 30,
        tools: [
          {
            name: 'ticketing_system',
            type: 'ticketing_system',
            interface: { ticketCount: 5 },
            permissions: ['view', 'update', 'resolve']
          },
          {
            name: 'email',
            type: 'email',
            interface: { emailCount: 3 },
            permissions: ['read', 'send', 'reply']
          }
        ],
        objectives: [
          'Resolve all high priority support tickets',
          'Respond to all customer emails within 15 minutes',
          'Maintain professional communication tone'
        ],
        successCriteria: [
          {
            metric: 'accuracy',
            target: 80,
            weight: 40,
            measurement: 'accuracy'
          },
          {
            metric: 'time_to_complete',
            target: 25,
            weight: 30,
            measurement: 'time'
          },
          {
            metric: 'communication',
            target: 75,
            weight: 30,
            measurement: 'quality'
          }
        ]
      },
      // Add more scenarios as needed
    };
    
    const scenarioKey = `${type}_${difficulty}`;
    return scenarios[scenarioKey] || scenarios['customer_service_easy'];
  }

  async generateScenarioData(scenario: SimulationScenario): Promise<any> {
    // Generate contextual data based on scenario type
    return {
      companyName: 'SimuCorp Technologies',
      candidateRole: 'Customer Success Representative',
      currentTime: new Date(),
      workingHours: '9 AM - 5 PM EST',
      escalationContact: 'supervisor@company.com'
    };
  }
}

export const simulationAssessmentService = new SimulationAssessmentService();
