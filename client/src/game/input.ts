/**
 * One input for the whole game: touch/mouse anywhere on `el`, or the spacebar.
 * Calls `onChange(true)` on press and `onChange(false)` on release.
 */
export function attachInput(el: HTMLElement, onChange: (down: boolean) => void): () => void {
  const pointers = new Set<number>();
  let key = false;
  let last = false;
  const prevTouchAction = el.style.touchAction;
  el.style.touchAction = "none";

  const emit = () => {
    const now = pointers.size > 0 || key;
    if (now !== last) {
      last = now;
      onChange(now);
    }
  };

  const down = (e: PointerEvent) => {
    // Ignore non-primary mouse buttons
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Ignore if target is inside interactive elements
    const target = e.target as Element | null;
    if (target?.closest("button, a, input, textarea, select, [data-no-input]")) return;

    e.preventDefault();
    el.setPointerCapture?.(e.pointerId);
    pointers.add(e.pointerId);
    emit();
  };

  const up = (e: PointerEvent) => {
    e.preventDefault();
    pointers.delete(e.pointerId);
    emit();
  };

  const keyDown = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    // Return early if target is interactive
    const target = e.target as Element | null;
    const isInteractive =
      target?.matches?.("input, textarea, select, button, [contenteditable]") ??
      false;
    if (isInteractive) return;

    e.preventDefault();
    if (e.repeat) return;
    key = true;
    emit();
  };

  const keyUp = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    // Return early if target is interactive
    const target = e.target as Element | null;
    const isInteractive =
      target?.matches?.("input, textarea, select, button, [contenteditable]") ??
      false;
    if (isInteractive) return;

    e.preventDefault();
    key = false;
    emit();
  };

  const contextMenu = (e: Event) => {
    e.preventDefault();
  };

  const reset = () => {
    pointers.clear();
    key = false;
    emit();
  };

  const onVisibilityChange = () => {
    if (document.hidden) reset();
  };

  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("lostpointercapture", up);
  el.addEventListener("contextmenu", contextMenu);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    // If input is currently down, emit release before cleanup
    if (pointers.size > 0 || key) {
      pointers.clear();
      key = false;
      onChange(false);
    }

    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    el.removeEventListener("lostpointercapture", up);
    el.removeEventListener("contextmenu", contextMenu);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
    window.removeEventListener("blur", reset);
    document.removeEventListener("visibilitychange", onVisibilityChange);

    el.style.touchAction = prevTouchAction;
  };
}
