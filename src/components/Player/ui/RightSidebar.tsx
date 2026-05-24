"use client";

import { useRef } from "react";
import { T } from "@/utils/roomHelpers";

interface Member {
  userId: string;
  name: string;
  avatar?: string;
}

interface Message {
  id: string;
  name: string;
  text: string;
  avatar?: string;
}

interface Props {
  members: Member[];
  messages: Message[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChat: () => void;
}

export function RightSidebar({
  members,
  messages,
  chatInput,
  setChatInput,
  handleSendChat,
}: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        borderLeft: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        background: T.surface,
        overflow: "hidden",
      }}
    >
      {/* Members */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontSize: "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: T.text3,
            marginBottom: "10px",
          }}
        >
          {members.length} listening
        </p>
        {members.map((m) => (
          <div
            key={m.userId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            {m.avatar ? (
              <img
                src={m.avatar}
                alt=""
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  border: `1px solid ${T.border}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: T.purpleDim,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  color: T.purpleLight,
                  fontWeight: 500,
                  border: `1px solid rgba(106,90,205,0.3)`,
                  flexShrink: 0,
                }}
              >
                {m.name[0]}
              </div>
            )}
            <span style={{ fontSize: "11px", color: T.text2 }}>
              {m.name.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}
        className="room-scroll"
      >
        {messages.length === 0 && (
          <p
            style={{
              fontSize: "11px",
              color: T.text3,
              textAlign: "center",
              marginTop: "30px",
            }}
          >
            no messages yet
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            {msg.avatar ? (
              <img
                src={msg.avatar}
                alt=""
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  marginTop: "1px",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: T.surface3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "9px",
                  color: T.text3,
                  flexShrink: 0,
                }}
              >
                {msg.name[0]}
              </div>
            )}
            <div>
              <span
                style={{
                  fontSize: "10px",
                  color: T.text3,
                  marginRight: "6px",
                }}
              >
                {msg.name.split(" ")[0]}
              </span>
              <span style={{ fontSize: "11px", color: T.text2 }}>
                {msg.text}
              </span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px 12px",
          borderTop: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          placeholder="say something…"
          style={{
            flex: 1,
            background: T.surface3,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontSize: "11px",
            padding: "8px 12px",
            borderRadius: "8px",
            outline: "none",
            fontFamily: T.font,
          }}
        />
        <button
          onClick={handleSendChat}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            border: "none",
            background: T.surface3,
            color: T.text2,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            transition: "all 0.15s",
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
