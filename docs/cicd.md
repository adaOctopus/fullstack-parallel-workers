# CI/CD Pipeline Guide

## Overview

The CI/CD pipeline is configured using GitHub Actions and runs on every push and pull request.

## Pipeline Stages

### 1. Lint and Type Check
- Runs ESLint on all code
- Performs TypeScript type checking
- Ensures code quality standards

### 2. Test
- Runs all unit tests
- Tests frontend components
- Tests backend services
- Tests LLM cost tracking

### 3. Build
- Builds all apps (web, api, worker)
- Verifies production builds succeed
- Only runs if lint and tests pass

### 4. Deploy (Main Branch Only)
- Deploys to production
- Only runs on `main` branch
- Requires all previous stages to pass

## Setup Instructions

### 1. GitHub Secrets

Add these secrets in your GitHub repository settings:

- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection URL
- `OPENAI_API_KEY`: OpenAI API key
- Add deployment secrets as needed (e.g., Vercel token, AWS credentials)

### 2. Workflow File

The workflow is located at `.github/workflows/ci.yml`.

### 3. Customize Deployment

Edit the `deploy` job in `.github/workflows/ci.yml`:

```yaml
deploy:
  name: Deploy
  runs-on: ubuntu-latest
  needs: [build]
  if: github.ref == 'refs/heads/main'
  steps:
    # Add your deployment steps here
    # Example: Vercel, AWS, Docker, etc.
```

### 4. Example Deployments

**Vercel (Frontend)**:
```yaml
- uses: amondnet/vercel-action@v20
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID }}
    vercel-project-id: ${{ secrets.PROJECT_ID }}
```

**Docker**:
```yaml
- name: Build and push Docker images
  uses: docker/build-push-action@v4
  with:
    push: true
    tags: your-registry/app:latest
```

## Monitoring

- View pipeline status in GitHub Actions tab
- Check logs for failed stages
- Set up notifications for failures

## Best Practices

1. **Fast Feedback**: Keep tests fast (< 5 minutes)
2. **Parallel Jobs**: Run independent jobs in parallel
3. **Caching**: Use npm cache for faster installs
4. **Secrets**: Never commit secrets, use GitHub Secrets
5. **Rollback**: Plan for quick rollbacks if deployment fails
