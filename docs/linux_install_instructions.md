# Linux Installation Instructions

This guide explains how to install and run the Video Highlight Generator on Linux.

## Prerequisites

Ensure you have Python 3.8 or higher installed.

### System Dependencies

You may need to install system dependencies for `opencv` and `moviepy`.

On Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install python3-pip python3-venv ffmpeg libsm6 libxext6
```

## Installation

1.  **Create a Virtual Environment (Recommended)**

    ```
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Install the Package**

    ```
    pip install video-highlight-generator
    ```

## Running the Application

Once installed, you can run the application using the command line:

```
video-highlight-generator
```

This will start the backend server. Open your web browser and navigate to `http://localhost:8000` to use the application.

## Troubleshooting

-   **Font Issues**: If you see warnings about fonts not being found, ensure you have standard fonts installed (e.g., `fonts-dejavu` or `fonts-liberation`).
    ```bash
    sudo apt-get install fonts-liberation
    ```
-   **Permission Issues**: If you encounter permission errors accessing folders, ensure the user running the application has read/write access to the input and output directories.
