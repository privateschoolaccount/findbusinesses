function MockMap({ businesses = [], area = 'Map' }) {
  const noWebsiteBiz = businesses.filter(b => !b.hasWebsite);

  return (
    <div className="mock-map">
      <div className="mock-map__header">
        <span className="body-sm" style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>{area}</span>
        <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
          {noWebsiteBiz.length} business{noWebsiteBiz.length !== 1 ? 'es' : ''} without website
        </span>
      </div>
      <div className="mock-map__canvas">
        <div className="mock-map__grid" />
        <div className="mock-map__roads">
          <div className="mock-map__road mock-map__road--h" style={{ top: '30%' }} />
          <div className="mock-map__road mock-map__road--h" style={{ top: '60%' }} />
          <div className="mock-map__road mock-map__road--v" style={{ left: '25%' }} />
          <div className="mock-map__road mock-map__road--v" style={{ left: '55%' }} />
          <div className="mock-map__road mock-map__road--v" style={{ left: '75%' }} />
        </div>
        {noWebsiteBiz.map(b => (
          <div
            key={b.id}
            className="mock-map__dot"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            title={b.name}
          />
        ))}
      </div>
    </div>
  );
}

export default MockMap;
