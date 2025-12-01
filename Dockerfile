# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend and Runtime
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies for OpenCV and MoviePy
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY setup.py .
COPY MANIFEST.in .
COPY backend/ backend/
COPY README.md .

# Copy built frontend assets to the package's static directory
# Ensure the directory exists
RUN mkdir -p backend/video_highlight_generator/static

# Copy dist files from frontend build stage
COPY --from=frontend-build /app/frontend/dist/ backend/video_highlight_generator/static/

# Install Python dependencies and the package itself
RUN pip install --no-cache-dir .

# Expose port
EXPOSE 8000

# Run the application
CMD ["video-highlight-generator"]
