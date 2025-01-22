import { useRef, useEffect } from "react";
import { useFrame, extend, useThree } from "@react-three/fiber";
import { Vector2 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

extend({ EffectComposer, RenderPass, UnrealBloomPass, OutputPass });

function BloomScene({ frequency }: { frequency: number }) {
    const { gl, scene, camera, size } = useThree();

    const renderPass = useRef<RenderPass | null>(null);
    const outputPass = useRef<OutputPass | null>(null);
    const composer = useRef<EffectComposer | null>(null);
    const bloomPass = useRef<UnrealBloomPass | null>(null);

    useEffect(() => {
        renderPass.current = new RenderPass(scene, camera);
        outputPass.current = new OutputPass();
        composer.current = new EffectComposer(gl);
        bloomPass.current = new UnrealBloomPass(
            new Vector2(size.width, size.height),
            0.2,
            1,
            0,
        );

        composer.current.addPass(renderPass.current);
        composer.current.addPass(bloomPass.current);
        composer.current.addPass(outputPass.current);

        return () => {
            if (composer.current) {
                if (renderPass.current) {
                    composer.current.removePass(renderPass.current);
                    renderPass.current.dispose();
                }
                if (bloomPass.current) {
                    composer.current.removePass(bloomPass.current);
                    bloomPass.current.dispose();
                }
                if (outputPass.current) {
                    composer.current.removePass(outputPass.current);
                    outputPass.current.dispose();
                }
                composer.current.dispose();
            }
        };
    }, [gl, scene, camera, size]);

    useEffect(() => {
        composer.current?.setSize(size.width, size.height);
    }, [size]);

    useEffect(() => {
        if (bloomPass.current) {
            bloomPass.current.strength = 0.1 + frequency / 1500;
        }
    }, [frequency]);

    useFrame(() => {
        if (composer.current) {
            composer.current.render();
        }
    }, 1);

    return null;
}

export default BloomScene;