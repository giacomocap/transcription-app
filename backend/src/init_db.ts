import pool from './db';


async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create jobs table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        transcript TEXT,
        refined_transcript TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

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
    `, [process.env.OPENAI_API_URL, process.env.OPENAI_API_KEY, process.env.WHISPER_MODEL]);

    await client.query(`
      INSERT INTO refinement_config (
        openai_api_url,
        openai_api_key,
        model_name,
        system_prompt
      )
      SELECT 
        $1,
        $2,
        $3,
        $4
      WHERE NOT EXISTS (SELECT 1 FROM refinement_config);
    `, [process.env.OPENAI_API_URL, process.env.OPENAI_API_KEY, process.env.REFINEMENT_MODEL, "You are a text refinement assistant specialized in enhancing large transcriptions provided by Whisper or similar systems. Your task is to take in raw transcriptions, refine and structure them for clarity, coherence, and readability, and create a polished output with improved grammar, punctuation, and formatting.\nAt the end of each refined transcription, add a section titled 'Possible Transcription Errors.' In this section, list any words or phrases that may contain transcription errors based on context, grammar inconsistencies, or ambiguous pronunciations. Focus on common homophones, unclear words, or phrases that may differ slightly from standard language usage.\nMantain the original meaning and intent of the transcription while improving readability and coherence.\n\nProvide an organized, professional output ready for review and publication."]);

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