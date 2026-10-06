// 3D photography gallery (from 21st.dev, "3d-gallery-photography"), adapted 6 October for the
// homepage intro (src/islands/hero-gallery.tsx, driven by src/js/gallery.js):
//
// - Page scrolling drives it: `scrollSource` fires "gallery:scroll" events with the scroll
//   delta. The original captured the mouse wheel over the canvas and the arrow keys on the
//   whole page, which would have stopped the page from scrolling.
// - `paused` stops drawing (frameloop "never") once the hero has taken over.
// - Each frame moves the planes directly (refs) instead of re-rendering through React state,
//   and the damping no longer depends on the screen's refresh rate (144 Hz screens).
// - `speed` and `visibleCount` are passed through (the original ignored them).
// - The no-WebGL fallback uses plain classes (the site has no Tailwind); styles in home.css.
// - The pixel ratio is capped at 1.5 to keep the GPU's work down on high-density screens.
// - The canvas measures its layout size, not its on-screen box, and not on every scroll: the
//   page zooms the gallery during the hand-over, which made it resize mid-scroll and jump.
// - The hover wave eases in and out instead of snapping on, and doesn't start while the page
//   is scrolling (pictures sliding under a resting pointer made them twitch).
// - A centred layout (CENTRED_LAYOUT) replaces the original scatter, which leaned to one side
//   in the opening view.
import type React from 'react';
import { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

type ImageItem = string | { src: string; alt?: string };

interface FadeSettings {
	fadeIn: {
		start: number;
		end: number;
	};
	fadeOut: {
		start: number;
		end: number;
	};
}

interface BlurSettings {
	blurIn: {
		start: number;
		end: number;
	};
	blurOut: {
		start: number;
		end: number;
	};
	maxBlur: number;
}

interface InfiniteGalleryProps {
	images: ImageItem[];
	speed?: number;
	zSpacing?: number;
	visibleCount?: number;
	falloff?: { near: number; far: number };
	fadeSettings?: FadeSettings;
	blurSettings?: BlurSettings;
	className?: string;
	style?: React.CSSProperties;
	/** Fires "gallery:scroll" events whose detail is the page's scroll delta in px. */
	scrollSource?: EventTarget;
	/** Stops drawing while true. */
	paused?: boolean;
}

interface PlaneData {
	index: number;
	z: number;
	imageIndex: number;
	x: number;
	y: number;
}

const DEFAULT_DEPTH_RANGE = 50;

// Where each plane flies, across and up from the centre line. Every third plane comes down the
// middle and the others arrive in mirrored pairs on neighbouring depths, so the opening view, and
// every view after it, is balanced round the centre of the screen.
const CENTRED_LAYOUT: { x: number; y: number }[] = [
	{ x: 0, y: 0.2 }, { x: 2.4, y: 1.1 }, { x: -2.4, y: -1.1 },
	{ x: 0, y: 0 }, { x: 2.0, y: -0.9 }, { x: -2.0, y: 0.9 },
	{ x: 0.3, y: -0.2 }, { x: 2.8, y: -0.4 }, { x: -2.8, y: 0.4 },
	{ x: -0.3, y: 0.15 }, { x: 1.2, y: 1.6 }, { x: -1.2, y: -1.6 },
];
// How far along the planes start, so the opening view is a mirrored pair, both fully visible,
// round a centre plane coming up behind them.
const START_DEPTH = 9.3;

const createClothMaterial = () => {
	return new THREE.ShaderMaterial({
		transparent: true,
		uniforms: {
			map: { value: null },
			opacity: { value: 1.0 },
			blurAmount: { value: 0.0 },
			scrollForce: { value: 0.0 },
			time: { value: 0.0 },
			isHovered: { value: 0.0 },
		},
		vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normal;

        vec3 pos = position;

        // Create smooth curving based on scroll force
        float curveIntensity = scrollForce * 0.3;

        // Base curve across the plane based on distance from center
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;

        // Add gentle cloth-like ripples
        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;

        // Flag waving effect when hovered, scaled by isHovered (0 to 1) so it eases in and out
        float flagWave = 0.0;
        if (isHovered > 0.0) {
          // Create flag-like wave from left to right
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float waveAmplitude = sin(wavePhase) * 0.1;
          // Damping effect - stronger wave on the right side (free edge)
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = waveAmplitude * dampening;

          // Add secondary smaller waves for more realistic flag motion
          float secondaryWave = sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
          flagWave += secondaryWave;
          flagWave *= isHovered;
        }

        // Apply Z displacement for curving effect (inverted) with cloth ripples and flag wave
        pos.z -= (curve + clothEffect + flagWave);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
		fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vec4 color = texture2D(map, vUv);

        // Simple blur approximation
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;

          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }

        // Add subtle lighting effect based on curving
        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);

        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
	});
};

