# Contributing to InsureRoute

Thank you for your interest in contributing to InsureRoute. This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Submit a pull request

## Development Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm 9 or higher

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r ../requirements.txt
uvicorn api:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```

## Code Standards

- **Python:** Follow PEP 8 conventions. Use type hints where practical.
- **JavaScript/React:** Use functional components with hooks.
- **Commits:** Write clear, descriptive commit messages.
- **Documentation:** Update relevant documentation when making changes.

## Reporting Issues

Open a GitHub Issue with:
- A clear title and description
- Steps to reproduce the problem
- Expected vs. actual behaviour
- Environment details (OS, Python version, Node version)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
