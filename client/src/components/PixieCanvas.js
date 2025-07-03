import { useEffect, useRef } from "react";
import { Application, Assets, Sprite, Container, Texture } from "pixi.js";

const MetaverseRoom = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
 const app = new Application();
    (async () => {
     
      await app.init({ background: '#1a1a1a', resizeTo: window });

      // Append the canvas to the DOM
      if (canvasRef.current) {
        canvasRef.current.appendChild(app.canvas);
      }

      // Load your local asset (must be inside public folder)
      const baseTexture = await Assets.load("/assets/pixelofficeassets.png");

      // Create container
      const room = new Container();
      app.stage.addChild(room);

      // Create textures (you'll need to crop these based on your asset layout)
      const chairTexture = new Texture(baseTexture.baseTexture, { x: 0, y: 0, width: 32, height: 32 });
      const tableTexture = new Texture(baseTexture.baseTexture, { x: 32, y: 0, width: 32, height: 32 });

      // Create some chairs and tables
      const chair1 = new Sprite(chairTexture);
      chair1.x = 100;
      chair1.y = 100;

      const table1 = new Sprite(tableTexture);
      table1.x = 150;
      table1.y = 100;

      const chair2 = new Sprite(chairTexture);
      chair2.x = 200;
      chair2.y = 100;

      // Add to container
      room.addChild(chair1, table1, chair2);

    })();

    return () => {
      app?.destroy(true);
    };
  }, []);

  return <div ref={canvasRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default MetaverseRoom;
