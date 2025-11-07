# User Service

User profile management service.

## Structure

This service follows the same Clean Architecture pattern as auth-service:
- `src/core` - Entities and use cases
- `src/application` - Controllers
- `src/infrastructure` - Database, external services
- `src/ports` - Interfaces and DTOs
- `src/routes` - Express routes

## Local Development

Run mock server for other services:
```bash
npm run mock:server
```

## Events

Consumes:
- `user.created` - From auth-service

Publishes:
- `user.profile.updated` - When user profile is updated

