"use client";

import {OfferBlock} from "@/components/OfferBlock";
import {Tarot} from "@/components/Tarot";
import {Login} from "@/components/Login";
import {Loader} from "@/components/Loader";
import {useEffect, useRef, useState} from "react";
import {Header} from "@/components/Header";
import {Providers} from "@/components/Providers";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const tarotRef = useRef<HTMLDivElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);

  }, []);

  const scrollToTarot = () => {
    if (tarotRef.current) {
      tarotRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToLogin = () => {
    if (loginRef.current) {
      loginRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Providers>
        {!isLoaded
            ? <Loader />
            : (
                <>
                  <Header onScrollToLogin={scrollToLogin}/>
                  <main className="">
                    <OfferBlock
                        onScrollToTarot={scrollToTarot}
                        onScrollToLogin={scrollToLogin}
                    />
                    <div ref={tarotRef}>
                      <Tarot/>
                    </div>
                    <div ref={loginRef}>
                      <Login/>
                    </div>
                  </main>
                </>
            )
        }
    </Providers>
  );
};
