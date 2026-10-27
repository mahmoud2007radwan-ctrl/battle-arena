
import { useEffect, useRef, useState } from "react";
import "./App.css";

const WIDTH = 960;
const HEIGHT = 500;
const GROUND = 410;
const ROUND_TIME = 60;

const COLORS = {
  backgroundTop: "#08091f",
  backgroundBottom: "#190d35",
  floor: "#10132f",
  floorLine: "#22d3ee",
  player1: "#22d3ee",
  player2: "#ff3cac",
  text: "#f5f3ff",
  muted: "#aaa9d4",
  skin: "#e9b99a",
  belt: "#17152d",
  glove: "#ffffff",
  healthBackground: "#292342",
  damage: "#ff426d",
  overlay: "rgba(5, 5, 24, 0.82)",
};



const createFighter = (x, color, facing) => ({
  x,
  y: GROUND,
  vx: 0,
  vy: 0,
  color,
  facing,
  health: 100,

  attackTimer: 0,
  attackCooldown: 0,
  attackHit: false,

  hitFlash: 0,
  hitStun: 0,
  recoil: 0,
  walkTime: 0,
  previousX: x,
});


const controls = {
  p1: { left: "a", right: "d", jump: "w", attack: "f" },
  p2: {left: "arrowleft", right: "arrowright",jump: "arrowup",attack: "enter",
  },
};



