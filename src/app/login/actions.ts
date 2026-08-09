"use server";

import { APIError } from "better-auth";
import { auth } from "@/lib/auth";
import { findStudentByMatricAndEmail } from "@/db/queries/students";

export async function requestStudentOtpAction(
  matricNumber: string,
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  const student = await findStudentByMatricAndEmail(matricNumber, email);
  if (!student) {
    return { success: false, error: "No student record matches that matric number and email." };
  }

  try {
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    return { success: true };
  } catch (err) {
    if (err instanceof APIError) {
      return { success: false, error: err.message };
    }
    console.error("Failed to send sign-in OTP:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function verifyStudentOtpAction(
  email: string,
  otp: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await auth.api.signInEmailOTP({ body: { email, otp } });
    return { success: true };
  } catch (err) {
    if (err instanceof APIError) {
      return { success: false, error: err.message };
    }
    console.error("Failed to verify sign-in OTP:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
