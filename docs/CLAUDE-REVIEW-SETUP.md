# Claude PR Review Integration

This document explains how to set up and use Claude AI-powered code reviews in this repository.

## Overview

The Claude review integration provides automated, intelligent code reviews using Anthropic's Claude AI (Sonnet 4.5). It complements the existing Gemini review system by offering an alternative AI reviewer with different strengths.

## Features

- **Automatic Reviews**: Optionally trigger on every PR
- **Manual Trigger**: Comment `@claude review` on any PR
- **Comprehensive Analysis**: Code quality, security, performance, testing, accessibility
- **Severity Levels**: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low
- **Actionable Feedback**: Constructive suggestions with specific file:line references
- **Review Artifacts**: All reviews saved as GitHub artifacts for 30 days

## Setup Instructions

### 1. Prerequisites

- Repository with GitHub Actions enabled
- Anthropic API key (get one at https://console.anthropic.com/)

### 2. Configure Secrets

Add the following secret to your repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key

### 3. Configure Variables (Optional)

Add these repository variables for customization:

**Settings** → **Secrets and variables** → **Actions** → **Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_AUTO_REVIEW` | `false` | Set to `true` to auto-review all PRs |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Claude model to use |

### 4. Verify Setup

The workflows are located at:
- `.github/workflows/claude-dispatch.yml` - Triggers reviews
- `.github/workflows/claude-review.yml` - Performs reviews

## Usage

### Automatic Reviews

If `CLAUDE_AUTO_REVIEW=true`, Claude will automatically review:
- New pull requests
- PR updates (new commits)

### Manual Reviews

To trigger a review manually, comment on any PR:

```
@claude review
```

With additional context:

```
@claude review focus on security and performance
```

### Review Output

Claude will post a comment with:

1. **Summary**: High-level assessment of the PR
2. **General Feedback**: Overall observations and patterns
3. **Inline Comments**: Specific issues with file:line references
4. **Severity Indicators**: Visual markers for issue importance
5. **Actionable Suggestions**: Concrete code improvements

Example review structure:

```markdown
## 📋 Review Summary

This PR implements Phase 2 of the design system with well-structured
components following accessibility best practices.

## 🔍 Detailed Feedback

### Button.tsx:45
🟡 **Medium** - Consider extracting variant styles to a separate constant
for better maintainability.

### Input.tsx:78
🔴 **Critical** - Missing input sanitization could lead to XSS vulnerability.

Suggested fix:
\`\`\`typescript
const sanitizedValue = DOMPurify.sanitize(value);
\`\`\`
```

## Comparison: Claude vs Gemini

Both AI reviewers are available in this repository:

| Feature | Claude | Gemini |
|---------|--------|--------|
| **Trigger** | `@claude review` | `@gemini-cli /review` |
| **Model** | Claude Sonnet 4.5 | Gemini 2.0 |
| **Auto-review** | Optional | On by default |
| **MCP Integration** | No | Yes |
| **Inline Suggestions** | Via comments | Via MCP tools |
| **Best For** | Code quality, security | Integration tasks |

## Troubleshooting

### Review doesn't trigger

1. Check that `ANTHROPIC_API_KEY` is set correctly
2. Verify you have permissions (OWNER, MEMBER, or COLLABORATOR)
3. Ensure the PR is not from a fork (security restriction)
4. Check workflow runs in **Actions** tab

### Review fails

1. Check the workflow logs in **Actions** tab
2. Verify API key has sufficient credits
3. Check if the diff is too large (>100KB may timeout)

### Review quality issues

1. Add more context: `@claude review focus on [specific area]`
2. Try different models by setting `CLAUDE_MODEL` variable
3. Provide clearer PR descriptions and commit messages

## Advanced Configuration

### Custom Review Criteria

Edit `.github/workflows/claude-review.yml` to customize the review prompt:

```yaml
review_prompt = f"""You are an expert code reviewer...
[Customize criteria here]
"""
```

### Adjust Timeout

Modify the job timeout in `claude-review.yml`:

```yaml
jobs:
  review:
    timeout-minutes: 10  # Increase for large PRs
```

### Filter File Types

Add file filtering to review only specific files:

```bash
# In claude-review.yml, filter the diff
gh pr diff "$PR_NUMBER" -- '*.ts' '*.tsx' > /tmp/pr.diff
```

## Cost Considerations

- Each review uses Claude API tokens
- Approximate cost: $0.03-0.30 per PR (depending on size)
- Monitor usage in Anthropic Console
- Set `CLAUDE_AUTO_REVIEW=false` to review only when explicitly requested

## Security

- API keys are stored as encrypted secrets
- Workflow only runs on non-fork PRs (prevents malicious use)
- Requires authenticated user with repo permissions
- All external data is treated as untrusted

## Support

For issues or questions:

1. Check workflow logs in **Actions** tab
2. Review this documentation
3. Open an issue with `claude-review` label
4. Contact repository maintainers

## Example Workflow

1. **Developer** creates PR with Phase 2 design system changes
2. **Automatic** (if enabled) or **Manual** (`@claude review`) trigger
3. **Claude** analyzes:
   - Code quality and correctness
   - Security vulnerabilities
   - Performance issues
   - Testing coverage
   - Accessibility compliance
4. **Review Posted** as PR comment with severity markers
5. **Developer** addresses feedback
6. **Re-review** if needed: `@claude review` again

## Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Claude Models Overview](https://docs.anthropic.com/en/docs/models-overview)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [DEVELOPMENT_RULES.md](../DEVELOPMENT_RULES.md) - Project standards
