"use client";

import dynamic from "react";
import type { LucideProps } from "lucide-react";

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

// Pour utiliser, téléchargez des animations sur lottieflow.com ou lottiefiles.com
// Puis importez ici :

// Exemple d'utilisation :
// import { LottieAnimation } from "@/components/ui/Lottie";
// import doneAnimation from "./animations/done.json";
// import loadingAnimation from "./animations/loading.json";
// import successAnimation from "./animations/success.json";
// import emptyAnimation from "./animations/empty.json";

// <LottieAnimation animationData={successAnimation} width={120} height={120} loop={false} />