export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const text = message.toLowerCase();

    const defaultReplies = [
      "Message received. Our team will get back to you within 24 hours.",
      "Thanks for reaching out 🙌 We've received your message and will respond shortly.",
      "Got it 👍 Our team will review this and follow up with you soon.",
    ];

    const getRandomReply = () =>
      defaultReplies[Math.floor(Math.random() * defaultReplies.length)];

    let reply = getRandomReply();

    if (text.includes("bmi")) {
      reply =
        "Got it 👍 Your BMI question has been received. A nutrition specialist will help you interpret your results shortly.";
    } else if (text.includes("calories")) {
      reply =
        "Thanks! Your question about calories has been noted. We'll guide you based on your goals soon.";
    } else if (text.includes("hello") || text.includes("hi")) {
      reply =
        "Hi there 👋 We've received your message. How can we assist you further?";
    } else if (text.includes("thanks") || text.includes("ok")) {
      reply =
        "You're welcome 😊 Let us know if you need anything else!";
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