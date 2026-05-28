/**
 * Hero block
 * EDS structure: two-column table → col0: picture/image, col1: content
 *
 * Variants (add as extra word in block name):
 *   hero background  → uses the image as CSS background-image
 */
import { parseBlock } from '../../scripts/utils/block-parser.js';

const SCHEMA = {
  structure: 'container',
  headerRows: 1,
  headerFields: [
    { name: 'image', col: 0, type: 'picture' },
    { name: 'textContent', col: 1, type: 'html' },
  ],
};

export default function decorate(block) {
  const hasBackground = block.classList.contains('background');
  const { image, textContent } = parseBlock(block, SCHEMA);

  block.innerHTML = '';

  if (image) {
    block.classList.add('hero--has-image');
    if (hasBackground) {
      const img = image.querySelector?.('img') ?? image;
      if (img?.src) block.style.backgroundImage = `url(${img.src})`;
    } else {
      const imageWrapper = document.createElement('div');
      imageWrapper.classList.add('hero__image');
      imageWrapper.append(image);
      block.append(imageWrapper);
    }
  }

  if (textContent) {
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('hero__content');
    const temp = document.createElement('div');
    temp.innerHTML = textContent;
    temp.querySelectorAll('a').forEach((a) => {
      a.classList.add('button', 'button--primary');
      const wrapper = document.createElement('p');
      wrapper.classList.add('button-container');
      a.replaceWith(wrapper);
      wrapper.append(a);
    });
    contentWrapper.append(...temp.children);
    block.append(contentWrapper);
  }
}
