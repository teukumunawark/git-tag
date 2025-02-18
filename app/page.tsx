"use client";

import React from "react";
import Waves from "@/components/waves";
import TrueFocus from "@/components/true-focus";

export default function Home() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Waves
                lineColor="#C5BAFF"
                backgroundColor="rgba(255, 255, 255, 0.0)"
                waveSpeedX={0.02}
                waveSpeedY={0.01}
                waveAmpX={40}
                waveAmpY={20}
                friction={0.9}
                tension={0.01}
                maxCursorMove={120}
                xGap={12}
                yGap={36}
            />
            <div className="w-3/4">
                <TrueFocus
                    sentence="INTRODUCING THE AMBITIOUS PROJECT SQUAD-2"
                    manualMode={false}
                    blurAmount={5}
                    borderColor="red"
                    animationDuration={1}
                    pauseBetweenAnimations={1}
                />
            </div>
        </div>
    );
}
