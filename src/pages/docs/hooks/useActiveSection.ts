import { useEffect, useState } from "react";

/** Distance from the viewport top (sticky header + scroll margin) at which a heading counts as "current". */
const ACTIVATION_OFFSET_PX = 100;

/**
 * Returns the id of the last element (in the given document order) whose top
 * has scrolled past the activation line, so the highlighted nav item always
 * matches the heading the reader is looking at.
 */
export function useActiveSection(ids: readonly string[]): string {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      let current = ids[0] ?? "";
      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) {
          continue;
        }
        if (element.getBoundingClientRect().top <= ACTIVATION_OFFSET_PX) {
          current = id;
        } else {
          break;
        }
      }
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (atBottom && ids.length > 0) {
        current = ids[ids.length - 1];
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [ids]);

  return activeId;
}
