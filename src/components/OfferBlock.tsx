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
import {useSession} from "next-auth/react";
import AnimatedCard from "@/components/AnimatedCard";
import {pickRandomCards} from "@/utils";
import {useAppContext} from "@/AppProvider";

type OfferBlockProps = {
    onOpenLogin: () => void;
};

export const OfferBlock = ({
   onOpenLogin
}: OfferBlockProps) => {
    const { data: session } = useSession();
    const { state, setState } = useAppContext();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isDeckShaking, setIsDeckShaking] = useState(false);

    useEffect(() => {
        setIsLoaded(true);

    }, []);

    const handleClick = () => {
        const chosenCards = pickRandomCards({ cards: state.tarots, count: 3 });
        setState(prevState => ({
            ...prevState,
            chosenCards,
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

    return (
        <section className={`offer-block ${isLoaded ? "loaded" : ""}`}>
            {!isLoaded
                ? <div>Loading...</div>
                : (
                    <>
                        <SmokeAnimation/>
                        <h1 className="offer-block__title title title--primary">
                            <span>Discover</span>
                            <span>Your</span>
                            <span>Fate</span>
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
                            <div className="inner-wrap">
                                <div className="offer-block__btn offer-block__btn--left">
                                    <button
                                        className="btn border-dashed"
                                        onClick={() => {
                                            handleClick();
                                        }}
                                        disabled={state.isResponseLoading}
                                    >
                                        Shake the Deck
                                    </button>
                                </div>
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
                                        animation="cardTwistAnimation 3s infinite"
                                    />
                                    <div className="hand"><Hand/></div>
                                </div>
                                <div className="offer-block__btn offer-block__btn--right"
                                     style={session ? {visibility: 'hidden'} : undefined}
                                >
                                    <button
                                        className="btn border-dashed"
                                        onClick={onOpenLogin}
                                    >
                                        Join the Circle <br/> of the Chosen
                                    </button>
                                </div>
                            </div>
                        </div>
                        <Footer />
                    </>
                )
            }
        </section>
    );
};
