// The top of the Social Night page as a glyph portal (7 October): a React island. esbuild
// bundles this file, React and the portal into /js/social-portal.js (eleventy.config.js);
// src/js/social-night.js loads it straight away.
//
// The page's own hero is server-rendered, and shows as it is without JavaScript, with reduced
// motion, or if this fails. Here its parts move into the portal: the night sky (moon, bats and
// embers) is what shows through the letters, the title, date and button are what you arrive
// at, and the edition and date line sit round the word in the opening frame.
import { useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import GlyphPortal from '@/components/ui/glyph-portal';

export interface PortalParts {
	word: string;
	enterLabel: string;
	scene: HTMLElement;
	content: HTMLElement;
	front: HTMLElement;
}

// A slot that takes over an element from the page (React never renders inside it).
function Adopt({ node, className }: { node: HTMLElement; className: string }) {
	const ref = useRef<HTMLDivElement>(null);
	useLayoutEffect(() => {
		ref.current?.append(node);
		node.hidden = false;
	}, [node]);
	return <div ref={ref} className={className} />;
}

// Rendered at once (flushSync), so the page's hero can step aside in the same frame.
export function mount(root: HTMLElement, parts: PortalParts) {
	const reactRoot = createRoot(root);
	flushSync(() => reactRoot.render(
		<GlyphPortal
			word={parts.word}
			interactive={false}
			fontFamily='"Montserrat", sans-serif'
			fontWeight={900}
			lineHeight={0.9}
			scrollLength={2.4}
			enterLabel={parts.enterLabel}
			className="sn-portal"
			background={<Adopt node={parts.scene} className="sn-portal__scene" />}
			front={<Adopt node={parts.front} className="sn-portal__front" />}
		>
			<Adopt node={parts.content} className="sn-portal__content" />
		</GlyphPortal>
	));
}
