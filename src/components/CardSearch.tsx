"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { matchCards, type CardSearchEntry } from "@/lib/cardMeanings";
import { matchDreams } from "@/lib/dreamMeanings";

type SearchCard = CardSearchEntry & { image: string };
type SearchDream = { slug: string; title: string; terms: string };

type Props = {
  index: SearchCard[];
  /** Dream names in the visitor's language. The one search box finds cards and dreams together. */
  dreams?: SearchDream[];
  /** The full grouped index. Rendered whenever the box is empty. */
  children: React.ReactNode;
};

/**
 * Filters the /cards index in place. The grouped accordions arrive as server
 * children and stay in the HTML on first paint, so a crawler still sees all 78
 * links — the search only replaces them once someone types.
 */
export const CardSearch = ({ index, dreams = [], children }: Props) => {
  const t = useTranslations("cardMeanings");
  const tDreams = useTranslations("dreams");
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const results = useMemo(() => matchCards(index, trimmed), [index, trimmed]);
  const dreamResults = useMemo(
    () => (trimmed === "" ? [] : matchDreams(dreams, trimmed)),
    [dreams, trimmed]
  );
  const both = dreams.length > 0;

  return (
    <>
      {trimmed === "" ? (
        children
      ) : results.length === 0 && dreamResults.length === 0 ? (
        <p className="cards-search__empty">
          {both ? tDreams("searchNothing") : t("searchNoResults")}
        </p>
      ) : (
        <>
          {results.length > 0 && (
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
          {dreamResults.length > 0 && (
            <section className="cards-search__dreams">
              <h2 className="cards-search__dreams-title">{tDreams("navLabel")}</h2>
              <ul className="dreams-index__list">
                {dreamResults.map((dream) => (
                  <li key={dream.slug}>
                    <Link className="dreams-index__link" href={`/dreams/${dream.slug}`}>
                      {dream.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Below the groups, directly above the source block. */}
      <div className="cards-search">
        <input
          type="search"
          className="cards-search__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={both ? tDreams("searchAllPlaceholder") : t("searchPlaceholder")}
          aria-label={both ? tDreams("searchAllLabel") : t("searchLabel")}
          autoComplete="off"
        />
      </div>
    </>
  );
};
