import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = contactSchema.parse(body);
    // In production, send email / store in DB. For now, log it.
    console.log("Contact form submission:", data);
    return NextResponse.json({
      success: true,
      message: "Message received successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 400 }
    );
  }
}
