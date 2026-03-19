import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {Card} from "@/types/Types";
import {tarots} from "@/data";
import {getQuestionPrompt} from "@/utils";
import {handleAsk} from "@/handleAsk";
import {generateReading} from "@/tarotReadings";

type AppState = {
    tarots: Card[];
    chosenCards: Card[];
    resetFlipped: boolean;
    isPredictionReady: boolean;
    response: string;
    isResponseLoading: boolean;
    isCardsModalOpen: boolean;
};

type AppContextType = {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
};

const defaultState: AppContextType = {
    state: {
        tarots: tarots,
        chosenCards: [],
        resetFlipped: false,
        isPredictionReady: false,
        response: '',
        isResponseLoading: false,
        isCardsModalOpen: false,
    },
    setState: () => {},
};

const AppContext = createContext<AppContextType>(defaultState);

type AppProviderProps = {
    children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
    const [state, setState] = useState<AppState>(defaultState.state);

    useEffect(() => {
        if (state.chosenCards.length > 0) {
            setState(prevState => ({
                ...prevState,
                resetFlipped: true,
                isPredictionReady: false,
                isResponseLoading: true,
            }));

            // TODO: swap back to API when billing is sorted
            // const prompt = getQuestionPrompt(state.chosenCards);
            // handleAsk(prompt).then(response => {
            //     setState(prevState => ({
            //         ...prevState,
            //         isResponseLoading: false,
            //         response: response,
            //     }));
            // });

            const response = generateReading(state.chosenCards);
            setState(prevState => ({
                ...prevState,
                isResponseLoading: false,
                response: response,
            }));
        }
    }, [state.chosenCards]);

    return (
        <AppContext.Provider value={{ state, setState }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}
