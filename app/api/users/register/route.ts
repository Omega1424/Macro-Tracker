import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUser, createUser } from "@/lib/userdb";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    const existing   = await getUser(normalised);
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    await createUser(normalised, hash);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
