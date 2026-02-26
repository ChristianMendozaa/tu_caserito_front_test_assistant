"use client";
import { useEffect, useRef, useState } from "react";
import { handleToolCall } from "../lib/tools";

export function useWebRTC() {
    const [isActive, setIsActive] = useState(false);
    const [frequency, setFrequency] = useState(0);
    const [amplitude, setAmplitude] = useState(0);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startSession = async () => {
        try {
            // 1. Get ephemeral token from the FastAPI backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
            const tokenResponse = await fetch(`${backendUrl}/session`);
            if (!tokenResponse.ok) throw new Error("Failed to get token");
            const { client_secret } = await tokenResponse.json();
            const ephemeralKey = client_secret.value;

            // 2. Setup WebRTC
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            // 3. Setup audio playing from assistant & analyser for animations
            const audioEl = new Audio();
            audioEl.autoplay = true;

            pc.ontrack = (e) => {
                audioEl.srcObject = e.streams[0];
                // Setup Web Audio API Analyser for frequency/amplitude
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = audioCtx;
                const source = audioCtx.createMediaStreamSource(e.streams[0]);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyserRef.current = analyser;

                // Loop to update state with freq/amp
                const updateAudioData = () => {
                    if (!analyserRef.current) return;
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(dataArray);

                    let sum = 0;
                    let maxVal = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                        if (dataArray[i] > maxVal) maxVal = dataArray[i];
                    }
                    setAmplitude(sum / dataArray.length);
                    setFrequency(maxVal);
                    requestAnimationFrame(updateAudioData);
                };
                updateAudioData();
            };

            // 4. Capture User Microphone
            const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = userStream;
            pc.addTrack(userStream.getTracks()[0]);

            // Add microphone to the same analyser
            if (audioContextRef.current && analyserRef.current) {
                const micSource = audioContextRef.current.createMediaStreamSource(userStream);
                micSource.connect(analyserRef.current);
            }

            // 5. Data Channel for Events (Tools, System Prompts)
            const dc = pc.createDataChannel("oai-events");
            dataChannelRef.current = dc;

            dc.addEventListener("open", () => {
                setIsActive(true);
                // Dispatch session update
                const introEvent = {
                    type: "session.update",
                    session: {
                        instructions: "Eres Tu Caserito, un amable asistente para ayudar en el negocio con ventas e inventario. Responde con fluidez en español, de forma muy natural, cálida, sencilla y con confianza. Ayuda a registrar ventas usando la herramienta registrar_venta.",
                        tools: [
                            {
                                type: "function",
                                name: "registrar_venta",
                                description: "Registra una venta de un producto especificando el nombre del producto, la cantidad y el precio.",
                                parameters: {
                                    type: "object",
                                    properties: {
                                        producto: { type: "string" },
                                        cantidad: { type: "number" },
                                        precio: { type: "number" }
                                    },
                                    required: ["producto", "cantidad", "precio"]
                                }
                            }
                        ]
                    }
                };
                dc.send(JSON.stringify(introEvent));
            });

            dc.addEventListener("message", async (e) => {
                const msg = JSON.parse(e.data);
                if (msg.type === "response.function_call_arguments.done") {
                    const args = JSON.parse(msg.arguments);
                    const result = await handleToolCall(msg.name, args);

                    const outputEvent = {
                        type: "conversation.item.create",
                        item: {
                            type: "function_call_output",
                            call_id: msg.call_id,
                            output: JSON.stringify(result)
                        }
                    };
                    dc.send(JSON.stringify(outputEvent));
                    dc.send(JSON.stringify({ type: "response.create" }));
                }
            });

            // 6. SDP Offer/Answer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const sdpResponse = await fetch("https://api.openai.com/v1/realtime?model=gpt-realtime-mini-2025-12-15", {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${ephemeralKey}`,
                    "Content-Type": "application/sdp",
                },
            });
            if (!sdpResponse.ok) throw new Error("Failed to get SDP Answer");

            const answer = {
                type: "answer" as RTCSdpType,
                sdp: await sdpResponse.text(),
            };
            await pc.setRemoteDescription(answer);

        } catch (err) {
            console.error("Error setting up WebRTC:", err);
            setIsActive(false);
        }
    };

    const stopSession = () => {
        pcRef.current?.close();
        dataChannelRef.current?.close();
        audioContextRef.current?.close();
        streamRef.current?.getTracks().forEach(track => track.stop());
        setIsActive(false);
        setAmplitude(0);
        setFrequency(0);
    };

    return { startSession, stopSession, isActive, frequency, amplitude };
}
