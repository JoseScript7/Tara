import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  // Parse paragraphs and lines
  const lines = content.split('\n');

  const renderFormattedLine = (line: string, index: number) => {
    // 1. Heading 3: ### Heading
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} className="text-sm md:text-base font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5">
          {parseInlineFormatting(line.replace('### ', ''))}
        </h3>
      );
    }

    // 2. Heading 2: ## Heading
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} className="text-base md:text-lg font-bold text-slate-900 mt-3.5 mb-2">
          {parseInlineFormatting(line.replace('## ', ''))}
        </h2>
      );
    }

    // 3. Numbered List: 1. Item
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return (
        <div key={index} className="flex items-start gap-2 my-1 pl-1">
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200 mt-0.5">
            {numMatch[1]}
          </span>
          <div className="flex-1 text-xs md:text-sm text-slate-800 leading-relaxed">
            {parseInlineFormatting(numMatch[2])}
          </div>
        </div>
      );
    }

    // 4. Bullet List: - Item or * Item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={index} className="flex items-start gap-2 my-1 pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FE8A70] shrink-0 mt-1.5" />
          <div className="flex-1 text-xs md:text-sm text-slate-800 leading-relaxed">
            {parseInlineFormatting(line.substring(2))}
          </div>
        </div>
      );
    }

    // 5. Empty line spacer
    if (line.trim() === '') {
      return <div key={index} className="h-1.5" />;
    }

    // 6. Regular paragraph line
    return (
      <p key={index} className="my-1 text-xs md:text-sm text-slate-800 leading-relaxed">
        {parseInlineFormatting(line)}
      </p>
    );
  };

  // Helper for inline **bold**, `code`, and *italic*
  const parseInlineFormatting = (text: string): React.ReactNode => {
    // Split by bold (**bold**) and inline code (`code`)
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className={`space-y-0.5 ${className}`}>
      {lines.map((line, idx) => renderFormattedLine(line, idx))}
    </div>
  );
};
