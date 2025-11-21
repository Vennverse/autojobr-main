# Chrome Web Store - Privacy Practices Tab Justifications

## Required Permission Justifications

### 1. **Alarms Permission**
**Justification for Chrome Web Store Privacy Practices Tab:**

The `alarms` permission is used to schedule and manage essential background tasks that enhance user productivity and maintain application performance:

- **Daily Resume Checks**: Reminds users to review and update their resume on a daily schedule
- **Application Reminders**: Sends periodic reminders to users about job applications they need to follow up on
- **Cache Cleanup**: Automatically cleans up cached data at regular intervals to maintain optimal extension performance
- **User Data Synchronization**: Periodically syncs user profile data with the AutoJobr server to ensure information stays current

These alarms are only created and managed by the extension's background service worker and help deliver core features of the application without constant user interaction.

---

### 2. **Cookies Permission**
**Justification for Chrome Web Store Privacy Practices Tab:**

The `cookies` permission is used exclusively for authentication and session management purposes:

- **Authentication Monitoring**: Tracks changes to authentication cookies to detect when users log in or out of their AutoJobr account
- **Session Management**: Retrieves and validates session cookies to maintain secure user sessions across extension features
- **Cross-Domain Cookie Access**: Accesses cookies from the autojobr.com domain only to verify authentication status and maintain user sessions
- **Login State Synchronization**: Ensures the extension remains aware of the user's authentication status to provide appropriate feature access

The extension does **NOT** access, store, or transmit cookies from any third-party job board websites (LinkedIn, Indeed, Greenhouse, etc.). Cookies are only used for our own authentication system.

---

### 3. **Offscreen Document Permission**
**Justification for Chrome Web Store Privacy Practices Tab:**

The `offscreen` permission is used to perform CPU-intensive document processing tasks that require a document context:

- **PDF Resume Processing**: Processes and analyzes PDF resumes to extract job-relevant information without blocking the extension's main interface
- **Document Optimization**: Performs AI-powered resume optimization and analysis in a dedicated offscreen context
- **Heavy Computation Handling**: Executes complex document transformations and data extraction that cannot be performed in the background service worker context
- **Performance Optimization**: Isolates heavy processing tasks to prevent delays in the main extension UI and popup interface

All document processing is performed locally on the user's machine. No documents are transmitted or stored remotely during this process.

---

## Summary

These three permissions are essential to AutoJobr's core functionality:
- **Alarms** enable smart reminders and background maintenance
- **Cookies** enable secure user authentication and session management  
- **Offscreen** enables powerful document processing features

None of these permissions are used for tracking, data collection, or any purposes beyond what is described above.
