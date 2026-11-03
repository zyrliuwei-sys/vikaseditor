import { ArrowRight, Check, LoaderCircle } from 'lucide-react';

export interface VikasPlanCard {
  id: string;
  name: string;
  price: string;
  period: string;
  credits: string;
  details: string[];
  button: string;
  badge?: string;
}

export function VikasPricingCards({
  cards,
  busyId,
  disabled,
  onChoose,
}: {
  cards: VikasPlanCard[];
  busyId?: string;
  disabled: boolean;
  onChoose: (id: string) => void;
}) {
  return (
    <div className="vikas-plan-grid">
      {cards.map((card) => (
        <article
          key={card.id}
          className={`vikas-plan-card ${card.badge ? 'is-featured' : ''}`}
        >
          <div className="vikas-plan-top">
            <h2>{card.name}</h2>
            {card.badge && <span>{card.badge}</span>}
          </div>
          <p className="vikas-plan-price">
            <strong>{card.price}</strong>
            <span>{card.period}</span>
          </p>
          <p className="vikas-plan-credits">{card.credits}</p>
          <ul>
            {card.details.map((detail) => (
              <li key={detail}>
                <Check size={16} aria-hidden="true" />
                {detail}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="vikas-button"
            disabled={disabled || Boolean(busyId)}
            onClick={() => onChoose(card.id)}
          >
            {card.button}
            {busyId === card.id ? (
              <LoaderCircle size={17} className="vs-spinner" />
            ) : (
              <ArrowRight size={17} />
            )}
          </button>
        </article>
      ))}
    </div>
  );
}
