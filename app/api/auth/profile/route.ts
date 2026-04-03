import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest, hashPassword } from "../../../../lib/auth";
import { findUserById, users } from "../../../../lib/db";

// GET current user profile
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = findUserById(payload.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return user info without password
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// UPDATE user profile
export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userIndex = users.findIndex(u => u.id === payload.userId);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    // Update name
    if (name !== undefined && name.trim()) {
      users[userIndex].name = name.trim();
    }

    // Update email
    if (email !== undefined && email.trim()) {
      // Check if email is already taken by another user
      const existingUser = users.find(u => u.email === email.trim() && u.id !== payload.userId);
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
      users[userIndex].email = email.trim();
    }

    // Update password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        );
      }

      // Verify current password (we need to import verifyPassword)
      const bcrypt = await import("bcryptjs");
      const isValid = await bcrypt.compare(currentPassword, users[userIndex].password);
      
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      users[userIndex].password = await hashPassword(newPassword);
    }

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          id: users[userIndex].id,
          email: users[userIndex].email,
          name: users[userIndex].name,
          createdAt: users[userIndex].createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}