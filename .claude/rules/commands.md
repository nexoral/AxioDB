# Commands

## Build & Test
```bash
npm run build              # TypeScript → lib/ (MANDATORY after changes)
npm test                   # All tests (separate processes due to singleton)
npm test crud              # Only CRUD tests
npm test transaction       # Only transaction tests
npm test read              # Only read optimization tests
npm run lint               # ESLint
npx tsc --noEmit          # Type check without emit
```

## Development
```bash
# Run specific test directly
node Test/modules/crud.test.js

# Manual AxioDB instance
node -e "const {AxioDB} = require('./lib/config/DB.js'); new AxioDB({ GUI: true });"  # GUI on 27018
node -e "const {AxioDB} = require('./lib/config/DB.js'); new AxioDB({ GUI: false, RootName: 'MyDB', CustomPath: '.', TCP: true });"  # TCP on 27019

# Documentation site
cd Document && npm run dev   # localhost:5173
cd Document && npm run build
```

## Docker
```bash
docker build -t axiodb:latest .
docker run -d --name axiodb-server -p 27018:27018 -p 27019:27019 -v axiodb-data:/app axiodb:latest
docker logs axiodb-server
docker exec -it axiodb-server sh
```

## Important Notes
- **Always build first** before testing changes
- **Tests run sequentially** (cannot parallel - singleton)
- **Ports**: 27018 (HTTP GUI), 27019 (TCP)
- **TypeScript strict mode** - all code must pass
