import pool from './db';


async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        profile_picture TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create jobs table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_url VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        transcript TEXT,
        refined_transcript TEXT,
        subtitle_content TEXT,
        summary TEXT,
        diarization_enabled BOOLEAN DEFAULT FALSE,
        diarization_status VARCHAR(50),
        speaker_profiles JSONB,
        audio_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    //update table jobs add column diarization_progress and transcription_progress, speaker_segments
    await client.query(`
      ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS diarization_progress FLOAT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS transcription_progress FLOAT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS speaker_segments JSONB;
    `);

    // // Create speaker_segments table for diarization results
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS speaker_segments (
    //     id SERIAL PRIMARY KEY,
    //     job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    //     speaker_label VARCHAR(50),
    //     start_time FLOAT NOT NULL,
    //     end_time FLOAT NOT NULL,
    //     confidence FLOAT,
    //     created_at TIMESTAMP DEFAULT NOW()
    //   );
    // `);

    // // Create diarization_cache table
    // await client.query(`
    //   CREATE TABLE IF NOT EXISTS diarization_cache (
    //     audio_hash VARCHAR(64) PRIMARY KEY,
    //     segments JSONB NOT NULL,
    //     created_at TIMESTAMP DEFAULT NOW(),
    //     last_accessed TIMESTAMP DEFAULT NOW()
    //   );
    // `);

    // Create transcription_config table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS transcription_config (
        id SERIAL PRIMARY KEY,
        openai_api_url VARCHAR(255) NOT NULL,
        openai_api_key VARCHAR(255) NOT NULL,
        model_name VARCHAR(100) NOT NULL,
        max_concurrent_jobs INTEGER DEFAULT 3,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create refinement_config table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS refinement_config (
        id SERIAL PRIMARY KEY,
        openai_api_url VARCHAR(255) NOT NULL,
        openai_api_key VARCHAR(255) NOT NULL,
        model_name VARCHAR(100) NOT NULL,
        fast_model_name VARCHAR(100) NOT NULL,
        system_prompt TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert default configurations if they don't exist
    await client.query(`
      INSERT INTO transcription_config (
        openai_api_url,
        openai_api_key,
        model_name,
        max_concurrent_jobs
      )
      SELECT 
        $1,
        $2,
        $3,
        3
      WHERE NOT EXISTS (SELECT 1 FROM transcription_config);
    `, [process.env.AUDIO_OPENAI_API_URL, process.env.AUDIO_OPENAI_API_KEY, process.env.AUDIO_MODEL]);

    await client.query(`
      INSERT INTO refinement_config (
        openai_api_url,
        openai_api_key,
        model_name,
        fast_model_name,
        system_prompt
      )
      SELECT 
        $1,
        $2,
        $3,
        $4,
        $5
      WHERE NOT EXISTS (SELECT 1 FROM refinement_config);
    `, [process.env.OPENAI_API_URL, process.env.OPENAI_API_KEY, process.env.REFINEMENT_MODEL, process.env.FAST_REFINEMENT_MODEL, `You are a text refinement assistant. Your task is to refine and structure raw transcriptions for clarity, coherence, and readability while strictly preserving the original language, meaning, and intent.

Tasks:
Correct grammar, punctuation, and formatting.
Format the refined text into paragraphs, without titles.
Rules:

Do not translate under any circumstances. Work strictly in the original language of the transcription.
Process the entire transcription fully before concluding.
Maintain all original meanings without deviation.

Deliver a polished, professional output ready for review and publication.`]);

    await client.query('COMMIT');
    console.log('Database initialization completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Export for use in the main application
export default initializeDatabase;