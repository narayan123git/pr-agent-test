import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Node.js will load process.env securely here (Server-side only)
const BACKEND_URL = process.env.BACKEND_URL;
const FRONTEND_SECRET = process.env.FRONTEND_SECRET; // This replaces NEXT_PUBLIC_FRONTEND_SECRET

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const res = await axios.get(`${BACKEND_URL}/api/settings/${username}`, {
      headers: { 'x-saas-secret': FRONTEND_SECRET }
    });
    
    return NextResponse.json(res.data);
  } catch (error: any) {
    if (error.response?.status === 404) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(
      { error: "Error communicating with backend server" }, 
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const res = await axios.post(`${BACKEND_URL}/api/settings`, body, {
      headers: { 'x-saas-secret': FRONTEND_SECRET }
    });
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error communicating with backend server" }, 
      { status: error.response?.status || 500 }
    );
  }
}