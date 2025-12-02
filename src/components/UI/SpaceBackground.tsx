import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
// @ts-ignore
import * as random from "maath/random/dist/maath-random.esm";

function Stars(props: any) {
  // @ts-ignore
  const ref = useRef<any>();
  const [sphere] = useState(() =>
    random.inSphere(new Float32Array(5000), { radius: 1.5 }),
  );

  useFrame((state, delta) => {
    if (ref.current) {
      // Оставляем медленное автоматическое вращение
      ref.current.rotation.x -= delta / 15;
      ref.current.rotation.y -= delta / 20;

      // --- ДОБАВЛЕНО: Реакция на движение мыши ---
      // state.mouse.x и .y меняются от -1 до 1 в зависимости от положения курсора в canvas.
      // Мы добавляем это значение к вращению с небольшим коэффициентом для плавности.
      // Делим на 5 или 10, чтобы эффект был не слишком резким.
      ref.current.rotation.x += state.mouse.y / 10;
      ref.current.rotation.y += state.mouse.x / 10;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points
        ref={ref}
        positions={sphere}
        stride={3}
        frustumCulled={false}
        {...props}
      >
        <PointMaterial
          transparent
          color="#1976d2"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export default function SpaceBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        // --- ИЗМЕНЕНО: Более контрастный фон ---
        // Легкий градиент поможет частицам выделяться, не делая фон слишком темным.
        background: "linear-gradient(to bottom, #eef2f6, #dce6f2)",
      }}
    >
      {/* Добавляем событие onPointerMove, чтобы Canvas отслеживал мышь */}
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars />
      </Canvas>
    </div>
  );
}
