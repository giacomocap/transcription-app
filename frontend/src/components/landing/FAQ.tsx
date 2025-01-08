export const FAQ = () => {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">How accurate is the transcription?</h3>
              <p>Our AI-enhanced transcription offers industry-leading accuracy, especially for clear audio.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Can I try Claire for free?</h3>
              <p>Yes, we offer a free trial with limited features to get you started.</p>
            </div>
          </div>
        </div>
      </section>
    );
  };