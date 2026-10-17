/** Svelte attachment that shrinks a box's text until its content fits, by setting --fit from 1 down to MIN_SCALE. */

const STEP = 0.04;
const MIN_SCALE = 0.4;

function fitsInside(node: HTMLElement): boolean {
  return node.scrollHeight <= node.clientHeight + 1;
}

export function fitContent(node: HTMLElement): () => void {
  function fit(): void {
    let scale = 1;
    node.style.setProperty('--fit', '1');
    while (!fitsInside(node) && scale > MIN_SCALE) {
      scale -= STEP;
      node.style.setProperty('--fit', scale.toFixed(2));
    }
  }

  const resize = new ResizeObserver(fit);
  const mutation = new MutationObserver(fit);
  resize.observe(node);
  mutation.observe(node, { childList: true, subtree: true, characterData: true });
  document.fonts.ready.then(fit);
  fit();

  return () => {
    resize.disconnect();
    mutation.disconnect();
  };
}
