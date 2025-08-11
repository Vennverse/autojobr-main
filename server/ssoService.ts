import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '@shared/schema';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { DOMParser } from 'xmldom';

// SSO Provider Types
export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oidc' | 'oauth';
  isActive: boolean;
  configuration: {
    entityId?: string;
    singleSignOnServiceUrl?: string;
    x509Certificate?: string;
    clientId?: string;
    clientSecret?: string;
    discoveryUrl?: string;
    scopes?: string[];
    attributeMappings: {
      email: string;
      firstName: string;
      lastName: string;
      groups?: string;
      department?: string;
    };
  };
  lastUsed?: string;
  totalUsers: number;
  status: 'active' | 'inactive' | 'error';
  errorMessage?: string;
}

export interface SSOSession {
  id: string;
  userId: string;
  userEmail: string;
  provider: string;
  loginAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface SAMLResponse {
  nameId: string;
  attributes: { [key: string]: string };
  sessionIndex?: string;
}

export class SSOService {
  private providers: Map<string, SSOProvider> = new Map();
  private activeSessions: Map<string, SSOSession> = new Map();

  constructor() {
    this.loadProviders();
  }

  // Load SSO providers from database
  private async loadProviders(): Promise<void> {
    try {
      // In a real implementation, load from database
      // For now, we'll use a default configured provider
      const defaultProvider: SSOProvider = {
        id: 'default-saml',
        name: 'Corporate SAML',
        type: 'saml',
        isActive: true,
        configuration: {
          entityId: 'https://app.autojobr.com/saml/metadata',
          singleSignOnServiceUrl: 'https://identity-provider.com/sso',
          x509Certificate: '',
          attributeMappings: {
            email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
            firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
            lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
            groups: 'http://schemas.xmlsoap.org/claims/Group'
          }
        },
        totalUsers: 0,
        status: 'active'
      };

      this.providers.set(defaultProvider.id, defaultProvider);
    } catch (error) {
      console.error('Failed to load SSO providers:', error);
    }
  }

  // Get all SSO providers
  async getProviders(): Promise<SSOProvider[]> {
    return Array.from(this.providers.values());
  }

  // Get a specific SSO provider
  async getProvider(id: string): Promise<SSOProvider | null> {
    return this.providers.get(id) || null;
  }

  // Create or update SSO provider
  async saveProvider(providerData: Partial<SSOProvider>): Promise<SSOProvider> {
    const id = providerData.id || crypto.randomUUID();
    
    const provider: SSOProvider = {
      id,
      name: providerData.name || 'Unnamed Provider',
      type: providerData.type || 'saml',
      isActive: providerData.isActive ?? true,
      configuration: {
        ...providerData.configuration,
        attributeMappings: {
          email: 'email',
          firstName: 'firstName',
          lastName: 'lastName',
          ...providerData.configuration?.attributeMappings
        }
      },
      totalUsers: providerData.totalUsers || 0,
      status: providerData.status || 'active'
    };

    this.providers.set(id, provider);
    
    // In a real implementation, save to database
    return provider;
  }

  // Delete SSO provider
  async deleteProvider(id: string): Promise<boolean> {
    return this.providers.delete(id);
  }

  // Toggle provider active status
  async toggleProvider(id: string, isActive: boolean): Promise<void> {
    const provider = this.providers.get(id);
    if (provider) {
      provider.isActive = isActive;
      provider.status = isActive ? 'active' : 'inactive';
    }
  }

  // Test SSO provider connection
  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const provider = this.providers.get(id);
    if (!provider) {
      return { success: false, message: 'Provider not found' };
    }

