import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});


export async function POST(request: Request) {
    try {

        const { code, language } = await request.json();

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ 
                role: "user", 
                content:  `Complete this ${language} code. Return ONLY the completion, no explanation:\n\n${code}` 
            }],
            max_tokens:200
        });
        const text = completion.choices[0].message.content;
        const cleaned = text
            ?.replace(/```[\w]*\n/g, "") // Remove code block markers
            .replace(/```/g, "") // Remove any remaining code block markers
            .trim();
        return NextResponse.json({ completion: cleaned });
    } catch (error) {
        console.error("Error getting completion:", error);
       return NextResponse.json({ error: "Failed to get completion" }, { status: 500 });        
    }

}