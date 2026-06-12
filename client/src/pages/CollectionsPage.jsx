import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  saved: 'Saved',
  researching: 'Researching',
};

function CollectionsPage() {
  const [search, setSearch] = useState('');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/collections')
      .then(res => res.json())
      .then(data => {
        setCollections(data.map(c => ({
          ...c,
          status: c.status || 'saved',
          totalLeads: c.totalLeads || 0,
          noWebsite: c.noWebsite || 0,
          newLeads: c.newLeads || 0,
        })));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalLeads = filtered.reduce((sum, c) => sum + c.totalLeads, 0);
  const totalNew = filtered.reduce((sum, c) => sum + c.newLeads, 0);

  return (
    <div className="collections-page">
      <div className="collections-page__header">
        <h1 className="headline-md">Lead Collections</h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 'var(--space-xs)' }}>
          {loading ? 'Loading...' : `${filtered.length} active lead list${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="search-bar">
        <div className="field">
          <label className="field__label" htmlFor="cat-search">Search</label>
          <input
            id="cat-search"
            className="field__input"
            type="text"
            placeholder="Search categories or business types..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Link to="/collections/finding/New%20Search?collectionNew=false" className="btn btn--primary" style={{ textDecoration: 'none' }}>
          Add Businesses
        </Link>
      </div>

      <div className="collections-stats">
        <div className="collection-stat">
          <span className="collection-stat__value collection-stat__value--total">{totalLeads}</span>
          <span className="collection-stat__label">Total Leads</span>
        </div>
        <div className="collection-stat">
          <span className="collection-stat__value collection-stat__value--new">+{totalNew}</span>
          <span className="collection-stat__label">New Leads</span>
        </div>
      </div>

      <div className="collections-list">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div className="collection-card" key={i}>
              <div className="collection-card__top">
                <div className="skeleton" style={{ width: '50%', height: 20 }} />
                <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 9999 }} />
              </div>
              <div className="collection-card__details" style={{ marginTop: 8 }}>
                <div className="skeleton" style={{ width: '30%', height: 14 }} />
                <div className="skeleton" style={{ width: '20%', height: 14 }} />
                <div className="skeleton" style={{ width: '25%', height: 14 }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p className="headline-sm" style={{ color: 'var(--on-surface-variant)' }}>
              No collections found
            </p>
            <p className="body-md">Create one to get started</p>
          </div>
        ) : (
          filtered.map(c => (
            <div className="collection-card" key={c.id}>
              <div className="collection-card__top">
                <div className="collection-card__name">{c.name}</div>
                <span className={`chip chip--${c.status}`}>
                  {STATUS_LABELS[c.status] || c.status}
                </span>
              </div>
              <div className="collection-card__details">
                <div className="collection-card__detail">
                  <span className="collection-card__icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <span className="body-sm">{c.location || 'No location'}</span>
                </div>
                <div className="collection-card__stat">
                  <span className="data-mono">{c.totalLeads}</span>
                  <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>leads</span>
                </div>
                <div className="collection-card__stat">
                  <span className="data-mono" style={{ color: 'var(--color-new)' }}>{c.noWebsite}</span>
                  <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>without website</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Link to="/collections/new" className="btn btn--primary" style={{
        display: 'flex',
        width: '100%',
        padding: 'var(--space-md)',
        marginTop: 'var(--space-lg)',
        textDecoration: 'none',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Create New Collection
      </Link>
    </div>
  );
}

export default CollectionsPage;
