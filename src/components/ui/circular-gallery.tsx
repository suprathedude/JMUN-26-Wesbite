// Circular 3D gallery (from 21st.dev, "circular-gallery"), adapted 6 October for "Committees at
// a glance" on the homepage (src/islands/committee-ring.tsx, loaded by src/js/ring.js):
//
// - Fixed the card transform: the original's template string was broken
//   (`rotateY(itemAngledeg)translateZ({radius}px)`), which stacked every card in one place.
// - The ring turns slowly by itself and scrolling past nudges it round (`scrollFactor` degrees
//   per pixel, while it's on screen). The original mapped the whole page's scroll to one turn.
// - The ring is turned through refs each frame, not React state: the original re-rendered every
//   card on every frame. It only animates while on screen.
// - It holds still under the pointer, so cards are easy to click, and keyboard focus turns the
//   focused card to the front. With reduced motion it doesn't turn by itself or with scrolling.
// - Cards can link somewhere (`href`). Their size follows `cardWidth` and `cardHeight`, and the
//   perspective follows the radius, in the original's proportions.
// - Plain classes (circular-gallery__*, styled in home.css) replace the Tailwind ones: the site
//   has no Tailwind. `photo.by` is optional; without it there's no credit line.
import React, { useEffect, useRef, HTMLAttributes } from 'react';

// A simple utility for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => {
	return classes.filter(Boolean).join(' ');
};

// Define the type for a single gallery item
export interface GalleryItem {
	common: string;
	binomial: string;
	href?: string;
	photo: {
		url: string;
		text: string;
		pos?: string;
		by?: string;
	};
}