function drawFighter(ctx, fighter, name) {
  const {
    x, y, color, facing,
    attackTimer, hitFlash, hitStun, walkTime, vx
  } = fighter;

  const attacking = attackTimer > 0;
  const impact = hitStun > 0;
  const bodyColor = impact ? "#ffffff" : color;
  const swing = Math.sin(walkTime * 12) * Math.min(1, Math.abs(vx) / 260);
  const punchProgress = attacking
    ? Math.sin((1 - attackTimer / 0.22) * Math.PI)
    : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  // Neon ground shadow
  ctx.fillStyle = color + "30";
  ctx.beginPath();
  ctx.ellipse(0, -2, 38, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -2, 28, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Body lean while punching
  const lean = attacking ? -punchProgress * 9 : impact ? -5 : 0;
  ctx.translate(lean, 0);

  // Back leg
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#17172e";
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(-8, -39);
  ctx.lineTo(-17 - swing * 5, -22);
  ctx.lineTo(-24 - swing * 8, -5);
  ctx.stroke();

  // Front leg
  ctx.beginPath();
  ctx.moveTo(8, -39);
  ctx.lineTo(15 + swing * 5, -21);
  ctx.lineTo(22 + swing * 8, -5);
  ctx.stroke();

  // Neon leg seams
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-17 - swing * 5, -22);
  ctx.lineTo(-24 - swing * 8, -5);
  ctx.moveTo(15 + swing * 5, -21);
  ctx.lineTo(22 + swing * 8, -5);
  ctx.stroke();

  // Boots
  ctx.fillStyle = "#09091c";
  ctx.fillRect(-34 - swing * 8, -8, 20, 8);
  ctx.fillRect(13 + swing * 8, -8, 20, 8);

  ctx.fillStyle = color;
  ctx.fillRect(-31 - swing * 8, -5, 15, 3);
  ctx.fillRect(16 + swing * 8, -5, 15, 3);

  // Torso armor
  ctx.fillStyle = "#17172e";
  ctx.beginPath();
  ctx.moveTo(-17, -83);
  ctx.lineTo(13, -83);
  ctx.lineTo(21, -45);
  ctx.lineTo(0, -35);
  ctx.lineTo(-21, -45);
  ctx.closePath();
  ctx.fill();

  // Chest plate
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-12, -78);
  ctx.lineTo(10, -78);
  ctx.lineTo(15, -49);
  ctx.lineTo(0, -43);
  ctx.lineTo(-15, -49);
  ctx.closePath();
  ctx.fill();

  // Armor highlight
  ctx.strokeStyle = "#ffffff";
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -74);
  ctx.lineTo(-2, -53);
  ctx.lineTo(8, -62);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Belt
  ctx.fillStyle = "#09091c";
  ctx.fillRect(-18, -45, 36, 7);
  ctx.fillStyle = "#ffe66d";
  ctx.fillRect(-3, -45, 6, 7);

  // Back arm
  ctx.strokeStyle = "#17172e";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(-13, -77);
  ctx.lineTo(-27, -61);
  ctx.lineTo(-19, -47);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-27, -61);
  ctx.lineTo(-19, -47);
  ctx.stroke();

  // Front shoulder
  ctx.fillStyle = "#252345";
  ctx.beginPath();
  ctx.arc(13, -77, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(13, -77, 11, -1.3, 1.4);
  ctx.stroke();

  // Punching arm: extend smoothly during attack
  const elbowX = attacking ? 27 + punchProgress * 18 : 23;
  const elbowY = attacking ? -73 + punchProgress * 3 : -60;
  const fistX = attacking ? 38 + punchProgress * 35 : 13;
  const fistY = attacking ? -70 + punchProgress * 3 : -47;

  ctx.strokeStyle = "#17172e";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(15, -76);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(fistX, fistY);
  ctx.stroke();

  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(18, -76);
  ctx.lineTo(elbowX, elbowY);
  ctx.stroke();

  // Glowing boxing glove
  ctx.shadowColor = color;
  ctx.shadowBlur = attacking ? 24 : 10;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(fistX, fistY, 11, 9, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillRect(fistX - 7, fistY + 4, 12, 4);
  ctx.shadowBlur = 0;

  // Neck
  ctx.fillStyle = COLORS.skin;
  ctx.fillRect(-6, -94, 12, 12);

  // Head
  ctx.fillStyle = COLORS.skin;
  ctx.beginPath();
  ctx.ellipse(0, -104, 16, 19, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair / helmet silhouette
  ctx.fillStyle = "#111126";
  ctx.beginPath();
  ctx.moveTo(-17, -105);
  ctx.lineTo(-19, -123);
  ctx.lineTo(-7, -117);
  ctx.lineTo(0, -131);
  ctx.lineTo(7, -118);
  ctx.lineTo(19, -123);
  ctx.lineTo(15, -103);
  ctx.lineTo(8, -112);
  ctx.lineTo(-7, -112);
  ctx.closePath();
  ctx.fill();

  // Hair neon accents
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-13, -117);
  ctx.lineTo(-2, -120);
  ctx.lineTo(4, -127);
  ctx.moveTo(3, -117);
  ctx.lineTo(12, -119);
  ctx.stroke();

  // Eye visor
  ctx.fillStyle = "#09091c";
  ctx.fillRect(2, -108, 12, 6);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(7, -106, 5, 2);

  // Attack trail
  if (attacking && punchProgress > 0.45) {
    ctx.globalAlpha = punchProgress;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.arc(
      fistX - 15,
      fistY,
      25,
      -0.8,
      0.65
    );
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Player name
  ctx.scale(facing, 1);
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillText(name, 0, -143);
  ctx.shadowBlur = 0;

  if (hitFlash > 0) {
    ctx.globalAlpha = Math.min(0.65, hitFlash * 4);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -80, 37, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}





function drawScene(ctx, p1, p2, timeLeft, phase, countdown) {
  // Night city background
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#07081d");
  sky.addColorStop(0.52, "#191044");
  sky.addColorStop(1, "#08091e");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Distant city skyline
  for (let i = 0; i < 30; i++) {
    const x = i * 35;
    const h = 65 + ((i * 47) % 100);
    ctx.fillStyle = i % 2 ? "#111431" : "#171039";
    ctx.fillRect(x, GROUND - h, 27, h);

    for (let wy = GROUND - h + 12; wy < GROUND - 8; wy += 17) {
      ctx.fillStyle = i % 2 ? "#22d3ee55" : "#ff3cac55";
      ctx.fillRect(x + 6, wy, 3, 5);
      ctx.fillRect(x + 16, wy, 3, 5);
    }
  }

  // Neon arena pillars
  for (const x of [25, 935]) {
    const glow = ctx.createLinearGradient(x - 5, 100, x + 5, 400);
    glow.addColorStop(0, "#22d3ee00");
    glow.addColorStop(0.5, x < WIDTH / 2 ? "#22d3ee" : "#ff3cac");
    glow.addColorStop(1, "#22d3ee00");

    ctx.fillStyle = glow;
    ctx.fillRect(x - 5, 100, 10, 300);
  }

  // Arena back wall
  ctx.fillStyle = "#0b0d27";
  ctx.fillRect(0, 245, WIDTH, 165);

  // Neon wall panels
  for (let i = 0; i < 10; i++) {
    const x = i * 100 + 10;
    ctx.strokeStyle = i < 5 ? "#22d3ee66" : "#ff3cac66";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 267, 76, 96);
    ctx.fillStyle = i < 5 ? "#22d3ee08" : "#ff3cac08";
    ctx.fillRect(x, 267, 76, 96);
  }

  // Audience silhouettes
  for (let i = 0; i < 70; i++) {
    const x = (i * 53) % WIDTH;
    const y = 375 + ((i * 19) % 28);

    ctx.fillStyle = i % 2 ? "#08091b" : "#12112d";
    ctx.beginPath();
    ctx.arc(x, y - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 5, y - 4, 10, 19);
  }

  // Arena floor
  const floor = ctx.createLinearGradient(0, GROUND, 0, HEIGHT);
  floor.addColorStop(0, "#17183e");
  floor.addColorStop(1, "#08091d");
  ctx.fillStyle = floor;
  ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);

  // Floor perspective grid
  ctx.lineWidth = 1;

  for (let i = -12; i <= 12; i++) {
    const x = WIDTH / 2 + i * 40;

    ctx.strokeStyle = i < 0 ? "#22d3ee55" : "#ff3cac55";
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2 + i * 5, GROUND);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }

  for (let i = 1; i <= 7; i++) {
    const t = i / 7;
    const y = GROUND + t * t * (HEIGHT - GROUND);

    ctx.strokeStyle = "#8b5cf644";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // Center platform markings
  ctx.strokeStyle = "#22d3ee88";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND + 35);
  ctx.lineTo(WIDTH, GROUND + 35);
  ctx.stroke();

  ctx.strokeStyle = "#ff3cac88";
  ctx.beginPath();
  ctx.moveTo(0, GROUND + 39);
  ctx.lineTo(WIDTH, GROUND + 39);
  ctx.stroke();

  // HUD panel
  ctx.fillStyle = "#08091de8";
  ctx.fillRect(0, 0, WIDTH, 82);

  // Player labels
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.player1;
  ctx.shadowColor = COLORS.player1;
  ctx.shadowBlur = 12;
  ctx.fillText("PLAYER 1", 28, 22);

  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.player2;
  ctx.shadowColor = COLORS.player2;
  ctx.fillText("PLAYER 2", WIDTH - 28, 22);
  ctx.shadowBlur = 0;

  // Health bars
  const drawHealth = (x, y, health, color, flip = false) => {
    const barWidth = 360;
    const barHeight = 17;
    const safeHealth = Math.max(0, Math.min(100, health));
    const width = barWidth * safeHealth / 100;

    ctx.fillStyle = "#211d3d";
    ctx.fillRect(x, y, barWidth, barHeight);

    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "#ffffff");

    ctx.fillStyle = gradient;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillRect(
      flip ? x + barWidth - width : x,
      y,
      width,
      barHeight
    );
    ctx.shadowBlur = 0;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, barWidth, barHeight);
  };

  drawHealth(28, 32, p1.health, COLORS.player1);
  drawHealth(WIDTH - 388, 32, p2.health, COLORS.player2, true);

  // Round timer
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 25px Arial";
  ctx.shadowColor = "#8b5cf7";
  ctx.shadowBlur = 14;
  ctx.fillText(
    String(Math.max(0, Math.ceil(timeLeft))).padStart(2, "0"),
    WIDTH / 2,
    52
  );
  ctx.shadowBlur = 0;

  // Fighters
  drawFighter(ctx, p1, "P1");
  drawFighter(ctx, p2, "P2");

  // Countdown overlay
  if (phase === "countdown") {
    ctx.fillStyle = COLORS.overlay;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = "center";
    ctx.font = "bold 76px Arial";
    ctx.fillStyle = countdown > 0 ? "#ffffff" : "#22d3ee";
    ctx.shadowColor = countdown > 0 ? "#8b5cf7" : "#22d3ee";
    ctx.shadowBlur = 28;
    ctx.fillText(countdown > 0 ? countdown : "FIGHT!", WIDTH / 2, 260);
    ctx.shadowBlur = 0;
  }
}



