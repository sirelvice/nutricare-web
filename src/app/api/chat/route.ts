export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Simple placeholder logic
    let reply = "Thanks for your message!";

    if (message.toLowerCase().includes("bmi")) {
      reply = "BMI helps assess body weight relative to height. Would you like help interpreting yours?";
    } else if (message.toLowerCase().includes("calories")) {
      reply = "Calories depend on your BMR and activity level. NutriCare can help estimate this.";
    } else if (message.toLowerCase().includes("hello")) {
      reply = "Hello! 👋 How can I assist you today?";
    }

    return Response.json({ reply });
  } catch (error) {
    return Response.json(
      { reply: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
