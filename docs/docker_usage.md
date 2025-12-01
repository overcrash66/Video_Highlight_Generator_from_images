# Docker Usage Guide

This guide explains how to build and run the Video Highlight Generator using Docker.

## Prerequisites

- Docker
- Docker Compose

## Building and Running

1.  **Build and Start the Container**

    Run the following command in the project root:

    ```bash
    docker-compose up --build
    ```

    This will:
    - Build the React frontend.
    - Build the Python backend image.
    - Start the application on port 8000.

2.  **Access the Application**

    Open your browser and navigate to `http://localhost:8000`.

## Managing Data and Media

### Database Persistence

The `docker-compose.yml` file configures a volume to persist the database and generated videos:

```yaml
volumes:
  - ./data:/app/data
```

This maps the local `data` directory to `/app/data` inside the container. The database file `video_highlight_generator.db` will be stored here.

### Adding Media (Photos/Music)

Since the application runs inside a container, it cannot access your host's file system directly. You must mount your media folders.

The default `docker-compose.yml` includes an example mount:

```yaml
volumes:
  - ./media:/data/media
```

1.  **Place your photos/music** in the `media` folder in the project root (or update the `docker-compose.yml` to point to your actual media folder).
2.  **In the Application**:
    - The "Browse" button will not work inside Docker (as it requires a desktop environment).
    - Use the **Manual Path Input** field (added below the "Add Folder" button).
    - Enter `/data/media` (or the specific subfolder) and click "Add".

## Troubleshooting

-   **Browse Button Fails**: This is expected in Docker. Use the manual path input.
-   **Permission Issues**: Ensure the user running Docker has read access to the mounted media folders and write access to the `data` folder.
