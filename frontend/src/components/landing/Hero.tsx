import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
    const navigate = useNavigate();
    return (
        <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="container mx-auto text-center">
                <h1 className="text-5xl font-bold mb-6">Welcome to Claire</h1>
                <p className="text-xl mb-8">Revolutionize your audio transcription with AI-enhanced technology.</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate("/login")}>Get Started</Button>
            </div>
        </section>
    );
};