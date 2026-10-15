"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MAX_SYMBOLS, buildSymbolCode, matchDreams } from "@/lib/dreamMeanings";

type Entry = { slug: string; title: string; terms: string };

type Props = {
  /** Every dream, so the client carries names and search words but not the prose. */
  dreams: Entry[];
  popular: string[];
  /** Every card slug; one is drawn at random on submit. */
  cardSlugs: string[];
};

export const DreamTeller = ({ dreams, popular, cardSlugs }: Props) => {
  const t = useTranslations("dreams");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [error, setError] = useState(false);

  const bySlug = useMemo(() => new Map(dreams.map((d) => [d.slug, d])), [dreams]);
  const trimmed = query.trim();
  const full = chosen.length >= MAX_SYMBOLS;

  const picked = useMemo(
    () => chosen.map((slug) => bySlug.get(slug)).filter((d): d is Entry => Boolean(d)),
    [chosen, bySlug]
  );

  // Typing shows matches; otherwise the popular ones. Chosen ones leave the
  // list: they live inside the field.
  const options = useMemo(() => {
    const pool =
      trimmed === ""
        ? popular.map((slug) => bySlug.get(slug)).filter((d): d is Entry => Boolean(d))
        : matchDreams(dreams, trimmed);
    return pool.filter((d) => !chosen.includes(d.slug));
  }, [trimmed, dreams, popular, chosen, bySlug]);

  const add = (slug: string) => {
    setError(false);
    setChosen((current) =>
      current.includes(slug) || current.length >= MAX_SYMBOLS ? current : [...current, slug]
    );
    setQuery("");
    inputRef.current?.focus();
  };

  const remove = (slug: string) => {
    setChosen((current) => current.filter((s) => s !== slug));
    inputRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace in an empty field takes the last chosen one back out.
    if (event.key === "Backspace" && query === "" && chosen.length > 0) {
      setChosen((current) => current.slice(0, -1));
    }
    // Enter picks the first match instead of submitting half a dream.
    if (event.key === "Enter" && trimmed !== "") {
      event.preventDefault();
      if (options.length > 0 && !full) add(options[0].slug);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (chosen.length === 0 || cardSlugs.length === 0) {
      setError(true);
      return;
    }
    const card = cardSlugs[Math.floor(Math.random() * cardSlugs.length)];
    router.push(`/dreams/result/${buildSymbolCode(chosen)}/${card}`);
  };

  return (
    <form className="dream-tell__form" onSubmit={submit}>
      <div className="dream-tell__field" onClick={() => inputRef.current?.focus()}>
        {picked.map((dream) => (
          <button
            key={dream.slug}
            type="button"
            className="dream-token"
            aria-label={t("removeSymbol", { name: dream.title })}
            onClick={(event) => {
              event.stopPropagation();
              remove(dream.slug);
            }}
          >
            <span>{dream.title}</span>
            <span className="dream-token__x" aria-hidden="true">
              ×
            </span>
          </button>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="dream-tell__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={picked.length === 0 ? t("inputPlaceholder") : ""}
          aria-label={t("inputLabel")}
          autoComplete="off"
          disabled={full}
        />
      </div>

      {!full && (
        <ul className="dream-tell__chips">
          {options.map((dream) => (
            <li key={dream.slug}>
              <button type="button" className="dream-chip" onClick={() => add(dream.slug)}>
                {dream.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!full && options.length === 0 && trimmed !== "" && (
        <p className="dream-tell__hint">{t("noMatch")}</p>
      )}

      <p className="dream-tell__count" aria-live="polite">
        {full ? t("maxReached") : t("chosenCount", { count: chosen.length, max: MAX_SYMBOLS })}
      </p>
      {error && (
        <p className="dream-tell__error" role="alert">
          {t("pickOne")}
        </p>
      )}

      <button type="submit" className="dream-glow dream-tell__submit">
        {t("submit")}
      </button>
      <p className="dream-tell__free">{t("freeNote")}</p>
    </form>
  );
};
