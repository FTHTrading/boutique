# Contributing to Coffee Advisory OS

Thank you for your interest in contributing to the Coffee Advisory OS project. This document outlines the standards and processes for contributing to this institutional-grade distribution intelligence platform.

---

## 🎯 Contribution Philosophy

We maintain enterprise-grade code quality while enabling rapid innovation. All contributions must:

1. **Maintain Type Safety** – Full TypeScript strict mode compliance
2. **Preserve System Integrity** – Agent orchestration patterns must remain consistent
3. **Enhance Intelligence** – RAG and ML improvements are prioritized
4. **Document Thoroughly** – All features require documentation updates
5. **Test Comprehensively** – Unit + integration tests for critical paths

---

## 🏗 Development Environment Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 15+ with pgvector extension
- Git 2.40+
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/FTHTrading/boutique.git
cd boutique

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure your local environment variables
# POSTGRES_URL, OPENAI_API_KEY, CLERK keys required

# Initialize database
npm run db:push

# Optional: Load sample data
npm run db:seed

# Start development servers
npm run dev        # Frontend on :3000
npm run mcp:start  # Agent server on :3001

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🌿 Branch Naming Conventions

Use semantic branch names that clearly indicate purpose:

| Type | Pattern | Example |
|:-----|:--------|:--------|
| Feature | `feature/<description>` | `feature/stripe-integration` |
| Bug Fix | `fix/<issue-description>` | `fix/credit-score-calculation` |
| Agent Enhancement | `agent/<agent-name>` | `agent/proposal-rag-improvement` |
| Documentation | `docs/<topic>` | `docs/api-reference` |
| Infrastructure | `infra/<component>` | `infra/vercel-deployment` |
| Hotfix | `hotfix/<critical-issue>` | `hotfix/security-patch` |

---

## 📝 Commit Message Standards

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes
- `agent`: Agent system modifications
- `rag`: RAG/embedding changes

### Examples

```bash
# Feature addition
git commit -m "feat(proposal): add dynamic margin calculation based on volume commitments"

# Bug fix
git commit -m "fix(credit): correct payment history weight in scoring algorithm"

# Agent enhancement
git commit -m "agent(outreach): improve email personalization with client history context"

# Documentation
git commit -m "docs(architecture): add mermaid diagrams for agent interaction flow"
```

---

## 🔄 Pull Request Process

### 1. Before Creating a PR

