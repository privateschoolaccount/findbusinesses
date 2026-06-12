import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SUGGESTED_CATEGORIES = [
  'SaaS Companies',
  'Manufacturing',
  'HealthTech',
  'Enterprise Software',
  'E-commerce',
  'Industrial Automation',
  'FinTech',
  'Data & AI',
];

function CreateCollectionPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [searchPrompt, setSearchPrompt] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState([]);
  const [inputVal, setInputVal] = useState('');

  function addTag(tag) {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setInputVal('');
  }

  function removeTag(tag) {
    setTags(tags.filter(t => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && inputVal.trim()) {
      e.preventDefault();
      addTag(inputVal.trim());
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        location: location.trim() || null,
        tags: tags.length > 0 ? tags : null,
      }),
    })
      .then(res => res.json())
      .then(data => {
        navigate(`/collections/finding/${encodeURIComponent(data.name)}?collectionNew=true&searchPrompt=${encodeURIComponent(searchPrompt.trim() || name.trim())}`);
      })
      .catch(() => {
        navigate(`/collections/finding/${encodeURIComponent(name.trim())}?collectionNew=true&searchPrompt=${encodeURIComponent(searchPrompt.trim() || name.trim())}`);
      });
  }

  return (
    <div className="create-collection-page">
      <div className="create-collection-page__header">
        <Link to="/" className="btn btn--tertiary" style={{ padding: '4px 0', alignSelf: 'flex-start' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Link>
        <h1 className="headline-md" style={{ marginTop: 'var(--space-sm)' }}>New Collection</h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 'var(--space-xs)' }}>
          Create a new lead collection to organize your outreach
        </p>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field__label" htmlFor="col-name">Collection Name</label>
          <input
            id="col-name"
            className="field__input"
            type="text"
            placeholder="e.g. SaaS Companies"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="search-prompt">Search Prompt</label>
          <textarea
            id="search-prompt"
            className="field__input"
            style={{ resize: 'vertical', minHeight: 72, paddingTop: 'var(--space-sm)' }}
            rows={3}
            placeholder="Describe what to search for, e.g. SaaS companies in San Francisco"
            value={searchPrompt}
            onChange={e => setSearchPrompt(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="col-location">Target Location</label>
          <input
            id="col-location"
            className="field__input"
            type="text"
            placeholder="City, state, or region"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="col-tags">
            Categories / Business Types
          </label>
          <input
            id="col-tags"
            className="field__input"
            type="text"
            placeholder="Type and press Enter to add..."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {tags.length > 0 && (
          <div className="tags-list">
            {tags.map(tag => (
              <span className="tag" key={tag}>
                {tag}
                <button type="button" className="tag__remove" onClick={() => removeTag(tag)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="suggested-categories">
          <p className="label-caps" style={{ marginBottom: 'var(--space-sm)' }}>Suggested</p>
          <div className="suggested-categories__list">
            {SUGGESTED_CATEGORIES.filter(s => !tags.includes(s)).map(s => (
              <button
                type="button"
                className="suggested-cat"
                key={s}
                onClick={() => addTag(s)}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn--primary"
          style={{ width: '100%', padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}
          disabled={!name.trim()}
        >
          Create Collection
        </button>
      </form>
    </div>
  );
}

export default CreateCollectionPage;
