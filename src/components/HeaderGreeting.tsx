"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { resolveGreeting } from "@/lib/greetings";

type HeaderGreetingProps = {
  /** Placement class the parent owns — this component carries no layout. */
  className: string;
};

/**
 * The rotating signed-in greeting.
 *
 * Plain text, not a link: the avatar beside it is the one way into the profile,
 * so the greeting no longer duplicates that target.
 *
 * Rendered TWICE on purpose: once as a fixed strip above the header (mobile)
 * and once inline in the nav (desktop), with CSS showing exactly one at a time.
 * `display: none` also removes the hidden one from the accessibility tree, so
 * nothing is announced twice.
 *
 * Two instances are safe because `resolveGreeting` caches its KEY in
 * sessionStorage — the second call reads what the first stored, so both render
 * the same line.
 *
 * The mobile strip cannot live inside `<header>`: `.main-header` is animated
 * with a `transform`, which makes it the containing block for any
 * `position: fixed` descendant — the same trap that forced the reader
 * selection's bottom sheet to portal out. So the strip is a sibling instead.
 */
export const HeaderGreeting = ({ className }: HeaderGreetingProps) => {
  const { data: session, status } = useSession();
  const tGreeting = useTranslations("greetings");
  const [greeting, setGreeting] = useState<string | null>(null);
  const name = session?.user?.name ?? "";

  // Resolve once when auth settles; sessionStorage holds it stable across
  // re-renders and navigation (keyed on status, not name/t, so no reshuffle).
  useEffect(() => {
    if (status !== "authenticated") {
      setGreeting(null);
      return;
    }
    setGreeting(resolveGreeting({ name, t: tGreeting }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (!session || !greeting) return null;

  return <span className={className}>{greeting}</span>;
};
