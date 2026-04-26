"use client";

import dynamic from "react";
import { useState, useEffect } from "react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface LottieProps {
  animationData: object;
  width?: number;
  height?: number;
  loop?: boolean;
  autoPlay?: boolean;
  className?: string;
}

export function LottieAnimation({
  animationData,
  width = 200,
  height = 200,
  loop = true,
  autoPlay = true,
  className,
}: LottieProps) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoPlay}
      style={{ width, height }}
      className={className}
    />
  );
}

interface InViewProps extends LottieProps {
  triggerOnce?: boolean;
}

export function LottieInView({
  animationData,
  width = 150,
  height = 150,
  loop = true,
  autoPlay = true,
  className,
  triggerOnce = true,
}: InViewProps) {
  const [inView, setInView] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) {
            setHasPlayed(true);
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { threshold: 0.3 }
    );

    const currentElement = document.getElementById("lottie-container");
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => observer.disconnect();
  }, [triggerOnce]);

  if (!inView && triggerOnce && hasPlayed) {
    return (
      <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Lottie
          animationData={animationData}
          loop={loop}
          autoplay={false}
          style={{ width, height }}
        />
      </div>
    );
  }

  return (
    <div id="lottie-container" className={className}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={inView && autoPlay}
        style={{ width, height }}
      />
    </div>
  );
}