export default function App() {
  const canvasRef = useRef(null);
  const keysRef = useRef(new Set());

  const [screen, setScreen] = useState("menu");
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState([0, 0]);
  const [winner, setWinner] = useState("");
  const [roundMessage, setRoundMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [matchId, setMatchId] = useState(0);

  const startMatch = (event) => {
    event.preventDefault();

    const a = name1.trim();
    const b = name2.trim();

    if (!a || !b || a.length > 30 || b.length > 30) return;

    if (a.toLowerCase() === b.toLowerCase()) {
      alert("Please enter two different player names.");
      return;
    }

    setPlayer1(a);
    setPlayer2(b);
    setRound(1);
    setScore([0, 0]);
    setWinner("");
    setRoundMessage("");
    setSaveStatus("");
    setScreen("game");
    setMatchId((id) => id + 1);
  };

  useEffect(() => {
    if (screen !== "game" || !player1 || !player2) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const keys = keysRef.current;
    keys.clear();
    
let p1 = createFighter(245, COLORS.player1, 1);
let p2 = createFighter(715, COLORS.player2, -1);

    let currentRound = 1;
    let wins1 = 0;
    let wins2 = 0;
    let phase = "countdown";
    let countdown = 3;
    let countdownElapsed = 0;
    let transitionTimer = 0;
    let timeLeft = ROUND_TIME;
    let previousTime = performance.now();
    let animationId;
    let finished = false;

    const keydown = (event) => {
      const key = event.key.toLowerCase();

      if (
        ["arrowleft", "arrowright", "arrowup", "enter", " "].includes(key)
      ) {
        event.preventDefault();
      }

      keys.add(key);
    };

    const keyup = (event) => {
      keys.delete(event.key.toLowerCase());
    };

    const attack = (fighter) => {
      if (fighter.attackCooldown <= 0) {
        fighter.attackTimer = 0.22;
        fighter.attackCooldown = 0.55;
        fighter.attackHit = false;
      }
    };

    const updateFighter = (fighter, opponent, control, dt) => {
      fighter.attackTimer = Math.max(0, fighter.attackTimer - dt);
      fighter.attackCooldown = Math.max(0, fighter.attackCooldown - dt);
      fighter.hitFlash = Math.max(0, fighter.hitFlash - dt);
      fighter.hitStun = Math.max(0, fighter.hitStun - dt);
      fighter.recoil = Math.max(0, fighter.recoil - 400 * dt);
      fighter.walkTime += dt;

      fighter.vx = 0;

      if (keys.has(control.left)) fighter.vx = -260;
      if (keys.has(control.right)) fighter.vx = 260;

      if (
        keys.has(control.jump) &&
        Math.abs(fighter.y - GROUND) < 0.5
      ) {
        fighter.vy = -620;
      }

      if (keys.has(control.attack)) attack(fighter);

      fighter.x += fighter.vx * dt;
      fighter.vy += 1500 * dt;
      fighter.y += fighter.vy * dt;

      if (fighter.y >= GROUND) {
        fighter.y = GROUND;
        fighter.vy = 0;
      }

      fighter.x = Math.max(35, Math.min(WIDTH - 35, fighter.x));
      fighter.facing = opponent.x >= fighter.x ? 1 : -1;

      const closeEnough = Math.abs(fighter.x - opponent.x) < 105;
      const verticallyAligned = Math.abs(fighter.y - opponent.y) < 65;

      if (
        fighter.attackTimer > 0 &&
        !fighter.attackHit &&
        closeEnough &&
        verticallyAligned
      ) {
        opponent.health = Math.max(0, opponent.health - 10);
        opponent.hitFlash = 0.22;
        opponent.hitStun = 0.18;
        opponent.recoil = 180;
        opponent.x += fighter.facing * 28;
        opponent.x = Math.max(35, Math.min(WIDTH - 35, opponent.x));
        fighter.attackHit = true;
      }
    };

    const resetRound = () => {
      p1 = createFighter(245, COLORS.player1, 1);
      p2 = createFighter(715, COLORS.player2, -1);
      timeLeft = ROUND_TIME;
      countdown = 3;
      countdownElapsed = 0;
      phase = "countdown";
      transitionTimer = 0;
      keys.clear();
      setRound(currentRound);
      setRoundMessage("");
    };

    const saveMatch = async (finalWinner, finalScore) => {
      try {
        const response = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player1,
            player2,
            score1: finalScore[0],
            score2: finalScore[1],
            winner: finalWinner,
          }),
        });

        if (!response.ok) {
          throw new Error("Could not save the result.");
        }

        setSaveStatus("Result saved successfully.");
      } catch {
        setSaveStatus(
          "Could not save the result. Check that the backend is running."
        );
      }
    };

    const finishRound = () => {
      if (phase !== "playing") return;

      phase = "roundOver";
      keys.clear();

      // If time expires, the fighter with more health wins.
      // Equal health means a draw for this round.
      let roundWinner = 0;

      if (p1.health > p2.health) roundWinner = 1;
      if (p2.health > p1.health) roundWinner = 2;

      if (p1.health <= 0) roundWinner = 2;
      if (p2.health <= 0) roundWinner = 1;

      if (roundWinner === 1) wins1++;
      if (roundWinner === 2) wins2++;

      const updatedScore = [wins1, wins2];
      setScore(updatedScore);

      const roundText =
        roundWinner === 0
          ? "ROUND DRAW!"
          : roundWinner === 1
          ? `${player1} WINS ROUND ${currentRound}!`
          : `${player2} WINS ROUND ${currentRound}!`;

      setRoundMessage(roundText);
      transitionTimer = 2;

      const isMatchOver =
    wins1 === 2 || wins2 === 2 || currentRound >= 3;

  if (isMatchOver) {
  finished = true;

  let finalWinner = "";

  if (wins1 > wins2) {
    finalWinner = player1;
  } else if (wins2 > wins1) {
    finalWinner = player2;
  }

  setWinner(finalWinner);
  setScreen("result");

  phase = "finished";

  if (finalWinner) {
    saveMatch(finalWinner, updatedScore);
  } else {
    setSaveStatus("Match ended in a draw.");
  }
}
    };

    const loop = (now) => {
      const dt = Math.min((now - previousTime) / 1000, 0.033);
      previousTime = now;

      if (phase === "countdown") {
        countdownElapsed += dt;

        if (countdownElapsed >= 1) {
          countdownElapsed -= 1;
          countdown--;

          if (countdown < 0) {
            phase = "playing";
            setRoundMessage("");
          }
        }
      } else if (phase === "playing") {
        timeLeft = Math.max(0, timeLeft - dt);

        updateFighter(p1, p2, controls.p1, dt);
        updateFighter(p2, p1, controls.p2, dt);

        if (p1.health <= 0 || p2.health <= 0 || timeLeft <= 0) {
          finishRound();
        }
      } else if (phase === "roundOver") {
        transitionTimer -= dt;

        if (transitionTimer <= 0 && !finished) {
          currentRound++;
          resetRound();
        }
      }

      drawScene(ctx, p1, p2, timeLeft, phase, countdown);

      if (phase !== "finished") {
        animationId = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      keys.clear();
    };
  }, [screen, matchId, player1, player2]);

  return (
    <main className="game-page">
      {screen === "menu" && (
        <section className="menu-screen">
          <p className="eyebrow">LOCAL MULTIPLAYER • ARCADE</p>
          <h1 className="hero-title">
            BATTLE <span>ARENA</span>
          </h1>
          <p className="subtitle">
            Two players. Three rounds. One champion.
          </p>
          <div className="menu-fighters" aria-hidden="true">
            <span className="fighter-icon cyan">⚔</span>
            <span className="menu-vs">VS</span>
            <span className="fighter-icon pink">⚔</span>
          </div>
          <button
            className="play-button start-button"
            onClick={() => setScreen("registration")}
          >
            START GAME
          </button>
          <p className="menu-note">PRESS START TO ENTER THE ARENA</p>
        </section>
      )}

      {screen === "registration" && (
        <section className="registration-screen">
          <p className="eyebrow">FIGHTER REGISTRATION</p>
          <h1>CHOOSE YOUR <span>FIGHTERS</span></h1>
          <p className="subtitle">
            Enter both names before the battle begins.
          </p>

          <form className="registration-form" onSubmit={startMatch}>
            <label>
              <span className="cyan-text">PLAYER ONE</span>
              <input
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                placeholder="Enter player one's name"
                maxLength={30}
                required
              />
              <small>Controls: A / D / W / F</small>
            </label>

            <div className="form-vs">VS</div>

            <label>
              <span className="pink-text">PLAYER TWO</span>
              <input
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                placeholder="Enter player two's name"
                maxLength={30}
                required
              />
              <small>Controls: Arrows / ENTER</small>
            </label>

            <p className="round-rule">
              BEST OF 3 ROUNDS · FIRST TO 2 WINS
            </p>

            <button className="play-button" type="submit">
              ENTER THE ARENA →
            </button>
            <button
              className="reset-button"
              type="button"
              onClick={() => setScreen("menu")}
            >
              BACK TO MENU
            </button>
          </form>
        </section>
      )}

      {screen === "game" && (
        <>
          <header className="game-header">
            <div>
              <p className="eyebrow">ROUND {round} OF 3</p>
              <h1>BATTLE<span> ARENA</span></h1>
            </div>
            <div className="score-pill">
              {player1} {score[0]} — {score[1]} {player2}
            </div>
          </header>

          <section className="arena">
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              aria-label="Fighting game arena"
            />

            {roundMessage && (
              <div className="round-overlay">
                <div className="round-announcement">
                  <p className="eyebrow">BATTLE UPDATE</p>
                  <h2 key={roundMessage}>{roundMessage}</h2>
                  <p>Score: {score[0]} — {score[1]}</p>
                </div>
              </div>
            )}
          </section>

          <section className="controls-panel">
            <div className="player-controls player-one">
              <h3>{player1}</h3>
              <p><kbd>A</kbd> <kbd>D</kbd> Move · <kbd>W</kbd> Jump · <kbd>F</kbd> Attack</p>
            </div>
            <div className="versus">VS</div>
            <div className="player-controls player-two">
              <h3>{player2}</h3>
              <p><kbd>←</kbd> <kbd>→</kbd> Move · <kbd>↑</kbd> Jump · <kbd>ENTER</kbd> Attack</p>
            </div>
          </section>
        </>
      )}

      {screen === "result" && (
        <section className="result-screen">
          <p className="eyebrow">MATCH COMPLETE</p>
          <div className="result-trophy">🏆</div>
          {winner ? (
    <h1><span>{winner}</span> WINS!</h1>
      ) : (  <h1>MATCH <span>DRAW!</span></h1>)}
          <p className="final-score">
            {player1} <strong>{score[0]} — {score[1]}</strong> {player2}
          </p>
        <p className="result-caption">
          {winner ? "FIRST TO TWO ROUND WINS" : "THREE ROUNDS COMPLETED"}
        </p>          <p className="save-message">{saveStatus || "Saving result..."}</p>

          <button
            className="play-button"
            onClick={() => {
              setName1(player1);
              setName2(player2);
              setScreen("registration");
            }}
          >
            REMATCH
          </button>
          <button
            className="reset-button"
            onClick={() => {
              setName1("");
              setName2("");
              setPlayer1("");
              setPlayer2("");
              setScore([0, 0]);
              setWinner("");
              setScreen("menu");
            }}
          >
            MAIN MENU
          </button>
        </section>
      )}
    </main>
  );
}

