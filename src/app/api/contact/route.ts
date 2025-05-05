import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define the expected schema for the contact form data
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the incoming data
    const validation = contactFormSchema.safeParse(body);

    if (!validation.success) {
      // Extract validation errors
      const errors = validation.error.flatten().fieldErrors;
       console.error("Contact form validation failed:", errors);
      return NextResponse.json({
        message: "Validation failed. Please check your input.",
        errors: errors, // Provide detailed errors back to the client if needed
      }, { status: 400 });
    }

    // Data is valid
    const { name, email, subject, message } = validation.data;

    // --- Process the Contact Request ---
    // In a real application, you would:
    // 1. Send an email notification to your support team.
    // 2. Save the message to a database (e.g., a 'ContactMessages' collection).
    // 3. Integrate with a CRM or help desk system.

    // For this example, we'll just log the received data.
    console.log("Received contact form submission:");
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Subject:", subject);
    console.log("Message:", message);
    // --- End Processing ---


    // Simulate processing delay (optional)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return a success response
    return NextResponse.json({ message: "Message received successfully!" }, { status: 200 });

  } catch (error) {
    console.error('Error processing contact form:', error);
    // Generic error for unexpected issues
    return NextResponse.json({ message: 'Internal server error. Could not process your request.' }, { status: 500 });
  }
}