// Plane size for a texture, keeping its aspect ratio; `size` shrinks it on narrow screens.
const scaleFor = (texture: THREE.Texture, size = 1): [number, number, number] => {
	const image = texture.image as { width: number; height: number } | undefined;
	const aspect = image ? image.width / image.height : 1;
	return aspect > 1 ? [2 * aspect * size, 2 * size, 1] : [2 * size, (2 / aspect) * size, 1];
};

function ImagePlane({
	texture,
	position,
	scale,
	material,
	meshRef,
	onHover,
}: {
	texture: THREE.Texture;
	position: [number, number, number];
	scale: [number, number, number];
	material: THREE.ShaderMaterial;
	meshRef: (mesh: THREE.Mesh | null) => void;
	onHover: (hovered: boolean) => void;
}) {
	useEffect(() => {
		if (material && texture) {
			material.uniforms.map.value = texture;
		}
	}, [material, texture]);

	return (
		<mesh
			ref={meshRef}
			position={position}
			scale={scale}
			material={material}
			onPointerEnter={() => onHover(true)}
			onPointerLeave={() => onHover(false)}
		>
			<planeGeometry args={[1, 1, 32, 32]} />
		</mesh>
	);
}

function GalleryScene({
	images,
	speed = 1,
	visibleCount = 8,
	fadeSettings = {
		fadeIn: { start: 0.05, end: 0.15 },
		fadeOut: { start: 0.85, end: 0.95 },
	},
	blurSettings = {
		blurIn: { start: 0.0, end: 0.1 },
		blurOut: { start: 0.9, end: 1.0 },
		maxBlur: 3.0,
	},
	scrollSource,
}: Omit<InfiniteGalleryProps, 'className' | 'style' | 'paused'>) {
	// Refs, not state: they change every frame, and a re-render per frame is wasted work.
	const scrollVelocity = useRef(0);
	const autoPlay = useRef(true);
	const lastInteraction = useRef(Date.now());
	const meshes = useRef<(THREE.Mesh | null)[]>([]);
	// Hover wave: where each plane's wave is heading (0 or 1); the uniform eases towards it.
	const hoverTarget = useRef<number[]>([]);
	const scrollingUntil = useRef(0);

	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : img
			),
		[images]
	);

	const textures = useTexture(normalizedImages.map((img) => img.src));

	// Create materials pool
	const materials = useMemo(
		() => Array.from({ length: visibleCount }, () => createClothMaterial()),
		[visibleCount]
	);

	// On narrow (portrait) screens the planes keep closer to the centre line, so the pairs
	// aren't cut off at the sides.
	const aspect = useThree((state) => state.size.width / Math.max(1, state.size.height));
	const spread = Math.min(1, aspect / 1.4);
	const size = 0.55 + 0.45 * spread; // and the pictures a little smaller
	const spatialPositions = useMemo(
		() =>
			Array.from({ length: visibleCount }, (_, i) => {
				const p = CENTRED_LAYOUT[i % CENTRED_LAYOUT.length];
				return { x: p.x * spread, y: p.y };
			}),
		[visibleCount, spread]
	);

	const totalImages = normalizedImages.length;
	const depthRange = DEFAULT_DEPTH_RANGE;

	// Initialize plane data
	const planesData = useRef<PlaneData[]>(
		Array.from({ length: visibleCount }, (_, i) => ({
			index: i,
			z: visibleCount > 0 ? ((depthRange / visibleCount) * i + START_DEPTH) % depthRange : 0,
			imageIndex: totalImages > 0 ? i % totalImages : 0,
			x: spatialPositions[i]?.x ?? 0, // Use spatial positions for x
			y: spatialPositions[i]?.y ?? 0, // Use spatial positions for y
		}))
	);

	useEffect(() => {
		planesData.current = Array.from({ length: visibleCount }, (_, i) => ({
			index: i,
			z:
				visibleCount > 0
					? ((depthRange / Math.max(visibleCount, 1)) * i + START_DEPTH) % depthRange
					: 0,
			imageIndex: totalImages > 0 ? i % totalImages : 0,
			x: spatialPositions[i]?.x ?? 0,
			y: spatialPositions[i]?.y ?? 0,
		}));
		// Not on spatialPositions: a resize only moves the planes sideways (each frame reads
		// the new positions); it mustn't send them back to their starting depths.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [depthRange, totalImages, visibleCount]);

	// Page scrolling pushes the gallery: down moves it on, up turns it back.
	useEffect(() => {
		if (!scrollSource) return;
		const onScroll = (event: Event) => {
			const delta = (event as CustomEvent<number>).detail;
			scrollVelocity.current += delta * 0.01 * speed;
			autoPlay.current = false;
			lastInteraction.current = Date.now();
			// No waving while the page scrolls: stop any wave and ignore hovers for a moment.
			scrollingUntil.current = Date.now() + 400;
			hoverTarget.current.fill(0);
		};
		scrollSource.addEventListener('gallery:scroll', onScroll);
		return () => scrollSource.removeEventListener('gallery:scroll', onScroll);
	}, [scrollSource, speed]);

	// Auto-play logic
	useEffect(() => {
		const interval = setInterval(() => {
			if (Date.now() - lastInteraction.current > 3000) {
				autoPlay.current = true;
			}
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	useFrame((state, delta) => {
		// Apply auto-play
		if (autoPlay.current) {
			scrollVelocity.current += 0.3 * delta;
		}

		// Damping: 0.95 per frame at 60 fps, the same per second at any refresh rate.
		scrollVelocity.current *= Math.pow(0.95, delta * 60);
		const velocity = scrollVelocity.current;

		// Update time uniform for all materials, and ease each hover wave towards its target
		const time = state.clock.getElapsedTime();
		const ease = 1 - Math.pow(0.001, delta); // about 0.3 s to settle
		materials.forEach((material, i) => {
			if (material && material.uniforms) {
				material.uniforms.time.value = time;
				material.uniforms.scrollForce.value = velocity;
				const hover = material.uniforms.isHovered;
				hover.value += ((hoverTarget.current[i] ?? 0) - hover.value) * ease;
				if (hover.value < 0.001) hover.value = 0;
			}
		});

		// Update plane positions
		const imageAdvance =
			totalImages > 0 ? visibleCount % totalImages || totalImages : 0;
		const totalRange = depthRange;
		const halfRange = totalRange / 2;

		planesData.current.forEach((plane, i) => {
			let newZ = plane.z + velocity * delta * 10;
			let wrapsForward = 0;
			let wrapsBackward = 0;

			if (newZ >= totalRange) {
				wrapsForward = Math.floor(newZ / totalRange);
				newZ -= totalRange * wrapsForward;
			} else if (newZ < 0) {
				wrapsBackward = Math.ceil(-newZ / totalRange);
				newZ += totalRange * wrapsBackward;
			}

			if (wrapsForward > 0 && imageAdvance > 0 && totalImages > 0) {
				plane.imageIndex =
					(plane.imageIndex + wrapsForward * imageAdvance) % totalImages;
			}

			if (wrapsBackward > 0 && imageAdvance > 0 && totalImages > 0) {
				const step = plane.imageIndex - wrapsBackward * imageAdvance;
				plane.imageIndex = ((step % totalImages) + totalImages) % totalImages;
			}

			plane.z = ((newZ % totalRange) + totalRange) % totalRange;
			plane.x = spatialPositions[i]?.x ?? 0;
			plane.y = spatialPositions[i]?.y ?? 0;

			const worldZ = plane.z - halfRange;

			// Calculate opacity based on fade settings
			const normalizedPosition = plane.z / totalRange; // 0 to 1
			let opacity = 1;

			if (
				normalizedPosition >= fadeSettings.fadeIn.start &&
				normalizedPosition <= fadeSettings.fadeIn.end
			) {
				// Fade in: opacity goes from 0 to 1 within the fade in range
				const fadeInProgress =
					(normalizedPosition - fadeSettings.fadeIn.start) /
					(fadeSettings.fadeIn.end - fadeSettings.fadeIn.start);
				opacity = fadeInProgress;
			} else if (normalizedPosition < fadeSettings.fadeIn.start) {
				// Before fade in starts: fully transparent
				opacity = 0;
			} else if (
				normalizedPosition >= fadeSettings.fadeOut.start &&
				normalizedPosition <= fadeSettings.fadeOut.end
			) {
				// Fade out: opacity goes from 1 to 0 within the fade out range
				const fadeOutProgress =
					(normalizedPosition - fadeSettings.fadeOut.start) /
					(fadeSettings.fadeOut.end - fadeSettings.fadeOut.start);
				opacity = 1 - fadeOutProgress;
			} else if (normalizedPosition > fadeSettings.fadeOut.end) {
				// After fade out ends: fully transparent
				opacity = 0;
			}

			// Clamp opacity between 0 and 1
			opacity = Math.max(0, Math.min(1, opacity));

			// Calculate blur based on blur settings
			let blur = 0;

			if (
				normalizedPosition >= blurSettings.blurIn.start &&
				normalizedPosition <= blurSettings.blurIn.end
			) {
				// Blur in: blur goes from maxBlur to 0 within the blur in range
				const blurInProgress =
					(normalizedPosition - blurSettings.blurIn.start) /
					(blurSettings.blurIn.end - blurSettings.blurIn.start);
				blur = blurSettings.maxBlur * (1 - blurInProgress);
			} else if (normalizedPosition < blurSettings.blurIn.start) {
				// Before blur in starts: full blur
				blur = blurSettings.maxBlur;
			} else if (
				normalizedPosition >= blurSettings.blurOut.start &&
				normalizedPosition <= blurSettings.blurOut.end
			) {
				// Blur out: blur goes from 0 to maxBlur within the blur out range
				const blurOutProgress =
					(normalizedPosition - blurSettings.blurOut.start) /
					(blurSettings.blurOut.end - blurSettings.blurOut.start);
				blur = blurSettings.maxBlur * blurOutProgress;
			} else if (normalizedPosition > blurSettings.blurOut.end) {
				// After blur out ends: full blur
				blur = blurSettings.maxBlur;
			}

			// Clamp blur to reasonable values
			blur = Math.max(0, Math.min(blurSettings.maxBlur, blur));

			// Update material uniforms
			const material = materials[i];
			if (material && material.uniforms) {
				material.uniforms.opacity.value = opacity;
				material.uniforms.blurAmount.value = blur;
			}

			// Move the plane, and swap its picture when it has wrapped round.
			const mesh = meshes.current[i];
			const texture = textures[plane.imageIndex];
			if (mesh) {
				mesh.position.set(plane.x, plane.y, worldZ);
				if (material && texture && material.uniforms.map.value !== texture) {
					material.uniforms.map.value = texture;
					mesh.scale.set(...scaleFor(texture, size));
				}
			}
		});
	});

	if (normalizedImages.length === 0) return null;

	return (
		<>
			{planesData.current.map((plane, i) => {
				const texture = textures[plane.imageIndex];
				const material = materials[i];

				if (!texture || !material) return null;

				const worldZ = plane.z - depthRange / 2;

				return (
					<ImagePlane
						key={plane.index}
						texture={texture}
						position={[plane.x, plane.y, worldZ]} // Position planes relative to camera center
						scale={scaleFor(texture, size)}
						material={material}
						meshRef={(mesh) => {
							meshes.current[i] = mesh;
						}}
						onHover={(hovered) => {
							hoverTarget.current[i] = hovered && Date.now() > scrollingUntil.current ? 1 : 0;
						}}
					/>
				);
			})}
		</>
	);
}

// Fallback component for when WebGL is not available
function FallbackGallery({ images }: { images: ImageItem[] }) {
	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : img
			),
		[images]
	);

	return (
		<div className="gallery-fallback">
			<div className="gallery-fallback__grid">
				{normalizedImages.map((img, i) => (
					<img
						key={i}
						src={img.src}
						alt={img.alt ?? ''}
						className="gallery-fallback__img"
					/>
				))}
			</div>
		</div>
	);
}

export default function InfiniteGallery({
	images,
	speed = 1,
	visibleCount = 8,
	className = 'gallery-3d',
	style,
	fadeSettings = {
		fadeIn: { start: 0.05, end: 0.25 },
		fadeOut: { start: 0.4, end: 0.43 },
	},
	blurSettings = {
		blurIn: { start: 0.0, end: 0.1 },
		blurOut: { start: 0.4, end: 0.43 },
		maxBlur: 8.0,
	},
	scrollSource,
	paused = false,
}: InfiniteGalleryProps) {
	const [webglSupported, setWebglSupported] = useState(true);

	useEffect(() => {
		// Check WebGL support
		try {
			const canvas = document.createElement('canvas');
			const gl =
				canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			if (!gl) {
				setWebglSupported(false);
			}
		} catch (e) {
			setWebglSupported(false);
		}
	}, []);

	if (!webglSupported) {
		return (
			<div className={className} style={style}>
				<FallbackGallery images={images} />
			</div>
		);
	}

	return (
		<div className={className} style={style}>
			<Canvas
				camera={{ position: [0, 0, 0], fov: 55 }}
				gl={{ antialias: true, alpha: true }}
				dpr={[1, 1.5]}
				resize={{ scroll: false, offsetSize: true }}
				frameloop={paused ? 'never' : 'always'}
			>
				<Suspense fallback={null}>
					<GalleryScene
						images={images}
						speed={speed}
						visibleCount={visibleCount}
						fadeSettings={fadeSettings}
						blurSettings={blurSettings}
						scrollSource={scrollSource}
					/>
				</Suspense>
			</Canvas>
		</div>
	);
}
