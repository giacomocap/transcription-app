export const Team = () => {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <img src="/team/member1.jpg" alt="Team Member 1" className="w-32 h-32 rounded-full mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">John Doe</h3>
              <p>CEO</p>
            </div>
            <div className="text-center">
              <img src="/team/member2.jpg" alt="Team Member 2" className="w-32 h-32 rounded-full mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Jane Smith</h3>
              <p>CTO</p>
            </div>
            <div className="text-center">
              <img src="/team/member3.jpg" alt="Team Member 3" className="w-32 h-32 rounded-full mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Mike Johnson</h3>
              <p>Lead Developer</p>
            </div>
            <div className="text-center">
              <img src="/team/member4.jpg" alt="Team Member 4" className="w-32 h-32 rounded-full mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Sarah Lee</h3>
              <p>Product Manager</p>
            </div>
          </div>
        </div>
      </section>
    );
  };