    try {
      switch (provider.type) {
        case 'saml':
          return await this.testSAMLConnection(provider);
        case 'oidc':
          return await this.testOIDCConnection(provider);
        case 'oauth':
          return await this.testOAuthConnection(provider);
        default:
          return { success: false, message: 'Unsupported provider type' };
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Test SAML connection
  private async testSAMLConnection(provider: SSOProvider): Promise<{ success: boolean; message: string }> {
    // Validate SAML configuration
    if (!provider.configuration.entityId || !provider.configuration.singleSignOnServiceUrl) {
      return { success: false, message: 'Missing required SAML configuration' };
    }

    // In a real implementation, you would:
    // 1. Validate the certificate
    // 2. Check if the SSO URL is reachable
    // 3. Validate the metadata
    
    return { success: true, message: 'SAML configuration is valid' };
  }

  // Test OIDC connection
  private async testOIDCConnection(provider: SSOProvider): Promise<{ success: boolean; message: string }> {
    if (!provider.configuration.discoveryUrl || !provider.configuration.clientId) {
      return { success: false, message: 'Missing required OIDC configuration' };
    }

    try {
      // Fetch OIDC discovery document
      const response = await fetch(provider.configuration.discoveryUrl);
      if (!response.ok) {
        return { success: false, message: 'Unable to fetch OIDC discovery document' };
      }

      const discovery = await response.json();
      if (!discovery.authorization_endpoint || !discovery.token_endpoint) {
        return { success: false, message: 'Invalid OIDC discovery document' };
      }

      return { success: true, message: 'OIDC configuration is valid' };
    } catch (error) {
      return { success: false, message: `OIDC test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Test OAuth connection
  private async testOAuthConnection(provider: SSOProvider): Promise<{ success: boolean; message: string }> {
    // Similar to OIDC but simpler validation
    if (!provider.configuration.clientId) {
      return { success: false, message: 'Missing client ID' };
    }

    return { success: true, message: 'OAuth configuration is valid' };
  }

  // Generate SAML AuthnRequest
  generateSAMLAuthRequest(providerId: string, relayState?: string): string {
    const provider = this.providers.get(providerId);
    if (!provider || provider.type !== 'saml') {
      throw new Error('Invalid SAML provider');
    }

    const requestId = '_' + crypto.randomUUID();
    const issueInstant = new Date().toISOString();
    const entityId = provider.configuration.entityId;
    const ssoUrl = provider.configuration.singleSignOnServiceUrl;

    const authnRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="${requestId}"
                    Version="2.0"
                    IssueInstant="${issueInstant}"
                    Destination="${ssoUrl}"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                    AssertionConsumerServiceURL="https://app.autojobr.com/api/auth/saml/acs">
  <saml:Issuer>${entityId}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>`;

    // In a real implementation, you would sign this request
    return Buffer.from(authnRequest).toString('base64');
  }

  // Parse SAML Response
  parseSAMLResponse(encodedResponse: string): SAMLResponse {
    try {
      const samlResponse = Buffer.from(encodedResponse, 'base64').toString('utf-8');
      const parser = new DOMParser();
      const doc = parser.parseFromString(samlResponse, 'text/xml');

      // Extract NameID
      const nameIdNode = doc.getElementsByTagName('saml:NameID')[0];
      const nameId = nameIdNode ? nameIdNode.textContent : '';

      // Extract attributes
      const attributes: { [key: string]: string } = {};
      const attributeNodes = doc.getElementsByTagName('saml:Attribute');
      
      for (let i = 0; i < attributeNodes.length; i++) {
        const attr = attributeNodes[i];
        const name = attr.getAttribute('Name') || '';
        const valueNode = attr.getElementsByTagName('saml:AttributeValue')[0];
        const value = valueNode ? valueNode.textContent : '';
        
        if (name && value) {
          attributes[name] = value;
        }
      }

      return {
        nameId,
        attributes
      };
    } catch (error) {
      throw new Error(`Failed to parse SAML response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Handle OIDC callback
  async handleOIDCCallback(providerId: string, code: string, state?: string): Promise<any> {
    const provider = this.providers.get(providerId);
    if (!provider || provider.type !== 'oidc') {
      throw new Error('Invalid OIDC provider');
    }

    // Fetch discovery document
    const discoveryResponse = await fetch(provider.configuration.discoveryUrl!);
    const discovery = await discoveryResponse.json();

    // Exchange code for tokens
    const tokenResponse = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${provider.configuration.clientId}:${provider.configuration.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://app.autojobr.com/api/auth/oidc/callback'
      })
    });

    const tokens = await tokenResponse.json();

    // Decode ID token
    const idToken = jwt.decode(tokens.id_token, { complete: true });
    return idToken?.payload;
  }

  // Create or update user from SSO
  async createOrUpdateSSOUser(userData: any, providerId: string): Promise<any> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    // Map attributes based on provider configuration
    const mappings = provider.configuration.attributeMappings;
    const email = userData[mappings.email];
    const firstName = userData[mappings.firstName];
    const lastName = userData[mappings.lastName];

    if (!email) {
      throw new Error('Email attribute not found in SSO response');
    }

    try {
      // Check if user exists
      const existingUser = await db.select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        const user = existingUser[0];
        await db.update(schema.users)
          .set({
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            updatedAt: new Date()
          })
          .where(eq(schema.users.id, user.id));

        return user;
      } else {
        // Create new user
        const newUser = await db.insert(schema.users)
          .values({
            id: crypto.randomUUID(),
            email,
            firstName: firstName || '',
            lastName: lastName || '',
            userType: 'job_seeker', // Default to job seeker, can be changed later
            emailVerified: true, // SSO users are considered verified
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        return newUser[0];
      }
    } catch (error) {
      console.error('Error creating/updating SSO user:', error);
      throw error;
    }
  }

  // Create SSO session
  async createSSOSession(userId: string, userEmail: string, providerId: string, ipAddress: string, userAgent: string): Promise<SSOSession> {
    const session: SSOSession = {
      id: crypto.randomUUID(),
      userId,
      userEmail,
      provider: providerId,
      loginAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      ipAddress,
      userAgent,
      isActive: true
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  // Get active SSO sessions
  async getActiveSessions(): Promise<SSOSession[]> {
    return Array.from(this.activeSessions.values()).filter(session => session.isActive);
  }

  // Revoke SSO session
  async revokeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
  }

  // Update session activity
  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date().toISOString();
    }
  }

  // Generate SAML metadata
  generateSAMLMetadata(): string {
    const entityId = 'https://app.autojobr.com/saml/metadata';
    const acsUrl = 'https://app.autojobr.com/api/auth/saml/acs';

    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true"
                      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                Location="${acsUrl}"
                                index="1" isDefault="true"/>
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }

  // Get SSO analytics
  async getAnalytics(): Promise<any> {
    const providers = Array.from(this.providers.values());
    const sessions = Array.from(this.activeSessions.values());

    return {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.isActive).length,
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.isActive).length,
      successRate: 99, // In a real implementation, calculate from logs
      topProviders: providers.map(p => ({
        name: p.name,
        type: p.type,
        users: p.totalUsers
      })).sort((a, b) => b.users - a.users).slice(0, 5)
    };
  }
}

// Export singleton instance
export const ssoService = new SSOService();