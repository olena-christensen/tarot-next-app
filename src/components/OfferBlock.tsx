"use client";

import Hand from "../assets/svg/hand.svg";
import Medallion1 from "../assets/svg/medallion1.svg";
import Medallion2 from "../assets/svg/medallion2.svg";
import Medallion3 from "../assets/svg/medallion3.svg";
import Medallion4 from "../assets/svg/medallion4.svg";
import Medallion5 from "../assets/svg/medallion5.svg";
import Medallion6 from "../assets/svg/medallion6.svg";
import {SmokeAnimation} from "@/components/SmokeAnimation";
import {useEffect, useState} from "react";
import { useTranslations, useMessages } from "next-intl";
import {useSession} from "next-auth/react";
import AnimatedCard from "@/components/AnimatedCard";
import Image from "next/image";
import {useAppContext} from "@/AppProvider";
import {READERS, DEFAULT_READER} from "@/lib/readers";
import {ReaderSelection} from "@/components/ReaderSelection";
import {Modal} from "@/components/Modal";
import {MysticButton} from "@/components/MysticButton";
import { Loader } from "@/components/Loader";
import { useReadingGate } from "@/hooks/useReadingGate";

type OfferBlockProps = {
    // Direct openers — used by the "change your reader" / reader-upgrade actions.
    onOpenLogin: () => void;
    onOpenSubscription: () => void;
    // Reading-gate blocks — routed through the in-character ReadingGateModal first.
    onBlockedAnon: () => void;
    onBlockedFree: () => void;
};

let hasPlayedIntro = false;

// Shared with CookieBanner: signals the intro animation is playing so the banner
// doesn't pop over it. `theveil:intro-done` fires when the interactive cards/CTA
// screen begins animating in (or immediately on skip).
type WindowWithIntro = Window & { __theveilIntroPlaying?: boolean };
const INTRO_DONE_EVENT = "theveil:intro-done";

const finishIntro = () => {
    const w = window as WindowWithIntro;
    if (!w.__theveilIntroPlaying) return;
    w.__theveilIntroPlaying = false;
    window.dispatchEvent(new Event(INTRO_DONE_EVENT));
};

