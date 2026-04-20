import Image from "next/image";
import React, {useEffect, useState} from "react";
import {useAppContext} from "@/AppProvider";

type PropsType = {
    width?: number;
    height?: number;
    frontUrl: string;
    backUrl: string;
    frontAlt?: string;
    backAlt?: string;
    animation: string;
    isDeckShaking?: boolean;
    isGlowing?: boolean;
    disabled?: boolean;
    onClickAction?: () => void;
};

export default function AnimatedCard({
 width = 365,
 height = 450,
 frontUrl,
 backUrl,
 frontAlt = "Tarot card back",
 backAlt = "Tarot card",
 animation,
 isDeckShaking,
 isGlowing,
 disabled,
 onClickAction,
}: PropsType) {
    const { state, setState } = useAppContext();
    const [isAnimating, setIsAnimating] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        console.log(state.resetFlipped + " resetFlipped");
        console.log(isFlipped + " isFlipped");
        if (state.resetFlipped) {
            setIsFlipped(false);
            setState(prevState => ({
                ...prevState,
                resetFlipped: false, // Reset the flag after flipping the cards
            }));
        }
    }, [state.resetFlipped]);

    const handleClick = () => {
        setIsAnimating(true);
        if (onClickAction) {
            onClickAction();
        }

        setTimeout(() => {
            setIsAnimating(false);
            setIsFlipped(!isFlipped);

        }, 2000);
    };

    const animationStyle: React.CSSProperties = {
        animation: isAnimating || isDeckShaking ? animation : "none",
    };

    const style: React.CSSProperties = {
        width,
        height,
    };

    return (
        <div
            className={`animated-card${isFlipped ? " flipped" : ""}${isGlowing && !isFlipped ? " glowing" : ""}`}
            style={style}
            onClick={() => {
                if (!isFlipped && !disabled) handleClick();
            }}
        >
            <div className="animated-card__wrap" style={animationStyle}>
                <div className="animated-card__front">
                    <Image
                        src={frontUrl}
                        alt={frontAlt}
                        width={width}
                        height={height}
                    />
                </div>
                <div className="animated-card__back">
                    <Image
                        src={backUrl}
                        alt={backAlt}
                        width={width}
                        height={height}
                    />
                </div>
            </div>
        </div>
    );
}
