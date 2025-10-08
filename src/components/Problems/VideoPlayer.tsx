interface Props {
  videoUrl?: string;
  videoEmbedId?: string;
  title?: string;
}

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function VideoPlayer({ videoUrl, videoEmbedId, title = "Video" }: Props) {
  // If we have a direct embed ID, use it
  if (videoEmbedId) {
    return (
      <div style={{ width: '100%', marginBottom: 12 }}>
        <div style={{ 
          position: 'relative', 
          paddingBottom: '56.25%', // 16:9 aspect ratio
          height: 0,
          overflow: 'hidden',
          borderRadius: 8,
          border: '1px solid var(--card-border)'
        }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 8
            }}
            src={`https://www.youtube.com/embed/${videoEmbedId}`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Try to extract YouTube ID from URL
  if (videoUrl) {
    const youtubeId = extractYouTubeId(videoUrl);
    if (youtubeId) {
      return (
        <div style={{ width: '100%', marginBottom: 12 }}>
          <div style={{ 
            position: 'relative', 
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            borderRadius: 8,
            border: '1px solid var(--card-border)'
          }}>
            <iframe
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: 8
              }}
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
    }

    // For other video URLs, try to embed directly
    if (videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.ogg')) {
      return (
        <div style={{ width: '100%', marginBottom: 12 }}>
          <video
            controls
            style={{
              width: '100%',
              maxHeight: 300,
              borderRadius: 8,
              border: '1px solid var(--card-border)'
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
        </div>
      );
    }

    // Fallback to link
    return (
      <div style={{ marginBottom: 12 }}>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noreferrer" 
          style={{ 
            color: "#3fb950",
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            border: '1px solid var(--card-border)',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14
          }}
        >
          <span>🎥</span>
          Открыть видео
        </a>
      </div>
    );
  }

  return (
    <div style={{ opacity: 0.6, fontSize: 14 }}>
      Видео отсутствует
    </div>
  );
}

