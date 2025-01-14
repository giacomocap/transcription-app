-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "transcript" TEXT,
    "refined_transcript" TEXT,
    "subtitle_content" TEXT,
    "summary" TEXT,
    "diarization_enabled" BOOLEAN DEFAULT false,
    "diarization_status" VARCHAR(50),
    "speaker_profiles" JSONB,
    "audio_hash" VARCHAR(64),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "diarization_progress" DOUBLE PRECISION DEFAULT 0,
    "transcription_progress" DOUBLE PRECISION DEFAULT 0,
    "speaker_segments" JSONB,
    "refinement_triggered" BOOLEAN DEFAULT false,
    "refinement_pending" BOOLEAN DEFAULT false,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refinement_config" (
    "id" SERIAL NOT NULL,
    "openai_api_url" VARCHAR(255) NOT NULL,
    "openai_api_key" VARCHAR(255) NOT NULL,
    "model_name" VARCHAR(100) NOT NULL,
    "fast_model_name" VARCHAR(100) NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refinement_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcription_config" (
    "id" SERIAL NOT NULL,
    "openai_api_url" VARCHAR(255) NOT NULL,
    "openai_api_key" VARCHAR(255) NOT NULL,
    "model_name" VARCHAR(100) NOT NULL,
    "max_concurrent_jobs" INTEGER DEFAULT 3,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcription_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "google_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "profile_picture" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_shares" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "token" VARCHAR(100),
    "email" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',

    CONSTRAINT "job_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "job_shares_token_key" ON "job_shares"("token");

-- CreateIndex
CREATE UNIQUE INDEX "job_shares_job_id_email_key" ON "job_shares"("job_id", "email");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "job_shares" ADD CONSTRAINT "job_shares_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_shares" ADD CONSTRAINT "job_shares_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
