export const Services = () => {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Meeting Registration</h3>
              <p>Register and manage your meetings with ease.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Lecture Transcription</h3>
              <p>Transcribe lectures with high accuracy.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Diarization</h3>
              <p>Identify speakers in multi-speaker audio.</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Speaker Identification</h3>
              <p>Recognize and label speakers in your audio files.</p>
            </div>
          </div>
        </div>
      </section>
    );
  };