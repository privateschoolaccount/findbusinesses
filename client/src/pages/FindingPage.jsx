import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import MockMap from '../components/MockMap';

const CATEGORIES = ['SaaS', 'Manufacturing', 'HealthTech', 'Enterprise Software', 'E-commerce', 'FinTech'];

const STATUS_LABELS = {
  has_website: 'Has Website',
  no_website: 'Without Website',
  pending: 'Pending Verification',
};

const STATUS_CHIP = {
  has_website: 'chip--success',
  no_website: 'chip--new',
  pending: 'chip--pending',
};

const FALLBACK_BUSINESSES = [
  { id: 'fb-1', name: 'TechFlow Solutions', type: 'SaaS', address: 'San Francisco', websiteStatus: 'no_website', lat: 37.78, lng: -122.42, x: 35, y: 28 },
  { id: 'fb-2', name: 'GreenLeaf Analytics', type: 'Data & AI', address: 'San Francisco', websiteStatus: 'has_website', lat: 37.79, lng: -122.41, x: 60, y: 45 },
  { id: 'fb-3', name: 'BridgePoint Systems', type: 'SaaS', address: 'San Francisco', websiteStatus: 'no_website', lat: 37.77, lng: -122.39, x: 72, y: 55 },
  { id: 'fb-4', name: 'NorthBay Software', type: 'Enterprise Software', address: 'San Francisco', websiteStatus: 'pending', lat: 37.80, lng: -122.44, x: 45, y: 18 },
  { id: 'fb-5', name: 'Coastal Data Group', type: 'FinTech', address: 'San Francisco', websiteStatus: 'has_website', lat: 37.76, lng: -122.40, x: 80, y: 70 },
  { id: 'fb-6', name: 'Summit Innovations', type: 'HealthTech', address: 'San Francisco', websiteStatus: 'no_website', lat: 37.81, lng: -122.43, x: 22, y: 65 },
  { id: 'fb-7', name: 'Pacific Digital', type: 'E-commerce', address: 'San Francisco', websiteStatus: 'pending', lat: 37.75, lng: -122.38, x: 50, y: 80 },
  { id: 'fb-8', name: 'Peninsula Robotics', type: 'Manufacturing', address: 'San Francisco', websiteStatus: 'no_website', lat: 37.82, lng: -122.45, x: 15, y: 40 },
];

function normalizeBusiness(b) {
  let websiteStatus = b.websiteStatus || 'pending';
  if (b.status === 'has_website' || b.hasWebsite === true) websiteStatus = 'has_website';
  else if (b.status === 'no_website' || b.hasWebsite === false) websiteStatus = 'no_website';
  else if (b.status === 'pending_verification') websiteStatus = 'pending';

  return {
    id: b.id,
    name: b.name,
    type: b.type || b.categories || 'Unknown',
    area: b.address || b.area || 'Unknown',
    websiteStatus,
    x: b.x ?? (((b.lng || -122.4) + 122.5) * 100),
    y: b.y ?? ((37.8 - (b.lat || 37.8)) * 200),
  };
}

