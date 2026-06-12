import { useState } from 'react';
import { Link } from 'react-router-dom';

const MOCK_COLLECTIONS = [
  { id: 1, name: 'SaaS Companies', status: 'saved', location: 'San Francisco, CA', totalLeads: 42, noWebsite: 8, newLeads: 3 },
  { id: 2, name: 'Manufacturing', status: 'researching', location: 'Austin, TX', totalLeads: 28, noWebsite: 12, newLeads: 5 },
  { id: 3, name: 'HealthTech', status: 'saved', location: 'Boston, MA', totalLeads: 19, noWebsite: 4, newLeads: 0 },
  { id: 4, name: 'Enterprise SaaS', status: 'researching', location: 'New York, NY', totalLeads: 35, noWebsite: 6, newLeads: 7 },
  { id: 5, name: 'Industrial Automation', status: 'saved', location: 'Chicago, IL', totalLeads: 15, noWebsite: 9, newLeads: 2 },
];

const STATUS_LABELS = {
  saved: 'Saved',
  researching: 'Researching',
};

function CollectionsPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_COLLECTIONS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalLeads = filtered.reduce((sum, c) => sum + c.totalLeads, 0);
  const totalNew = filtered.reduce((sum, c) => sum + c.newLeads, 0);

  return (
    <div className="collections-page">
      <div className="collections-page__header">
        <h1 className="headline-md">Lead Collections</h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 'var(--space-xs)' }}>
          {filtered.length} active lead list{filtered.length !== 1 ? 's' : ''}
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
        <Link to="/collections/finding/New%20Search?collectionNew=false" className="btn btn--primary" style={{ textDecoration: 'none' }}>Add Businesses</Link>
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
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p className="headline-sm" style={{ color: 'var(--on-surface-variant)' }}>
              No collections found
            </p>
            <p className="body-md">Try a different search term</p>
          </div>
        ) : (
          filtered.map(c => (
            <div className="collection-card" key={c.id}>
              <div className="collection-card__top">
                <div className="collection-card__name">{c.name}</div>
                <span className={`chip chip--${c.status}`}>
                  {STATUS_LABELS[c.status]}
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
                  <span className="body-sm">{c.location}</span>
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
