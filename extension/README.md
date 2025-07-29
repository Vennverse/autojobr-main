# AutoJobr Universal Extension

A comprehensive Chrome extension that works across all job sites to streamline the job application process.

## Features

### Universal Job Site Support
- Works on 50+ job boards including LinkedIn, Workday, Indeed, Glassdoor, Greenhouse, Lever, and more
- Automatically detects job pages across all supported platforms
- Enhanced support for Workday variations (myworkdayjobs.com domains)

### Smart Application Assistance
- **Auto-fill forms** with user confirmation using real profile data
- **Multi-step form navigation** with automatic step detection
- **Smart field mapping** for all common application fields
- **Unknown data prompts** when information is missing

### Application Tracking
- **Automatic submission detection** - tracks applications even without manual autofill
- **Real-time confirmation** with popup showing application was tracked
- **Direct link** to view all applications in AutoJobr dashboard
- **Multiple detection methods** - form submission, button clicks, URL changes

### Job Management
- **Save jobs** directly from any job page
- **Job analysis** with match scoring based on user profile
- **Real-time job data extraction** from all supported platforms

## Installation

1. Download the extension folder
2. Open Chrome -> More tools -> Extensions
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. Pin the AutoJobr extension to your toolbar

## Usage

### Automatic Features
- Extension automatically activates on job sites
- Shows floating widget with available actions
- Automatically tracks application submissions
- Displays confirmation popup when applications are detected

### Manual Controls
- Click extension icon for popup controls
- Use "Auto-Fill Form" for form completion with confirmation
- "Save Job" to bookmark interesting positions
- "Analyze Job" for match scoring
- Toggle settings for auto-fill, tracking, and notifications

### Multi-Step Forms
- Extension detects form steps automatically
- Popup shows navigation controls for multi-step applications
- Handles complex Workday and enterprise application flows

## Configuration

Extension automatically connects to:
`https://2c294fad-7817-4711-a460-7808eeccb047-00-3bi7bnnz6rhfb.picard.replit.dev`

## Files Structure

- `manifest.json` - Extension configuration
- `config.js` - API endpoints and field mappings
- `background.js` - Service worker for API communication
- `universal-content-script.js` - Main functionality across all sites
- `popup.html` - Extension popup interface
- `popup.js` - Popup controls and settings

## Supported Job Boards

LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, Workday (all variants), Greenhouse, Lever, Bamboo HR, SmartRecruiters, Jobvite, iCIMS, Taleo, SuccessFactors, AshbyHQ, Naukri, CareerBuilder, Dice, Stack Overflow, and many more.

## Privacy

- Only processes data when user is authenticated
- Requires user confirmation before auto-filling forms
- All data synced with AutoJobr platform account
- No data collected without explicit user action