import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL;
const FRONTEND_SECRET = process.env.FRONTEND_SECRET;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const res = await axios.get(`${BACKEND_URL}/api/reviews/${username}`, {
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