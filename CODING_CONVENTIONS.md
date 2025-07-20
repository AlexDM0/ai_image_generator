# Coding Conventions

This document outlines the coding conventions and patterns used throughout this AI Image Chat project to ensure consistency and maintainability.

## Table of Contents
- [General Principles](#general-principles)
- [TypeScript Conventions](#typescript-conventions)
- [File Structure](#file-structure)
- [Naming Conventions](#naming-conventions)
- [Logging Standards](#logging-standards)
- [Error Handling](#error-handling)
- [API Design](#api-design)
- [Frontend Conventions](#frontend-conventions)
- [Documentation](#documentation)

## General Principles

### Code Organization
- **Separation of Concerns**: Each module should have a single, well-defined responsibility
- **Modularity**: Extract reusable functionality into utility modules
- **Dependency Injection**: Pass dependencies through constructors rather than creating them internally
- **Interface Segregation**: Define clear interfaces for data structures and service contracts

### Code Quality
- **Explicit over Implicit**: Be explicit about types, parameters, and return values
- **Fail Fast**: Validate inputs early and throw meaningful errors
- **Comprehensive Logging**: Log all significant operations with structured data
- **Error Context**: Provide detailed error information for debugging

## TypeScript Conventions

### Type Definitions
```typescript
// ✅ Good: Explicit interface definitions
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
  localImageUrl?: string;
  filename?: string;
  responseId?: string;
}

// ✅ Good: Union types for constrained values
type MessageRole = 'user' | 'assistant';

// ✅ Good: Optional properties with ?
interface OptionalConfig {
  timeout?: number;
  retries?: number;
}
```

### Constants
```typescript
// ✅ Good: Constants at module level
const AI_MODEL = 'gpt-4.1-mini';

// ✅ Good: Grouped constants in objects
const CONFIG = {
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  IMAGE_QUALITY: 'low'
} as const;
```

### Function Signatures
```typescript
// ✅ Good: Explicit parameter and return types
async processMessage(
  sessionId: string, 
  userMessage: string, 
  requestId: string = 'unknown'
): Promise<{
  session: ChatSession;
  response: ChatMessage;
}> {
  // implementation
}
```

## File Structure

### Directory Organization
```
src/
├── routes/          # HTTP route handlers
├── services/        # Business logic services
├── utils/           # Utility functions and helpers
└── server.ts        # Main server entry point

public/              # Static frontend files
├── index.html
├── styles.css
└── chat.js
```

### File Naming
- **PascalCase** for class files: `ChatService.ts`, `ImageRoutes.ts`
- **camelCase** for utility files: `fileUtils.ts`, `imageUtils.ts`
- **kebab-case** for frontend files: `chat.js`, `styles.css`

### Import/Export Patterns
```typescript
// ✅ Good: Named exports for utilities
export const ImageUtil = {
  saveBase64Image: async () => { /* ... */ },
  processImageOutputs: async () => { /* ... */ }
};

// ✅ Good: Class exports
export class ChatService {
  // implementation
}

// ✅ Good: Interface exports
export interface ChatMessage {
  // definition
}
```

## Naming Conventions

### Variables and Functions
- **camelCase** for variables and functions: `requestId`, `generateSessionId()`
- **PascalCase** for classes and interfaces: `ChatService`, `ChatMessage`
- **SCREAMING_SNAKE_CASE** for constants: `AI_MODEL`, `DEFAULT_TIMEOUT`

### Request ID Pattern
- Format: `req_${timestamp}_${randomString}`
- Used consistently across all logging operations
- Generated once per request and passed through the call chain

### File and Directory Names
- **camelCase** for TypeScript files: `chatService.ts`, `imageUtils.ts`
- **PascalCase** for class-based files: `ChatRoutes.ts`, `ImageRoutes.ts`
- **lowercase** for utility directories: `utils/`, `services/`, `routes/`

## Logging Standards

### Log Format
```typescript
// ✅ Standard format: [requestId] emoji COMPONENT: message
console.log(`[${requestId}] 🚀 IMAGE GENERATION REQUEST STARTED`);
console.log(`[${requestId}] ⏰ Timestamp: ${new Date().toISOString()}`);
console.log(`[${requestId}] 📋 Request Body:`, structuredData);
```

### Emoji Usage
- 🚀 **Start operations**: Request/process start
- ✅ **Success**: Completed operations
- ❌ **Errors**: Failed operations
- 💬 **Chat**: Chat-related operations
- 🎨 **Images**: Image generation/processing
- 📁 **Files**: File operations
- 🔄 **Processing**: Ongoing operations
- 📊 **Data**: Data/response information
- ⏰ **Time**: Timestamps
- 🌐 **Network**: HTTP/API calls
- 💾 **Storage**: Disk/database operations
- 🏁 **Completion**: Final status

### Structured Logging
```typescript
// ✅ Good: Structured data objects
console.log(`[${requestId}] 📊 Response data:`, {
  sessionId: result.session.id,
  responseId: result.response.id,
  responseType: result.response.imageUrl ? 'image' : 'text',
  messageCount: result.session.messages.length
});

// ✅ Good: Performance timing
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
console.log(`[${requestId}] ⏱️  Operation duration: ${duration}ms`);
```

### Log Levels
- **console.log()** for normal operations and info
- **console.error()** for errors and failures
- **console.warn()** for warnings (not currently used but reserved)

## Error Handling

### Error Patterns
```typescript
// ✅ Good: Comprehensive error logging
catch (error) {
  const duration = Date.now() - startTime;
  console.error(`[${requestId}] 💥 ERROR OCCURRED:`, error);
  console.error(`[${requestId}] 📋 Error details:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    type: error instanceof Error ? error.constructor.name : typeof error
  });
  console.error(`[${requestId}] ⏱️  Request duration before error: ${duration}ms`);
  console.error(`[${requestId}] 🏁 REQUEST FINISHED WITH ERROR\n`);
  
  res.status(500).json({ error: 'Failed to process request' });
}
```

### Error Response Format
```typescript
// ✅ Standard error response
{
  error: "Human-readable error message"
}
```

### Validation Patterns
```typescript
// ✅ Good: Early validation with logging
if (!prompt) {
  console.log(`[${requestId}] ❌ VALIDATION FAILED: Missing prompt`);
  console.log(`[${requestId}] ⏱️  Request duration: ${Date.now() - startTime}ms`);
  res.status(400).json({ error: 'Prompt is required' });
  return;
}
```

## API Design

### Route Patterns
- **POST** for creating/processing: `/api/chat/message`, `/api/chat/session`
- **GET** for retrieving: `/api/chat/session/:sessionId`, `/api/chat/sessions`
- **RESTful URLs**: Use nouns for resources, verbs for actions

### Request/Response Format
```typescript
// ✅ Request format
{
  message: string;
  sessionId?: string;
}

// ✅ Response format
{
  session: ChatSession;
  response: ChatMessage;
}
```

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request (validation errors)
- **404**: Not Found
- **500**: Internal Server Error

## Frontend Conventions

### Class-Based Architecture
```javascript
// ✅ Good: Class-based frontend components
class ChatInterface {
  constructor() {
    this.sessionId = null;
    this.isLoading = false;
    this.initializeElements();
    this.attachEventListeners();
  }
}
```

### Event Handling
```javascript
// ✅ Good: Arrow functions for event handlers
this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
```

### DOM Manipulation
```javascript
// ✅ Good: Clear element creation and manipulation
const messageDiv = document.createElement('div');
messageDiv.className = `message ${role}`;

const contentDiv = document.createElement('div');
contentDiv.className = 'message-content';
```

### CSS Class Naming
- **kebab-case**: `.chat-container`, `.message-content`
- **BEM-like patterns**: `.message.user`, `.message.assistant`
- **State classes**: `.hidden`, `.loading`

## Documentation

### JSDoc Comments
```typescript
/**
 * Process chat message with OpenAI responses API for multi-turn image generation
 */
async processMessage(
  sessionId: string, 
  userMessage: string, 
  requestId: string = 'unknown'
): Promise<{
  session: ChatSession;
  response: ChatMessage;
}> {
  // implementation
}
```

### Inline Comments
```typescript
// Add user message to session
this.addMessage(session.id, 'user', userMessage);

// Update session with new response ID for multi-turn capability
session.lastResponseId = response.id;
session.updatedAt = new Date().toISOString();
```

### README Structure
- Clear project description
- Setup instructions
- API documentation
- Usage examples

## OpenAI API Patterns

### Responses API Usage
```typescript
// ✅ Good: Consistent parameter structure
const response = await this.openai.responses.create({
  model: AI_MODEL,
  previous_response_id: session.lastResponseId,
  input: userMessage,
  tools: [{
    type: "image_generation",
    quality: "low",
    output_format: "png",
    moderation: "low",
    size: "1024x1024",
  }]
});
```

### Multi-turn Conversation Pattern
```typescript
// ✅ Good: Track response IDs for continuity
session.lastResponseId = response.id;

// ✅ Good: Use previous_response_id for follow-ups
if (session.lastResponseId) {
  requestParams.previous_response_id = session.lastResponseId;
}
```

## Utility Patterns

### Utility Object Structure
```typescript
// ✅ Good: Utility objects with focused methods
export const ImageUtil = {
  async saveBase64Image(): Promise<ImageSaveResult> { /* ... */ },
  async processImageOutputs(): Promise<ImageSaveResult | null> { /* ... */ },
  validateBase64Image(): boolean { /* ... */ },
  getImageFileInfo(): FileInfo { /* ... */ }
};
```

### ID Generation
```typescript
// ✅ Standard ID format
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

## Performance Considerations

### Timing Measurements
```typescript
// ✅ Always measure operation duration
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
console.log(`[${requestId}] ⏱️  Operation completed in ${duration}ms`);
```

### Resource Management
```typescript
// ✅ Good: Proper async/await usage
const fs = await import('fs');
fs.writeFileSync(filePath, Buffer.from(imageBase64, 'base64'));
```

## Security Considerations

### Input Validation
- Always validate required parameters
- Sanitize user inputs
- Use TypeScript types for compile-time safety

### API Key Management
- Use environment variables for sensitive data
- Never hardcode API keys
- Validate API key presence at startup

---

## Enforcement

These conventions should be followed for all new code and when modifying existing code. When in doubt, follow the patterns established in the existing codebase, particularly in:

- `src/services/chatService.ts` - Service layer patterns
- `src/routes/chatRoutes.ts` - API route patterns  
- `src/utils/imageUtils.ts` - Utility function patterns
- `public/chat.js` - Frontend patterns

Regular review of this document ensures it stays current with the evolving codebase.
