# 🧠 Claude Code Reviews

Automated AI-powered code reviews using Anthropic's Claude Sonnet 4.5.

## Quick Start

### Trigger a Review

Comment on any PR:
```
@claude review
```

### With Context

```
@claude review focus on security and accessibility
```

## What Claude Reviews

✅ **Code Quality** - Logic, patterns, best practices
✅ **Security** - Vulnerabilities, input validation, auth
✅ **Performance** - Bottlenecks, inefficiencies
✅ **Testing** - Coverage, edge cases
✅ **Accessibility** - WCAG compliance, ARIA
✅ **Maintainability** - Readability, documentation

## Severity Levels

🔴 **Critical** - Must fix before merge
🟠 **High** - Should fix before merge
🟡 **Medium** - Consider improving
🟢 **Low** - Minor/stylistic

## Setup Required

Repository maintainers must configure:

1. Add `ANTHROPIC_API_KEY` secret
2. (Optional) Set `CLAUDE_AUTO_REVIEW=true` for automatic reviews

See [CLAUDE-REVIEW-SETUP.md](../docs/CLAUDE-REVIEW-SETUP.md) for detailed setup instructions.

## Example Review

```markdown
## 📋 Review Summary
Strong implementation with good accessibility practices.
Minor security and performance improvements recommended.

## 🔍 Detailed Feedback

### src/components/Button.tsx:67
🟡 Medium - Consider memoizing variant styles to avoid
recreation on every render.

### src/components/Input.tsx:89
🔴 Critical - User input is not sanitized before rendering.
This could lead to XSS attacks.

Suggestion:
\`\`\`typescript
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
\`\`\`
```

## Need Help?

- 📖 [Full Setup Guide](../docs/CLAUDE-REVIEW-SETUP.md)
- 🐛 [Report Issues](https://github.com/Maximus-Technologies-Uganda/Training/issues)
- 💬 Ask in PR comments

---

**Note**: Claude reviews complement human reviews, not replace them.
Always have your code reviewed by team members as well.
