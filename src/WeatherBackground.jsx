import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { loadScene, sceneUrl, selectScene } from './weather-scenes.js';

export default function WeatherBackground({ current }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1200], [0, 160]);
  const lastScene = useRef('cold');
  const scene = current ? selectScene(current) : lastScene.current;
  useEffect(() => { lastScene.current = scene; }, [scene]);
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!image) return;
    return () => { setTimeout(() => URL.revokeObjectURL(image.url), 2200); };
  }, [image]);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let objectUrl;
    (async () => {
      try {
        const blob = await loadScene(sceneUrl(scene), controller.signal);
        if (disposed) return;
        objectUrl = URL.createObjectURL(blob);
        const preload = new Image();
        preload.src = objectUrl;
        await preload.decode();
        if (!disposed) setImage({ scene, url: objectUrl });
        else URL.revokeObjectURL(objectUrl);
      } catch { if (objectUrl) URL.revokeObjectURL(objectUrl); /* Retain the previous image on failure. */ }
    })();
    return () => { disposed = true; controller.abort(); };
  }, [scene]);
  return <div className="scenery" aria-hidden="true" data-weather-scene={image?.scene || 'loading'}>
    <AnimatePresence initial={false}>
      {image && <motion.div key={image.scene} className="landscape weather-landscape" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 1.8 }} style={{ y: reduce ? 0 : y, backgroundImage: `url("${image.url}")` }} />}
    </AnimatePresence>
    <div className={`weather-tint ${current?.is_day === 0 ? 'weather-night' : ''}`} />
    <div className="atmosphere" />
  </div>;
}
