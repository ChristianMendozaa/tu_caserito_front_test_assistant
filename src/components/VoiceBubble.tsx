"use client";
import React, { useEffect, useState } from "react";

export function VoiceBubble({ active, frequency, amplitude }: { active: boolean, frequency: number, amplitude: number }) {
    // Use a base scale of 1, add scale based on amplitude
    const scale = active ? 1 + (amplitude / 128) * 0.5 : 1;
    const vibration = active ? (frequency / 255) * 5 : 0;

    const bubbleStyle: React.CSSProperties = {
        transform: `scale(${scale}) translate(${Math.random() * vibration - vibration / 2}px, ${Math.random() * vibration - vibration / 2}px)`,
        transition: "transform 0.05s ease-out, box-shadow 0.2s ease-in-out, border-radius 0.2s ease-in-out",
        boxShadow: active
            ? `inset 10px 10px 20px rgba(255,255,255,0.5), inset -10px -10px 20px rgba(0,0,0,0.1), 0 10px ${20 + amplitude}px rgba(0, 150, 255, 0.4)`
            : "inset 10px 10px 20px rgba(255,255,255,0.5), inset -10px -10px 20px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.1)",
        borderRadius: active
            ? `${40 + Math.random() * 20}% ${40 + Math.random() * 20}% ${40 + Math.random() * 20}% ${40 + Math.random() * 20}%`
            : "50% 50% 50% 50%",
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 h-full">
            <div
                className={`w-64 h-64 flex items-center justify-center transition-colors duration-500 backdrop-blur-md border border-white/30 ${active ? 'bg-blue-400/30' : 'bg-gray-300/30'}`}
                style={bubbleStyle}
            />
        </div>
    );
}
