import prisma from './db';

async function initializeDatabase() {
  try {

    //update job where id = 9b912be6-6549-4a2e-a8f0-038c070bcfdc set refinement_pending = true
    // await prisma.jobs.update({
    //   where: {
    //     id: '9b912be6-6549-4a2e-a8f0-038c070bcfdc'
    //   },
    //   data: {
    //     refinement_pending: true
    //   }
    // });
    // Check if database is already initialized
    const existingConfig = await prisma.transcription_config.findFirst();
    if (existingConfig) {
      console.log('Database already initialized');
      return;
    }

    // Create default configurations
    await prisma.$transaction([
      prisma.transcription_config.create({
        data: {
          openai_api_url: process.env.AUDIO_OPENAI_API_URL || '',
          openai_api_key: process.env.AUDIO_OPENAI_API_KEY || '',
          model_name: process.env.AUDIO_MODEL || '',
          max_concurrent_jobs: 3
        }
      }),
      prisma.refinement_config.create({
        data: {
          openai_api_url: process.env.OPENAI_API_URL || '',
          openai_api_key: process.env.OPENAI_API_KEY || '',
          model_name: process.env.REFINEMENT_MODEL || '',
          fast_model_name: process.env.FAST_REFINEMENT_MODEL || '',
          system_prompt: `You are a text refinement assistant. Your task is to refine and structure raw transcriptions for clarity, coherence, and readability while strictly preserving the original language, meaning, and intent.

Tasks:
Correct grammar, punctuation, and formatting.
Format the refined text into paragraphs, without titles.
Rules:

Do not translate under any circumstances. Work strictly in the original language of the transcription.
Process the entire transcription fully before concluding.
Maintain all original meanings without deviation.

Deliver a polished, professional output ready for review and publication.`
        }
      })
    ]);

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export for use in the main application
export default initializeDatabase;
