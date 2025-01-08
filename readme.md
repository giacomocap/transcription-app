# Transcription App

A full-stack application for audio transcription using OpenAI's Whisper model, built with Node.js, React, PostgreSQL, and Redis.

## 🚀 Quick Production Setup

### Prerequisites
- Docker and Docker Compose installed on your server
- Git access to the repository
- OpenAI API key
- Google OAuth credentials (client ID and client secret)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/giacomocap/transcription-app
   cd transcription-app
   ```

2. **Create environment file:**
   ```bash
   cat > .env << EOL
   DB_PASSWORD=your_secure_password
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_API_URL=https://api.openai.com/v1
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   EOL
   ```

3. **Deploy the application:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify deployment:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

The application will be accessible at:
- Frontend: http://your-server-ip:8080
- Backend API: http://your-server-ip:5001

### Google OAuth Configuration
Ensure the following settings are configured in the Google Cloud Console:
- **Authorized JavaScript origins:** `http://localhost:8080`
- **Authorized redirect URIs:** `http://localhost:8080/api/auth/google/callback`

### Maintenance Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update application
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Stop application
docker-compose -f docker-compose.prod.yml down
```

---

For development setup and additional details, refer to the [DEVELOPMENT.md](DEVELOPMENT.md) file.

---