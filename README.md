# DeepMynd - Advanced AI Chat Interface

[![Unimynd](https://img.shields.io/badge/Website-unimynd.me-blue)](https://www.unimynd.me)

DeepMynd is an advanced, locally-run AI chat interface built using React, Vite, and TypeScript. It allows users to interact with various Large Language Models (LLMs), including potentially running models directly in the browser using technologies like WebAssembly (Wllama) and MLC. Key features include customizable AI personas, support for different model backends, document interaction capabilities, and a modern, responsive user interface.

Welcome to DeepMynd, a sophisticated AI chat application designed to provide a flexible and powerful interface for interacting with various large language models (LLMs). Built with modern web technologies, DeepMynd offers features like persona customization, local and remote model support, and rich chat interactions.

Visit our website: [www.unimynd.me](https://www.unimynd.me)

## ✨ Features

*   **Modern UI:** Built with React, TypeScript, Vite, and Tailwind CSS for a responsive and clean user experience.
*   **Flexible Model Integration:** Supports interaction with different AI models, potentially including local models (via WebAssembly/MLC) and external services (like Hugging Face).
*   **Persona Management:** Create, customize, and manage different AI personas to tailor interactions.
*   **Rich Chat Experience:** Supports text and potentially image-based interactions within the chat interface.
*   **Document Interaction:** Includes capabilities for viewing documents (e.g., PDF Viewer).
*   **State Management:** Organized state management for UI and data.
*   **Background Processing:** Utilizes web workers for tasks like AI model inference, image processing, and translation.
*   **Vector Database:** Likely uses VoyDB for efficient similarity search or knowledge retrieval.
*   **Authentication:** User authentication flow.
*   **Onboarding:** Includes an onboarding tour for new users.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS
*   **State Management:** (Likely Zustand or similar, based on store structure)
*   **Vector Database:** VoyDB
*   **AI Inference:** WebAssembly (Wllama), MLC (Machine Learning Compilation)

## 🚀 Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   Yarn (Classic or Berry, check `.yarnrc.yml`)

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repository-url>
    cd DeepMynd
    ```
2.  Install dependencies:
    ```bash
    yarn install
    ```

### Running the Development Server

1.  Start the Vite development server:
    ```bash
    yarn dev
    ```
2.  Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

### Building for Production

```bash
yarn build
```

## ⚙️ Configuration

The application might require environment variables for configuration (e.g., API keys, backend endpoints). Check for a `.env.example` file or documentation regarding necessary environment variables. Create a `.env` file in the root directory based on the requirements.

## 📁 Project Structure

The project follows a standard structure for React applications:

*   `public/`: Static assets and web workers.
*   `src/`: Source code.
    *   `components/`: Reusable React components, organized by feature (auth, chat, models, persona, etc.).
    *   `controllers/`: Application logic, API interactions, and worker management.
    *   `db/`: Database related code (e.g., VoyDB setup).
    *   `pipelines/`: Specific AI task pipelines (text generation, image generation, TTS).
    *   `stores/`: State management stores.
    *   `App.tsx`: Main application component.
    *   `main.tsx`: Application entry point.
*   `eslint.config.js`: ESLint configuration.
*   `tailwind.config.js`: Tailwind CSS configuration.
*   `vite.config.ts`: Vite configuration.
*   `tsconfig.json`: TypeScript configuration.

## 🤝 Contributing

Contributions are welcome! Please follow standard Git workflow practices (fork, branch, pull request). Ensure your code adheres to the project's linting rules.

## 📄 License

(Specify your license here, e.g., MIT License)

---

*This README was generated based on the project structure.*
