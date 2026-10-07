"use client";
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Camera } from 'three';

export const SmokeAnimation = () => {
    const mountRef = useRef<HTMLDivElement | null>(null); // Create a ref to attach the Three.js renderer

    useEffect(() => {
        const mount = mountRef.current; // the same node for the cleanup below
        let camera: THREE.Object3D<THREE.Object3DEventMap>, scene: THREE.Scene, renderer: THREE.WebGLRenderer, clock: THREE.Clock;
        let light;
        let smokeParticles: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial, THREE.Object3DEventMap>[] = [];

        function init() {
            clock = new THREE.Clock();

            // Create renderer and attach it to the ref's current element
            renderer = new THREE.WebGLRenderer();
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (mount) {
                mount.appendChild(renderer.domElement); // Attach renderer to div
            }

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
            camera.position.z = 1000;
            scene.add(camera);

            light = new THREE.DirectionalLight(0xffffff, 0.3);
            light.position.set(-1, 0, 1);
            scene.add(light);

            const smokeTexture = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/95637/Smoke-Element.png');
            const smokeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, map: smokeTexture, transparent: true });
            const smokeGeo = new THREE.PlaneGeometry(300, 300);

            for (let p = 0; p < 150; p++) {
                const particle = new THREE.Mesh(smokeGeo, smokeMaterial);
                particle.position.set(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 1000 - 100);
                particle.rotation.z = Math.random() * 360;
                scene.add(particle);
                smokeParticles.push(particle);
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            evolveSmoke(delta);
            render();
        }

        function evolveSmoke(delta: number) {
            smokeParticles.forEach(particle => {
                particle.rotation.z += (delta * 0.2);
            });
        }

        function render() {
            if (camera instanceof Camera) {
                renderer.render(scene, camera);
            }
        }

        init();
        animate();

        // Clean up on unmount
        return () => {
            if (mount) {
                mount.removeChild(renderer.domElement); // Remove renderer from div
            }
        };
    }, []);

    return <div className="smoke-animation" ref={mountRef} />; // Attach ref to div element
};
