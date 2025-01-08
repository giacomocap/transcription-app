import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Newsletter = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Subscribe to Our Newsletter</h2>
        <div className="max-w-md mx-auto">
          <div className="flex space-x-2">
            <Input type="email" placeholder="Enter your email" className="flex-1" />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Subscribe</Button>
          </div>
        </div>
      </div>
    </section>
  );
};
