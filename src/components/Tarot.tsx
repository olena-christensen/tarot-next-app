"use client";

import Medallion3 from "@/assets/svg/medallion3.svg";
import Medallion4 from "@/assets/svg/medallion4.svg";

import {useEffect, useState} from "react";
import { useTranslations } from "next-intl";
import AnimatedCard from "@/components/AnimatedCard";
import {Modal} from "@/components/Modal";
import LoaderSvg from "@/assets/svg/ouroboros.svg";
import {useAppContext} from "@/AppProvider";
import {MysticButton} from "@/components/MysticButton";
import {pickRandomCards} from "@/utils";
import Footer from "@/components/Footer";

export const Tarot = () => {
    const { state, setState } = useAppContext();
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
        }));
        setFlippedCards([false, false, false]);
        setModalDismissed(false);
        setShowLoader(false);
    };

    const handleRetry = () => {
        setState(prevState => ({
            ...prevState,
            isPredictionReady: false,
            response: '',
            resetFlipped: true,
            chosenCards: pickRandomCards({ cards: state.tarots, count: 3 }),
            shakeCount: prevState.shakeCount + 1,
        }));
        setFlippedCards([false, false, false]);
        setModalDismissed(false);
        setShowLoader(false);
    };

    const handleBackToSanctum = () => {
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
                            <div className="tarot__post-actions">
                                <MysticButton
                                    onClick={handleRetry}
                                    disabled={state.isResponseLoading}
                                >
                                    {t("unveilAnotherFate")}
                                </MysticButton>
                                <MysticButton onClick={handleBackToSanctum}>
                                    {t("backToSanctum")}
                                </MysticButton>
                            </div>
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
