import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ChainScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const fitScene = () => {
      const sceneWidth = 5.8;
      const viewWidthPerDepth = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      camera.position.z = Math.max(7, sceneWidth / viewWidthPerDepth);
    };
    fitScene();

    scene.add(new THREE.AmbientLight(0xb9c9ff, 2.2));
    const keyLight = new THREE.PointLight(0x71dfff, 48, 18);
    keyLight.position.set(-3, 3, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x8877ff, 35, 18);
    rimLight.position.set(4, -2, -3);
    scene.add(rimLight);

    const network = new THREE.Group();
    scene.add(network);

    const cubeGeometry = new THREE.BoxGeometry(1.55, 1.55, 1.55);
    const cubeMaterials = [0x5267db, 0x3549ad, 0x7187ff, 0x293d9a, 0x607bfa, 0x4054c0].map(
      (color) => new THREE.MeshStandardMaterial({
        color,
        emissive: 0x172b87,
        emissiveIntensity: 0.55,
        metalness: 0.28,
        roughness: 0.34,
      }),
    );
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
    network.add(cube);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(cubeGeometry),
      new THREE.LineBasicMaterial({ color: 0xb9f3ff, transparent: true, opacity: 0.9 }),
    );
    cube.add(edges);

    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x788eff, transparent: true, opacity: 0.38 });
    const orbits = [
      { x: 2.45, y: 1.15, rotation: [0.85, 0.25, -0.3] },
      { x: 1.8, y: 2.15, rotation: [0.25, 0.9, 0.55] },
      { x: 2.05, y: 0.82, rotation: [1.25, 0.1, 0.7] },
    ];

    orbits.forEach(({ x, y, rotation }) => {
      const curve = new THREE.EllipseCurve(0, 0, x, y, 0, Math.PI * 2, false, 0);
      const points = curve.getPoints(128).map(({ x: pointX, y: pointY }) => new THREE.Vector3(pointX, pointY, 0));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbit = new THREE.LineLoop(geometry, orbitMaterial);
      orbit.rotation.set(...rotation);
      network.add(orbit);
    });

    const satellites = [
      { position: [-2.15, 0.75, 0.25], color: 0x55dff2, scale: 0.43 },
      { position: [1.85, 1.15, -0.35], color: 0x9b8cff, scale: 0.5 },
      { position: [1.7, -1.15, 0.45], color: 0x6a91ff, scale: 0.38 },
    ];

    const satelliteBlocks = [];
    satellites.forEach(({ position, color, scale }) => {
      const nodeMaterial = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        metalness: 0.2,
        roughness: 0.38,
      });
      const node = new THREE.Mesh(new THREE.BoxGeometry(scale, scale, scale), nodeMaterial);
      node.position.set(...position);
      node.rotation.set(0.35, 0.45, 0.2);
      network.add(node);
      satelliteBlocks.push(node);
    });

    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = mount;
      if (!clientWidth || !clientHeight) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      fitScene();
      renderer.setSize(clientWidth, clientHeight);
      renderer.render(scene, camera);
    });
    resizeObserver.observe(mount);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId;
    let previousTime = 0;
    const animate = (time) => {
      if (!reducedMotion) {
        frameId = window.requestAnimationFrame(animate);
        const delta = Math.min((time - previousTime) / 1000, 0.05);
        network.rotation.y += delta * 0.16;
        network.rotation.x = Math.sin(time * 0.00025) * 0.045;
        cube.rotation.x += delta * 0.08;
        satelliteBlocks.forEach((block, index) => {
          block.rotation.x += delta * (0.12 + index * 0.025);
          block.rotation.y += delta * (0.18 + index * 0.035);
        });
      }
      previousTime = time;
      renderer.render(scene, camera);
    };
    if (reducedMotion) renderer.render(scene, camera);
    else frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="three-scene" aria-hidden="true" />;
}