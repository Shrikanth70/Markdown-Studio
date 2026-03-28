# Markdown Studio - Precision A4 Pagination Engine

**Markdown Studio** is a high-fidelity Markdown previewer and PDF export engine designed specifically for professionals who require strict **A4 document precision** (Print-Ready Standards).

Unlike standard Markdown viewers, this engine uses a custom **Atomic Pagination System** that intelligently decomposes complex elements (like tables and lists) to maximize page-fill while maintaining mathematically perfect margins.

---

## 📐 The "Fortress" Margin Engine

Markdown Studio is built on the **v3.4.1 Precision Engine**, featuring:

- **Strict Symmetrical Margins**: Mathematically locked 2.54cm (1 inch) buffers on all four sides of every page.
- **Symmetrical Scaling**: A real-time 1:1 preview that matches the final PDF export with pixel-perfect accuracy.
- **Zero-Bleed Containment**: Global `word-break` and `pre-wrap` enforcement ensures that no character or symbol can physically violate the professional margin zones.

## 🚀 Key Features

### 1. Atomic Element Splitting
Large, indivisible blocks (like long tables or bulleted lists) are automatically decomposed into atomic units. This allows the engine to fill the bottom of Page 1 and continue seamlessly on Page 2, eliminating the "early-break" whitespace common in other PDF generators.

### 2. Precise Top-Alignment
Using margin-collapse logic, every page starts exactly at the 1-inch mark. Headings and paragraphs hit the top margin line flush, ensuring a consistent vertical rhythm throughout the document.

### 3. Smart Heading Glue (60px)
Built-in intelligence prevents "orphaned" headers. If a heading would sit alone at the bottom of a page without enough content to follow, the engine automatically moves it to the next page to maintain document readability.

### 4. Professional Typography
- **Primary Font**: Inter (Premium sans-serif)
- **Code Engine**: JetBrains Mono with automatic wrapping
- **Layout**: Optimized for 96 DPI A4 Standard (794px x 1123px)

---

## 🛠️ Technological Stack

- **Core**: React + Vite
- **Styling**: TailwindCSS + Vanilla CSS (Atomic Architecture)
- **Logic**: Custom Recursive Pagination Algorithm
- **Rendering**: React-Markdown + Remark-GFM + Rehype-Highlight

## 📥 Getting Started

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Shrikanth70/Markdown-Studio.git
    cd Markdown-Studio
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

---

*Built with precision by Antigravity for Markdown Studio.*