- [ ] Code compiles without errors (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Types are correct (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation updated (if applicable)
- [ ] New tests added for new functionality
- [ ] PR linked to relevant issue (if applicable)

### 2. PR Template

```markdown
## Description
Brief summary of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to break)
- [ ] Documentation update
- [ ] Agent enhancement
- [ ] RAG/intelligence improvement

## Changes Made
- Bullet point list of specific changes

## Testing
- How was this tested?
- What edge cases were considered?

## Screenshots (if applicable)
Visual proof for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### 3. Review Process

1. **Automated Checks** – CI/CD pipeline runs tests, linting, type checking
2. **Code Review** – Minimum 1 approval required from maintainers
3. **Agent Testing** – For agent changes, verify MCP orchestration integrity
4. **RAG Validation** – For RAG changes, test embedding quality and retrieval accuracy
5. **Merge** – Squash and merge to main branch

---

## 🏛 Code Style Guidelines

### TypeScript

```typescript
// ✅ GOOD: Explicit types, clear naming
interface ProposalParams {
  clientId: string;
  volumeTier: 'low' | 'mid' | 'high';
  roastProfile: string;
  paymentTerms: PaymentTerms;
}

export async function generateProposal(
  params: ProposalParams
): Promise<ProposalResult> {
  // Implementation
}

// ❌ BAD: Implicit any, unclear naming
async function gen(data) {
  // Implementation
}
```

### Agent Architecture

```typescript
// ✅ GOOD: Consistent agent pattern
export class ProposalAgent {
  constructor(private db: Database, private ragService: RAGService) {}

  async generateProposal(params: ProposalParams): Promise<Proposal> {
    // 1. Validate inputs
    // 2. Retrieve RAG context
    // 3. Execute business logic
    // 4. Log action
    // 5. Return result
  }
}

// ❌ BAD: Inconsistent pattern, no logging
function makeProposal(stuff) {
  // Direct implementation without structure
}
```

### Database Queries

```typescript
// ✅ GOOD: Parameterized queries, type-safe
const client = await db.query<Client>(
  `SELECT * FROM clients WHERE id = $1`,
  [clientId]
);

// ❌ BAD: String concatenation (SQL injection risk)
const client = await db.query(
  `SELECT * FROM clients WHERE id = '${clientId}'`
);
```

---

## 🧪 Testing Standards

### Test Structure

```typescript
describe('CreditAgent', () => {
  describe('scoreClient', () => {
    it('should return high score for excellent credit profile', async () => {
      // Arrange
      const client = createMockClient({
        yearsInBusiness: 10,
        monthlyRevenue: 50000,
        dnbScore: 85,
        tradeReferences: 5,
        latePayments: false
      });

      // Act
      const score = await creditAgent.scoreClient(client.id);

      // Assert
      expect(score).toBeGreaterThanOrEqual(80);
      expect(score.paymentTerms).toBe('net-30');
    });

    it('should flag high-risk clients for prepay', async () => {
      // Test implementation
    });
  });
});
```

### Coverage Requirements

- **Agent Logic**: 90%+ coverage
- **Credit Scoring**: 100% coverage (critical financial logic)
- **RAG System**: 85%+ coverage
- **API Routes**: 80%+ coverage
- **Utilities**: 75%+ coverage

---

## 📚 Documentation Standards

### Code Comments

```typescript
/**
 * Generates a custom coffee proposal using RAG-enhanced context.
 *
 * This function:
 * 1. Retrieves client credit score
 * 2. Searches vector database for similar historical proposals
 * 3. Generates personalized messaging with GPT-4
 * 4. Calculates volume-based pricing with credit discounts
 * 5. Creates proposal record and indexes for future RAG retrieval
 *
 * @param params - Proposal generation parameters
 * @returns Complete proposal with PDF URL, pricing, and metadata
 * @throws {ValidationError} If client credit score below minimum threshold
 * @throws {RAGError} If vector search fails
 *
 * @example
 * ```typescript
 * const proposal = await generateProposal({
 *   clientId: 'shop-123',
 *   volumeTier: 'mid',
 *   roastProfile: 'medium',
 *   paymentTerms: 'net-30'
 * });
 * ```
 */
export async function generateProposal(
  params: ProposalParams
): Promise<Proposal> {
  // Implementation
}
```

### README Updates

For new features, update:
- Table of Contents (if new major section)
- Core Modules section
- Agent descriptions (if agent changes)
- Roadmap (move from future to current)
- Tech Stack (if new dependencies)

---

## 🤖 Agent Development Guidelines

### Adding a New Agent

1. **Create agent file**: `/agents/<name>.agent.ts`
2. **Implement consistent interface**:
   ```typescript
   export class NewAgent {
     constructor(dependencies) {}
     
     async primaryAction(params): Promise<Result> {
       // Validate
       // Retrieve context
       // Execute logic
       // Log action
       // Return result
     }
   }
   ```
3. **Register with MCP server**: Add tool definition in `mcp-server.ts`
4. **Add tests**: `/tests/agents/<name>.agent.test.ts`
5. **Document**: Update `docs/architecture.md` and README

### Agent Logging Requirements

All agents must log:
- User/system initiating action
- Input parameters
- RAG sources retrieved (if applicable)
- Decision logic applied
- Output generated
- Execution time
- Success/failure status

```typescript
await db.query(`
  INSERT INTO agent_logs (agent_name, action, input, output, context, timestamp)
  VALUES ($1, $2, $3, $4, $5, NOW())
`, [agentName, action, input, output, context]);
```

---

## 🧠 RAG System Contributions

### Embedding Quality

When modifying RAG functionality:
- Test with diverse query types
- Validate cosine similarity thresholds (default: 0.7)
- Ensure chunk size optimization (max 1500 chars)
- Verify metadata preservation

### Vector Search Performance

- Index strategy for large datasets
- Query optimization for sub-100ms response
- Batch embedding for efficiency
- Cache frequently accessed vectors

---

## 🚀 Deployment Contributions

### CI/CD Pipeline

Located in `.github/workflows/`:
- `ci.yml` – Test, lint, type-check on PR
- `deploy.yml` – Automated Vercel deployment on merge to main
- `security.yml` – Dependency scanning

### Infrastructure as Code

For infrastructure changes:
- Update `DEPLOYMENT.md` with new instructions
- Document environment variable changes in `.env.example`
- Update Vercel/AWS configuration guides

---

## 🔐 Security Contributions

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email: security@unykorn.org

Include:
- Vulnerability description
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

### Security Best Practices

- Never commit secrets or API keys
- Use parameterized SQL queries
- Validate all user inputs
- Sanitize data before RAG indexing
- Follow OWASP Top 10 guidelines

---

## 📞 Communication Channels

- **GitHub Issues** – Bug reports, feature requests
- **GitHub Discussions** – General questions, ideas
- **Pull Requests** – Code contributions
- **Email** – security@unykorn.org (security only)

---

## 🏆 Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Acknowledged in release notes
- Invited to project discussions

Significant contributions may lead to maintainer status.

---

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment.

### Expected Behavior

- Use welcoming and inclusive language
- Respect differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

Violations may result in temporary or permanent ban from the project.

---

## ❓ Questions?

If you have questions about contributing:
1. Check existing documentation
2. Search closed issues
3. Open a GitHub Discussion
4. Reach out to maintainers

---

**Thank you for contributing to Coffee Advisory OS!**

Together, we're building the future of AI-native distribution intelligence.

☕🚀