function FindingPage() {
  const { collectionName } = useParams();
  const [searchParams] = useSearchParams();
  const collectionNew = searchParams.get('collectionNew') === 'true';
  const searchPrompt = searchParams.get('searchPrompt') || collectionName || 'businesses';

  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [currentLocation, setCurrentLocation] = useState('San Francisco');
  const [businesses, setBusinesses] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [hideWithWebsite, setHideWithWebsite] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showPopup, setShowPopup] = useState(collectionNew);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedCollIds, setSelectedCollIds] = useState(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer;
    let safetyTimeout;

    async function init() {
      try {
        const collRes = await fetch('/api/collections');
        const collData = await collRes.json();
        if (cancelled) return;
        setCollections(collData);
        const match = collData.find(c => c.name === collectionName);
        const location = (match && match.location) || 'San Francisco';
        setCurrentLocation(location);

        const searchRes = await fetch('/api/searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchPrompt, location, radius: 5000 }),
        });
        const searchData = await searchRes.json();
        if (cancelled) return;
        const searchId = searchData.id;

        pollTimer = setInterval(() => {
          if (cancelled) return;

          fetch(`/api/searches/${searchId}/results`)
            .then(res => res.json())
            .then(resultData => {
              if (cancelled) return;
              const items = resultData.rows || [];
              if (items.length > 0) {
                setBusinesses(items.map(normalizeBusiness));
                setLoading(false);
              }
            })
            .catch(() => {});

          fetch(`/api/searches/${searchId}`)
            .then(res => res.json())
            .then(sd => {
              if (cancelled) return;
              if (sd.status === 'completed' || sd.status === 'failed') {
                clearInterval(pollTimer);
                clearTimeout(safetyTimeout);
                setLoading(false);
                if (sd.status === 'failed') setApiError('Search failed — showing sample data');
              }
            })
            .catch(() => {});
        }, 3000);

        safetyTimeout = setTimeout(() => {
          clearInterval(pollTimer);
          if (!cancelled) {
            setBusinesses(FALLBACK_BUSINESSES);
            setApiError('Search timed out — showing sample data');
            setLoading(false);
          }
          cancelled = true;
        }, 120000);
      } catch {
        if (!cancelled) {
          setBusinesses(FALLBACK_BUSINESSES);
          setApiError('Search API unavailable — showing sample data');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      clearTimeout(safetyTimeout);
    };
  }, [collectionName, searchPrompt]);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => setShowPopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const recentCollections = [...collections]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 5);

  const sortedCollections = [...collections]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  const results = businesses.filter(b => {
    if (hideWithWebsite && b.websiteStatus === 'has_website') return false;
    if (activeCategory && b.type !== activeCategory) return false;
    return true;
  });

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(b => b.id)));
    }
  }

  function addToCollection(collId, ids) {
    return fetch(`/api/collections/${collId}/businesses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultIds: ids.map(id => id.toString()) }),
    });
  }

  function handleAddAllToRecent() {
    const ids = results.map(b => b.id);
    Promise.all(
      recentCollections.map(c => addToCollection(c.id, ids))
    ).then(responses => {
      if (responses.every(r => r.ok)) {
        const names = recentCollections.map(c => c.name).join(', ');
        alert(`Added all to: ${names}`);
      }
    });
  }

  function handleAddAllToName() {
    const coll = collections.find(c => c.name === collectionName);
    if (!coll) {
      alert(`Collection "${collectionName}" not found.`);
      return;
    }
    addToCollection(coll.id, results.map(b => b.id))
      .then(res => {
        if (res.ok) alert(`Added all to "${collectionName}"`);
      });
  }

  function toggleCollection(id) {
    setSelectedCollIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddSelected() {
    if (selectedCollIds.size === 0) return;
    const selected = results.filter(b => selectedIds.has(b.id));
    const targetColls = collections.filter(c => selectedCollIds.has(c.id));
    const collNames = targetColls.map(c => c.name).join(', ');

    Promise.all(
      targetColls.map(c => addToCollection(c.id, selected.map(b => b.id)))
    ).then(responses => {
      if (responses.every(r => r.ok)) {
        const bizNames = selected.map(b => b.name).join(', ');
        alert(`Added to "${collNames}": ${bizNames}`);
      }
      setDropdownOpen(false);
    });
  }

  function statusCount(status) {
    return businesses.filter(b => b.websiteStatus === status).length;
  }

  return (
    <div className="search-page">
      {showPopup && (
        <div className="toast toast--success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Collection "{collectionName}" created
        </div>
      )}

      <div className="finding-page__header">
        <h1 className="headline-md">{collectionName || 'Finding Businesses'}</h1>
        <p className="body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 'var(--space-xs)' }}>
          {currentLocation}
          {!loading && (
            <> &middot; {statusCount('no_website')} without &middot; {statusCount('pending')} pending &middot; {statusCount('has_website')} with website</>
          )}
          {apiError && <span style={{ color: 'var(--color-hot)', marginLeft: 8 }}>({apiError})</span>}
        </p>
      </div>

      <div className="filter-chips">
        <button
          className={`filter-chip ${hideWithWebsite ? 'filter-chip--active' : ''}`}
          onClick={() => setHideWithWebsite(v => !v)}
        >
          Without Websites
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${activeCategory === cat ? 'filter-chip--active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mock-map">
          <div className="mock-map__header">
            <div className="skeleton" style={{ width: 120, height: 16 }} />
            <div className="skeleton" style={{ width: 200, height: 16 }} />
          </div>
          <div className="mock-map__canvas skeleton" />
        </div>
      ) : (
        <MockMap businesses={results} area={currentLocation} />
      )}

      {!loading && (
        <div className="add-bar">
          <div className="add-bar__select-all">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={selectedIds.size === results.length && results.length > 0}
                onChange={toggleSelectAll}
              />
              <span className="checkbox__mark" />
            </label>
            <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {selectedIds.size} selected
            </span>
          </div>

          {collectionNew ? (
            <button className="btn btn--primary" onClick={handleAddAllToName}>
              Add All to {collectionName}
            </button>
          ) : (
            <button className="btn btn--primary" onClick={handleAddAllToRecent}>
              Add All to 5 Recent
            </button>
          )}

          <div className="add-bar__dropdown-wrapper">
            <button
              className="btn btn--secondary"
              disabled={selectedIds.size === 0}
              onClick={() => { setDropdownOpen(v => !v); if (!dropdownOpen) setSelectedCollIds(new Set()); }}
            >
              {selectedCollIds.size > 0
                ? `Add to ${selectedCollIds.size} collection${selectedCollIds.size > 1 ? 's' : ''}`
                : 'Add Selected'}
            </button>
            {dropdownOpen && (
              <div className="dropdown dropdown--wide">
                <div className="dropdown__list">
                  {sortedCollections.map(c => (
                    <label className="dropdown__item" key={c.id}>
                      <span className="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedCollIds.has(c.id)}
                          onChange={() => toggleCollection(c.id)}
                        />
                        <span className="checkbox__mark" />
                      </span>
                      <span className="dropdown__item-name">{c.name}</span>
                      {recentCollections.includes(c) && (
                        <span className="chip chip--recent">Recent</span>
                      )}
                    </label>
                  ))}
                </div>
                <button
                  className="dropdown__apply"
                  disabled={selectedCollIds.size === 0 || selectedIds.size === 0}
                  onClick={handleAddSelected}
                >
                  Add to {selectedCollIds.size || '...'} collection{selectedCollIds.size !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="search-results">
        <div className="search-results__header">
          {loading ? (
            <div className="skeleton" style={{ width: 100, height: 24 }} />
          ) : (
            <span className="headline-sm">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div className="result-card" key={i}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 'var(--radius)' }} />
              <div className="result-card__content">
                <div className="skeleton" style={{ width: '60%', height: 18, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: '40%', height: 14 }} />
              </div>
              <div className="skeleton" style={{ width: 90, height: 22, borderRadius: 9999 }} />
            </div>
          ))
        ) : results.length === 0 ? (
          <div className="empty-state">
            <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
              No businesses found matching your criteria
            </p>
          </div>
        ) : (
          results.map(b => (
            <div
              className={`result-card ${selectedIds.has(b.id) ? 'result-card--selected' : ''}`}
              key={b.id}
              onClick={() => toggleSelect(b.id)}
            >
              <label className="checkbox" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(b.id)}
                  onChange={() => toggleSelect(b.id)}
                />
                <span className="checkbox__mark" />
              </label>
              <div className="result-card__thumbnail">
                {b.name.charAt(0)}
              </div>
              <div className="result-card__content">
                <div className="result-card__name">{b.name}</div>
                <div className="result-card__meta">
                  <span className="body-sm">{b.type}</span>
                  <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>&middot;</span>
                  <span className="body-sm">{b.area}</span>
                </div>
              </div>
              <div className="result-card__status">
                <span className={`chip ${STATUS_CHIP[b.websiteStatus] || 'chip--pending'}`}>
                  {STATUS_LABELS[b.websiteStatus] || 'Pending Verification'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FindingPage;
