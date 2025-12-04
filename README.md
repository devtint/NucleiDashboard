# Nuclei Dashboard

A modern, real-time dashboard for [Nuclei](https://github.com/projectdiscovery/nuclei), the fast and customizable vulnerability scanner.

## Features

*   **Real-time Statistics**: View total vulnerabilities, active scans, and critical issues instantly.
*   **Live Scanning**: Start and stop scans directly from the UI.
*   **Smart Diffing**: Automatically tracks new, fixed, and regressed findings.
*   **Filtering**: Filter findings by severity (Critical, High, Medium, Low, Info).
*   **Management**: Mark findings as False Positive, Accepted Risk, or Fixed. Delete findings permanently.
*   **Dark Mode**: Sleek, hacker-friendly interface.

## Tech Stack

*   **Backend**: Go (Fiber), GORM, SQLite, Nuclei SDK
*   **Frontend**: Next.js, Tailwind CSS, Lucide Icons

## Getting Started

### Prerequisites

*   **Go**: Version 1.21 or higher. [Download Go](https://go.dev/dl/)
*   **Node.js**: Version 18 or higher. [Download Node.js](https://nodejs.org/)
*   **Nuclei**: Ensure `nuclei` is installed and in your PATH.
### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/devtint/NucleiDashboard.git
    cd NucleiDashboard
    ```

2.  **Start the Backend:**
    The backend handles scanning logic and database management.
    ```bash
    cd backend
    go mod tidy
    go run .
    ```
    *The backend will run on `http://127.0.0.1:3001`*

3.  **Start the Frontend:**
    Open a new terminal window for the frontend.
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    *The frontend will run on `http://localhost:3000`*

4.  **Access the Dashboard:**
    Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## Troubleshooting

### "Nuclei not found"
Ensure that `nuclei` is installed and available in your system's PATH. You can verify this by running `nuclei -version` in your terminal.

### Database Issues
If you encounter database errors, try deleting the `nuclei-dashboard.db` file in the `backend` directory and restarting the backend. It will be recreated automatically.

### Port Conflicts
- Ensure port `3001` is free for the backend.
- Ensure port `3000` is free for the frontend.

## License

MIT
