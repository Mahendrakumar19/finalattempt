import React from 'react';

/**
 * Parses basic WhatsApp Markdown and renders it as React elements.
 * Supports:
 * - *bold*
 * - _italic_
 * - ~strikethrough~
 * - ```monospace```
 */
export function renderWhatsAppMarkdown(text: string | null | undefined) {
  if (!text) return null;

  // Split by line breaks to preserve them
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {parseLine(line)}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

function parseLine(line: string) {
  // Regex to match ```code```, *bold*, _italic_, ~strike~
  const regex = /(```[\s\S]*?```|\*[^*]+\*|_[^_]+_|~[^~]+~)/g;
  
  const parts = line.split(regex);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      return <code key={index} className="bg-background/20 rounded px-1 py-0.5 font-mono text-[11px]">{part.slice(3, -3)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={index} className="font-bold">{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('~') && part.endsWith('~')) {
      return <del key={index} className="line-through opacity-80">{part.slice(1, -1)}</del>;
    }
    
    // Also format checkmarks or bullets to look a bit nicer if they are at the start of a line segment
    // But since we already split, we can just replace '✔' with something nicer or keep it.
    // We will just return the raw text for the rest.
    return part;
  });
}
