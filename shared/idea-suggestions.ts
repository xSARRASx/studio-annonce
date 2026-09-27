/** Toggle only the chosen suggestion, keeping the other suggestions and free text. */
export function suggestionState(current: string, suggestion: string, limit = 4000) {
  const index = current.indexOf(suggestion);
  const added = index >= 0;
  const separator = current && !current.endsWith("\n") ? "\n" : "";
  let text = `${current}${separator}${suggestion}`;
  if (added) {
    let start = index;
    let end = index + suggestion.length;
    // Remove one adjacent separator so toggling a middle card leaves clean lines.
    if (start > 0 && current[start - 1] === "\n") start -= 1;
    else if (current[end] === "\n") end += 1;
    text = current.slice(0, start) + current.slice(end);
  }
  return { text, added, full: text.length > limit };
}
