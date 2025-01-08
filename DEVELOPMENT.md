# Development Setup

This guide covers the steps to set up the Transcription App for local development.

## 🛠️ Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed
- Python 3.10 (for the diarization service)
- Git access to the repository

---

## 🚀 Local Development Setup

### 1. **Clone the Repository**
   ```bash
   git clone https://github.com/giacomocap/transcription-app
   cd transcription-app
   ```

### 2. **Set Up Python Virtual Environment (for Diarization Service)**
   ```bash
   cd diarization-service
   python3.10 -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -c constraints.txt -r requirements.txt
   ```

### 3. **Start Local Services**
   Start the database and Redis using Docker Compose:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

### 4. **Set Up Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

### 5. **Set Up Worker**
   In a new terminal:
   ```bash
   cd backend
   npm run worker:dev
   ```

### 6. **Set Up Frontend**
   In a new terminal:
   ```bash
   cd frontend
   npm install
   npm start
   ```

---

## 🐳 Docker Compose Configurations

The project uses different Docker Compose configurations for different environments:

### 1. **`docker-compose.dev.yml`**
   - Lightweight configuration for development
   - Only runs database and Redis
   - Frontend and backend run directly on your machine
   - Enables hot-reload and faster development cycles
   - Best for active development work

### 2. **`docker-compose.prod.yml`**
   - Production-ready configuration
   - Includes optimized builds
   - Uses different ports (8080 for frontend) to avoid conflicts
   - Includes restart policies and volume configurations
   - Suitable for deployment to staging/production servers

---

## 🔧 Environment Variables

Create a `.env` file in the root directory for local development:

```env
# Database
DB_PASSWORD=your_secure_password

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com/v1

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 🚀 Using the Diarization Service and Google Auth

The diarization service separates speakers in the audio, and Google Auth is used for authentication.

### Google Auth Setup

1. **Create a Google Cloud Project:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one.

2. **Enable the Google People API:**
   - In the Google Cloud Console, navigate to "APIs & Services" > "Library".
   - Search for "Google People API" and enable it.

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials".
   - Click "Create Credentials" > "OAuth client ID".
   - Select "Web application" as the application type.
   - Add `http://localhost:3000` to "Authorized JavaScript origins" for development.
   - Add `http://localhost:5001/api/auth/google/callback` to "Authorized redirect URIs" for development.
   - Click "Create".

4. **Set Environment Variables:**
   - Add the following to your `.env` file:
     ```env
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```

---

## 🛠️ Testing the Full Stack Locally

To test the complete application locally using Docker:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

---

## 🧑‍💻 Contributing

1. Fork the repository.
2. Create your feature branch:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Make your changes.
4. Test using `docker-compose -f docker-compose.dev.yml up --build`.
5. Commit your changes:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
6. Push to the branch:
   ```bash
   git push origin feature/AmazingFeature
   ```
7. Open a Pull Request.

---

For production setup, refer to the [README.md](README.md) file.

---