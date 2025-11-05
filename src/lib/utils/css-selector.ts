export function buildCssSelector(element: Element): string {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }
  const path: string[] = [];
  let current: Element | null = element;
  while (current && current.nodeType === Node.ELEMENT_NODE && path.length < 5) {
    let selector = current.nodeName.toLowerCase();
    if (current.classList.length > 0) {
      selector += `.${Array.from(current.classList)
        .map((cls) => CSS.escape(cls))
        .join('.')}`;
    }
    const siblingIndex = getIndex(current);
    selector += `:nth-of-type(${siblingIndex + 1})`;
    path.unshift(selector);
    if (current.parentElement) {
      current = current.parentElement;
    } else {
      break;
    }
  }
  return path.join(' > ');
}

function getIndex(element: Element) {
  let index = 0;
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === element.tagName) {
      index += 1;
    }
    sibling = sibling.previousElementSibling;
  }
  return index;
}
