"use client";

import Medallion3 from "@/assets/svg/medallion3.svg";
import Medallion4 from "@/assets/svg/medallion4.svg";

import {useEffect, useState} from "react";
import { useTranslations, useMessages } from "next-intl";
import { useSession } from "next-auth/react";
import AnimatedCard from "@/components/AnimatedCard";
import {Modal} from "@/components/Modal";
import LoaderSvg from "@/assets/svg/ouroboros.svg";
import {useAppContext} from "@/AppProvider";
import {pickRandomCards} from "@/utils";
import Footer from "@/components/Footer";
import {ReaderSelection} from "@/components/ReaderSelection";
import type {ReaderId} from "@/lib/readers";

export const Tarot = () => {
    const { state, setState } = useAppContext();
    const { data: session } = useSession();
    const messages = useMessages() as any;
    const t = useTranslations("ui");
    const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false]);
    const [modalDismissed, setModalDismissed] = useState(false);
    const [showLoader, setShowLoader] = useState(false);
    const allFlipped = flippedCards.every(card => card);

    const chosenCards = state.chosenCards;
    const glowingIndex = chosenCards.length > 0 ? flippedCards.indexOf(false) : -1;

    let cards = [];
    for (let i = 0; i < 3; i++) {
        const card = <AnimatedCard
            key={i}
            width={280}
            height={447}
            frontUrl="/decor-img/Card-middle.webp"
            backUrl={chosenCards[i] ? chosenCards[i].image : "/decor-img/Card-middle.webp"}
            animation="CardFlipAnimation 2s forwards"
            isGlowing={i === glowingIndex}
            disabled={i !== glowingIndex}
            onClickAction={() => handleCardFlip(i)}
        />
        cards.push(card);
    }

    const handleClose = () => {
        setState(prevState => ({
            ...prevState,
            isCardsModalOpen: false,
            chosenCards: [],
            isPredictionReady: false,
            response: '',
            resetFlipped: true,
            // Reset reader so the next session re-prompts the selection screen
            // (for users who actually see it).
            selectedReader: null,
        }));
        setFlippedCards([false, false, false]);
        setModalDismissed(false);
        setShowLoader(false);
    };

    const handleRetry = () => {
        handleClose();
    };

    const handleCardFlip = (index: number) => {
        if (chosenCards.length > 0 && index === glowingIndex) {
            const newFlippedCards = [...flippedCards];
            newFlippedCards[index] = true;
            setFlippedCards(newFlippedCards);
        }
    };

    useEffect(() => {
        if (allFlipped) {
            // Wait for the last card's flip animation (2s) before showing loader
            setTimeout(() => {
                setShowLoader(true);
            }, 2000);
            // Then wait another 3s with loader visible before showing reading
            setTimeout(() => {
                setState(prevState => ({
                    ...prevState,
                    isPredictionReady: true,
                }));
            }, 5000);
        }
    }, [allFlipped]);

    useEffect(() => {
        if (state.isCardsModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [state.isCardsModalOpen]);

    if (!state.isCardsModalOpen) return null;

    // Decide at render time whether the user should pick a reader.
    // Skip the selection step for: anonymous users, or locales where the
    // `readers` block hasn't been translated yet.
    const localeHasReaders = !!messages?.readers;
    const shouldPickReader = !!session && localeHasReaders;

    const handleReaderSelect = (readerId: ReaderId) => {
        setState(prev => ({ ...prev, selectedReader: readerId }));
    };

    if (shouldPickReader && state.selectedReader === null) {
        return (
            <div className="tarot-modal">
                <div className="tarot-modal__inner">
                    <div className="tarot-modal__bg">
                        <Medallion3/>
                        <Medallion4/>
                    </div>
                    <div className="tarot-modal__content">
                        <ReaderSelection onSelect={handleReaderSelect} />
                    </div>
                    <Footer />
                </div>
            </div>
        );
    }

    // For users who don't pick a reader, fall through to the cards with the
    // default reader. The AppProvider effect already substitutes DEFAULT_READER
    // when selectedReader is null, so no extra wiring needed here.

    return (
        <div className="tarot-modal">
            <div className="tarot-modal__inner">
                <div className="tarot-modal__bg">
                    <Medallion3/>
                    <Medallion4/>
                </div>
                <div className="tarot-modal__content">
                    <div className="tarot__cards-container">
                        {cards}
                    </div>
                    <div className="tarot__action-area">
                        {modalDismissed ? (
                            <button
                                className="btn btn-try-again border-dashed tarot__revoke-btn"
                                onClick={handleRetry}
                                disabled={state.isResponseLoading}
                            >
                                {t("revokeAndRetry")}
                            </button>
                        ) : (
                            <>
                                <h2 className={`tarot__title title${showLoader ? " tarot__title--hidden" : ""}`}>
                                    {t("unveilDestiny")}
                                </h2>
                                {showLoader && (
                                    <div className={`tarot__loader${state.isPredictionReady ? " tarot__loader--hidden" : ""}`}>
                                        <LoaderSvg />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <Modal
                    isOpen={state.isPredictionReady && !modalDismissed}
                    onClose={() => setModalDismissed(true)}
                    title={state.response ? t("cardsHaveSpoken") : t("cardsStillSilent")}
                >
                    <div className="tarot__result">
                        {state.response && <p className="tarot__result-text">{state.response}</p>}
                    </div>
                </Modal>
                <Footer />
            </div>
        </div>
    );
};
