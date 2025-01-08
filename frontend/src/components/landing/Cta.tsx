import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Cta = () => {
    const navigate = useNavigate();
    return (
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="container mx-auto text-center">
                <h2 className="text-4xl font-bold text-white mb-8">Ready to Transform Your Audio?</h2>
                <Button className="bg-white text-blue-600 hover:bg-gray-100" onClick={() => navigate("/login")}>Get Started Now</Button>
            </div>
        </section>
    );
};