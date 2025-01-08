export const Testimonials = () => {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-lg mb-4">"Claire has revolutionized how we handle meetings. The transcription quality is unmatched!"</p>
              <p className="font-bold">- John Doe</p>
            </div>
            <div className="text-center">
              <p className="text-lg mb-4">"The AI enhancements are a game-changer. Highly recommend Claire for any professional setting."</p>
              <p className="font-bold">- Jane Smith</p>
            </div>
            <div className="text-center">
              <p className="text-lg mb-4">"Speaker identification and summarization have saved us countless hours. Thank you, Claire!"</p>
              <p className="font-bold">- Mike Johnson</p>
            </div>
          </div>
        </div>
      </section>
    );
  };