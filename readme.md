# Transcription App

A full-stack application for audio transcription using OpenAI's Whisper model, built with Node.js, React, PostgreSQL, and Redis.

## 🏗️ Architecture

- **Frontend**: React application
- **Backend**: Node.js with TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Worker**: Background processing for transcription tasks
- **Container**: Docker for development and production environments

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 16 or higher
- npm
- OpenAI API key

### Environment Variables

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_URL=https://api.openai.com/v1
```

### Development Mode

For local development without containers:

1. Start the database and Redis:
```bash
docker-compose -f docker-compose.dev.yml up
```

2. Start the backend:
```bash
cd backend
npm install
npm run dev
```

3. In a new terminal, start the worker:
```bash
cd backend
npm run worker:dev
```

4. In a new terminal, start the frontend:
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Production Mode

To run the full application in production mode:

```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📁 Project Structure

```
transcription-app/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
├── docker-compose.yml
├── docker-compose.dev.yml
├── Dockerfile.backend
├── Dockerfile.frontend
```

## 🛠️ Available Scripts

### Backend

```bash
npm run dev        # Start development server with hot-reload
npm run worker:dev # Start worker in development mode
npm run start      # Start production server
```

### Frontend

```bash
npm start   # Start development server
npm build   # Build for production
npm test    # Run tests
npm eject   # Eject from create-react-app
```

## 🐳 Docker Configuration

The application uses multiple Dockerfiles and Docker Compose configurations:

- `Dockerfile.backend`: Node.js backend configuration
- `Dockerfile.frontend`: React frontend with Nginx configuration
- `docker-compose.yml`: Full production setup
- `docker-compose.dev.yml`: Development setup (DB and Redis only)

## 🔧 Configuration

### Database

PostgreSQL is configured with the following default settings:
- User: postgres
- Password: password
- Database: transcription
- Port: 5432

### Redis

Redis is configured with default settings:
- Port: 6379
- No password

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.