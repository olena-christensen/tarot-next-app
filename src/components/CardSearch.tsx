"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { matchCards, type CardSearchEntry } from "@/lib/cardMeanings";

type SearchCard = CardSearchEntry & { image: string };

type Props = {
  index: SearchCard[];
  /** The full grouped index. Rendered whenever the box is empty. */
  children: React.ReactNode;
};

/**
 * Filters the /cards index in place. The grouped accordions arrive as server
 * children and stay in the HTML on first paint, so a crawler still sees all 78
 * links — the search only replaces them once someone types.
 */
export const CardSearch = ({ index, children }: Props) => {
  const t = useTranslations("cardMeanings");
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const results = useMemo(() => matchCards(index, trimmed), [index, trimmed]);

  return (
    <>
      {trimmed === "" ? (
        children
      ) : results.length === 0 ? (
        <p className="cards-search__empty">{t("searchNoResults")}</p>
      ) : (
        <ul className="cards-index__list cards-search__results">
          {results.map((card) => (
            <li className="cards-index__item" key={card.slug}>
              <Link className="cards-index__link" href={`/cards/${card.slug}`}>
                <Image
                  className="cards-index__img"
                  src={card.image}
                  alt=""
                  width={427}
                  height={750}
                  sizes="(min-width: 900px) 16vw, (min-width: 768px) 23vw, (min-width: 600px) 31vw, 46vw"
                  quality={85}
                />
                <span className="cards-index__name">{card.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Below the groups, directly above the source block. */}
      <div className="cards-search">
        <input
          type="search"
          className="cards-search__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          autoComplete="off"
        />
      </div>
    </>
  );
};
