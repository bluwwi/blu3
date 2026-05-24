"use client";

import { Track } from "@/utils/types";
import { asTrackFromRecent, T } from "@/utils/roomHelpers";

interface Props {
  queue: Track[];
  recentTracks: Array<{
    videoId: string;
    trackName: string;
    artistName: string;
    image: string;
    playedAt: number;
  }>;
  canControlPlayback: boolean;
  handleAdminPlayTrack: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  addToQueue: (track: Track) => void;
  activeVideoId: string | null | undefined;
}

export function QueueAndHistory({
  queue,
  recentTracks,
  canControlPlayback,
  handleAdminPlayTrack,
  removeFromQueue,
  addToQueue,
  activeVideoId,
}: Props) {
  return (
    <div style={{ paddingTop: "8px" }}>
      {/* Queue */}
      <p
        style={{
          fontSize: "9px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: T.text3,
          paddingBottom: "8px",
          borderBottom: `1px solid ${T.border}`,
          marginBottom: "10px",
        }}
      >
        Room Queue
      </p>
      {queue.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 20px",
            color: T.text3,
          }}
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "10px",
              opacity: 0.4,
            }}
          >
            ⊞
          </div>
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Queue is empty
          </p>
        </div>
      ) : (
        <div>
          {queue.map((track, i) => (
            <div
              key={`${track.id}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "10px",
                border: `1px solid ${T.border2}`,
                background: T.surface,
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: T.text3,
                  width: "14px",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <img
                src={track.image}
                alt=""
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  flexShrink: 0,
                  background: T.surface3,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: T.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {track.name}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: T.text2,
                    marginTop: "2px",
                  }}
                >
                  {track.artists?.[0]?.name}
                </p>
              </div>
              {canControlPlayback && (
                <button
                  onClick={() => {
                    handleAdminPlayTrack(track);
                    removeFromQueue(track.id);
                  }}
                  style={{
                    fontSize: "9px",
                    color: T.purpleLight,
                    border: `1px solid rgba(106,90,205,0.3)`,
                    background: T.purpleGhost,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontFamily: T.font,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Play
                </button>
              )}
              <button
                onClick={() => removeFromQueue(track.id)}
                style={{
                  color: T.text3,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "4px",
                  borderRadius: "6px",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <p
        style={{
          fontSize: "9px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: T.text3,
          paddingBottom: "8px",
          borderBottom: `1px solid ${T.border}`,
          marginBottom: "10px",
          marginTop: "24px",
        }}
      >
        Room History{" "}
        <span style={{ marginLeft: "8px", opacity: 0.5 }}>
          {recentTracks.length} played
        </span>
      </p>
      {recentTracks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 20px",
            color: T.text3,
          }}
        >
          <div
            style={{
              fontSize: "28px",
              marginBottom: "10px",
              opacity: 0.4,
            }}
          >
            🕘
          </div>
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            No history yet
          </p>
        </div>
      ) : (
        <div>
          {recentTracks.map((track, i) => {
            const historyTrack: Track = {
              id: track.videoId,
              videoId: track.videoId,
              name: track.trackName,
              artists: [{ name: track.artistName }],
              album: { name: "" },
              image: track.image,
              duration_ms: 0,
              explicit: false,
            };
            const isActive = activeVideoId === track.videoId;
            return (
              <div
                key={`${track.videoId}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: isActive
                    ? `1px solid rgba(106,90,205,0.3)`
                    : `1px solid ${T.border2}`,
                  background: isActive ? T.purpleGhost : T.surface,
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: T.text3,
                    width: "14px",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <img
                  src={track.image}
                  alt=""
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    flexShrink: 0,
                    background: T.surface3,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: isActive ? T.purpleLight : T.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {track.trackName}
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      color: T.text2,
                      marginTop: "2px",
                    }}
                  >
                    {track.artistName}
                  </p>
                </div>
                {canControlPlayback && (
                  <button
                    onClick={() => handleAdminPlayTrack(historyTrack)}
                    style={{
                      fontSize: "9px",
                      color: T.purpleLight,
                      border: `1px solid rgba(106,90,205,0.3)`,
                      background: T.purpleGhost,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: T.font,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Play
                  </button>
                )}
                <button
                  onClick={() => addToQueue(historyTrack)}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "7px",
                    border: `1px solid ${T.border}`,
                    background: T.surface3,
                    color: T.text2,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  ＋
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
