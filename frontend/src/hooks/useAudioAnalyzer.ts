// useAudioAnalyzer.ts - Version with controlled randomness
import { useState, useEffect } from 'react';

const useAudioAnalyzer = () => {
    const [frequency, setFrequency] = useState(0);

    useEffect(() => {
        let frameId: number;
        let time = 0;
        let randomOffset = 0;
        let targetOffset = 0;
        let noiseSeed = Math.random() * 1000; // Initial random seed for noise

        const animate = () => {
            // Base sine wave pattern
            const baseFrequency = Math.sin(time) * 25 + 35; // Base oscillation
            
            // Generate smooth noise using Perlin-like approach
            noiseSeed += 0.1;
            const noise = (Math.sin(noiseSeed) + Math.cos(noiseSeed * 0.7)) * 8;
            
            // Random target drift with smooth transition
            if (Math.random() < 0.02) { // 2% chance per frame to change target
                targetOffset = (Math.random() - 0.5) * 20;
            }
            randomOffset += (targetOffset - randomOffset) * 0.1; // Smooth interpolation
            
            // Combine elements with constraints
            const combined = baseFrequency + noise + randomOffset;
            const clamped = Math.max(10, Math.min(combined, 80)); // Keep within safe range
            
            setFrequency(clamped);

            time += 0.045; // Adjust time increment for base wave speed
            frameId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(frameId);
    }, []);

    return frequency;
};

export default useAudioAnalyzer;