"use client";
import { useWebRTC } from "../hooks/useWebRTC";
import { VoiceBubble } from "../components/VoiceBubble";

export default function Home() {
  const { startSession, stopSession, isActive, frequency, amplitude } = useWebRTC();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Tu Caserito - Asistente de Voz Inteligente
        </p>
      </div>

      <div className="relative flex place-items-center flex-1 w-full justify-center">
        <VoiceBubble active={isActive} frequency={frequency} amplitude={amplitude} />
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-1 lg:text-left">
        <div className="flex justify-center flex-col items-center">
          <p className="text-gray-500 mb-6 text-center">
            {isActive
              ? "El asistente está escuchando y listo para ayudarte con las ventas."
              : "Presiona el botón para comenzar a interactuar con Tu Caserito."
            }
          </p>
          <button
            onClick={isActive ? stopSession : startSession}
            className={`px-8 py-4 rounded-full font-bold text-white transition-all shadow-lg hover:shadow-xl ${isActive ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {isActive ? "Terminar Conversación" : "Empezar a Hablar"}
          </button>
        </div>
      </div>
    </main>
  );
}
