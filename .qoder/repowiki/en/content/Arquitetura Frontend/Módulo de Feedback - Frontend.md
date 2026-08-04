# Feedback Module - Frontend

<cite>
**Referenced Files in This Document**
- [FeedbackButton.tsx](file://src/components/feedback/FeedbackButton.tsx)
- [FeedbackModal.tsx](file://src/components/feedback/FeedbackModal.tsx)
- [FeedbacksPage.tsx](file://src/pages/feedbacks/FeedbacksPage.tsx)
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)
- [SettingsPage.tsx](file://src/pages/settings/SettingsPage.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [api.ts](file://src/services/api.ts)
- [feedback.json](file://src/i18n/locales/pt/feedback.json)
- [index.ts](file://src/i18n/index.ts)
</cite>

## Update Summary
**Changes Made**
- Added MyFeedbacksSection component integration in settings page
- Enhanced feedback modal with screenshot viewer functionality
- Improved table formatting and user interface elements
- Corrected translation namespace usage for proper i18n support
- Updated component architecture to support new settings integration

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [New Features and Enhancements](#new-features-and-enhancements)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This document describes the frontend implementation of the Feedback module in Windlog, a web-based management system for wind energy technicians. The feedback feature allows users to submit and manage feedback entries through a React UI that communicates with a NestJS backend via REST API. The frontend uses TanStack Query for data fetching and caching, i18n for internationalization, and Tailwind CSS for styling. Recent updates have enhanced the module with improved settings integration, screenshot viewing capabilities, and better internationalization support.

## Project Structure
The feedback-related frontend code is organized into four main areas:
- UI components: reusable elements for user interactions (button and modal)
- Page components: dedicated pages for listing and managing feedback
- Settings integration: MyFeedbacksSection component for settings page integration
- Service layer: HTTP client abstraction for API calls

```mermaid
graph TB
subgraph "Feedback UI"
FB_Button["FeedbackButton.tsx"]
FB_Modal["FeedbackModal.tsx"]
FB_Page["FeedbacksPage.tsx"]
MF_Sections["MyFeedbacksSection.tsx"]
end
subgraph "Settings Integration"
SP_Page["SettingsPage.tsx"]
MF_Sections --> SP_Page
end
subgraph "Service Layer"
FB_Service["feedback.service.ts"]
API_Client["api.ts"]
end
subgraph "i18n"
FB_Locales["feedback.json"]
I18N_Index["index.ts"]
end
FB_Button --> FB_Modal
FB_Page --> FB_Service
FB_Modal --> FB_Service
MF_Sections --> FB_Service
FB_Service --> API_Client
FB_Button --> FB_Locales
FB_Modal --> FB_Locales
FB_Page --> FB_Locales
MF_Sections --> FB_Locales
FB_Locales --> I18N_Index
```

**Diagram sources**
- [FeedbackButton.tsx](file://src/components/feedback/FeedbackButton.tsx)
- [FeedbackModal.tsx](file://src/components/feedback/FeedbackModal.tsx)
- [FeedbacksPage.tsx](file://src/pages/feedbacks/FeedbacksPage.tsx)
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)
- [SettingsPage.tsx](file://src/pages/settings/SettingsPage.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [api.ts](file://src/services/api.ts)
- [feedback.json](file://src/i18n/locales/pt/feedback.json)
- [index.ts](file://src/i18n/index.ts)

**Section sources**
- [FeedbackButton.tsx](file://src/components/feedback/FeedbackButton.tsx)
- [FeedbackModal.tsx](file://src/components/feedback/FeedbackModal.tsx)
- [FeedbacksPage.tsx](file://src/pages/feedbacks/FeedbacksPage.tsx)
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)
- [SettingsPage.tsx](file://src/pages/settings/SettingsPage.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [api.ts](file://src/services/api.ts)
- [feedback.json](file://src/i18n/locales/pt/feedback.json)
- [index.ts](file://src/i18n/index.ts)

## Core Components
- FeedbackButton: A small trigger component that opens the feedback modal. It should be accessible from key areas of the application where quick feedback submission is desired.
- FeedbackModal: A modal form that collects feedback details, validates input, and submits it to the backend via the service layer. It handles loading states, success, and error messages. **Enhanced** with screenshot viewer functionality for better visual feedback submission.
- FeedbacksPage: The dedicated page that lists existing feedback entries, supports filtering/searching, and provides actions such as viewing details or deleting entries. **Improved** table formatting and user experience.
- MyFeedbacksSection: **New** component integrated into the settings page that displays user's personal feedback entries with quick access to create new feedback.

Key responsibilities:
- User interaction handling (open/close modal, form submission)
- Data fetching and mutation using TanStack Query
- Internationalized labels and messages with corrected namespace usage
- Error handling and user feedback
- Screenshot capture and viewing capabilities
- Settings page integration for personalized feedback management

**Section sources**
- [FeedbackButton.tsx](file://src/components/feedback/FeedbackButton.tsx)
- [FeedbackModal.tsx](file://src/components/feedback/FeedbackModal.tsx)
- [FeedbacksPage.tsx](file://src/pages/feedbacks/FeedbacksPage.tsx)
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)

## Architecture Overview
The frontend architecture follows a layered approach with enhanced settings integration:
- UI Layer: React components handle presentation and user interactions
- Service Layer: Encapsulates API calls and request/response transformations
- Data Layer: TanStack Query manages caching, background updates, and mutations
- i18n Layer: Centralized translations for all user-facing text with proper namespace usage
- Settings Integration: Dedicated section component for seamless settings page embedding

```mermaid
sequenceDiagram
participant U as "User"
participant B as "FeedbackButton.tsx"
participant M as "FeedbackModal.tsx"
participant MS as "MyFeedbacksSection.tsx"
participant S as "feedback.service.ts"
participant A as "api.ts"
participant BE as "Backend API"
U->>B : Click "Submit Feedback"
B->>M : Open Modal
U->>MS : View Personal Feedbacks
MS->>S : getFeedbacks(filters)
U->>M : Fill Form and Submit
M->>S : createFeedback(data)
S->>A : POST /feedbacks
A->>BE : HTTP Request
BE-->>A : Response {data, message, statusCode}
A-->>S : Normalized Response
S-->>M : Success/Error
S-->>MS : Success/Error
M-->>U : Show success/error state
MS-->>U : Display updated feedback list
Note over M,S : Invalidate related queries on success
```

**Diagram sources**
- [FeedbackButton.tsx](file://src/components/feedback/FeedbackButton.tsx)
- [FeedbackModal.tsx](file://src/components/feedback/FeedbackModal.tsx)
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [api.ts](file://src/services/api.ts)

## Detailed Component Analysis

### FeedbackButton
Purpose:
- Provides a consistent entry point to open the feedback modal
- Displays localized label and optional tooltip
- Integrates with global layout or floating action patterns

Behavior:
- On click, sets modal visibility state in parent or triggers modal open event
- Supports keyboard accessibility and focus management

Integration points:
- Uses i18n keys for button text
- May accept props for positioning and styling

**Section sources**
- [FeedbackButton.tsx](file://src/components/feedback/FeedbackButton.tsx)
- [feedback.json](file://src/i18n/locales/pt/feedback.json)

### FeedbackModal
Purpose:
- Collects feedback content and metadata
- Validates inputs before submission
- Submits feedback via service layer and updates UI state

Data flow:
- Local state holds form values and validation errors
- On submit, calls service method to create feedback
- On success, closes modal and invalidates query cache
- On error, displays user-friendly message

Validation:
- Required fields, length limits, and format checks
- Real-time validation feedback

Accessibility:
- Focus trap within modal
- Escape key to close
- Screen reader announcements for status changes

**Enhanced Features:**
- Screenshot viewer integration for visual feedback attachment
- Improved file upload handling with preview capabilities
- Better error handling for media files

**Section sources**
- [FeedbackModal.tsx](file://src/components/feedback/FeedbackModal.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [feedback.json](file://src/i18n/locales/pt/feedback.json)

### FeedbacksPage
Purpose:
- Lists all feedback entries with pagination and filters
- Allows viewing details and performing destructive actions (e.g., delete)
- Provides search functionality and sorting options

Features:
- Fetches feedback list using TanStack Query
- Handles loading skeletons and error states
- Renders table or card grid depending on screen size
- Integrates with i18n for column headers and actions

State management:
- Query keys include filters and pagination parameters
- Mutations invalidate relevant queries after successful operations

**Improvements:**
- Enhanced table formatting with better responsive design
- Improved loading states and error handling
- Better mobile responsiveness

**Section sources**
- [FeedbacksPage.tsx](file://src/pages/feedbacks/FeedbacksPage.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)

### MyFeedbacksSection
Purpose:
- **New** component that integrates feedback functionality directly into the settings page
- Displays user's personal feedback entries with quick access to create new feedback
- Provides contextual feedback management within user settings context

Features:
- Fetches user-specific feedback entries
- Displays feedback history with status indicators
- Quick action buttons for creating new feedback
- Seamless integration with settings page layout

Integration:
- Embedded within SettingsPage component
- Uses same service layer and i18n configuration
- Maintains consistent styling and behavior with rest of settings

**Section sources**
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)
- [SettingsPage.tsx](file://src/pages/settings/SettingsPage.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)

### Service Layer
Purpose:
- Encapsulates all API calls related to feedback
- Normalizes responses and handles authentication headers
- Exposes typed methods for CRUD operations

Methods:
- getFeedbacks(filters): fetches paginated feedback list
- getFeedback(id): retrieves single feedback by ID
- createFeedback(data): creates new feedback entry
- updateFeedback(id, data): updates existing feedback
- deleteFeedback(id): deletes feedback entry

Error handling:
- Translates HTTP errors to user-friendly messages
- Logs errors for debugging while preserving privacy

**Updated:**
- Enhanced error handling for screenshot uploads
- Improved response normalization for better type safety
- Better integration with settings page data requirements

**Section sources**
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [api.ts](file://src/services/api.ts)

## New Features and Enhancements

### MyFeedbacksSection Integration
The new MyFeedbacksSection component provides seamless integration of feedback functionality within the settings page, allowing users to view and manage their personal feedback entries without navigating away from their settings.

```mermaid
graph LR
SP["SettingsPage.tsx"] --> MF["MyFeedbacksSection.tsx"]
MF --> FS["feedback.service.ts"]
MF --> IL["i18n locales"]
FS --> API["api.ts"]
API --> BE["Backend API"]
```

**Diagram sources**
- [SettingsPage.tsx](file://src/pages/settings/SettingsPage.tsx)
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [api.ts](file://src/services/api.ts)

### Enhanced Feedback Modal
The FeedbackModal has been significantly enhanced with screenshot viewing capabilities, allowing users to attach and preview screenshots when submitting feedback.

### Improved Table Formatting
The FeedbacksPage now features improved table formatting with better responsive design, enhanced loading states, and improved mobile responsiveness.

### Corrected i18n Namespace Usage
Translation namespace usage has been corrected to ensure proper internationalization support across all feedback-related components.

**Section sources**
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)
- [FeedbackModal.tsx](file://src/components/feedback/FeedbackModal.tsx)
- [FeedbacksPage.tsx](file://src/pages/feedbacks/FeedbacksPage.tsx)
- [feedback.json](file://src/i18n/locales/pt/feedback.json)

## Dependency Analysis
The feedback module maintains clear separation of concerns with minimal coupling between components, enhanced by the new settings integration:

```mermaid
graph LR
FB_Button["FeedbackButton.tsx"] --> FB_Locales["feedback.json"]
FB_Modal["FeedbackModal.tsx"] --> FB_Service["feedback.service.ts"]
FB_Modal --> FB_Locales
FB_Page["FeedbacksPage.tsx"] --> FB_Service
FB_Page --> FB_Locales
MF_Sections["MyFeedbacksSection.tsx"] --> FB_Service
MF_Sections --> FB_Locales
FB_Service --> API_Client["api.ts"]
API_Client --> Backend["REST API"]
```

**Diagram sources**
- [FeedbackButton.tsx](file://src/components/feedback/FeedbackButton.tsx)
- [FeedbackModal.tsx](file://src/components/feedback/FeedbackModal.tsx)
- [FeedbacksPage.tsx](file://src/pages/feedbacks/FeedbacksPage.tsx)
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [api.ts](file://src/services/api.ts)
- [feedback.json](file://src/i18n/locales/pt/feedback.json)

**Section sources**
- [FeedbackButton.tsx](file://src/components/feedback/FeedbackButton.tsx)
- [FeedbackModal.tsx](file://src/components/feedback/FeedbackModal.tsx)
- [FeedbacksPage.tsx](file://src/pages/feedbacks/FeedbacksPage.tsx)
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [api.ts](file://src/services/api.ts)
- [feedback.json](file://src/i18n/locales/pt/feedback.json)

## Performance Considerations
- Use TanStack Query's built-in caching to avoid unnecessary re-fetches
- Implement optimistic updates for better perceived performance
- Debounce search inputs to reduce API calls
- Lazy load modal content when possible
- Use virtual scrolling for large feedback lists
- Optimize images and attachments if supported
- Monitor bundle size impact of additional dependencies
- **New**: Efficient screenshot handling with lazy loading for previews
- **New**: Optimized settings page integration to minimize re-renders

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and solutions:

Authentication problems:
- Ensure JWT token is properly attached to requests
- Check token expiration and refresh logic
- Verify CORS settings if testing locally

API communication errors:
- Inspect network tab for request/response details
- Validate endpoint URLs and HTTP methods
- Check backend error responses and status codes

Form validation issues:
- Review validation rules and error messages
- Test edge cases like empty strings and special characters
- Ensure proper field types and formats

Internationalization problems:
- Verify translation keys exist in feedback.json
- Check i18n configuration and language switching
- Ensure fallback behavior for missing translations
- **New**: Verify correct namespace usage in settings integration

Cache inconsistencies:
- Clear query cache when needed during development
- Invalidate queries after mutations
- Debug stale-while-revalidate behavior

Screenshot-related issues:
- Check file size limits and supported formats
- Verify browser compatibility for screenshot APIs
- Test image compression and optimization

Settings integration problems:
- Ensure proper prop passing between SettingsPage and MyFeedbacksSection
- Verify data synchronization between settings and feedback sections
- Check for proper cleanup of event listeners and subscriptions

**Section sources**
- [feedback.service.ts](file://src/services/feedback.service.ts)
- [api.ts](file://src/services/api.ts)
- [feedback.json](file://src/i18n/locales/pt/feedback.json)
- [MyFeedbacksSection.tsx](file://src/pages/settings/components/MyFeedbacksSection.tsx)

## Conclusion
The Feedback module frontend provides a clean, accessible, and maintainable interface for submitting and managing feedback. The modular architecture with clear separation between UI, services, and data layers ensures scalability and ease of maintenance. Recent enhancements including the new MyFeedbacksSection component, improved screenshot viewing capabilities, better table formatting, and corrected i18n namespace usage have significantly improved the user experience and developer workflow. Following the established patterns and guidelines will help maintain consistency across the application while providing a smooth user experience.

[No sources needed since this section summarizes without analyzing specific files]