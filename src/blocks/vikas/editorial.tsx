import { ArrowUpRight, Quote } from 'lucide-react';

import { m } from '@/paraglide/messages.js';
import { VikasArtwork } from '@/components/vikas/artwork';

export function VikasIntroduction() {
  return (
    <section
      className="vikas-section vikas-introduction"
      aria-labelledby="introduction-title"
    >
      <div>
        <h2 id="introduction-title">{m['vikas.seo.intro_title']()}</h2>
      </div>
      <div className="vikas-reading-copy">
        <p>{m['vikas.seo.intro1']()}</p>
        <p>{m['vikas.seo.intro2']()}</p>
      </div>
    </section>
  );
}

export function VikasStyleGuide() {
  const styles = [
    { title: m['vikas.seo.style1_title'](), body: m['vikas.seo.style1']() },
    { title: m['vikas.seo.style2_title'](), body: m['vikas.seo.style2']() },
    { title: m['vikas.seo.style3_title'](), body: m['vikas.seo.style3']() },
  ];
  return (
    <section
      className="vikas-section vikas-style-guide"
      aria-labelledby="style-guide-title"
    >
      <div className="vikas-section-heading">
        <div>
          <h2 id="style-guide-title">{m['vikas.seo.styles_title']()}</h2>
        </div>
      </div>
      <div className="vikas-style-essays">
        {styles.map((style) => (
          <article key={style.title}>
            <h3>{style.title}</h3>
            <p>{style.body}</p>
          </article>
        ))}
      </div>
      <aside className="vikas-frame-note">
        <h3>{m['vikas.seo.frame_title']()}</h3>
        <p>{m['vikas.seo.frame_body']()}</p>
      </aside>
    </section>
  );
}

export function VikasPromptGuide({
  onUse,
}: {
  onUse: (prompt: string) => void;
}) {
  const tips = [
    { title: m['vikas.seo.prompt1_title'](), body: m['vikas.seo.prompt1']() },
    { title: m['vikas.seo.prompt2_title'](), body: m['vikas.seo.prompt2']() },
    { title: m['vikas.seo.prompt3_title'](), body: m['vikas.seo.prompt3']() },
  ];
  return (
    <section
      id="prompt-guide"
      className="vikas-section vikas-prompt-guide"
      aria-labelledby="prompt-guide-title"
    >
      <div className="vikas-prompt-editorial">
        <h2 id="prompt-guide-title">{m['vikas.seo.prompt_title']()}</h2>
        <p>{m['vikas.seo.prompt_intro']()}</p>
        <div className="vikas-prompt-tips">
          {tips.map((tip) => (
            <article key={tip.title}>
              <h3>{tip.title}</h3>
              <p>{tip.body}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="vikas-prompt-example">
        <div className="vikas-prompt-example-image">
          <VikasArtwork
            index={2}
            alignment="top"
            alt={m['vikas.template.midnight-city.description']()}
          />
          <span>{m['vikas.gallery.example']()}</span>
        </div>
        <div className="vikas-prompt-example-copy">
          <Quote size={22} aria-hidden="true" />
          <p className="vikas-eyebrow">
            {m['vikas.seo.prompt_example_label']()}
          </p>
          <blockquote>{m['vikas.seo.prompt_example']()}</blockquote>
          <button onClick={() => onUse(m['vikas.seo.prompt_example']())}>
            {m['vikas.seo.prompt_cta']()}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
