# Universal Response Structure

This directory contains utilities for standardized API responses across all services.

## Response Structure

All API responses follow this consistent structure:

### Success Response
```typescript
{
  success: true,
  message: string,
  data?: T,           // Optional payload
  timestamp: string    // ISO 8601 format
}
```

### Error Response
```typescript
{
  success: false,
  message: string,
  error?: string,      // Optional detailed error (dev mode)
  timestamp: string
}
```

## Usage

### Import the utilities
```typescript
import {
  sendSuccess,
  sendCreated,
  sendBadRequest,
  sendUnauthorized,
  sendNotFound,
  sendError,
} from '../utils/response.util';
```

### Success Responses

```typescript
// Generic success (200)
sendSuccess(res, 200, 'Operation successful', { userId: '123' });

// Created resource (201)
sendCreated(res, 'User created successfully', { user: userData });

// Success without data
sendSuccess(res, 200, 'Password changed successfully');
```

### Error Responses

```typescript
// Bad Request (400)
sendBadRequest(res, 'Invalid input', 'Email is required');

// Unauthorized (401)
sendUnauthorized(res, 'Authentication required');

// Not Found (404)
sendNotFound(res, 'User not found');

// Generic error with custom status
sendError(res, 422, 'Validation failed', 'Email format is invalid');
```

## Available Helpers

- `sendSuccess(res, statusCode, message, data?)` - Generic success response
- `sendCreated(res, message, data?)` - 201 Created response
- `sendNoContent(res)` - 204 No Content response
- `sendBadRequest(res, message, error?)` - 400 Bad Request
- `sendUnauthorized(res, message?, error?)` - 401 Unauthorized
- `sendForbidden(res, message?, error?)` - 403 Forbidden
- `sendNotFound(res, message?, error?)` - 404 Not Found
- `sendConflict(res, message, error?)` - 409 Conflict
- `sendValidationError(res, message, errors?)` - 422 Validation Error
- `sendInternalError(res, message?, error?)` - 500 Internal Server Error
- `sendError(res, statusCode, message, error?)` - Generic error response

## Example Controller Implementation

```typescript
import { Request, Response } from 'express';
import { sendSuccess, sendCreated, sendBadRequest } from '../utils/response.util';

export class UserController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.create(req.body);
      sendCreated(res, 'User created successfully', { user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      sendBadRequest(res, message);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.findById(req.params.id);
      sendSuccess(res, 200, 'User retrieved successfully', { user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'User not found';
      sendNotFound(res, message);
    }
  }
}
```

## Benefits

1. **Consistency**: All services return the same response structure
2. **Type Safety**: TypeScript generics ensure type-safe responses
3. **Maintainability**: Centralized response logic
4. **Developer Experience**: Clear, predictable API responses
5. **Client Integration**: Frontend clients can reliably parse responses

## Notes

- The `timestamp` field is automatically added to all responses
- The `error` field in error responses is only included when provided (useful for dev mode)
- The `data` field is optional and only included when provided
- All helpers set appropriate HTTP status codes

