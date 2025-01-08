export const Pricing = () => {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">Basic</h3>
              <p className="text-4xl font-bold mb-4">$10/month</p>
              <ul className="text-left">
                <li>10 hours of transcription</li>
                <li>Basic summarization</li>
                <li>Email support</li>
              </ul>
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">Pro</h3>
              <p className="text-4xl font-bold mb-4">$30/month</p>
              <ul className="text-left">
                <li>30 hours of transcription</li>
                <li>Advanced summarization</li>
                <li>Priority support</li>
              </ul>
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4">Enterprise</h3>
              <p className="text-4xl font-bold mb-4">$100/month</p>
              <ul className="text-left">
                <li>Unlimited transcription</li>
                <li>Full feature access</li>
                <li>Dedicated support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  };