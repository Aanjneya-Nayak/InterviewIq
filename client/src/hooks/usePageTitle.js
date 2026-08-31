import { useEffect } from "react";

/**
 * usePageTitle
 *
 * Sets document.title to "<pageTitle> — InterviewIQ" and resets it on unmount.
 *
 * @param {string} title — the page-specific portion of the title
 */
const usePageTitle = (title) => {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — InterviewIQ` : "InterviewIQ";
    return () => { document.title = prev; };
  }, [title]);
};

export default usePageTitle;
