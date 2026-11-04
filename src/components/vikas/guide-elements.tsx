import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function GuideDownload({
  href,
  filename,
  label,
}: {
  href: string;
  filename: string;
  label: string;
}) {
  return (
    <div className="guide-download">
      <a className="vikas-button" href={href} download={filename}>
        {label}
      </a>
    </div>
  );
}

export function GuideTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div
      className="guide-table"
      tabIndex={0}
      role="region"
      aria-label={columns.join(' / ')}
    >
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GuideFigure({
  src,
  alt,
  caption,
  width = 1440,
  height = 960,
}: {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="guide-figure">
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function GuidePrompt({
  prompt,
  copyLabel,
  copiedLabel,
  errorLabel,
}: {
  prompt: string;
  copyLabel: string;
  copiedLabel: string;
  errorLabel: string;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setState('copied');
    } catch {
      setState('error');
    }
  }
  return (
    <div className="guide-prompt">
      <p lang="en">{prompt}</p>
      <button type="button" onClick={copy} className="vikas-button-secondary">
        {state === 'copied' ? <Check size={16} /> : <Copy size={16} />}
        {state === 'copied' ? copiedLabel : copyLabel}
      </button>
      <span
        role="status"
        className={state === 'error' ? 'guide-copy-error' : 'sr-only'}
      >
        {state === 'error' ? errorLabel : state === 'copied' ? copiedLabel : ''}
      </span>
    </div>
  );
}
