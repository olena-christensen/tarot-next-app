"use client";

import Hand from "../assets/svg/hand.svg";
import Medallion1 from "../assets/svg/medallion1.svg";
import Medallion2 from "../assets/svg/medallion2.svg";
import Medallion3 from "../assets/svg/medallion3.svg";
import Medallion4 from "../assets/svg/medallion4.svg";
import Medallion5 from "../assets/svg/medallion5.svg";
import Medallion6 from "../assets/svg/medallion6.svg";
import {SmokeAnimation} from "@/components/SmokeAnimation";
import Footer from "@/components/Footer";
import {useEffect, useState} from "react";
import { useTranslations, useMessages } from "next-intl";
import {useSession} from "next-auth/react";
import AnimatedCard from "@/components/AnimatedCard";
import Image from "next/image";
import {pickRandomCards} from "@/utils";
import {useAppContext} from "@/AppProvider";
import {READERS, DEFAULT_READER} from "@/lib/readers";
import {ReaderSelection} from "@/components/ReaderSelection";
import {Modal} from "@/components/Modal";
import {MysticButton} from "@/components/MysticButton";

type OfferBlockProps = {
    onOpenLogin: () => void;
    onOpenSubscription: () => void;
};

const FREE_SHAKE_LIMIT = 3;
let hasPlayedIntro = false;

export const OfferBlock = ({
   onOpenLogin,
   onOpenSubscription,
}: OfferBlockProps) => {
    const { data: session, update } = useSession();
    const { state, setState } = useAppContext();
    const t = useTranslations("ui");
    const [skipIntro] = useState(() => {
        const skip = hasPlayedIntro;
        hasPlayedIntro = true;
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

    useEffect(() => {
        setIsLoaded(true);
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

    const handleClick = () => {
        const isFree = !planId || planId === "FREE";
        if (isFree && state.shakeCount >= FREE_SHAKE_LIMIT) {
            onOpenSubscription();
            return;
        }

        const chosenCards = pickRandomCards({ cards: state.tarots, count: 3 });
        setState(prevState => ({
            ...prevState,
            chosenCards,
            shakeCount: prevState.shakeCount + 1,
        }));
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

    const handleReaderSelect = (readerId: typeof state.selectedReader) => {
        setState(prev => ({ ...prev, selectedReader: readerId }));
        setIsReaderModalOpen(false);
        setIsDeckRevealed(true);

        if (session?.user) {
            fetch("/api/user/reader", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reader: readerId }),
            }).then(() => update({ preferredReader: readerId }));
        }
    };

    return (
        <section className={`offer-block${isLoaded ? " loaded" : ""}${skipIntro ? " skip-intro" : ""}`}>
            {!isLoaded
                ? <div>{t("loading")}</div>
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
                        <div className="offer-block__screen offer-block__screen--cards">
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
                                            alt=""
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
                                        {session && messages?.readers && (
                                            <button
                                                type="button"
                                                className="offer-block__change-btn"
                                                onClick={() => setIsReaderModalOpen(true)}
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
                                    currentReader={state.selectedReader}
                                    isSubscriber={isSubscriber}
                                    onOpenSubscription={() => {
                                        setIsReaderModalOpen(false);
                                        onOpenSubscription();
                                    }}
                                />
                            </Modal>
                        )}
                        <Footer />
                    </>
                )
            }
        </section>
    );
};
