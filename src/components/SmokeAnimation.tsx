"use client";
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Self-hosted copy of the original CodePen smoke sprite (2026-10-14).
const SMOKE_TEXTURE = "/decor-img/smoke.png";

export const SmokeAnimation = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const clock = new THREE.Clock();
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 1000;
        scene.add(camera);

        const light = new THREE.DirectionalLight(0xffffff, 0.3);
        light.position.set(-1, 0, 1);
        scene.add(light);

        const smokeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
        const loader = new THREE.TextureLoader();
        let smokeTexture: THREE.Texture | null = null;
        let disposed = false;
        const useTexture = (texture: THREE.Texture) => {
            if (disposed) {
                texture.dispose(); // arrived after the page was left
                return;
            }
            smokeTexture = texture;
            smokeMaterial.map = texture;
            smokeMaterial.opacity = 1; // hidden until a texture exists — no white squares
            smokeMaterial.needsUpdate = true;
        };
        loader.load(SMOKE_TEXTURE, useTexture);

        const smokeGeo = new THREE.PlaneGeometry(300, 300);
        const smokeParticles: THREE.Mesh[] = [];
        for (let p = 0; p < 150; p++) {
            const particle = new THREE.Mesh(smokeGeo, smokeMaterial);
            particle.position.set(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 1000 - 100);
            particle.rotation.z = Math.random() * 360;
            scene.add(particle);
            smokeParticles.push(particle);
        }

        // One loop at a time; it stops when the page is left or the tab is hidden.
        let frame = 0;
        const animate = () => {
            frame = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            smokeParticles.forEach(particle => {
                particle.rotation.z += delta * 0.2;
            });
            renderer.render(scene, camera);
        };
        const start = () => {
            if (frame) return;
            clock.getDelta(); // don't jump by the time spent hidden
            animate();
        };
        const stop = () => {
            cancelAnimationFrame(frame);
            frame = 0;
        };
        const onVisibility = () => (document.hidden ? stop() : start());
        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("resize", onResize);
        if (!document.hidden) start();

        // Leaving the page must release the graphics context: browsers allow only
        // ~16 at once, and every return to the main page used to add another.
        return () => {
            disposed = true;
            stop();
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("resize", onResize);
            smokeGeo.dispose();
            smokeMaterial.dispose();
            (smokeTexture as THREE.Texture | null)?.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
        };
    }, []);

    return <div className="smoke-animation" ref={mountRef} />;
};
