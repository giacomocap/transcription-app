import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { IcosahedronGeometry, ShaderMaterial, Clock, Mesh } from "three";

const MIN_WAVE_SIZE = 10;
const AUDIO_SCALE = 0.5;
const MAX_WAVE_SIZE = 60;

const clock = new Clock();

type AnimatedMeshProps = {
    ready: boolean;
    frequency: number;
};

function AnimatedMesh({ ready,frequency }: AnimatedMeshProps) {
    const colors = {
        red: ready ? 0.949 : 0.1,
        green: ready ? 0.820 : 0.1,
        blue: ready ? 0.000 : 0.1,
    };
    const meshRef = useRef();
    const geometry = useMemo(() => new IcosahedronGeometry(1.5, 20), []); // reduced size from 3 to 1.5
    const material = useMemo(() => {
        return new ShaderMaterial({
            uniforms: {
                u_time: { value: 0.0 },
                u_frequency: { value: 0.0 },
                u_red: { value: 0.0 },
                u_green: { value: 0.0 },
                u_blue: { value: 0.0 },
            },
            vertexShader: document.getElementById("vertexshader")?.textContent!,
            fragmentShader: document.getElementById("fragmentshader")?.textContent!,
            wireframe: true,
        });
    }, []);

    const uniforms = material.uniforms;

    useFrame(() => {
        const time = clock.getElapsedTime();

        uniforms.u_time.value = time;
        uniforms.u_frequency.value = Math.min(
            MIN_WAVE_SIZE + AUDIO_SCALE * frequency,
            MAX_WAVE_SIZE,
        );
        uniforms.u_red.value = colors.red;
        uniforms.u_green.value = colors.green;
        uniforms.u_blue.value = colors.blue;
    });

    return <primitive object={new Mesh(geometry, material)} ref={meshRef} />;
}

export default AnimatedMesh;