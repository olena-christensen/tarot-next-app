import Medallion3 from "@/assets/svg/medallion3.svg";
import Medallion4 from "@/assets/svg/medallion4.svg";

import {useEffect, useState} from "react";
import AnimatedCard from "@/components/AnimatedCard";
import {Modal} from "@/components/Modal";
import {useAppContext} from "@/AppProvider";
import {pickRandomCards} from "@/utils";
import Footer from "@/components/Footer";

export const Tarot = () => {
    const { state, setState } = useAppContext();
    const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false]);
    const [modalDismissed, setModalDismissed] = useState(false);

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
    };

    const handleRetry = () => {
        handleClose();
    };

    const handleCardFlip = (index: number) => {
        if (chosenCards.length > 0) {
            const newFlippedCards = [...flippedCards];
            newFlippedCards[index] = true;
            setFlippedCards(newFlippedCards);
        }
    };

    useEffect(() => {
        if (flippedCards.every(card => card)) {
            setTimeout(() => {
                setState(prevState => ({
                    ...prevState,
                    isPredictionReady: true,
                }));
            }, 2000)
        }
    }, [flippedCards]);

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
                            <button
                                className="btn btn-try-again border-dashed tarot__revoke-btn"
                                onClick={handleRetry}
                                disabled={state.isResponseLoading}
                            >
                                Revoke and Retry
                            </button>
                        ) : (
                            <h2 className="tarot__title title">Unveil Your Destiny, Card by Card...</h2>
                        )}
                    </div>
                </div>
                <Modal
                    isOpen={state.isPredictionReady && !modalDismissed}
                    onClose={() => setModalDismissed(true)}
                    title={state.response ? "The Cards Have Spoken" : "The cards are still silent..."}
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
