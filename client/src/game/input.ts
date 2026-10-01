/**
 * One input for the whole game: touch/mouse anywhere on `el`, or the spacebar.
 * Calls `onChange(true)` on press and `onChange(false)` on release.
 */
export function attachInput(el: HTMLElement, onChange: (down: boolean) => void): () => void {
  let pointers = 0;
  let key = false;
  let last = false;
  const emit = () => {
    const now = pointers > 0 || key;
    if (now !== last) {
      last = now;
      onChange(now);
    }
  };
  const down = (e: PointerEvent) => {
    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    pointers++;
    emit();
  };
  const up = (e: PointerEvent) => {
    e.preventDefault();
    pointers = Math.max(0, pointers - 1);
    emit();
  };
  const keyDown = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (e.repeat) return;
    key = true;
    emit();
  };
  const keyUp = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    key = false;
    emit();
  };
  const blur = () => {
    pointers = 0;
    key = false;
    emit();
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", blur);
  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", blur);
  };
}
