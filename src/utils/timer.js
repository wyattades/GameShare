
module.exports = (fn, fps) => {
  
  let delta,
      lastUpdate = Date.now(),
      now;

  const intervalId = setInterval(() => {
    now = Date.now();
    delta = now - lastUpdate;
    lastUpdate = now;

    fn(delta / 16.66); // 16.66 is the deltaTime of client i.e. 60fps
  }, 1000 / fps);

  return {
    stop: () => {
      clearInterval(intervalId);
    },
  };
};
