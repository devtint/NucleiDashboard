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

*   Go 1.21+
*   Node.js 18+

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/devtint/NucleiDashboard.git
    cd NucleiDashboard
    ```

2.  Start the Backend:
    ```bash
    cd backend
    go mod tidy
    go run main.go nuclei_wrapper.go
    ```

3.  Start the Frontend:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000).

## License

MIT
