// "Committees at a glance" as a ring of committee cards (6 October): a React island. esbuild
// bundles this file, React and the circular gallery into /js/committee-ring.js
// (eleventy.config.js); src/js/ring.js loads it as the section comes near and passes the cards
// (committee code, full name, photo, link) from the page.
//
// The ring is sized to the section's width: on phones it's wider than the screen, so the side
// cards run off the edges; on wide screens it stays within the page.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CircularGallery, type GalleryItem } from '@/components/ui/circular-gallery';

const sizeFor = (width: number, count: number) => {
	const radius = width < 700 ? width * 0.8 : Math.min(560, width * 0.38);
	// Cards nearly touch round the ring, 3:4 like the original.
	const cardWidth = Math.min(radius * 0.5, ((2 * Math.PI * radius) / Math.max(count, 1)) * 0.9);
	return { radius, cardWidth, cardHeight: (cardWidth * 4) / 3 };
};

function Ring({ root, items }: { root: HTMLElement; items: GalleryItem[] }) {
	const [width, setWidth] = useState(root.clientWidth);

	useEffect(() => {
		const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
		observer.observe(root);
		return () => observer.disconnect();
	}, [root]);

	const { radius, cardWidth, cardHeight } = sizeFor(width, items.length);
	return (
		<CircularGallery
			items={items}
			radius={radius}
			cardWidth={cardWidth}
			cardHeight={cardHeight}
			autoRotateSpeed={0.1}
			scrollFactor={0.12}
			aria-label="Committees"
			// Room for the front card, which the perspective draws about 1.4 times larger.
			style={{ height: Math.round(cardHeight * 1.6) }}
		/>
	);
}

export function mount(root: HTMLElement, items: GalleryItem[]) {
	createRoot(root).render(<Ring root={root} items={items} />);
}
