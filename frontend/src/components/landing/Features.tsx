export const Features = () => {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">AI-Enhanced Transcription</h3>
              <p>Best-in-class transcription quality with AI enhancements.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Summarization</h3>
              <p>Get concise summaries of your audio content.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Key Actions Extraction</h3>
              <p>Identify and extract key actions from your meetings.</p>
            </div>
          </div>
        </div>
      </section>
    );
  };