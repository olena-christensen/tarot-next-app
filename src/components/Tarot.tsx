import Medallion3 from "@/assets/svg/medallion3.svg";
import Medallion4 from "@/assets/svg/medallion4.svg";
import {forwardRef, useEffect, useState} from "react";
import AnimatedCard from "@/components/AnimatedCard";
import {Modal} from "@/components/Modal";
import {useAppContext} from "@/AppProvider";
import {pickRandomCards} from "@/utils";

export const Tarot = forwardRef<HTMLDivElement>((props, ref) => {
    const { state, setState } = useAppContext();
    const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false]);
    const [modalDismissed, setModalDismissed] = useState(false);

    const chosenCards = state.chosenCards;
    let cards = [];
    for (let i = 0; i < 3; i++) {
        const card = <AnimatedCard
            key={i}
            width={280}
            height={447}
            frontUrl="/decor-img/Card-middle.webp"
            backUrl={chosenCards[i] ? chosenCards[i].image : "/decor-img/Card-middle.webp"}
            animation="CardFlipAnimation 2s forwards"
            onClickAction={() => handleCardFlip(i)}
        />
        cards.push(card);
    }


    const handleClick = () => {
        const chosenCards = pickRandomCards({ cards: state.tarots, count: 3 });
        setState(prevState => ({
            ...prevState,
            chosenCards,
        }));
        setFlippedCards([false, false, false]);
        setModalDismissed(false);
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
                setState({
                    ...state,
                    isPredictionReady: true,
                });
            }, 2000)
        }
    }, [flippedCards]);

    return (
        <section className="tarot" ref={ref}>
            <div className="tarot__screen-bg">
                <Medallion3/>
                <Medallion4/>
            </div>
            <div className="container">

                <div className="tarot__cards-container">
                    { cards}
                </div>
                {state.chosenCards.length > 0 && (
                    <div className="tarot__action-area">
                        {modalDismissed ? (
                            <button
                                className="btn btn-try-again border-dashed tarot__revoke-btn"
                                onClick={handleClick}
                                disabled={state.isResponseLoading}
                            >
                                Revoke and Retry
                            </button>
                        ) : (
                            <h2 className="tarot__title title">Unveil Your Destiny, Card by Card...</h2>
                        )}
                    </div>
                )}
                <Modal
                    isOpen={state.isPredictionReady && !modalDismissed}
                    onClose={() => setModalDismissed(true)}
                    title={state.response ? "The Cards Have Spoken" : "The cards are still silent..."}
                >
                    <div className="tarot__result">
                        {state.response && <p className="tarot__result-text">{state.response}</p>}
                    </div>
                </Modal>
            </div>
        </section>
    );
});

Tarot.displayName = "Tarot";
