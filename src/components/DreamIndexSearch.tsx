"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { matchDreams } from "@/lib/dreamMeanings";

type Entry = { slug: string; title: string; terms: string };

type Props = {
  index: Entry[];
  /** The full A–Z list. Rendered whenever the box is empty, so crawlers see every link. */
  children: React.ReactNode;
};

export const DreamIndexSearch = ({ index, children }: Props) => {
  const t = useTranslations("dreams");
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const results = useMemo(() => matchDreams(index, trimmed), [index, trimmed]);

  return (
    <>
      <div className="cards-search dreams-index__search">
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

      {trimmed === "" ? (
        children
      ) : results.length === 0 ? (
        <p className="cards-search__empty">{t("searchNoResults")}</p>
      ) : (
        <ul className="dreams-index__list">
          {results.map((dream) => (
            <li key={dream.slug}>
              <Link className="dreams-index__link" href={`/dreams/${dream.slug}`}>
                {dream.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
