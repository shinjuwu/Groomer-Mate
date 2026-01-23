import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "No API Key found in environment variables" }, { status: 500 });
    }

    try {
        // Directly call the REST API to list models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Failed to fetch models: ${response.status}`, details: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
