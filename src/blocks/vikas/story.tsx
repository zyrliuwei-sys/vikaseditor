import { useState } from 'react';
import {
  ArrowRight,
  Camera,
  Film,
  ImagePlus,
  Pause,
  Play,
  Plus,
  Sparkles,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import { VikasArtwork } from '@/components/vikas/artwork';

import { getVikasFaq } from './faq-content';

export function VikasVideoStory({ onCreate }: { onCreate: () => void }) {
  const [playing, setPlaying] = useState(false);
  return (
    <section
      className="vikas-section vikas-video-story"
      aria-labelledby="video-story-title"
    >
      <div className="vikas-video-copy">
        <span className="vikas-line-label">
          <Film size={16} />
          {m['vikas.video.motion']()}
        </span>
        <h2 id="video-story-title">
          {m['vikas.video.title1']()}
          <br />
          <span>{m['vikas.video.title2']()}</span>
        </h2>
        <p>{m['vikas.video.description']()}</p>
        <ul>
          <li>
            <Camera size={17} />
            {m['vikas.video.prompt']()}
          </li>
          <li>
            <Film size={17} />
            {m['vikas.video.length']()}
          </li>
        </ul>
        <button className="vikas-button" onClick={onCreate}>
          {m['vikas.video.cta']()}
          <ArrowRight size={17} />
        </button>
      </div>
      <div>
        <div className={`vikas-motion-preview ${playing ? 'is-playing' : ''}`}>
          <div className="vikas-motion-art">
            <VikasArtwork index={2} alt={m['vikas.video.caption']()} />
          </div>
          <div className="vikas-motion-top">
            <span>
              <Film size={14} />
              {m['vikas.video.preview']()}
            </span>
            <span>5s</span>
          </div>
          <button
            className="vikas-play"
            aria-label={
              playing ? m['vikas.video.pause']() : m['vikas.video.play']()
            }
            onClick={() => setPlaying(!playing)}
          >
            {playing ? (
              <Pause size={25} fill="currentColor" />
            ) : (
              <Play size={25} fill="currentColor" />
            )}
          </button>
          <div className="vikas-motion-bottom">
            <span>{m['vikas.video.caption']()}</span>
            <span>
              <Camera size={16} />
              {m['vikas.video.motion']()}
            </span>
          </div>
        </div>
        <p className="vikas-preview-note">{m['vikas.video.note']()}</p>
      </div>
    </section>
  );
}

export function VikasHowItWorks() {
  const steps = [
    {
      icon: ImagePlus,
      title: m['vikas.how.step1'](),
      body: m['vikas.how.body1'](),
    },
    {
      icon: ImagePlus,
      title: m['vikas.how.step2'](),
      body: m['vikas.how.body2'](),
    },
    {
      icon: Sparkles,
      title: m['vikas.how.step3'](),
      body: m['vikas.how.body3'](),
    },
  ];
  return (
    <section
      id="how-it-works"
      className="vikas-section vikas-how"
      aria-labelledby="how-title"
    >
      <div className="vikas-centered-heading">
        <h2 id="how-title">{m['vikas.how.title']()}</h2>
        <p>{m['vikas.how.description']()}</p>
      </div>
      <ol className="vikas-steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <div className="vikas-step-icon">
              <step.icon size={23} />
              <span>{index + 1}</span>
            </div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            {index < 2 && <ArrowRight className="vikas-step-arrow" size={22} />}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function VikasFAQ() {
  const items = getVikasFaq();
  return (
    <section
      id="faq"
      className="vikas-section vikas-faq"
      aria-labelledby="faq-title"
    >
      <div>
        <h2 id="faq-title">{m['vikas.faq.title']()}</h2>
        <p>{m['vikas.faq.description']()}</p>
      </div>
      <div className="vikas-faq-items">
        {items.map((item) => (
          <details key={item.q} open={item === items[0]}>
            <summary>
              {item.q}
              <Plus size={18} />
            </summary>
            <p>
              {item.a}
              {item.guide && (
                <>
                  {' '}
                  Read our{' '}
                  <Link href={item.guide.href}>{item.guide.label}</Link> guide.
                </>
              )}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