// Define the props for the CircularGallery component
interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
	items: GalleryItem[];
	/** Controls how far the items are from the center. */
	radius?: number;
	/** Controls the speed of auto-rotation when not scrolling (degrees per frame at 60 fps). */
	autoRotateSpeed?: number;
	/** Degrees the ring turns per pixel of page scroll while it's on screen. */
	scrollFactor?: number;
	cardWidth?: number;
	cardHeight?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
	(
		{
			items,
			className,
			radius = 600,
			autoRotateSpeed = 0.02,
			scrollFactor = 0.15,
			cardWidth = 300,
			cardHeight = 400,
			style,
			...props
		},
		ref
	) => {
		const rootRef = useRef<HTMLDivElement | null>(null);
		const ringRef = useRef<HTMLDivElement>(null);
		const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
		const rotation = useRef(0); // where the ring is drawn, in degrees
		const target = useRef<number | null>(null); // where it's heading when a card is focused

		const anglePerItem = 360 / Math.max(items.length, 1);

		const setRoot = (el: HTMLDivElement | null) => {
			rootRef.current = el;
			if (typeof ref === 'function') ref(el);
			else if (ref) ref.current = el;
		};

		useEffect(() => {
			const root = rootRef.current;
			const ring = ringRef.current;
			if (!root || !ring) return;
			const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
			let frame = 0;
			let last = 0;
			let onScreen = false;
			let held = false;
			let scrollingUntil = 0;
			let lastY = window.scrollY;

			// Turn the ring, and fade each card by how far it is from the front.
			const draw = () => {
				const r = rotation.current;
				ring.style.transform = `rotateY(${r.toFixed(3)}deg)`;
				itemRefs.current.forEach((el, i) => {
					if (!el) return;
					const relativeAngle = (((i * anglePerItem + r) % 360) + 360) % 360;
					const normalizedAngle = relativeAngle > 180 ? 360 - relativeAngle : relativeAngle;
					el.style.opacity = Math.max(0.3, 1 - normalizedAngle / 180).toFixed(3);
				});
			};

			const tick = (now: number) => {
				const dt = last ? Math.min(now - last, 64) : 16.7;
				last = now;
				if (target.current !== null) {
					const diff = target.current - rotation.current;
					rotation.current += diff * (1 - Math.pow(0.85, dt / 16.7));
					if (Math.abs(diff) < 0.05) {
						rotation.current = target.current;
						target.current = null;
					}
				} else if (!calm && !held && now > scrollingUntil) {
					rotation.current += autoRotateSpeed * (dt / 16.7);
				}
				draw();
				const moving = target.current !== null || (!calm && !held);
				frame = onScreen && moving ? requestAnimationFrame(tick) : 0;
			};

			const start = () => {
				if (!frame && onScreen) {
					last = 0;
					frame = requestAnimationFrame(tick);
				}
			};

			const observer = new IntersectionObserver(([entry]) => {
				onScreen = entry.isIntersecting;
				lastY = window.scrollY;
				if (onScreen) start();
				else if (frame) {
					cancelAnimationFrame(frame);
					frame = 0;
				}
			});
			observer.observe(root);

			// Scrolling past nudges the ring round.
			const onScroll = () => {
				const y = window.scrollY;
				const delta = y - lastY;
				lastY = y;
				if (!onScreen || calm || held || !delta) return;
				rotation.current += delta * scrollFactor;
				scrollingUntil = performance.now() + 150;
				start();
			};
			window.addEventListener('scroll', onScroll, { passive: true });

			const onEnter = () => {
				held = true;
			};
			const onLeave = () => {
				held = root.contains(document.activeElement);
				start();
			};
			// Keyboard focus turns the focused card to the front, the short way round.
			const onFocusIn = (event: FocusEvent) => {
				const index = itemRefs.current.findIndex((el) => el?.contains(event.target as Node));
				if (index === -1) return;
				held = true;
				const front = -index * anglePerItem;
				const delta = ((((front - rotation.current) % 360) + 540) % 360) - 180;
				if (calm) {
					rotation.current += delta;
					draw();
					return;
				}
				target.current = rotation.current + delta;
				start();
			};
			const onFocusOut = (event: FocusEvent) => {
				if (root.contains(event.relatedTarget as Node)) return;
				held = root.matches(':hover');
				start();
			};
			root.addEventListener('pointerenter', onEnter);
			root.addEventListener('pointerleave', onLeave);
			root.addEventListener('focusin', onFocusIn);
			root.addEventListener('focusout', onFocusOut);

			draw();

			return () => {
				observer.disconnect();
				if (frame) cancelAnimationFrame(frame);
				window.removeEventListener('scroll', onScroll);
				root.removeEventListener('pointerenter', onEnter);
				root.removeEventListener('pointerleave', onLeave);
				root.removeEventListener('focusin', onFocusIn);
				root.removeEventListener('focusout', onFocusOut);
			};
		}, [anglePerItem, autoRotateSpeed, scrollFactor]);

		return (
			<div
				ref={setRoot}
				role="region"
				aria-label="Circular 3D Gallery"
				className={cn('circular-gallery', className)}
				style={{ perspective: `${Math.round(radius * 3.33)}px`, ...style }}
				{...props}
			>
				<div ref={ringRef} className="circular-gallery__ring">
					{items.map((item, i) => {
						const Card = item.href ? 'a' : 'div';
						return (
							<div
								key={`${item.photo.url}-${i}`}
								ref={(el) => {
									itemRefs.current[i] = el;
								}}
								role="group"
								aria-label={item.common}
								className="circular-gallery__item"
								style={{
									width: cardWidth,
									height: cardHeight,
									marginLeft: -cardWidth / 2,
									marginTop: -cardHeight / 2,
									transform: `rotateY(${i * anglePerItem}deg) translateZ(${radius}px)`,
								}}
							>
								<Card className="circular-gallery__card" {...(item.href ? { href: item.href } : {})}>
									<img
										src={item.photo.url}
										alt={item.photo.text}
										loading="lazy"
										decoding="async"
										className="circular-gallery__img"
										style={{ objectPosition: item.photo.pos || 'center' }}
									/>
									<div className="circular-gallery__caption">
										<h3 className="circular-gallery__title">{item.common}</h3>
										<em className="circular-gallery__subtitle">{item.binomial}</em>
										{item.photo.by && <p className="circular-gallery__credit">Photo by: {item.photo.by}</p>}
									</div>
								</Card>
							</div>
						);
					})}
				</div>
			</div>
		);
	}
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };
