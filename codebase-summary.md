# Codebase Summary

## Project Overview

**Purpose:** This project is a transcription application that allows users to upload audio/video files, transcribe them, and refine the transcriptions. It also includes features for user authentication, job management, and diarization (speaker identification).

**Tech Stack:**

-   **Frontend:** TypeScript, React, Tailwind CSS, Vite
-   **Backend:** TypeScript, Node.js, Express, Prisma (ORM), PostgreSQL (Database)
-   **Diarization:** Python, Pyannote (for speaker diarization)

**Structure:**

The codebase is organized into three main services:

-   **Frontend:** Handles the user interface and interaction.
-   **Backend:** Provides API endpoints for transcription, user management, and other backend functionalities.
-   **Diarization Service:** Performs speaker diarization on audio files.

## Services

### Frontend

#### Purpose

The frontend provides the user interface for interacting with the transcription application. It allows users to upload files, manage their jobs, view and refine transcriptions, and manage their accounts.

#### Key files

##### `package.json` - description

Frontend dependencies and build scripts.

##### `tsconfig.json` - description

TypeScript configuration for the frontend.

##### `src/` - description

Source code for the frontend application.

##### `src/main.tsx` - description

Main entry point for the React application.

**Key functions/components:**

-   `createRoot`: Initializes the React root.
-   `StrictMode`: Enables strict mode for development.
-   `App`: Renders the root component of the application.

##### `src/App.tsx` - description

Root component of the application, handling routing and authentication.

**Key functions/components:**

-   `BrowserRouter`: Enables client-side routing.
-   `Routes`: Defines the different routes of the application.
-   `Route`: Specifies the component to render for each route.
-   `Navigate`: Redirects to a different route.
-   `AuthProvider`: Provides authentication context to the application.
-   `ProtectedRoute`: Protects routes that require authentication.
-   `AppContent`: Handles conditional rendering of the Navigation component based on the route.

##### `src/components/` - description

Reusable UI components.

##### `src/components/ActionsView` - description

This directory does not contain any relevant components.

##### `src/components/DeleteJobAlert.tsx` - description

Component for confirming job deletion using an alert dialog.

**Key functions/components:**

-   `AlertDialog`: Renders an alert dialog.
-   `AlertDialogTrigger`: Specifies the element that triggers the alert dialog.
-   `AlertDialogContent`: Contains the content of the alert dialog.
-   `AlertDialogHeader`: Contains the header of the alert dialog.
-   `AlertDialogTitle`: Renders the title of the alert dialog.
-   `AlertDialogDescription`: Renders the description of the alert dialog.
-   `AlertDialogFooter`: Contains the footer of the alert dialog.
-   `AlertDialogCancel`: Renders the cancel button.
-   `AlertDialogAction`: Renders the confirm action button.

##### `src/components/DownloadOptions.tsx` - description

Component for selecting download options.

##### `src/components/EditJobDialog.tsx` - description

Component for editing job details.

##### `src/components/JobStatus.tsx` - description

Component for displaying job status.

##### `src/components/Navigation.tsx` - description

Navigation bar component.

##### `src/components/NotesView` - description

Component for viewing and editing notes.

##### `src/components/RefinedTranscriptView.tsx` - description

Component for viewing and refining transcriptions.

##### `src/components/SpeakerLabelEditor.tsx` - description

Component for editing speaker labels.

##### `src/components/StatsView.tsx` - description

Component for displaying job statistics.

##### `src/components/SummaryView.tsx` - description

Component for viewing job summary.

##### `src/components/TasksView.tsx` - description

Component for viewing and managing tasks.

##### `src/components/TranscriptionTabs.tsx` - description

Component for switching between transcription views.

##### `src/components/TranscriptView.tsx` - description

Component for viewing raw transcriptions.

##### `src/components/auth/` - description

Components related to user authentication.

##### `src/components/auth/ProtectedRoute.tsx` - description

Component for protecting routes that require authentication.

##### `src/components/landing/` - description

Components for the landing page.

##### `src/components/landing/About.tsx` - description

About section of the landing page.

