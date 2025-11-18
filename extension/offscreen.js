/**
 * Offscreen Document for Heavy Background Processing
 * Handles AI processing, resume optimization, and data-intensive operations
 * without blocking the main UI or content scripts
 */

console.log('[AutoJobr Offscreen] Document loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[AutoJobr Offscreen] Received message:', message.type);

  switch (message.type) {
    case 'OPTIMIZE_RESUME':
      handleResumeOptimization(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GENERATE_COVER_LETTER':
      handleCoverLetterGeneration(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'ANALYZE_JOB_MATCH':
      handleJobMatchAnalysis(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'EXTRACT_JOB_DATA':
      handleJobDataExtraction(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'BATCH_PROCESS_APPLICATIONS':
      handleBatchProcessing(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

async function handleResumeOptimization(data) {
  console.log('[AutoJobr Offscreen] Optimizing resume for job:', data.jobTitle);
  
  const response = await fetch(`${data.apiUrl}/api/ai/optimize-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText: data.resumeText,
      jobDescription: data.jobDescription,
      jobTitle: data.jobTitle
    })
  });

  if (!response.ok) {
    throw new Error(`Resume optimization failed: ${response.status}`);
  }

  return await response.json();
}

async function handleCoverLetterGeneration(data) {
  console.log('[AutoJobr Offscreen] Generating cover letter');
  
  const response = await fetch(`${data.apiUrl}/api/ai/generate-cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDescription: data.jobDescription,
      jobTitle: data.jobTitle,
      company: data.company,
      resumeText: data.resumeText,
      tone: data.tone || 'professional'
    })
  });

  if (!response.ok) {
    throw new Error(`Cover letter generation failed: ${response.status}`);
  }

  return await response.json();
}

async function handleJobMatchAnalysis(data) {
  console.log('[AutoJobr Offscreen] Analyzing job match');
  
  const response = await fetch(`${data.apiUrl}/api/ai/analyze-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText: data.resumeText,
      jobDescription: data.jobDescription,
      jobTitle: data.jobTitle
    })
  });

  if (!response.ok) {
    throw new Error(`Job match analysis failed: ${response.status}`);
  }

  return await response.json();
}

async function handleJobDataExtraction(data) {
  console.log('[AutoJobr Offscreen] Extracting job data from DOM');
  
  const jobData = {
    title: data.title || extractTextContent(data.titleSelectors),
    company: data.company || extractTextContent(data.companySelectors),
    location: data.location || extractTextContent(data.locationSelectors),
    description: data.description || extractTextContent(data.descriptionSelectors),
    salary: data.salary || extractTextContent(data.salarySelectors),
    requirements: data.requirements || extractListItems(data.requirementsSelectors),
    benefits: data.benefits || extractListItems(data.benefitsSelectors),
    extractedAt: new Date().toISOString()
  };

  return jobData;
}

async function handleBatchProcessing(data) {
  console.log('[AutoJobr Offscreen] Batch processing applications:', data.jobs.length);
  
  const results = [];
  
  for (const job of data.jobs) {
    try {
      const result = await processJobApplication({
        job: job,
        resumeText: data.resumeText,
        apiUrl: data.apiUrl
      });
      results.push({ success: true, job: job, result: result });
    } catch (error) {
      results.push({ success: false, job: job, error: error.message });
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return {
    total: data.jobs.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results
  };
}

async function processJobApplication(data) {
  const coverLetter = await handleCoverLetterGeneration({
    jobDescription: data.job.description,
    jobTitle: data.job.title,
    company: data.job.company,
    resumeText: data.resumeText,
    apiUrl: data.apiUrl
  });

  return {
    jobId: data.job.id,
    coverLetter: coverLetter.coverLetter,
    optimizedResume: data.resumeText,
    appliedAt: new Date().toISOString()
  };
}

function extractTextContent(selectors) {
  if (!selectors || selectors.length === 0) return '';
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }
  return '';
}

function extractListItems(selectors) {
  if (!selectors || selectors.length === 0) return [];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      return Array.from(elements).map(el => el.textContent.trim());
    }
  }
  return [];
}

console.log('[AutoJobr Offscreen] Ready for processing');
