import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "../../../../lib/auth";
import { findUserById } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    // Get token from request
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Find user by ID
    const user = await findUserById(payload.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return user info (without password)
    return NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isDeleted: user.isDeleted,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}