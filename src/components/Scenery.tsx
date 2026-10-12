import './Scenery.css';

const FLOWER_COLORS = ['#ff6fa5', '#ffb703', '#9b6bdf', '#ff8fc0', '#ffd166'];

export const Scenery = () => {
  const flowers = Array.from({ length: 7 });

  return (
    <div className="scenery" aria-hidden="true">
      <div className="scenery-sky">
        <div className="scenery-sun" />
        <div className="scenery-cloud scenery-cloud--a" />
        <div className="scenery-cloud scenery-cloud--b" />
        <div className="scenery-cloud scenery-cloud--c" />
      </div>
      <div className="scenery-tree scenery-tree--left">
        <span className="scenery-tree-foliage" />
        <span className="scenery-tree-trunk" />
      </div>
      <div className="scenery-tree scenery-tree--right">
        <span className="scenery-tree-foliage" />
        <span className="scenery-tree-trunk" />
      </div>
      <div className="scenery-hill scenery-hill--back" />
      <div className="scenery-path" />
      <div className="scenery-grass">
        {flowers.map((_, i) => (
          <div
            className="scenery-flower"
            key={i}
            style={{
              left: `${6 + i * 13}%`,
              animationDelay: `${i * 0.35}s`,
            }}
          >
            <span
              className="scenery-flower-head"
              style={{ background: FLOWER_COLORS[i % FLOWER_COLORS.length] }}
            />
            <span className="scenery-flower-stem" />
          </div>
        ))}
      </div>
    </div>
  );
};
