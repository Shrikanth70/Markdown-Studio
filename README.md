#  Markdown Studio - Professional A4 Precision Engine

**Markdown Studio** is a premium, high-fidelity Markdown editor designed for document-perfect precision. Built for professionals who require strict **A4 document standards**, it bridges the gap between raw markdown and print-ready PDF output with a focus on minimalist aesthetics and mathematical accuracy.


---

## 🚀 Key Features

###  The "Fortress" Pagination Engine (v3.4.1+)
Markdown Studio uses a custom **Atomic Pagination System** that intelligently decomposes complex elements (like tables and lists) to maximize page-fill while maintaining mathematically perfect margins.

- **Strict 2.54cm (1-Inch) Margins**: Guaranteed symmetrical buffers on all four sides of every page.
- **Atomic Element Splitting**: Indivisible blocks (tables/lists) are decomposed into atomic units, preventing awkward whitespace at page breaks.
- **Smart Heading Glue**: Automatically moves "orphaned" headers to the next page to maintain document readability.
- **Zero-Bleed Containment**: Global `word-break` and `pre-wrap` enforcement ensures content never violates professional margin zones.

### 🍱 Premium Minimalist UI
- **Cinematic 16:9 Workspace**: A focused, distraction-free editing environment.
- **Docs Mode**: Integrated documentation and high-quality sample uploads.
- **Real-Time 1:1 Preview**: What you see in the editor is exactly what you get in the PDF export.
- **Mobile Optimized**: A fluid, tabbed interface for editing on the go (v3.6+).

### 🛠️ Export & Sharing
- **High-Fidelity PDF Export**: One-click generation using a dedicated headless capture buffer.
- **Clickable PDF Links**: Full support for internal and external hyperlinking in exported documents.
- **Deep Syntax Highlighting**: Professional-grade code block rendering for developers.

---

## 💻 Tech Stack

- **Core Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Ultra-fast development and optimized builds)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Vanilla CSS (Atomic Design System)
- **Icons**: [Lucide React](https://lucide.dev/) (Clean, consistent iconography)
- **Markdown Logic**: 
  - `react-markdown`: Core rendering engine
  - `remark-gfm`: GitHub Flavored Markdown support
  - `rehype-highlight`: Lowlight-powered syntax highlighting
- **Export Engine**: Custom Headless DOM Capture (Print-Ready)

---

## 📥 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Shrikanth70/Markdown-Studio.git
cd md-viewer
npm install
```

### 2. Development
Launch the development server:
```bash
npm run dev
```

### 3. Production Build
Create an optimized production bundle:
```bash
npm run build
```

---

## 📂 Project Structure

```text
├── src/
│   ├── components/       # UI Components (Editor, Preview, Navbar, Actions)
│   ├── utils/            # Pagination logic and PDF Export Engine
│   ├── App.jsx           # Main Application State & Layout
│   └── index.css         # Global A4 Workspace Styles
├── public/               # Static assets (Favicon, etc.)
└── index.html            # Entry point
```

---

## 🤝 Contributing
Contributions are welcome! Feel free to open issues or submit pull requests to improve the pagination engine or UI.

**Developed with precision by [Shrikanth](https://github.com/Shrikanth70).** *(Using Antigravity + Chatgpt)*



## Recent Updates
- Improved mobile responsive UI toolbar.
- Cleaned up formatting logic (removed buggy native color picker).
- Improved cursor accuracy mapping.
- Added native page break and new line macros.
