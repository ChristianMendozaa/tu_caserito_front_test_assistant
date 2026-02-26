// This file contains logic for handling OpenAI tool calls
export async function handleToolCall(functionName: string, args: any) {
    if (functionName === "registrar_venta") {
        try {
            const response = await fetch("http://localhost:8000/api/tools/registrar_venta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(args)
            });
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            console.error("Error executing registrar_venta:", err);
            return { status: "error", message: "Error al comunicarse con el backend" };
        }
    }
    return { status: "error", message: "Tool no encontrada" };
}
