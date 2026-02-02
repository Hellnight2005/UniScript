# UniScript Frontend

The frontend for **UniScript**, built with **Next.js 15**, **Tailwind CSS**, and **Lingo.dev** for localization. It provides a modern, interactive dashboard for video content localization.

## 🚀 Key Features

-   **Dashboard UI**: Real-time visualization of system metrics (Processing Speed, Latency, Load).
-   **Video Pipeline**: Drag-and-drop interface for uploading video (`.mp4`, `.mkv`) or subtitle (`.srt`) files.
-   **Script Canvas**: Interactive viewer for transcribed scripts and translated subtitles.
-   **Localization**: Integrated language switcher supporting 13+ languages (ES, FR, DE, JA, HI, AR, etc.) via **Lingo.dev**.

## 🌍 How We Use Lingo.dev

We integrated **Lingo.dev** to automate our entire localization pipeline. Instead of manually translating files for every language, we utilize the Lingo CLI and AI engine.

### The Workflow
1.  **Source of Truth**: We maintain a single English source file at `i18n/en.json`.
2.  **Automated Translation**: When we run the pipeline, Lingo:
    -   Reads the latest keys from `en.json`.
    -   Uses AI to generate context-aware translations for 13+ languages (Spanish, French, Japanese, etc.).
    -   Updates the target JSON files in `i18n/` automatically.

## 🤖 CI/CD with GitHub Actions

To ensure translations are never out of sync, we implemented a **GitHub Action** (`.github/workflows/translate.yml`).

-   **Trigger**: The workflow runs on every push to the `main` branch.
-   **Action**: It executes `lingo run` to check for new content in the frontend.
-   **Result**: If new translations are generated, the Action automatically creates a **Pull Request** with the updates.

This ensures that developers only need to focus on the English source, and the specific translations are handled entirely by automation.

## 🛠️ Setup & Installation

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn

### Installation

1.  Navigate to the directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env` file in the `frontend` directory:
    ```env
    LINGODOTDEV_API_KEY=your_key_here
    NEXT_PUBLIC_API_URL=http://localhost:3001/api
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```
    Visit [http://localhost:3000](http://localhost:3000).

## 📂 Structure

-   `app/`: Next.js App Router (pages and layouts).
-   `components/`: Reusable UI components (`ProfessionalUpload`, `VideoLibrary`, etc.).
-   `i18n/`: Localization JSON files managed by Lingo.
-   `i18n.json`: Lingo project configuration.
-   `get-dictionary.ts`: Server-side dictionary loader for i18n.

## 🤝 Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server. |
| `npm run build` | Builds the application for production. |
| `npm run i18n` | Manually triggers the Lingo pipeline (`lingo run`). |
| `npm run i18n:status` | Checks the status of your Lingo project. |
