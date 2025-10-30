# AxioDB Built-in Web GUI

The AxioDB built-in web GUI provides a visual interface for managing your databases, collections, and documents. Perfect for development environments and Electron applications.

## Overview

This GUI is built with:
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast development and building
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons

## Features

- 📊 **Visual Database Browser**: Browse databases and collections
- 🔍 **Real-time Data Inspection**: View and inspect documents
- 📝 **Query Execution**: Execute queries with visual feedback
- 📈 **Performance Monitoring**: Monitor database performance
- 🎨 **Dark Mode Support**: Built-in dark/light theme
- 🚀 **Zero Configuration**: Works out of the box

## Enabling the GUI

### In Your Application

```javascript
const { AxioDB } = require('axiodb');

// Enable GUI when creating AxioDB instance
const db = new AxioDB(true);  // GUI available at localhost:27018

// With custom database path
const db = new AxioDB(true, "MyDB", "./custom/path");
```

The GUI will automatically start and be available at: `http://localhost:27018`

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm >= 6.0.0

### Setup

```bash
# Navigate to GUI directory
cd GUI

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:5173`

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
GUI/
├── src/
│   ├── Assets/         # Images and static assets
│   ├── components/     # React components
│   │   ├── content/    # Content components
│   │   ├── layout/     # Layout components
│   │   └── ui/         # UI components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API and service layer
│   ├── styles/         # Global styles
│   └── App.tsx         # Main application component
├── public/             # Public static assets
└── package.json        # Dependencies and scripts
```

## Configuration

### Vite Configuration

The GUI uses Vite for development and building. Configuration is in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
```

### TailwindCSS Configuration

Styling is configured in `tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class',
}
```

## Features in Detail

### Visual Database Browser

- Navigate through databases and collections
- View collection statistics
- Create and delete databases
- Manage collections

### Query Interface

- Execute complex queries
- Use MongoDB-style query operators
- View query results in formatted tables
- Export query results

### Performance Monitoring

- Real-time performance metrics
- Query execution times
- Cache hit rates
- Document counts

### Document Management

- View documents in formatted JSON
- Edit documents inline
- Delete documents
- Insert new documents

## Security Considerations

### Development Use Only

The GUI is designed for **development and local use**:

- ⚠️ **No Authentication**: The GUI has no built-in authentication
- ✅ **Localhost Binding**: Automatically binds to localhost only
- ✅ **Electron Safe**: Safe for embedded Electron applications

### Do NOT:

- ❌ Expose to public networks
- ❌ Use in production web servers
- ❌ Run on public IPs without authentication

### Safe For:

- ✅ Local development
- ✅ Electron applications
- ✅ Desktop applications (Tauri, etc.)
- ✅ CLI tools with local GUI

## Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Browser Support

The GUI supports modern browsers:

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Customization

### Theming

The GUI includes dark mode support. Theme can be toggled using the theme switcher in the UI.

### Styling

Customize styles by modifying:
- `src/index.css` - Global styles
- `tailwind.config.js` - Tailwind configuration

### Components

All components are in `src/components/`:
- Reusable UI components
- Layout components
- Content-specific components

## Troubleshooting

### GUI Not Starting

Check if port 27018 is available:

```bash
# Linux/macOS
lsof -i :27018

# Windows
netstat -ano | findstr :27018
```

### Development Server Issues

Clear cache and reinstall:

```bash
rm -rf node_modules .vite
npm install
npm run dev
```

### Build Issues

Ensure Node.js version is compatible:

```bash
node --version  # Should be >= 20.0.0
npm --version   # Should be >= 6.0.0
```

## Contributing

Contributions to the GUI are welcome! Please:

1. Follow the existing code style
2. Use TypeScript for type safety
3. Add comments for complex logic
4. Test changes across browsers
5. Update documentation

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

## License

The GUI is part of AxioDB and is licensed under the [MIT License](../LICENSE).

---

## Related Documentation

- **[Main Documentation](../README.md)**: AxioDB main documentation
- **[API Reference](https://axiodb.site/)**: Complete API reference
- **[Security Guidelines](../SECURITY.md)**: Security best practices
- **[Contributing Guide](../CONTRIBUTING.md)**: How to contribute

---

**Built with ❤️ for the AxioDB community**
