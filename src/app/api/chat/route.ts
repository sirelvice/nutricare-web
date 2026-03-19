export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    let reply =
      "Message received. Our team will review it and get back to you within 24 hours.";

    if (message.toLowerCase().includes("bmi")) {
      reply =
        "Got it 👍 Your BMI question has been received. A nutrition specialist will help you interpret your results shortly.";
    } else if (message.toLowerCase().includes("calories")) {
      reply =
        "Thanks! Your question about calories has been noted. We'll guide you based on your goals soon.";
    } else if (message.toLowerCase().includes("hello")) {
      reply =
        "Hi there 👋 We've received your message. How can we assist you further?";
    }

    return Response.json({ reply });
  } catch {
    return Response.json(
      {
        reply:
          "⚠️ We couldn’t process your message. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}