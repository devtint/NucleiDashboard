## ⚛️ Nuclei Dashboard

A modern, real-time web interface for managing and visualizing findings from **Nuclei**, the fast and customizable vulnerability scanner.

---

### ✨ Key Features

* **Real-time Stats:** Instantly view total vulnerabilities, active scans, and critical issues.
* **Live Scanning:** Initiate and terminate Nuclei scans directly from the UI.
* **Smart Diffing:** Automatic tracking of **new, fixed, and regressed** findings across different scans.
* **Filtering:** Filter findings efficiently by severity (Critical, High, Medium, Low, Info).
* **Finding Management:** Mark issues as **False Positive**, **Accepted Risk**, or **Fixed**. Also supports permanent deletion.
* **Dark Mode:** A sleek, optimized interface for long-term use.

---

### ⚙️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | Go (Fiber), GORM, SQLite, Nuclei SDK | Handles scanning logic and persistent data storage. |
| **Frontend** | Next.js, Tailwind CSS, Lucide Icons | Provides the interactive and responsive user interface. |

---

### 🚀 Getting Started

#### Prerequisites

To run the Nuclei Dashboard, you need the following tools installed:

* **Go:** Version **1.21 or higher**. ([Download Go](https://go.dev/doc/install))
* **Node.js:** Version **18 or higher**. ([Download Node.js](https://nodejs.org/en/download/))
* **Nuclei:** Must be installed and accessible in your system's **PATH**.

#### Installation Steps

1.  **Clone the Repository:**

    ```bash
    git clone [https://github.com/devtint/NucleiDashboard.git](https://github.com/devtint/NucleiDashboard.git)
    cd NucleiDashboard
    ```

2.  **Start the Backend:**

    Navigate to the backend directory and run the Go application.

    ```bash
    cd backend
    go mod tidy
    go run .
    ```

    > ℹ️ The backend server will be running on **`http://127.0.0.1:3001`**

3.  **Start the Frontend:**

    Open a new terminal window, navigate to the frontend directory, and start the development server.

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

    > ℹ️ The frontend application will be available at **`http://127.0.0.1:3000`**

---

### ⚠️ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"Nuclei not found"** | Ensure `nuclei` is properly installed and its location is included in your system's **PATH**. Verify by running `nuclei -version`. |
| **Database Errors** | Try deleting the database file, `nuclei-dashboard.db`, located in the `backend` directory. Restarting the backend will automatically recreate it. |
| **Port Conflicts** | Verify that **port 3001** (for the backend) and **port 3000** (for the frontend) are free on your system. |
