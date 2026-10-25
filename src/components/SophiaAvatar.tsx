import React, { useState, useEffect } from 'react';

export type SophiaPose = 'waving' | 'pointing' | 'cheering' | 'worried';

interface SophiaAvatarProps {
  pose: SophiaPose;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  reducedMotion?: boolean;
}

export const SophiaAvatar: React.FC<SophiaAvatarProps> = ({
  pose,
  className = '',
  size = 'md',
  reducedMotion = false,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Natural blink loop every 3.5 - 6 seconds
  useEffect(() => {
    if (reducedMotion) return;

    let timeoutId: NodeJS.Timeout;
    const scheduleBlink = () => {
      const delay = Math.random() * 2500 + 3500;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 160);
      }, delay);
    };

    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, [reducedMotion]);

  const sizeClasses = {
    sm: 'w-20 h-28',
    md: 'w-32 h-44',
    lg: 'w-44 h-60',
    xl: 'w-56 h-76',
  };

  return (
    <div
      className={`relative inline-block select-none pointer-events-none ${sizeClasses[size]} ${className}`}
      aria-label={`Miss Sophia Hartwell, Station Master (${pose} pose)`}
      role="img"
    >
      <svg
        viewBox="0 0 200 280"
        className={`w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] ${
          reducedMotion ? '' : 'animate-[sophia-idle_3.5s_ease-in-out_infinite]'
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Hair Gradient: Warm rich Auburn */}
          <linearGradient id="auburnHair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9b381e" />
            <stop offset="60%" stopColor="#7a240e" />
            <stop offset="100%" stopColor="#551505" />
          </linearGradient>

          {/* Skin Tone Gradient: Healthy Victorian porcelain */}
          <linearGradient id="skinTone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffeedd" />
            <stop offset="100%" stopColor="#fed2b5" />
          </linearGradient>

          {/* Blush */}
          <radialGradient id="blushGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
          </radialGradient>

          {/* GWR Uniform Navy Blue */}
          <linearGradient id="gwrNavy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#223759" />
            <stop offset="50%" stopColor="#15243e" />
            <stop offset="100%" stopColor="#0c172a" />
          </linearGradient>

          {/* Polished Brass Gold */}
          <linearGradient id="brassGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe682" />
            <stop offset="45%" stopColor="#d4af37" />
            <stop offset="85%" stopColor="#9e7b1c" />
            <stop offset="100%" stopColor="#5a4207" />
          </linearGradient>

          {/* Cap Visor Leather */}
          <linearGradient id="blackPatentLeather" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#111827" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
        </defs>

        {/* 1. BACK HAIR / NEAT BRAID */}
        <g id="back-hair">
          {/* Back hair volume */}
          <ellipse cx="100" cy="98" rx="46" ry="44" fill="url(#auburnHair)" />

          {/* Auburn Braid draped over left shoulder */}
          <path
            d="M 64 125 C 55 145, 52 165, 58 185 C 64 200, 56 215, 60 225 C 62 230, 60 238, 62 242 C 64 246, 68 245, 66 238"
            stroke="url(#auburnHair)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Braid ribs */}
          <ellipse cx="60" cy="148" rx="7" ry="5" fill="#581606" transform="rotate(-20 60 148)" />
          <ellipse cx="58" cy="168" rx="7" ry="5" fill="#581606" transform="rotate(20 58 168)" />
          <ellipse cx="60" cy="188" rx="6" ry="4.5" fill="#581606" transform="rotate(-15 60 188)" />
          <ellipse cx="59" cy="208" rx="5" ry="4" fill="#581606" transform="rotate(15 59 208)" />
          {/* Braid ribbon tie in GWR gold */}
          <rect x="56" y="224" width="8" height="4" rx="2" fill="url(#brassGold)" />
        </g>

        {/* 2. BODY / UNIFORM JACKET */}
        <g id="body">
          {/* Victorian High-Collar Shirt */}
          <path d="M 88 126 L 112 126 L 105 144 L 95 144 Z" fill="#ffffff" />
          <path d="M 97 132 L 100 137 L 103 132" stroke="#b91c1c" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Fitted Navy Uniform Jacket */}
          <path
            d="M 66 142 C 72 135, 85 132, 100 132 C 115 132, 128 135, 134 142 L 146 220 C 146 236, 134 246, 100 246 C 66 246, 54 236, 54 220 Z"
            fill="url(#gwrNavy)"
          />

          {/* Jacket Lapels */}
          <path d="M 82 133 L 100 168 L 76 150 Z" fill="#1b2a47" stroke="#2b4372" strokeWidth="1" />
          <path d="M 118 133 L 100 168 L 124 150 Z" fill="#1b2a47" stroke="#2b4372" strokeWidth="1" />

          {/* Gold Epaulets / Shoulder Cords */}
          <rect x="58" y="140" width="16" height="5" rx="2.5" fill="url(#brassGold)" transform="rotate(-12 66 142)" />
          <rect x="126" y="140" width="16" height="5" rx="2.5" fill="url(#brassGold)" transform="rotate(12 134 142)" />

          {/* Brass Buttons down jacket front */}
          <circle cx="100" cy="172" r="3.5" fill="url(#brassGold)" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))" />
          <circle cx="100" cy="190" r="3.5" fill="url(#brassGold)" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))" />
          <circle cx="100" cy="208" r="3.5" fill="url(#brassGold)" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))" />
          <circle cx="100" cy="226" r="3.5" fill="url(#brassGold)" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))" />

          {/* Brass Pocket Watch Chain (Albert Chain) across waistcoat */}
          <path
            d="M 97 190 C 88 198, 80 196, 76 188"
            stroke="url(#brassGold)"
            strokeWidth="1.8"
            fill="none"
            strokeDasharray="2 1.5"
          />
          {/* Small pocket watch fob medallion */}
          <circle cx="75" cy="189" r="2.5" fill="url(#brassGold)" />
        </g>

        {/* 3. HEAD & NECK */}
        <g id="neck-and-face">
          {/* Neck */}
          <path d="M 90 115 L 110 115 L 112 135 L 88 135 Z" fill="url(#skinTone)" />
          {/* Neck Shadow */}
          <path d="M 88 126 C 94 132, 106 132, 112 126 L 112 132 L 88 132 Z" fill="#e59873" opacity="0.35" />

          {/* Cute Round Face */}
          <path
            d="M 68 84 C 68 62, 82 52, 100 52 C 118 52, 132 62, 132 84 C 132 108, 120 126, 100 126 C 80 126, 68 108, 68 84 Z"
            fill="url(#skinTone)"
          />

          {/* Rosy Victorian Cheeks */}
          <ellipse cx="78" cy="98" rx="8" ry="5" fill="url(#blushGradient)" />
          <ellipse cx="122" cy="98" rx="8" ry="5" fill="url(#blushGradient)" />

          {/* Dainty Nose */}
          <path d="M 99 90 C 101 93, 102 93, 103 91" stroke="#d9774a" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Sweet Expressive Mouth based on pose */}
          {pose === 'worried' ? (
            <path d="M 93 108 C 97 104, 103 104, 107 108" stroke="#a83232" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : pose === 'cheering' ? (
            <path
              d="M 91 103 C 91 103, 100 116, 109 103 Z"
              fill="#c53030"
              stroke="#8a1c1c"
              strokeWidth="1.2"
            />
          ) : (
            <path
              d="M 93 103 C 96 109, 104 109, 107 103"
              stroke="#b91c1c"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Big Expressive Eyes & Eyelashes */}
          {isBlinking ? (
            // Blinking curved lines
            <g>
              <path d="M 77 86 C 82 90, 87 90, 91 86" stroke="#4a1d0d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 109 86 C 113 90, 118 90, 123 86" stroke="#4a1d0d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </g>
          ) : pose === 'worried' ? (
            // Wide concerned eyes + raised inner eyebrows
            <g>
              {/* Eyebrows */}
              <path d="M 76 74 C 82 72, 89 77, 91 79" stroke="#581606" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <path d="M 124 74 C 118 72, 111 77, 109 79" stroke="#581606" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              {/* Eyes */}
              <ellipse cx="84" cy="85" rx="7" ry="8" fill="#2d1e12" />
              <ellipse cx="116" cy="85" rx="7" ry="8" fill="#2d1e12" />
              {/* Eye Catchlights */}
              <circle cx="82" cy="82" r="2.8" fill="#ffffff" />
              <circle cx="86" cy="87" r="1.2" fill="#ffffff" />
              <circle cx="114" cy="82" r="2.8" fill="#ffffff" />
              <circle cx="118" cy="87" r="1.2" fill="#ffffff" />
              {/* Sweat drop on forehead/temple */}
              <path d="M 128 72 C 128 70, 131 66, 131 66 C 131 66, 134 70, 134 72 C 134 74, 131.3 75.5, 128 72 Z" fill="#60a5fa" />
            </g>
          ) : (
            // Bright cheerful welcoming/confident eyes
            <g>
              {/* Soft Eyebrows */}
              <path d="M 76 76 C 81 74, 88 75, 91 77" stroke="#581606" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M 124 76 C 119 74, 112 75, 109 77" stroke="#581606" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              {/* Hazel/Amber Iris */}
              <ellipse cx="84" cy="85" rx="7" ry="7.5" fill="#4d2c14" />
              <ellipse cx="116" cy="85" rx="7" ry="7.5" fill="#4d2c14" />
              {/* Pupils */}
              <ellipse cx="84" cy="85" rx="4.5" ry="5" fill="#150a04" />
              <ellipse cx="116" cy="85" rx="4.5" ry="5" fill="#150a04" />
              {/* Sparkle Highlights */}
              <circle cx="82" cy="82.5" r="2.6" fill="#ffffff" />
              <circle cx="86" cy="87" r="1.2" fill="#ffffff" />
              <circle cx="114" cy="82.5" r="2.6" fill="#ffffff" />
              <circle cx="118" cy="87" r="1.2" fill="#ffffff" />
              {/* Eyelash fringe */}
              <path d="M 75 82 C 81 79, 90 80, 93 83" stroke="#2e1408" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M 125 82 C 119 79, 110 80, 107 83" stroke="#2e1408" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* Front bangs framing face */}
          <path
            d="M 68 76 C 72 65, 82 66, 92 72 C 100 64, 116 64, 132 76 C 126 68, 112 60, 100 60 C 86 60, 74 66, 68 76 Z"
            fill="url(#auburnHair)"
          />
          {/* Side curls */}
          <path d="M 68 85 C 64 96, 67 110, 71 114 C 70 106, 68 96, 70 85 Z" fill="#7a240e" />
          <path d="M 132 85 C 136 96, 133 110, 129 114 C 130 106, 132 96, 130 85 Z" fill="#7a240e" />
        </g>

        {/* 4. VICTORIAN STATION MASTER'S PEAKED CAP */}
        <g id="station-master-cap">
          {/* Cap Crown (Navy Blue) */}
          <path
            d="M 52 56 C 52 28, 70 18, 100 18 C 130 18, 148 28, 148 56 C 148 59, 145 62, 140 64 C 122 61, 78 61, 60 64 C 55 62, 52 59, 52 56 Z"
            fill="url(#gwrNavy)"
          />
          {/* Crown top seam crease */}
          <path d="M 70 30 C 85 24, 115 24, 130 30" stroke="#3b537d" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Gold Embroidered Cap Band */}
          <path
            d="M 56 52 C 72 49, 128 49, 144 52 L 145 61 C 128 58, 72 58, 55 61 Z"
            fill="url(#brassGold)"
          />

          {/* GWR Monogram Crest Badge in Center of Band */}
          <ellipse cx="100" cy="55" rx="7.5" ry="6" fill="#15243e" stroke="url(#brassGold)" strokeWidth="1.5" />
          <path d="M 96 55 L 98 52 L 102 52 L 104 55 L 100 58 Z" fill="url(#brassGold)" />

          {/* Polished Black Visor / Peaked Brim */}
          <path
            d="M 52 60 C 65 67, 135 67, 148 60 C 151 63, 147 71, 135 73 C 114 76, 86 76, 65 73 C 53 71, 49 63, 52 60 Z"
            fill="url(#blackPatentLeather)"
          />
          {/* Visor Patent Leather Highlight Reflection */}
          <path
            d="M 68 64 C 85 68, 115 68, 132 64"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.65"
          />
        </g>

        {/* 5. ARMS & WHITE GLOVES (DYNAMIC BY POSE) */}
        {pose === 'waving' && (
          <g id="pose-waving">
            {/* Left resting arm */}
            <path d="M 64 146 C 52 165, 52 195, 56 215" stroke="url(#gwrNavy)" strokeWidth="15" strokeLinecap="round" />
            <ellipse cx="56" cy="220" rx="7" ry="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Right waving arm raised up */}
            <path
              d="M 136 146 C 150 135, 162 110, 165 88"
              stroke="url(#gwrNavy)"
              strokeWidth="15"
              strokeLinecap="round"
            />
            {/* Gold cuff stripe */}
            <rect x="156" y="94" width="13" height="4" rx="2" fill="url(#brassGold)" transform="rotate(-35 156 94)" />
            {/* White-gloved hand waving with motion */}
            <g transform="translate(162, 70)">
              {/* Palm */}
              <ellipse cx="8" cy="12" rx="8" ry="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
              {/* Fingers waving */}
              <rect x="1" y="0" width="4.5" height="10" rx="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" transform="rotate(-15 3 5)" />
              <rect x="7" y="-2" width="4.5" height="11" rx="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="13" y="0" width="4.5" height="10" rx="2.2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" transform="rotate(15 15 5)" />
              {/* Thumb */}
              <ellipse cx="1" cy="14" rx="4" ry="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" transform="rotate(-30 1 14)" />
            </g>
          </g>
        )}

        {pose === 'pointing' && (
          <g id="pose-pointing">
            {/* Left arm resting */}
            <path d="M 64 146 C 52 165, 52 195, 56 215" stroke="url(#gwrNavy)" strokeWidth="15" strokeLinecap="round" />
            <ellipse cx="56" cy="220" rx="7" ry="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Right arm extended pointing right towards UI */}
            <path
              d="M 136 146 C 155 148, 175 142, 185 136"
              stroke="url(#gwrNavy)"
              strokeWidth="15"
              strokeLinecap="round"
            />
            {/* Gold cuff band */}
            <rect x="172" y="132" width="12" height="4" rx="2" fill="url(#brassGold)" transform="rotate(-10 172 132)" />
            {/* White-gloved hand pointing with index finger */}
            <g transform="translate(182, 126)">
              {/* Fist */}
              <ellipse cx="5" cy="8" rx="7" ry="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
              {/* Extended index finger */}
              <rect x="7" y="5" width="16" height="5.5" rx="2.7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
              {/* Folded thumb */}
              <ellipse cx="6" cy="10" rx="3.5" ry="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              {/* Sparkle at index fingertip */}
              <circle cx="24" cy="8" r="2.5" fill="#f59e0b" className="animate-ping" />
            </g>
          </g>
        )}

        {pose === 'cheering' && (
          <g id="pose-cheering">
            {/* Left arm raised */}
            <path
              d="M 64 146 C 48 130, 36 105, 34 82"
              stroke="url(#gwrNavy)"
              strokeWidth="15"
              strokeLinecap="round"
            />
            <rect x="29" y="88" width="12" height="4" rx="2" fill="url(#brassGold)" transform="rotate(35 35 90)" />
            {/* Left fist */}
            <circle cx="32" cy="74" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />

            {/* Right arm raised high in victory fist */}
            <path
              d="M 136 146 C 152 130, 164 105, 166 82"
              stroke="url(#gwrNavy)"
              strokeWidth="15"
              strokeLinecap="round"
            />
            <rect x="159" y="88" width="12" height="4" rx="2" fill="url(#brassGold)" transform="rotate(-35 165 90)" />
            {/* Right fist */}
            <circle cx="168" cy="74" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />

            {/* Victory sparks around Sophia */}
            <g>
              <polygon points="176,55 180,63 188,65 182,71 184,79 176,74 168,79 170,71 164,65 172,63" fill="url(#brassGold)" />
              <polygon points="24,55 28,63 36,65 30,71 32,79 24,74 16,79 18,71 12,65 20,63" fill="url(#brassGold)" />
            </g>
          </g>
        )}

        {pose === 'worried' && (
          <g id="pose-worried">
            {/* Left hand to waist / tense */}
            <path d="M 64 146 C 50 165, 52 185, 66 200" stroke="url(#gwrNavy)" strokeWidth="15" strokeLinecap="round" />
            <ellipse cx="68" cy="202" rx="7" ry="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />

            {/* Right hand raised nervously touching her peaked cap */}
            <path
              d="M 136 146 C 154 135, 156 95, 142 66"
              stroke="url(#gwrNavy)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <rect x="144" y="82" width="11" height="4" rx="2" fill="url(#brassGold)" transform="rotate(-60 144 82)" />
            {/* White-gloved hand resting on cap brim */}
            <g transform="translate(138, 56)">
              <ellipse cx="4" cy="5" rx="6" ry="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
              <rect x="1" y="-2" width="4" height="7" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="5" y="-1" width="4" height="7" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
