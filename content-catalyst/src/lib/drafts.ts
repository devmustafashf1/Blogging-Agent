export interface BlogDraft {
  id: string;
  title: string;
  meta_description: string;
  intro: string;
  sections: { heading: string; content: string }[];
  conclusion: string;
  seo_keywords: string[];
  estimated_word_count: number;
  topic: string;
  createdAt: string;
  images?: { url: string; alt: string }[];
}

const KEY = "blog_drafts";

export const getDrafts = (): BlogDraft[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
};

export const getDraftById = (id: string): BlogDraft | undefined =>
  getDrafts().find((d) => d.id === id);

export const saveDraft = (draft: BlogDraft): void => {
  const drafts = getDrafts();
  const idx = drafts.findIndex((d) => d.id === draft.id);
  if (idx >= 0) drafts[idx] = draft;
  else drafts.unshift(draft);
  localStorage.setItem(KEY, JSON.stringify(drafts));
};

export const deleteDraft = (id: string): void => {
  localStorage.setItem(KEY, JSON.stringify(getDrafts().filter((d) => d.id !== id)));
};

export const blogToHtml = (draft: BlogDraft): string => {
  const paragraphs = (text: string) =>
    text.split("\n").filter((l) => l.trim()).map((l) => `<p>${l}</p>`).join("\n");

  return [
    draft.intro ? paragraphs(draft.intro) : "",
    ...(draft.sections || []).map(
      (s) => `<h2>${s.heading}</h2>\n${paragraphs(s.content)}`
    ),
    draft.conclusion
      ? `<h2>Conclusion</h2>\n${paragraphs(draft.conclusion)}`
      : "",
  ].filter(Boolean).join("\n");
};