##### `src/components/landing/Cta.tsx` - description

Call-to-action section of the landing page.

##### `src/components/landing/FAQ.tsx` - description

Frequently asked questions section of the landing page.

##### `src/components/landing/Features.tsx` - description

Features section of the landing page.

##### `src/components/landing/Footer.tsx` - description

Footer of the landing page.

##### `src/components/landing/Hero.tsx` - description

Hero section of the landing page.

##### `src/components/landing/HowItWorks.tsx` - description

How it works section of the landing page.

##### `src/components/landing/Newsletter.tsx` - description

Newsletter signup section of the landing page.

##### `src/components/landing/Pricing.tsx` - description

Pricing section of the landing page.

##### `src/components/landing/ScrollToTop.tsx` - description

Component for scrolling to the top of the page.

##### `src/components/landing/Services.tsx` - description

Services section of the landing page.

##### `src/components/landing/Sponsors.tsx` - description

Sponsors section of the landing page.

##### `src/components/landing/Team.tsx` - description

Team section of the landing page.

##### `src/components/landing/Testimonials.tsx` - description

Testimonials section of the landing page.

##### `src/components/ui/` - description

Reusable UI components from Shadcn UI.

##### `src/components/ui/alert-dialog.tsx` - description

Alert dialog component.

##### `src/components/ui/alert.tsx` - description

Alert component.

##### `src/components/ui/badge.tsx` - description

Badge component.

##### `src/components/ui/button.tsx` - description

Button component.

##### `src/components/ui/card.tsx` - description

Card component.

##### `src/components/ui/dialog.tsx` - description

Dialog component.

##### `src/components/ui/drawer.tsx` - description

Drawer component.

##### `src/components/ui/dropdown-menu.tsx` - description

Dropdown menu component.

##### `src/components/ui/input.tsx` - description

Input component.

##### `src/components/ui/label.tsx` - description

Label component.

##### `src/components/ui/popover.tsx` - description

Popover component.

##### `src/components/ui/progress.tsx` - description

Progress bar component.

##### `src/components/ui/select.tsx` - description

Select component.

##### `src/components/ui/slider.tsx` - description

Slider component.

##### `src/components/ui/tabs.tsx` - description

Tabs component.

##### `src/components/ui/textarea.tsx` - description

Textarea component.

##### `src/components/ui/toast.tsx` - description

Toast component.

##### `src/components/ui/toaster.tsx` - description

Toaster component.

##### `src/components/ui/tooltip.tsx` - description

Tooltip component.

##### `src/context/` - description

Context providers.

##### `src/context/AuthContext.tsx` - description

Authentication context provider.

##### `src/hooks/` - description

Custom React hooks.

##### `src/hooks/use-media-query.ts` - description

Hook for using media queries.

##### `src/hooks/use-toast.ts` - description

Hook for using the toast component.

##### `src/lib/` - description

Utility functions.

##### `src/lib/utils.ts` - description

General utility functions.

##### `src/pages/` - description

Page components.

##### `src/pages/AdminPage.tsx` - description

Admin page component.

##### `src/pages/JobDetailPage.tsx` - description

Job detail page component.

##### `src/pages/JobsDashboard.tsx` - description

Jobs dashboard page component.

##### `src/pages/LandingPage.tsx` - description

Landing page component.

##### `src/pages/LoginPage.tsx` - description

Login page component.

##### `src/pages/UploadPage.tsx` - description

Upload page component.

##### `src/types/` - description

TypeScript type definitions.

##### `src/types/auth.ts` - description

Authentication type definitions.

##### `src/types/index.ts` - description

General type definitions.

##### `src/types/stats.ts` - description

Statistics type definitions.

##### `src/utils/` - description

Utility functions.

##### `src/utils/fileConversion.ts` - description

File conversion utility functions.

#### Dependencies

