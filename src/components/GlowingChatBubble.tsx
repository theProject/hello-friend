// GlowingChatBubble.tsx
"use client";

import { useState, useEffect } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import FormattedMessage from "./FormattedMessage";

interface ChatMessage {
  id: string;
  content: string;
  role: string;
  imageUrl?: string;
  imageAlt?: string;
}

interface GlowingChatBubbleProps {
  message: ChatMessage;
  autoGlow?: boolean;
  onImageClick: (url: string) => void;
  glassStyle: string;
  messageStyle: string;
}

export function GlowingChatBubble({
  message,
  autoGlow = false,
  onImageClick,
  glassStyle,
  messageStyle,
}: GlowingChatBubbleProps) {
  const [glowActive, setGlowActive] = useState(false);

  useEffect(() => {
    if (autoGlow) {
      setGlowActive(true);
      const timer = setTimeout(() => {
        setGlowActive(false);
      }, 2000); // glow for 2 seconds; adjust as needed
      return () => clearTimeout(timer);
    }
  }, [autoGlow]);

  return (
    <div className="relative">
      {glowActive && (
        <GlowingEffect
          glow={true}
          disabled={false}
          className="absolute inset-0 pointer-events-none"
        />
      )}
      <FormattedMessage
        key={message.id}
        content={message.content}
        isUser={message.role === "user"}
        imageUrl={message.imageUrl}
        imageAlt={message.imageAlt}
        onImageClick={onImageClick}
        glassStyle={glassStyle}
        messageStyle={messageStyle}
      />
    </div>
  );
}
