export const HowItWorks = () => {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Upload Audio</h3>
              <p>Easily upload your audio files for processing.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">AI Processing</h3>
              <p>Our AI enhances transcription quality and extracts key insights.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Download Results</h3>
              <p>Get your transcriptions, summaries, and more in minutes.</p>
            </div>
          </div>
        </div>
      </section>
    );
  };