-   **@hookform/resolvers:** Form validation resolver.
-   **@radix-ui/\***: Radix UI components.
-   **@tanstack/react-query:** Data fetching and caching library.
-   **axios:** HTTP client.
-   **class-variance-authority:** Utility for constructing CSS class names.
-   **clsx:** Utility for constructing CSS class names.
-   **cmdk:** Command menu component.
-   **date-fns:** Date utility library.
-   **lucide-react:** Icon library.
-   **react:** React library.
-   **react-day-picker:** Date picker component.
-   **react-dom:** React DOM library.
-   **react-dropzone:** File dropzone component.
-   **react-hook-form:** Form library.
-   **react-router-dom:** Router library.
-   **react-secure-storage:** Secure storage library.
-   **tailwind-merge:** Utility for merging Tailwind CSS classes.
-   **tailwindcss-animate:** Tailwind CSS animation plugin.
-   **uuid:** UUID generator.
-   **zod:** Schema validation library.
-   **zustand:** State management library.

### Backend

#### Purpose

The backend provides API endpoints for the frontend to interact with. It handles user authentication, job management, transcription processing, and communication with the diarization service.

#### Key files

##### `package.json` - description

Backend dependencies and build scripts.

##### `tsconfig.json` - description

TypeScript configuration for the backend.

##### `prisma/` - description

Prisma schema and migrations.

##### `prisma/schema.prisma` - description

Prisma schema definition.

##### `src/` - description

Source code for the backend application.

##### `src/auth.ts` - description

Authentication middleware.

##### `src/converter.ts` - description

File conversion utilities.

##### `src/db.ts` - description

Database connection setup.

##### `src/index.ts` - description

Main entry point for the backend application.

##### `src/init_db.ts` - description

Database initialization script.

##### `src/refinement.ts` - description

Transcription refinement logic.

##### `src/routes-prisma.ts` - description

API routes using Prisma.

##### `src/swaggerConfig.ts` - description

Swagger API documentation configuration.

##### `src/worker.ts` - description

Background worker for processing transcription jobs.

##### `src/types/` - description

TypeScript type definitions.

##### `src/types/auth.ts` - description

Authentication type definitions.

##### `src/types/index.ts` - description

General type definitions.

#### Dependencies

-   **@fastify/autoload:** Fastify plugin for autoloading routes.
-   **@fastify/cors:** Fastify plugin for handling CORS.
-   **@fastify/multipart:** Fastify plugin for handling multipart/form-data.
-   **@fastify/sensible:** Fastify plugin for adding sensible defaults.
-   **@fastify/swagger:** Fastify plugin for generating Swagger documentation.
-   **@fastify/swagger-ui:** Fastify plugin for serving Swagger UI.
-   **@fastify/type-provider-typebox:** Fastify plugin for using TypeBox as a type provider.
-   **@prisma/client:** Prisma client library.
-   **@sinclair/typebox:** JSON Schema type builder.
-   **axios:** HTTP client.
-   **bull:** Redis-based queue system.
-   **dotenv:** Environment variable loader.
-   **fastify:** Web framework.
-   **fluent-ffmpeg:** FFmpeg wrapper.
-   **ioredis:** Redis client.
-   **uuid:** UUID generator.

### Diarization Service

#### Purpose

The diarization service handles speaker diarization for audio files. It receives audio files from the backend, performs diarization using Pyannote, and returns the diarization results to the backend.

#### Key files

##### `Dockerfile` - description

Dockerfile for building the diarization service image.

##### `main.py` - description

Main entry point for the diarization service.

##### `requirements.txt` - description

Python dependencies for the diarization service.

##### `app/` - description

Source code for the diarization service application.

##### `app/__init__.py` - description

Package initializer.

##### `app/config.py` - description

Configuration for the diarization service.

##### `app/diarizationprogress.py` - description

Diarization progress tracking.

##### `app/diarizer.py` - description

Speaker diarization logic using Pyannote.

##### `app/main.py` - description

FastAPI application for handling diarization requests.

##### `app/models.py` - description

Data models for the diarization service.

#### Dependencies

-   **fastapi:** Web framework.
-   **pyannote.audio:** Speaker diarization toolkit.
-   **pydantic:** Data validation library.
-   **python-dotenv:** Environment variable loader.
-   **redis:** Redis client.
-   **rq:** Task queue library.
-   **uvicorn:** ASGI server.