export const OfferBlock = ({
   onOpenLogin,
   onOpenSubscription,
   onBlockedAnon,
   onBlockedFree,
}: OfferBlockProps) => {
    const { data: session, update } = useSession();
    const { state, setState } = useAppContext();
    const t = useTranslations("ui");
    const [skipIntro] = useState(() => {
        // SSR must be deterministic and match a fresh client load (intro plays).
        // Never read/mutate the module flag on the server — it persists across
        // requests and would desync server vs. client HTML (hydration mismatch).
        if (typeof window === "undefined") return false;
        const skip = hasPlayedIntro;
        hasPlayedIntro = true;
        // Tell the cookie banner an intro is animating so it waits until it ends
        // (see CookieBanner). Runs in render, before the banner's mount effect.
        if (!skip) (window as WindowWithIntro).__theveilIntroPlaying = true;
        return skip;
    });
    const [isLoaded, setIsLoaded] = useState(skipIntro);
    const [isDeckShaking, setIsDeckShaking] = useState(false);
    const [planId, setPlanId] = useState<string | null>(null);
    const [isDeckRevealed, setIsDeckRevealed] = useState(false);
    const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
    const [isSubscriber, setIsSubscriber] = useState(false);
    const messages = useMessages() as any;
    const tReader = useTranslations("readers");
    const { beginReading } = useReadingGate({
        onBlockedAnon,
        onBlockedFree,
    });

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // Arriving from the reader modal's Summon (on another page): reveal the deck,
    // same as clicking Summon here. Cross-fades reader → deck via the CSS transition.
    useEffect(() => {
        if (sessionStorage.getItem("theveil_reveal_deck") === "1") {
            sessionStorage.removeItem("theveil_reveal_deck");
            setIsDeckRevealed(true);
        }
    }, []);

    useEffect(() => {
        if (session) {
            fetch("/api/user/plan")
                .then((res) => res.json())
                .then((data) => {
                    const id = data.planId ?? "FREE";
                    setPlanId(id);
                    setIsSubscriber(id !== "FREE");
                })
                .catch(() => {
                    setPlanId("FREE");
                    setIsSubscriber(false);
                });
        }
    }, [session]);

    useEffect(() => {
        if (state.isCardsModalOpen && isDeckRevealed) {
            setIsDeckRevealed(false);
        }
    }, [state.isCardsModalOpen]);

    const handleClick = async () => {
        const dealt = await beginReading();
        if (!dealt) return;

        setIsDeckShaking(true);
        setTimeout(() => {
            setState(prevState => ({
                ...prevState,
                isCardsModalOpen: true,
            }));
            setIsDeckShaking(false);
        }, 2000);
    };

    const handleSummon = () => {
        setIsDeckRevealed(true);
    };

    // Persist the chosen reader (session + DB) without changing the view.
    const persistReader = (readerId: typeof state.selectedReader) => {
        setState(prev => ({ ...prev, selectedReader: readerId }));

        if (session?.user) {
            fetch("/api/user/reader", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reader: readerId }),
            }).then(() => update({ preferredReader: readerId }));
        }
    };

    // Clicking a card: choose without leaving the modal.
    const handleReaderChoose = (readerId: typeof state.selectedReader) => {
        persistReader(readerId);
    };

    // Summon button: choose, close the modal, and reveal the deck.
    const handleReaderSelect = (readerId: typeof state.selectedReader) => {
        persistReader(readerId);
        setIsReaderModalOpen(false);
        setIsDeckRevealed(true);
    };

    return (
        <section className={`offer-block${isLoaded ? " loaded" : ""}${skipIntro ? " skip-intro" : ""}`}>
            {!isLoaded
                ? <Loader />
                : (
                    <>
                        <SmokeAnimation/>
                        <h1 className="offer-block__title title title--primary">
                            <span>{t("discover")}</span>
                            <span>{t("your")}</span>
                            <span>{t("fate")}</span>
                        </h1>
                        <div className="offer-block__screen offer-block__screen--moon">
                            <div className="moon"></div>
                        </div>
                        <div
                            className="offer-block__screen offer-block__screen--cards"
                            onAnimationStart={(e) => {
                                // Fires when the cards/CTA screen begins animating in (after its
                                // 8s delay). Reveal the banner now so consent is up as soon as the
                                // interactive content appears, not only after the full intro ends.
                                if (e.animationName === "offerBlockCardBlockAnimation") finishIntro();
                            }}
                        >
                            <div className="offer-block__screen-bg">
                                <div className="offer-block__screen-bg-inner-wrap">
                                    <Medallion1/>
                                    <Medallion2/>
                                </div>
                                <div className="offer-block__screen-bg-inner-wrap">
                                    <Medallion3/>
                                    <Medallion4/>
                                </div>
                                <div className="offer-block__screen-bg-inner-wrap">
                                    <Medallion5/>
                                    <Medallion6/>
                                </div>
                            </div>
                            <div className={`inner-wrap inner-wrap--reader${isDeckRevealed ? " inner-wrap--hidden" : ""}`}>
                                <div className="offer-block__reader"
                                     style={{ "--reader-accent": READERS[state.selectedReader].aura } as React.CSSProperties}
                                >
                                    <div className="offer-block__reader-portrait" aria-hidden="true">
                                        <Image
                                            src={READERS[state.selectedReader].avatar}
                                            alt={messages?.readers ? tReader(`${state.selectedReader}.displayName`) : "Tarot reader portrait"}
                                            width={100}
                                            height={100}
                                            className="offer-block__reader-image"
                                        />
                                    </div>
                                    <p className="offer-block__reader-label">{t("yourReaderIs")}</p>
                                    <h2 className="offer-block__reader-name">
                                        {messages?.readers
                                            ? tReader(`${state.selectedReader}.displayName`)
                                            : "Madame Vespera"}
                                    </h2>
                                    <p className="offer-block__reader-bio">
                                        {messages?.readers
                                            ? tReader(`${state.selectedReader}.tagline`)
                                            : ""}
                                    </p>
                                    <div className="offer-block__reader-actions">
                                        <MysticButton
                                            type="button"
                                            onClick={handleSummon}
                                        >
                                            {t("summonReader", {
                                                name: messages?.readers
                                                    ? tReader(`${state.selectedReader}.displayName`)
                                                    : "Madame Vespera"
                                            })}
                                        </MysticButton>
                                        {messages?.readers && (
                                            <button
                                                type="button"
                                                className="offer-block__change-btn"
                                                onClick={() => {
                                                    if (!session) {
                                                        onOpenLogin();
                                                        return;
                                                    }
                                                    setIsReaderModalOpen(true);
                                                }}
                                            >
                                                {t("changeYourReader")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={`inner-wrap inner-wrap--deck${isDeckRevealed ? " inner-wrap--visible" : ""}`}>
                                <div
                                    className="center"
                                    onClick={() => {
                                        handleClick();
                                    }}
                                >
                                    <AnimatedCard
                                        frontUrl="/decor-img/card.webp"
                                        backUrl="/decor-img/card1.webp"
                                        isDeckShaking={isDeckShaking}
                                        isGlowing={!isDeckShaking && !state.isCardsModalOpen}
                                        animation="cardTwistAnimation 3s infinite"
                                        interactive={false}
                                    />
                                    <div className="hand"><Hand/></div>
                                </div>
                            </div>
                        </div>
                        {messages?.readers && (
                            <Modal
                                title={t("chooseYourReader")}
                                isOpen={isReaderModalOpen}
                                onClose={() => setIsReaderModalOpen(false)}
                                wide
                            >
                                <ReaderSelection
                                    onSelect={handleReaderSelect}
                                    onChoose={handleReaderChoose}
                                    currentReader={state.selectedReader}
                                    isSubscriber={isSubscriber}
                                    onOpenSubscription={() => {
                                        setIsReaderModalOpen(false);
                                        onOpenSubscription();
                                    }}
                                />
                            </Modal>
                        )}
                    </>
                )
            }
        </section>
    );
};
