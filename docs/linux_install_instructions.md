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

    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Install the Package**

    Navigate to the directory containing the `.whl` file (usually `dist/`) and install it:

    ```bash
    pip install video_highlight_generator-0.1.0-py3-none-any.whl
    ```

    *Note: Replace the filename with the actual name of the generated wheel file.*

## Running the Application

Once installed, you can run the application using the command line:

```bash
video-highlight-generator
```

This will start the backend server. Open your web browser and navigate to `http://localhost:8000` to use the application.

## Troubleshooting

-   **Font Issues**: If you see warnings about fonts not being found, ensure you have standard fonts installed (e.g., `fonts-dejavu` or `fonts-liberation`).
    ```bash
    sudo apt-get install fonts-liberation
    ```
-   **Permission Issues**: If you encounter permission errors accessing folders, ensure the user running the application has read/write access to the input and output directories.
