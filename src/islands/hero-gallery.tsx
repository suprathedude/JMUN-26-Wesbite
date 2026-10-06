// The homepage gallery as a React island (6 October). esbuild bundles this file, React,
// Three.js and the gallery component into /js/hero-gallery.js (eleventy.config.js), and
// src/js/gallery.js loads it only when the gallery plays. gallery.js drives it through events
// on the root element:
//   "gallery:scroll"  detail: the page's scroll delta in px (moves the photos)
//   "gallery:pause"   detail: true to stop drawing, false to start again
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import InfiniteGallery from '@/components/ui/3d-gallery-photography';

type Image = { src: string; alt: string };

function Host({ root, images, startPaused }: { root: HTMLElement; images: Image[]; startPaused: boolean }) {
	const [paused, setPaused] = useState(startPaused);

	useEffect(() => {
		const onPause = (event: Event) => setPaused((event as CustomEvent<boolean>).detail);
		root.addEventListener('gallery:pause', onPause);
		return () => root.removeEventListener('gallery:pause', onPause);
	}, [root]);

	return (
		<InfiniteGallery
			images={images}
			speed={1.2}
			visibleCount={12}
			className="gallery__three"
			scrollSource={root}
			paused={paused}
		/>
	);
}

export function mount(root: HTMLElement, images: Image[], startPaused = false) {
	createRoot(root).render(<Host root={root} images={images} startPaused={startPaused} />);
}
