# Transcription App

A full-stack application for audio transcription using OpenAI's Whisper model, built with Node.js, React, PostgreSQL, and Redis.

## 🏗️ Architecture

- **Frontend**: React application
- **Backend**: Node.js with TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Worker**: Background processing for transcription tasks

## 🐳 Docker Configurations

The project uses different Docker Compose configurations for different environments:

### 1. `docker-compose.yml` (Default)
- Used for local testing of the complete stack
- Includes all services: frontend, backend, worker, database, and Redis
- Suitable for testing the full application locally before deployment
- Uses default ports (3000 for frontend, 5001 for backend)

### 2. `docker-compose.dev.yml`
- Lightweight configuration for development
- Only runs database and Redis
- Frontend and backend run directly on your machine
- Enables hot-reload and faster development cycles
- Best for active development work

### 3. `docker-compose.prod.yml`
- Production-ready configuration
- Includes optimized builds
- Uses different ports (8080 for frontend) to avoid conflicts
- Includes restart policies and volume configurations
- Suitable for deployment to staging/production servers

## 🚀 Development Setup

### Local Development (Recommended for devs)
```bash
# Create Python virtual environment for diarization service
cd diarization-service
python3.10 -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -c constraints.txt -r requirements.txt

# Start local services
docker-compose -f docker-compose.dev.yml up -d

# Then use VSCode Debug "Run All with Diarization" or the following commands:
# Start backend
cd backend
npm install
npm run dev

# Start worker (in new terminal)
cd backend
npm run worker:dev

# Start frontend (in new terminal)
cd frontend
npm install
npm start
```

### Full Stack Testing
```bash
# Test complete application locally
docker-compose up --build
```

## 📦 Deployment

### Prerequisites
- Docker and Docker Compose installed on your server
- Git access to the repository
- OpenAI API key

### Server Deployment Steps

1. Clone the repository:
```bash
git clone https://github.com/giacomocap/transcription-app
cd transcription-app
```

2. Create environment file:
```bash
cat > .env << EOL
DB_PASSWORD=your_secure_password
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com/v1
EOL
```

3. Deploy the application:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. Verify deployment:
```bash
docker-compose -f docker-compose.prod.yml ps
```

The application will be accessible at:
- Frontend: http://your-server-ip:8080
- Backend API: http://your-server-ip:5001

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

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DB_PASSWORD=your_secure_password

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com/v1

# Ports (if needed)
FRONTEND_PORT=8080
BACKEND_PORT=5001
```

### Default Ports
- Frontend: 8080 (production), 3000 (development)
- Backend API: 5001
- PostgreSQL: 5432
- Redis: 6379

## 📝 Contributing Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Test using `docker-compose up --build`
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.