# Contributing to Satellite Tracker

Thank you for your interest in contributing to Satellite Tracker! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, constructive, and collaborative. We aim to maintain a welcoming environment for all contributors.

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check if the issue has already been reported
2. Verify you're using the latest version
3. Test with a clean installation

When submitting a bug report, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, .NET version)
- Browser console errors (for frontend issues)

### Suggesting Features

Feature requests are welcome! Please:
1. Check if the feature has already been requested
2. Provide a clear use case
3. Explain how it benefits users
4. Consider implementation complexity

### Pull Requests

#### Before You Start
1. Fork the repository
2. Create a new branch from `main`
3. Ensure your development environment is set up correctly

#### Making Changes
1. Follow the existing code style
2. Write clear, descriptive commit messages
3. Test your changes thoroughly
4. Update documentation as needed

#### Submitting a Pull Request
1. Push your changes to your fork
2. Create a pull request to the `main` branch
3. Provide a clear description of changes
4. Reference any related issues
5. Ensure all checks pass

### Development Setup

#### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

#### Backend Development
```bash
cd backend/TLE
dotnet restore
dotnet run
```

## Code Style Guidelines

### Frontend (JavaScript/React)
- Use functional components with hooks
- Follow React best practices
- Use meaningful variable names
- Add comments for complex logic
- Keep components focused and single-purpose

### Backend (C#)
- Follow standard C# naming conventions
- Use async/await for I/O operations
- Handle errors appropriately
- Add XML documentation for public APIs

## Testing

Before submitting:
- Test frontend functionality in multiple browsers
- Verify backend API endpoints work correctly
- Test with both Space-Track and CelesTrak data sources
- Ensure the application works without credentials (public fallback)

## Documentation

When adding features:
- Update the README.md if user-facing
- Add inline code comments for complex logic
- Update API documentation for endpoint changes
- Include examples where helpful

## Areas for Contribution

Here are some areas where contributions would be particularly valuable:

### Features
- Search/filter satellites by name or properties
- Time controls (speed up/slow down simulation)
- Ground station visibility calculations
- Multiple satellite tracking at once
- Historical orbit playback
- Satellite pass predictions
- Customizable satellite colors/icons
- Additional satellite datasets

### Improvements
- Performance optimization for large satellite sets
- Mobile responsive design
- Keyboard shortcuts
- Unit tests and integration tests
- Error handling improvements
- Caching strategies for TLE data
- Docker containerization
- CI/CD pipeline

### Documentation
- Video tutorials
- Architecture diagrams
- API documentation
- Deployment guides
- Troubleshooting guides

## Questions?

Feel free to open an issue for:
- Questions about the codebase
- Clarification on contribution guidelines
- Discussion of potential changes

## Recognition

Contributors will be acknowledged in the project documentation. Significant contributions may be highlighted in release notes.

Thank you for contributing to Satellite Tracker!
