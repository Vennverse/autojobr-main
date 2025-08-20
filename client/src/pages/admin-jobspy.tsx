import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, PlayCircle, Settings, Database } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface JobSpyResult {
  success: boolean;
  scraped_count?: number;
  saved_count?: number;
  search_terms?: string[];
  locations?: string[];
  job_sites?: string[];
  error?: string;
  timestamp: string;
}

interface JobSpyConfig {
  search_terms?: string[];
  locations?: string[];
  job_sites?: string[];
  results_wanted?: number;
  country?: string;
}

export default function AdminJobSpyPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [customConfig, setCustomConfig] = useState<JobSpyConfig>({
    search_terms: ['software engineer'],
    locations: ['San Francisco, CA'],
    job_sites: ['indeed'],
    results_wanted: 10,
    country: 'USA'
  });
  
  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Test JobSpy installation
  const { data: testResult, isLoading: testLoading, refetch: testJobSpy } = useQuery({
    queryKey: ['/api/jobspy/test'],
    enabled: false // Only run when manually triggered
  });

  // Get JobSpy configuration options
  const { data: configOptions } = useQuery({
    queryKey: ['/api/jobspy/config']
  });

  // Scraping mutations
  const customScrapeMutation = useMutation({
    mutationFn: async (config: JobSpyConfig) => {
      const response = await fetch('/api/jobspy/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error('Scraping failed');
      return response.json() as Promise<JobSpyResult>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Scraping Completed",
          description: `Found ${data.scraped_count} jobs, saved ${data.saved_count} new jobs.`
        });
      } else {
        toast({
          title: "Scraping Failed",
          description: data.error,
          variant: "destructive"
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/scraped-jobs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Scraping Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const techScrapeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/jobspy/scrape-tech', { method: 'POST' });
      if (!response.ok) throw new Error('Tech scraping failed');
      return response.json() as Promise<JobSpyResult>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Tech Jobs Scraped",
          description: `Found ${data.scraped_count} jobs, saved ${data.saved_count} new jobs.`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/scraped-jobs'] });
    }
  });

  const remoteScrapeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/jobspy/scrape-remote', { method: 'POST' });
      if (!response.ok) throw new Error('Remote scraping failed');
      return response.json() as Promise<JobSpyResult>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Remote Jobs Scraped",
          description: `Found ${data.scraped_count} jobs, saved ${data.saved_count} new jobs.`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/scraped-jobs'] });
    }
  });

  const roleScrapeMutation = useMutation({
    mutationFn: async ({ role, location }: { role: string; location?: string }) => {
      const response = await fetch('/api/jobspy/scrape-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, location })
      });
      if (!response.ok) throw new Error('Role scraping failed');
      return response.json() as Promise<JobSpyResult>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Role-specific Jobs Scraped",
          description: `Found ${data.scraped_count} jobs, saved ${data.saved_count} new jobs.`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/scraped-jobs'] });
    }
  });

  const handleCustomScrape = () => {
    customScrapeMutation.mutate(customConfig);
  };

  const handleRoleScrape = () => {
    if (!roleInput.trim()) {
      toast({
        title: "Role Required",
        description: "Please enter a job role to search for.",
        variant: "destructive"
      });
      return;
    }
    roleScrapeMutation.mutate({ 
      role: roleInput.trim(), 
      location: locationInput.trim() || undefined 
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">JobSpy Integration</h1>
          <p className="text-muted-foreground">Scrape jobs from multiple job boards using JobSpy</p>
        </div>
      </div>

      <Tabs defaultValue="quick" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quick">Quick Actions</TabsTrigger>
          <TabsTrigger value="custom">Custom Scraping</TabsTrigger>
          <TabsTrigger value="test">Test & Setup</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Quick Actions Tab */}
        <TabsContent value="quick" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Tech Jobs
                </CardTitle>
                <CardDescription>
                  Scrape popular tech roles from major job boards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => techScrapeMutation.mutate()}
                  disabled={techScrapeMutation.isPending}
                  className="w-full"
                >
                  {techScrapeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Scrape Tech Jobs
                </Button>
                {techScrapeMutation.data && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      {techScrapeMutation.data.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">
                        {techScrapeMutation.data.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    {techScrapeMutation.data.success && (
                      <p>Scraped: {techScrapeMutation.data.scraped_count}, Saved: {techScrapeMutation.data.saved_count}</p>
                    )}
                    {techScrapeMutation.data.error && (
                      <p className="text-red-600">{techScrapeMutation.data.error}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Remote Jobs
                </CardTitle>
                <CardDescription>
                  Find remote opportunities across different fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => remoteScrapeMutation.mutate()}
                  disabled={remoteScrapeMutation.isPending}
                  className="w-full"
                >
                  {remoteScrapeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Scrape Remote Jobs
                </Button>
                {remoteScrapeMutation.data && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      {remoteScrapeMutation.data.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">
                        {remoteScrapeMutation.data.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    {remoteScrapeMutation.data.success && (
                      <p>Scraped: {remoteScrapeMutation.data.scraped_count}, Saved: {remoteScrapeMutation.data.saved_count}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Search by Role
                </CardTitle>
                <CardDescription>
                  Scrape jobs for a specific role and location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Job Role *</Label>
                    <Input
                      id="role"
                      placeholder="e.g., Product Manager"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location (optional)</Label>
                    <Input
                      id="location"
                      placeholder="e.g., New York, NY or Remote"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleRoleScrape}
                  disabled={roleScrapeMutation.isPending || !roleInput.trim()}
                  className="w-full"
                >
                  {roleScrapeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Scrape Jobs for Role
                </Button>
                {roleScrapeMutation.data && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      {roleScrapeMutation.data.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">
                        {roleScrapeMutation.data.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    {roleScrapeMutation.data.success && (
                      <p>Scraped: {roleScrapeMutation.data.scraped_count}, Saved: {roleScrapeMutation.data.saved_count}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Custom Scraping Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom JobSpy Configuration</CardTitle>
              <CardDescription>
                Configure advanced scraping parameters for specific needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Search Terms</Label>
                  <Textarea
                    placeholder="One search term per line&#10;software engineer&#10;data scientist&#10;product manager"
                    value={customConfig.search_terms?.join('\n') || ''}
                    onChange={(e) => setCustomConfig({
                      ...customConfig,
                      search_terms: e.target.value.split('\n').filter(term => term.trim())
                    })}
                    rows={5}
                  />
                </div>
                <div>
                  <Label>Locations</Label>
                  <Textarea
                    placeholder="One location per line&#10;New York, NY&#10;San Francisco, CA&#10;Remote"
                    value={customConfig.locations?.join('\n') || ''}
                    onChange={(e) => setCustomConfig({
                      ...customConfig,
                      locations: e.target.value.split('\n').filter(loc => loc.trim())
                    })}
                    rows={5}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Job Sites</Label>
                  <Select
                    value={customConfig.job_sites?.[0] || 'indeed'}
                    onValueChange={(value) => setCustomConfig({
                      ...customConfig,
                      job_sites: [value]
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indeed">Indeed</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="zip_recruiter">ZipRecruiter</SelectItem>
                      <SelectItem value="glassdoor">Glassdoor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Results per Search</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={customConfig.results_wanted || 10}
                    onChange={(e) => setCustomConfig({
                      ...customConfig,
                      results_wanted: parseInt(e.target.value) || 10
                    })}
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Select
                    value={customConfig.country || 'USA'}
                    onValueChange={(value) => setCustomConfig({
                      ...customConfig,
                      country: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="UK">UK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleCustomScrape}
                disabled={customScrapeMutation.isPending}
                className="w-full"
                size="lg"
              >
                {customScrapeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Custom Scraping
              </Button>

              {customScrapeMutation.data && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {customScrapeMutation.data.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {customScrapeMutation.data.success ? 'Scraping Completed' : 'Scraping Failed'}
                    </span>
                  </div>
                  {customScrapeMutation.data.success ? (
                    <div className="space-y-1 text-sm">
                      <p>Jobs Found: {customScrapeMutation.data.scraped_count}</p>
                      <p>Jobs Saved: {customScrapeMutation.data.saved_count}</p>
                      <p>Search Terms: {customScrapeMutation.data.search_terms?.join(', ')}</p>
                      <p>Locations: {customScrapeMutation.data.locations?.join(', ')}</p>
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm">{customScrapeMutation.data.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test & Setup Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                JobSpy Installation Test
              </CardTitle>
              <CardDescription>
                Verify that JobSpy is properly installed and configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => testJobSpy()}
                disabled={testLoading}
                variant="outline"
                className="w-full"
              >
                {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test JobSpy Installation
              </Button>

              {testResult && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {testResult.success ? 'JobSpy is Working' : 'JobSpy Test Failed'}
                    </span>
                  </div>
                  <p className="text-sm">{testResult.message}</p>
                </div>
              )}

              <div className="space-y-3 text-sm text-muted-foreground">
                <h4 className="font-medium text-foreground">What this test checks:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Python environment and JobSpy package installation</li>
                  <li>Database connectivity and permissions</li>
                  <li>Basic job scraping functionality</li>
                  <li>Data saving to your database</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>JobSpy Configuration Options</CardTitle>
              <CardDescription>
                Available job sites, search terms, and other configuration options
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configOptions ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Available Job Sites</h4>
                    <div className="flex flex-wrap gap-2">
                      {configOptions.available_job_sites?.map((site: string) => (
                        <Badge key={site} variant="secondary">{site}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Common Locations</h4>
                    <div className="flex flex-wrap gap-2">
                      {configOptions.common_locations?.map((location: string) => (
                        <Badge key={location} variant="outline">{location}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Search Terms by Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(configOptions.search_terms_by_category || {}).map(([category, terms]) => (
                        <div key={category} className="space-y-2">
                          <h5 className="font-medium text-sm">{category}</h5>
                          <div className="flex flex-wrap gap-1">
                            {(terms as string[]).map((term: string) => (
                              <Badge key={term} variant="outline" className="text-xs">{term}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium mb-1">Supported Countries</h4>
                      <div className="flex gap-2">
                        {configOptions.countries?.map((country: string) => (
                          <Badge key={country} variant="secondary">{country}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Max Results per Search</h4>
                      <Badge variant="outline">{configOptions.max_results_per_search}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading configuration...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}