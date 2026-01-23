import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { error: "No audio file provided" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Convert file to base64
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString("base64");

        // 處理不同的音訊格式
        let mimeType = audioFile.type;
        console.log('Received audio file type:', mimeType);

        // 如果是 webm，使用 audio/webm；否則使用原始類型
        if (!mimeType || mimeType === '') {
            mimeType = 'audio/webm'; // 預設值
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.0-flash as confirmed by debug list
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `你是一位台灣專業的寵物美容助理。請聆聽這段錄音（可能包含環境音和台語夾雜），並提取關鍵資訊。請回傳純 JSON 格式，包含以下欄位：

transcription: 逐字稿。
tags: 陣列，例如 ["皮膚紅腫", "指甲流血", "很乖"]。
summary: 一段給飼主看的文字，語氣要親切、溫柔，用『我們今天幫...』開頭。
internal_memo: 給美容師看的專業術語紀錄。`;

        console.log('Sending audio to Gemini with mimeType:', mimeType);

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio,
                },
            },
        ]);

        const responseText = result.response.text();

        // Parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", responseText);
            // Fallback or attempt to clean up markdown code blocks if present (though responseMimeType should handle it)
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } else {
                return NextResponse.json(
                    { error: "Failed to parse AI response", raw: responseText },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Error processing audio:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
