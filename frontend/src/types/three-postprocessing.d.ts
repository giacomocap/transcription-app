declare module 'three/examples/jsm/postprocessing/EffectComposer' {
    import { WebGLRenderer } from 'three';
    export class EffectComposer {
        constructor(renderer: WebGLRenderer);
        addPass(pass: any): void;
        removePass(pass: any): void;
        render(): void;
        setSize(width: number, height: number): void;
        dispose(): void;
    }
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
    import { Scene, Camera } from 'three';
    export class RenderPass {
        constructor(scene: Scene, camera: Camera);
        dispose(): void;
    }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass' {
    import { Vector2 } from 'three';
    export class UnrealBloomPass {
        constructor(resolution: Vector2, strength: number, radius: number, threshold: number);
        strength: number;
        dispose(): void;
    }
}

declare module 'three/examples/jsm/postprocessing/OutputPass' {
    export class OutputPass {
        constructor();
        dispose(): void;
    }
}
